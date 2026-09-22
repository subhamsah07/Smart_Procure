/**
 * Notification Service - Retrieves and updates operational alerts and queue notices.
 * Prepared for clean Supabase 'notifications' table integration with local persistence fallback.
 */

import { SystemNotification } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isValidUuid } from '../lib/utils';

const LOCAL_NOTIFICATIONS_KEY = 'smartprocure_farmer_notifications';

function mapDbNotificationToUi(n: any): SystemNotification {
  let type: SystemNotification['type'] = 'GENERAL_ADVISORY';
  if (n.type === 'delay') type = 'DELAY_ALERT';
  else if (n.type === 'queue' || n.type === 'booking') type = 'ETA_UPDATE';
  else if (n.type === 'payment') type = 'PAYMENT_CREDIT';
  else if (n.type === 'procurement') type = 'STATUS_CHANGE';

  return {
    id: n.id,
    recipientId: n.farmer_id,
    bookingId: n.booking_id || undefined,
    title: n.title,
    message: n.message,
    type,
    isRead: Boolean(n.read),
    createdAt: n.created_at,
  };
}

function mapParamTypeToUiType(type: string): SystemNotification['type'] {
  if (type === 'delay') return 'DELAY_ALERT';
  if (type === 'queue' || type === 'booking') return 'ETA_UPDATE';
  if (type === 'payment') return 'PAYMENT_CREDIT';
  if (type === 'procurement') return 'STATUS_CHANGE';
  return 'GENERAL_ADVISORY';
}

function loadLocalNotifications(): SystemNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(list: SystemNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // Ignore storage quota or environment errors
  }
}

class NotificationService {
  private notifications: SystemNotification[] = loadLocalNotifications();
  private listeners: Set<(notif?: SystemNotification) => void> = new Set();
  private channel: any = null;

  private recordNotification(notif: SystemNotification): void {
    // Avoid duplicate in memory
    const existingIdx = this.notifications.findIndex(n => n.id === notif.id);
    if (existingIdx >= 0) {
      this.notifications[existingIdx] = notif;
    } else {
      this.notifications.unshift(notif);
    }

    // Persist to local storage
    const locals = loadLocalNotifications();
    const lIdx = locals.findIndex(n => n.id === notif.id);
    if (lIdx >= 0) {
      locals[lIdx] = notif;
    } else {
      locals.unshift(notif);
    }
    saveLocalNotifications(locals);

    // Notify active subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(notif);
      } catch (err) {
        console.warn('[NotificationService] Error executing notification listener:', err);
      }
    });

    // Notify window components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartprocure_notification_created', { detail: notif }));
    }
  }

  async getNotifications(): Promise<SystemNotification[]> {
    let remoteNotifs: SystemNotification[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('farmer_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            remoteNotifs = data.map(mapDbNotificationToUi);
          }
        }
      } catch (err) {
        console.warn('Supabase notifications lookup notice:', err);
      }
    }

    // Merge remote notifications with locally stored notifications
    const localNotifs = loadLocalNotifications();
    const map = new Map<string, SystemNotification>();

    for (const n of localNotifs) {
      map.set(n.id, n);
    }
    for (const n of this.notifications) {
      map.set(n.id, n);
    }
    for (const n of remoteNotifs) {
      map.set(n.id, n);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.notifications = merged;
    return merged;
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.isRead = true;
    }

    const locals = loadLocalNotifications();
    const localItem = locals.find(n => n.id === id);
    if (localItem) {
      localItem.isRead = true;
      saveLocalNotifications(locals);
    }

    if (isSupabaseConfigured() && isValidUuid(id)) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('Supabase mark read fallback notice:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartprocure_notification_updated', { detail: { id, read: true } }));
    }
  }

  /**
   * Creates a persistent notification for a farmer.
   * Enforces idempotency via (farmer_id, booking_id, title) to prevent duplicate notifications.
   * Gracefully handles Row-Level Security (RLS) restrictions by falling back to local persistent store.
   */
  async createNotification(params: {
    farmerId: string;
    bookingId?: string;
    type: 'booking' | 'queue' | 'delay' | 'procurement' | 'payment' | 'system';
    title: string;
    message: string;
  }): Promise<SystemNotification | null> {
    const validBookingId = params.bookingId && isValidUuid(params.bookingId) ? params.bookingId : null;

    // Local idempotency check: only deduplicate if the EXACT SAME notification for this specific booking already exists
    const existingLocal = this.notifications.find((n) => {
      if (n.title !== params.title) return false;
      // If bookingId is provided on both, match by bookingId
      if (params.bookingId && n.bookingId) {
        return n.bookingId === params.bookingId;
      }
      // Otherwise ensure recipient and exact message match
      return n.recipientId === params.farmerId && n.message === params.message;
    });
    if (existingLocal) {
      return existingLocal;
    }

    if (isSupabaseConfigured() && isValidUuid(params.farmerId)) {
      try {
        // Remote idempotency check if booking is valid UUID
        if (validBookingId) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('*')
            .eq('farmer_id', params.farmerId)
            .eq('booking_id', validBookingId)
            .eq('title', params.title)
            .maybeSingle();

          if (existing) {
            const mapped = mapDbNotificationToUi(existing);
            this.recordNotification(mapped);
            return mapped;
          }
        }

        const { data, error } = await supabase
          .from('notifications')
          .insert({
            farmer_id: params.farmerId,
            booking_id: validBookingId,
            type: params.type,
            title: params.title,
            message: params.message,
            read: false,
          })
          .select()
          .single();

        if (error) {
          // If Row-Level Security (RLS) restriction (code 42501) occurs or permission denied:
          // Informatively log warning without bubbling as fatal application crash
          if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security')) {
            console.warn(
              `[NotificationService] Supabase RLS restriction for farmer notification (code ${error.code}). Storing in local persistent notifications store.`
            );
          } else {
            console.warn('[NotificationService] Supabase notification insert notice:', error.message || error);
          }
        } else if (data) {
          const newUiNotif = mapDbNotificationToUi(data);
          if (params.bookingId && !newUiNotif.bookingId) {
            newUiNotif.bookingId = params.bookingId;
          }
          this.recordNotification(newUiNotif);
          return newUiNotif;
        }
      } catch (err: any) {
        console.warn('[NotificationService] Remote notification creation notice:', err?.message || err);
      }
    }

    // Local persistent fallback
    const localNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipientId: params.farmerId,
      bookingId: validBookingId || params.bookingId || undefined,
      title: params.title,
      message: params.message,
      type: mapParamTypeToUiType(params.type),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.recordNotification(localNotif);
    return localNotif;
  }

  /**
   * Subscribes to real-time notification events in Supabase.
   * Centralized subscriber manager to avoid duplicate channel creation and
   * "cannot add postgres_changes callbacks after subscribe()" errors.
   */
  subscribeToNotifications(onNotification: (notif?: SystemNotification) => void): () => void {
    this.listeners.add(onNotification);

    if (!this.channel && isSupabaseConfigured()) {
      const channelId = `notifications-channel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      this.channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const notif = payload.new ? mapDbNotificationToUi(payload.new) : undefined;
            if (notif) {
              this.recordNotification(notif);
            }
            this.listeners.forEach((listener) => {
              try {
                listener(notif);
              } catch (err) {
                console.warn('[NotificationService] Error executing notification listener:', err);
              }
            });
          }
        )
        .subscribe();
    }

    return () => {
      this.listeners.delete(onNotification);
      if (this.listeners.size === 0 && this.channel) {
        try {
          supabase.removeChannel(this.channel);
        } catch {
          // noop
        }
        this.channel = null;
      }
    };
  }
}

export const notificationService = new NotificationService();
