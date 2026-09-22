/**
 * SmartProcure - Supabase Database TypeScript Schema Definitions
 * Matches PostgreSQL schema across all 11 core domain tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CentreOperatingStatus = 'OPEN' | 'BUSY' | 'LUNCH_BREAK' | 'CLOSED' | 'MAINTENANCE';
export type TimeSlotPreference = 'morning' | 'afternoon' | 'no_preference';
export type BookingStatus = 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type QueueEventType =
  | 'booking_created'
  | 'checked_in'
  | 'processing_started'
  | 'processing_completed'
  | 'delayed'
  | 'procurement_paused'
  | 'procurement_resumed'
  | 'cancelled'
  | 'no_show';

export type ProcurementWorkflowStatus =
  | 'booking'
  | 'qr_verified'
  | 'document_verification'
  | 'weight_rate_verification'
  | 'crop_quality_check'
  | 'procurement_completed'
  | 'payment_processing'
  | 'payment_completed'
  | 'rejected'
  | 'cancelled';

export type VerificationType =
  | 'QR verification'
  | 'document verification'
  | 'weight verification'
  | 'rate verification'
  | 'crop quality check';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type NotificationType = 'booking' | 'queue' | 'delay' | 'procurement' | 'payment' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          mobile: string | null;
          state: string;
          district: string;
          profile_image_url: string | null;
          preferred_language: string;
          notification_preferences: {
            sms?: boolean;
            whatsapp?: boolean;
            voice?: boolean;
            delay_alerts?: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          mobile?: string | null;
          state: string;
          district: string;
          profile_image_url?: string | null;
          preferred_language?: string;
          notification_preferences?: {
            sms?: boolean;
            whatsapp?: boolean;
            voice?: boolean;
            delay_alerts?: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          mobile?: string | null;
          state?: string;
          district?: string;
          profile_image_url?: string | null;
          preferred_language?: string;
          notification_preferences?: {
            sms?: boolean;
            whatsapp?: boolean;
            voice?: boolean;
            delay_alerts?: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
      };

      state_admins: {
        Row: {
          id: string;
          auth_user_id: string;
          state: string;
          state_code: string;
          admin_name: string;
          email: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          state: string;
          state_code: string;
          admin_name: string;
          email: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          state?: string;
          state_code?: string;
          admin_name?: string;
          email?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      districts: {
        Row: {
          id: string;
          state: string;
          state_code: string;
          district_name: string;
          district_code: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          state: string;
          state_code: string;
          district_name: string;
          district_code?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          state?: string;
          state_code?: string;
          district_name?: string;
          district_code?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };

      procurement_centres: {
        Row: {
          id: string;
          code: string;
          name: string;
          state: string;
          district: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          operating_status: CentreOperatingStatus;
          verified: boolean;
          opening_time: string;
          lunch_start: string;
          lunch_end: string;
          closing_time: string;
          capacity_per_day_quintals: number;
          contact_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          state: string;
          district: string;
          address: string;
          latitude?: number | null;
          longitude?: number | null;
          operating_status?: CentreOperatingStatus;
          verified?: boolean;
          opening_time?: string;
          lunch_start?: string;
          lunch_end?: string;
          closing_time?: string;
          capacity_per_day_quintals?: number;
          contact_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          state?: string;
          district?: string;
          address?: string;
          latitude?: number | null;
          longitude?: number | null;
          operating_status?: CentreOperatingStatus;
          verified?: boolean;
          opening_time?: string;
          lunch_start?: string;
          lunch_end?: string;
          closing_time?: string;
          capacity_per_day_quintals?: number;
          contact_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      crops: {
        Row: {
          id: string;
          name: string;
          hindi_name: string | null;
          category: string | null;
          season: string | null;
          standard_unit: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          hindi_name?: string | null;
          category?: string | null;
          season?: string | null;
          standard_unit?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          hindi_name?: string | null;
          category?: string | null;
          season?: string | null;
          standard_unit?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      crop_prices: {
        Row: {
          id: string;
          crop_id: string;
          state: string;
          rate: number;
          unit: string;
          effective_from: string;
          effective_until: string | null;
          active: boolean;
          created_by_admin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          crop_id: string;
          state: string;
          rate: number;
          unit?: string;
          effective_from?: string;
          effective_until?: string | null;
          active?: boolean;
          created_by_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          crop_id?: string;
          state?: string;
          rate?: number;
          unit?: string;
          effective_from?: string;
          effective_until?: string | null;
          active?: boolean;
          created_by_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      bookings: {
        Row: {
          id: string;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          quantity: number;
          preferred_date: string;
          preferred_time_preference: TimeSlotPreference;
          assigned_date: string | null;
          assigned_start_time: string | null;
          assigned_end_time: string | null;
          token: string;
          qr_identifier: string;
          booking_status: BookingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          quantity: number;
          preferred_date: string;
          preferred_time_preference?: TimeSlotPreference;
          assigned_date?: string | null;
          assigned_start_time?: string | null;
          assigned_end_time?: string | null;
          token?: string;
          qr_identifier: string;
          booking_status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          centre_id?: string;
          crop_id?: string;
          quantity?: number;
          preferred_date?: string;
          preferred_time_preference?: TimeSlotPreference;
          assigned_date?: string | null;
          assigned_start_time?: string | null;
          assigned_end_time?: string | null;
          token?: string;
          qr_identifier?: string;
          booking_status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
      };

      queue_events: {
        Row: {
          id: string;
          booking_id: string | null;
          centre_id: string;
          event_type: QueueEventType;
          event_time: string;
          estimated_processing_minutes: number;
          delay_minutes: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          centre_id: string;
          event_type: QueueEventType;
          event_time?: string;
          estimated_processing_minutes?: number;
          delay_minutes?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          centre_id?: string;
          event_type?: QueueEventType;
          event_time?: string;
          estimated_processing_minutes?: number;
          delay_minutes?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };

      procurement_requests: {
        Row: {
          id: string;
          booking_id: string;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          submitted_quantity: number;
          verified_quantity: number | null;
          configured_rate: number;
          verified_rate: number | null;
          estimated_value: number;
          final_value: number | null;
          status: ProcurementWorkflowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          submitted_quantity: number;
          verified_quantity?: number | null;
          configured_rate: number;
          verified_rate?: number | null;
          estimated_value: number;
          final_value?: number | null;
          status?: ProcurementWorkflowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          farmer_id?: string;
          centre_id?: string;
          crop_id?: string;
          submitted_quantity?: number;
          verified_quantity?: number | null;
          configured_rate?: number;
          verified_rate?: number | null;
          estimated_value?: number;
          final_value?: number | null;
          status?: ProcurementWorkflowStatus;
          created_at?: string;
          updated_at?: string;
        };
      };

      verification_records: {
        Row: {
          id: string;
          procurement_request_id: string;
          verification_type: VerificationType;
          status: VerificationStatus;
          verified_by: string | null;
          notes: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          procurement_request_id: string;
          verification_type: VerificationType;
          status?: VerificationStatus;
          verified_by?: string | null;
          notes?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          procurement_request_id?: string;
          verification_type?: VerificationType;
          status?: VerificationStatus;
          verified_by?: string | null;
          notes?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };

      payments: {
        Row: {
          id: string;
          procurement_request_id: string;
          farmer_id: string;
          amount: number;
          payment_status: PaymentStatus;
          payment_reference: string | null;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          procurement_request_id: string;
          farmer_id: string;
          amount: number;
          payment_status?: PaymentStatus;
          payment_reference?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          procurement_request_id?: string;
          farmer_id?: string;
          amount?: number;
          payment_status?: PaymentStatus;
          payment_reference?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      notifications: {
        Row: {
          id: string;
          farmer_id: string;
          booking_id: string | null;
          type: NotificationType;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          booking_id?: string | null;
          type: NotificationType;
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          booking_id?: string | null;
          type?: NotificationType;
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
    };

    Views: {
      v_active_centre_queues: {
        Row: {
          centre_id: string;
          centre_code: string;
          centre_name: string;
          centre_state: string;
          centre_district: string;
          operating_status: CentreOperatingStatus;
          capacity_per_day_quintals: number;
          active_processing_token: string | null;
          total_waiting_in_queue: number;
          current_delay_minutes: number;
          last_event_at: string | null;
        };
      };
      v_ml_operational_processing_history: {
        Row: {
          booking_id: string;
          token: string;
          centre_id: string;
          centre_code: string;
          centre_name: string;
          centre_state: string;
          centre_district: string;
          centre_daily_capacity: number;
          crop_id: string;
          crop_name: string;
          crop_category: string | null;
          submitted_quantity_quintals: number;
          assigned_date: string | null;
          assigned_start_time: string | null;
          assigned_end_time: string | null;
          actual_checkin_time: string | null;
          actual_processing_start_time: string | null;
          actual_processing_completed_time: string | null;
          actual_processing_duration_minutes: number | null;
          reported_delay_minutes: number;
          lunch_break_overlapped: boolean;
          booking_status: BookingStatus;
          procurement_status: ProcurementWorkflowStatus | null;
          verified_quantity_quintals: number | null;
          final_payout_amount: number | null;
          booking_created_at: string;
        };
      };
    };
    Functions: {
      generate_procurement_token: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_auth_admin_state: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin_for_state: {
        Args: {
          target_state: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      centre_operating_status: CentreOperatingStatus;
      timeslot_preference: TimeSlotPreference;
      booking_status: BookingStatus;
      queue_event_type: QueueEventType;
      procurement_workflow_status: ProcurementWorkflowStatus;
      verification_type: VerificationType;
      verification_status: VerificationStatus;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
