import * as React from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { notificationService } from '../../services/notificationService';
import { SystemNotification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = React.useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const items = await notificationService.getNotifications();
      setNotifications(items || []);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();

    const unsubscribe = notificationService.subscribeToNotifications(() => {
      fetchNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) {
        notificationService.markAsRead(n.id);
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('notifications.title', 'Operational Notifications')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('notifications.subtitle', 'Arrival updates, weighbridge speed advisories, and procurement completion notices')}
          </p>
        </div>

        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5" />
            <span>{t('notifications.markAllRead', 'Mark all as read')}</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-500 dark:text-neutral-400">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500">
            <Bell className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {t('notifications.emptyTitle', 'No notifications yet')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm">
              {t(
                'notifications.emptyDesc',
                'You will receive real-time notifications here when your slot is booked, procurement is completed, and payment is processed.'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isWarning = n.type === 'DELAY_ALERT' || (n as any).type === 'DELAY' || (n as any).type === 'LUNCH_BREAK';
            const isSuccess = n.type === 'PAYMENT_CREDIT' || (n as any).type === 'PAYMENT' || n.title.includes('Completed');

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  !n.isRead
                    ? 'bg-white dark:bg-neutral-950 border-emerald-500/60 dark:border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-slate-50/70 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isWarning
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                          : isSuccess
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {isWarning ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                        {!n.isRead && (
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl whitespace-pre-line">{n.message}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
