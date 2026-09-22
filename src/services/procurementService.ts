/**
 * Procurement Service - Manages the 7-stage procurement workflow and verification audits.
 * Interfaces directly with 'procurement_requests' and 'verification_records' PostgreSQL tables in Supabase.
 * Zero mock data.
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ProcurementWorkflowStatus, VerificationType } from '../types/database';

export interface ProcurementRequestDetails {
  id: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  cropId: string;
  submittedQuantity: number;
  verifiedQuantity: number | null;
  configuredRate: number;
  verifiedRate: number | null;
  estimatedValue: number;
  finalValue: number | null;
  status: ProcurementWorkflowStatus;
  createdAt: string;
  updatedAt: string;
  cropName?: string;
  centreName?: string;
  token?: string;
}

export interface VerificationAuditRecord {
  id: string;
  procurementRequestId: string;
  verificationType: VerificationType;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy: string | null;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

class ProcurementService {
  /**
   * Retrieves active procurement request by booking ID from Supabase.
   */
  async getRequestByBookingId(bookingId: string): Promise<ProcurementRequestDetails | null> {
    if (!isSupabaseConfigured() || !bookingId) return null;

    try {
      const { data, error } = await supabase
        .from('procurement_requests')
        .select(`
          id,
          booking_id,
          farmer_id,
          centre_id,
          crop_id,
          submitted_quantity,
          verified_quantity,
          configured_rate,
          verified_rate,
          estimated_value,
          final_value,
          status,
          created_at,
          updated_at,
          crops ( name ),
          procurement_centres ( name ),
          bookings ( token )
        `)
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        bookingId: data.booking_id,
        farmerId: data.farmer_id,
        centreId: data.centre_id,
        cropId: data.crop_id,
        submittedQuantity: Number(data.submitted_quantity) || 0,
        verifiedQuantity: data.verified_quantity != null ? Number(data.verified_quantity) : null,
        configuredRate: Number(data.configured_rate) || 0,
        verifiedRate: data.verified_rate != null ? Number(data.verified_rate) : null,
        estimatedValue: Number(data.estimated_value) || 0,
        finalValue: data.final_value != null ? Number(data.final_value) : null,
        status: data.status as ProcurementWorkflowStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        cropName: (data.crops as any)?.name,
        centreName: (data.procurement_centres as any)?.name,
        token: (data.bookings as any)?.token,
      };
    } catch (err) {
      console.warn('Supabase procurement request query error:', err);
      return null;
    }
  }

  /**
   * Retrieves verification audit checkpoint records for a procurement request.
   */
  async getVerificationRecords(procurementRequestId: string): Promise<VerificationAuditRecord[]> {
    if (!isSupabaseConfigured() || !procurementRequestId) return [];

    try {
      const { data, error } = await supabase
        .from('verification_records')
        .select('*')
        .eq('procurement_request_id', procurementRequestId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((v: any) => ({
        id: v.id,
        procurementRequestId: v.procurement_request_id,
        verificationType: v.verification_type as VerificationType,
        status: v.status,
        verifiedBy: v.verified_by,
        notes: v.notes,
        verifiedAt: v.verified_at,
        createdAt: v.created_at,
      }));
    } catch (err) {
      console.warn('Supabase verification audit records error:', err);
      return [];
    }
  }

  /**
   * Subscribes to realtime updates on procurement_requests for a farmer.
   */
  subscribeToFarmerProcurement(farmerId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured() || !farmerId) {
      return () => {};
    }

    const channel = supabase
      .channel(`farmer_procurement_${farmerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'procurement_requests',
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

export const procurementService = new ProcurementService();

