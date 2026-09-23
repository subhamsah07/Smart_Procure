/**
 * Payment Service - Tracks Direct Benefit Transfer (DBT) disbursements and payment records.
 * Interfaces directly with the 'payments' PostgreSQL table in Supabase.
 * Strictly adheres to Row Level Security: farmers can ONLY access their own payment records.
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { PaymentStatus } from '../types/database';
import { isValidUuid } from '../lib/utils';

export interface PaymentRecord {
  id: string;
  procurementRequestId: string;
  farmerId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional expanded details when available
  token?: string;
  cropName?: string;
  centreName?: string;
  quantityQuintals?: number;
}

class PaymentService {
  /**
   * Retrieves all real DBT payments for the logged-in farmer from Supabase.
   * Zero mock data.
   */
  async getFarmerPayments(farmerId?: string): Promise<PaymentRecord[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      let targetFarmerId = farmerId;
      if (!targetFarmerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        targetFarmerId = user.id;
      }

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          procurement_request_id,
          farmer_id,
          amount,
          payment_status,
          payment_reference,
          processed_by,
          processed_at,
          created_at,
          updated_at,
          procurement_requests (
            submitted_quantity,
            verified_quantity,
            crop_id,
            crops ( name ),
            procurement_centres ( name ),
            bookings ( token )
          )
        `)
        .eq('farmer_id', targetFarmerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching farmer payments:', error);
        return [];
      }

      if (!data) return [];

      return data.map((p: any) => ({
        id: p.id,
        procurementRequestId: p.procurement_request_id,
        farmerId: p.farmer_id,
        amount: Number(p.amount) || 0,
        paymentStatus: p.payment_status as PaymentStatus,
        paymentReference: p.payment_reference,
        processedBy: p.processed_by,
        processedAt: p.processed_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        token: p.procurement_requests?.bookings?.token,
        cropName: p.procurement_requests?.crops?.name,
        centreName: p.procurement_requests?.procurement_centres?.name,
        quantityQuintals: Number(p.procurement_requests?.verified_quantity || p.procurement_requests?.submitted_quantity) || undefined,
      }));
    } catch (err) {
      console.warn('Payment query error:', err);
      return [];
    }
  }

  /**
   * Retrieves the specific payment record linked to a booking ID.
   * Handles UUIDs, 6-character tokens, and human-readable booking IDs (e.g. 'book-z12v3ne') safely.
   */
  async getPaymentForBooking(bookingId: string): Promise<PaymentRecord | null> {
    if (!isSupabaseConfigured() || !bookingId) return null;

    try {
      let actualBookingUuid = isValidUuid(bookingId) ? bookingId : null;
      // If bookingId looks like a token or human-readable identifier (e.g. 'book-z12v3ne'), resolve it to the booking UUID
      if (!actualBookingUuid) {
        const cleanId = bookingId.trim();
        const { data: bRow } = await supabase
          .from('bookings')
          .select('id')
          .or(`token.ilike.${cleanId},qr_identifier.ilike.*${cleanId}*`)
          .limit(1)
          .maybeSingle();
        if (bRow?.id && isValidUuid(bRow.id)) {
          actualBookingUuid = bRow.id;
        }
      }

      // If no valid UUID could be resolved, do not query Postgres UUID column (prevents 22P02)
      if (!actualBookingUuid) {
        return null;
      }

      // First find the procurement request for this booking
      const { data: pr, error: prErr } = await supabase
        .from('procurement_requests')
        .select('id, status, final_value, estimated_value, farmer_id, updated_at')
        .eq('booking_id', actualBookingUuid)
        .maybeSingle();

      if (prErr) {
        console.warn('Procurement request query notice:', prErr);
      }

      let paymentData: any = null;
      if (pr?.id) {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('procurement_request_id', pr.id)
          .maybeSingle();

        if (!error && data) {
          paymentData = data;
        }
      }

      const isPrCompleted = pr?.status === 'payment_completed';

      if (paymentData) {
        const effectiveStatus: PaymentStatus =
          isPrCompleted || paymentData.payment_status === 'completed'
            ? 'completed'
            : (paymentData.payment_status as PaymentStatus);

        // If procurement is completed but payment record has older status, sync it in background
        if (isPrCompleted && paymentData.payment_status !== 'completed') {
          supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentData.id)
            .then(() => {});
        }

        return {
          id: paymentData.id,
          procurementRequestId: paymentData.procurement_request_id || pr?.id || '',
          farmerId: paymentData.farmer_id || pr?.farmer_id || '',
          amount: Number(paymentData.amount) || Number(pr?.final_value) || Number(pr?.estimated_value) || 0,
          paymentStatus: effectiveStatus,
          paymentReference: paymentData.payment_reference || (effectiveStatus === 'completed' ? `DBT-MSP-${paymentData.id.slice(-8)}` : null),
          processedBy: paymentData.processed_by,
          processedAt: paymentData.processed_at || (effectiveStatus === 'completed' ? (pr?.updated_at || new Date().toISOString()) : null),
          createdAt: paymentData.created_at,
          updatedAt: paymentData.updated_at,
        };
      }

      // If procurement request is completed by admin but payment row not yet created
      if (isPrCompleted && pr) {
        return {
          id: `pay-${pr.id}`,
          procurementRequestId: pr.id,
          farmerId: pr.farmer_id,
          amount: Number(pr.final_value) || Number(pr.estimated_value) || 0,
          paymentStatus: 'completed',
          paymentReference: `DBT-MSP-${pr.id.slice(-8)}`,
          processedBy: null,
          processedAt: pr.updated_at || new Date().toISOString(),
          createdAt: pr.updated_at || new Date().toISOString(),
          updatedAt: pr.updated_at || new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.warn('Error fetching payment for booking:', err);
      return null;
    }
  }

  /**
   * Subscribes to realtime updates on the payments table for a specific farmer.
   */
  subscribeToFarmerPayments(farmerId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured() || !farmerId) {
      return () => {};
    }

    const channel = supabase
      .channel(`farmer_payments_${farmerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `farmer_id=eq.${farmerId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const paymentService = new PaymentService();

