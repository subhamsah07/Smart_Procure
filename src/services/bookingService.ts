/**
 * SmartProcure - Booking Service
 * Handles farmer procurement slot booking, deterministic slot assignment,
 * cryptographically strong random token issuance, and Supabase database persistence.
 *
 * Interfaces with 'bookings', 'procurement_centres', 'crops', 'crop_prices',
 * 'profiles', and 'queue_events' PostgreSQL tables in Supabase.
 */

import {
  ProcurementBooking,
  IndianState,
  CropName,
  TimeSlotPreference,
  ProcurementWorkflowStatus,
} from '../types';
import {
  generateProcurementToken,
  generateVerificationCode,
  deriveVerificationCode,
  generateOpaqueQrPayload,
  calculateEstimatedProcurementValue,
} from '../lib/utils';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { cropService } from './cropService';
import { centreService } from './centreService';
import { notificationService } from './notificationService';
import { queueService } from './queueService';

export function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Next feasible appointment window recommendation
 */
export interface FeasibleAppointmentWindow {
  date: string; // YYYY-MM-DD e.g. "2026-09-08"
  formattedDate: string; // "8 September 2026"
  slotTime: string; // "10:00 AM – 11:00 AM"
  slotStartTime: string;
  slotEndTime: string;
  period: 'morning' | 'afternoon';
}

/**
 * Centre availability check result
 */
export interface CentreAvailabilityResult {
  isAvailable: boolean;
  capacityQuintals: number;
  bookedQuintals: number;
  remainingQuintals: number;
  operatingStatus: string;
  message: string;
  nextFeasibleSlot?: FeasibleAppointmentWindow;
}

/**
 * Standard operating slot definition
 * Operating hours:
 * Morning:   09:00 AM – 02:00 PM (14:00) -> 5 discrete 1-hour slots
 * Lunch:     02:00 PM – 03:00 PM (15:00) -> MANDATORY PAUSE; NEVER ASSIGNED
 * Afternoon: 03:00 PM – 06:00 PM (18:00) -> 3 discrete 1-hour slots
 */
export interface OperatingSlotDefinition {
  slotId: string;
  startTime: string; // '09:00:00'
  endTime: string;   // '10:00:00'
  formattedDisplay: string; // '09:00 AM – 10:00 AM'
  period: 'morning' | 'afternoon';
}

export interface AvailableSlotInfo {
  slotId: string;
  startTime: string;
  endTime: string;
  formattedDisplay: string;
  period: 'morning' | 'afternoon';
  slotCapacityQuintals: number;
  bookedQuintals: number;
  remainingQuintals: number;
  bookedFarmersCount: number;
  isAvailable: boolean;
}

export const OFFICIAL_OPERATING_SLOTS: OperatingSlotDefinition[] = [
  // Morning appointment windows (09:00 AM - 02:00 PM)
  {
    slotId: 'slot-m-1',
    startTime: '09:00:00',
    endTime: '10:00:00',
    formattedDisplay: '09:00 AM – 10:00 AM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-2',
    startTime: '10:00:00',
    endTime: '11:00:00',
    formattedDisplay: '10:00 AM – 11:00 AM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-3',
    startTime: '11:00:00',
    endTime: '12:00:00',
    formattedDisplay: '11:00 AM – 12:00 PM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-4',
    startTime: '12:00:00',
    endTime: '13:00:00',
    formattedDisplay: '12:00 PM – 01:00 PM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-5',
    startTime: '13:00:00',
    endTime: '14:00:00',
    formattedDisplay: '01:00 PM – 02:00 PM',
    period: 'morning',
  },
  // LUNCH BREAK: 14:00:00 - 15:00:00 (Mandatory centre pause. Strictly NO slots assigned)
  // Afternoon appointment windows (03:00 PM - 06:00 PM)
  {
    slotId: 'slot-a-1',
    startTime: '15:00:00',
    endTime: '16:00:00',
    formattedDisplay: '03:00 PM – 04:00 PM',
    period: 'afternoon',
  },
  {
    slotId: 'slot-a-2',
    startTime: '16:00:00',
    endTime: '17:00:00',
    formattedDisplay: '04:00 PM – 05:00 PM',
    period: 'afternoon',
  },
  {
    slotId: 'slot-a-3',
    startTime: '17:00:00',
    endTime: '18:00:00',
    formattedDisplay: '05:00 PM – 06:00 PM',
    period: 'afternoon',
  },
];

export interface CreateBookingParams {
  cropId?: string;
  cropName: CropName;
  quantityQuintals: number;
  ratePerQuintal?: number;
  centreId: string;
  centreName?: string;
  bookingDate: string;
  timePreference: 'morning' | 'afternoon' | 'no_preference';
  farmerName?: string;
  farmerMobile?: string;
  farmerState?: IndianState;
  farmerDistrict?: string;
}

/**
 * Converts HH:MM:SS or HH:MM to 12-hour AM/PM display string
 */
export function formatSlotTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return '09:00 AM – 10:00 AM';

  const to12Hr = (timeStr: string): string => {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? '0' + hours : '' + hours;
    return `${strHours}:${minutes} ${ampm}`;
  };

  return `${to12Hr(startTime)} – ${to12Hr(endTime)}`;
}

function formatTimePreferenceDisplay(pref: string): string {
  switch (pref?.toLowerCase()) {
    case 'morning':
      return 'Morning (09:00 AM – 02:00 PM)';
    case 'afternoon':
      return 'Afternoon (03:00 PM – 06:00 PM)';
    default:
      return 'No Preference (09:00 AM – 06:00 PM)';
  }
}

/**
 * Maps PostgreSQL 'bookings' database row to the UI ProcurementBooking interface
 */
function mapDbBookingToUi(b: any, rateLookup?: number): ProcurementBooking {
  const rate = rateLookup || 2425;
  const quantity = Number(b.quantity) || 0;
  const estimatedValue = calculateEstimatedProcurementValue(quantity, rate);

  const assignedSlotTime =
    b.assigned_start_time && b.assigned_end_time
      ? formatSlotTime(b.assigned_start_time, b.assigned_end_time)
      : '09:00 AM – 10:00 AM';

  return {
    id: b.id,
    token: b.token,
    verificationCode: deriveVerificationCode(b.token, b.qr_identifier),
    opaqueQrIdentifier: b.qr_identifier || generateOpaqueQrPayload(b.id, b.token),
    farmerId: b.farmer_id,
    farmerName: b.profiles?.full_name || 'Farmer',
    farmerMobile: b.profiles?.mobile || '',
    farmerState: (b.procurement_centres?.state || b.profiles?.state || 'Punjab') as IndianState,
    farmerDistrict: b.procurement_centres?.district || b.profiles?.district || '',
    centreId: b.centre_id,
    centreName: b.procurement_centres?.name || 'Procurement Centre',
    cropId: b.crop_id,
    cropName: (b.crops?.name || 'Wheat') as CropName,
    quantityQuintals: quantity,
    ratePerQuintal: rate,
    estimatedValue,
    bookingDate: b.assigned_date || b.preferred_date,
    preferredTimeSlot: formatTimePreferenceDisplay(b.preferred_time_preference),
    assignedSlotTime,
    assignedDate: b.assigned_date || b.preferred_date,
    assignedStartTime: b.assigned_start_time || '09:00:00',
    assignedEndTime: b.assigned_end_time || '10:00:00',
    bookingStatus: b.booking_status,
    workflowStatus: (b.booking_status?.toUpperCase() || 'BOOKED') as ProcurementWorkflowStatus,
    // Real queue metrics start at 0 / neutral until physical gate check-in
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    estimatedArrivalTime: 'Assigned upon check-in',
    delayMinutes: 0,
    isLunchBreakCrossed: false,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

class BookingService {
  // In-memory cache for optimistic updates and testing, backed by localStorage
  private localBookings: ProcurementBooking[] = [];

  constructor() {
    // Keep localBookings empty initially; always load user-scoped on demand
    this.localBookings = [];
  }

  public async getResolvedCurrentUserId(): Promise<string | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user?.id) {
          return user.id;
        }
      } catch {
        /* fallback to profile cache */
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem('smartprocure_farmer_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id) {
            return String(parsed.id);
          }
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }

  public resetLocalCache(): void {
    this.localBookings = [];
  }

  private getStorageKey(userId?: string | null): string {
    if (userId && typeof userId === 'string' && userId.trim()) {
      return `smartprocure_farmer_bookings_${userId.trim()}`;
    }
    return 'smartprocure_farmer_bookings';
  }

  private initLocalBookings(userId?: string | null) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (userId && typeof userId === 'string' && userId.trim()) {
          const userKey = this.getStorageKey(userId);
          const stored = localStorage.getItem(userKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              // Positively verify owner is the current user. Never allow un-scoped or another user's booking!
              this.localBookings = parsed.filter(
                (b: ProcurementBooking) => b && b.farmerId === userId
              );
              return;
            }
          }
          // Check legacy storage only to safely migrate strictly matching records
          const legacy = localStorage.getItem('smartprocure_farmer_bookings');
          if (legacy) {
            const parsedLegacy = JSON.parse(legacy);
            if (Array.isArray(parsedLegacy)) {
              const matched = parsedLegacy.filter(
                (b: ProcurementBooking) => b && b.farmerId === userId
              );
              if (matched.length > 0) {
                this.localBookings = matched;
                this.persistLocalBookings(userId);
                return;
              }
            }
          }
          this.localBookings = [];
          return;
        }

        // If NO userId is specified, NEVER load un-scoped bookings into in-memory cache
        this.localBookings = [];
      }
    } catch {
      this.localBookings = [];
    }
  }

  private persistLocalBookings(userId?: string | null) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (userId && typeof userId === 'string' && userId.trim()) {
          const userKey = this.getStorageKey(userId);
          localStorage.setItem(userKey, JSON.stringify(this.localBookings));
        }
      }
    } catch {
      /* non-blocking */
    }
  }

  public getLocalBookings(): ProcurementBooking[] {
    return [...this.localBookings];
  }

  /**
   * Generates a cryptographically strong, non-sequential 6-character token
   * and verifies uniqueness against the 'bookings' table in Supabase.
   * Example: "SP7K4Q", "A9X2LM"
   */
  async generateUniqueToken(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = generateProcurementToken();

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('token')
            .eq('token', candidate)
            .maybeSingle();

          if (!error && !data) {
            return candidate;
          }
        } catch (err) {
          console.warn('Error checking token collision in Supabase:', err);
          return candidate;
        }
      } else {
        const collision = this.localBookings.some((b) => b.token === candidate);
        if (!collision) return candidate;
      }
    }
    return generateProcurementToken();
  }

  /**
   * Calculates slot load and determines slot availability for a centre on a given date.
   * Deterministic rule-based slot calculations.
   */
  async getAvailableSlots(
    centreId: string,
    bookingDate: string,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference',
    requestedQuantity: number = 0
  ): Promise<AvailableSlotInfo[]> {
    // 1. Fetch real centre capacity from centreService or Supabase
    const centre = await centreService.getCentreById(centreId);
    const dailyCapacity = centre ? Number(centre.capacityPerDayQuintals) || 3000 : 3000;

    // 8 operating hours total -> slot target capacity per 1-hour window
    const slotCapacity = Math.max(100, Math.floor(dailyCapacity / OFFICIAL_OPERATING_SLOTS.length));

    // 2. Query all existing active bookings on this date for this centre
    const slotBookedQuintals: Record<string, number> = {};
    const slotBookedCount: Record<string, number> = {};
    let totalDayBooked = 0;

    OFFICIAL_OPERATING_SLOTS.forEach((s) => {
      slotBookedQuintals[s.startTime] = 0;
      slotBookedCount[s.startTime] = 0;
    });

    if (isSupabaseConfigured() && isValidUuid(centreId)) {
      try {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('quantity, assigned_start_time, preferred_date, assigned_date')
          .eq('centre_id', centreId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress']);

        if (bookingsData && bookingsData.length > 0) {
          bookingsData.forEach((b) => {
            const qty = Number(b.quantity) || 0;
            totalDayBooked += qty;
            const startTime = b.assigned_start_time ? b.assigned_start_time.substring(0, 8) : null;
            if (startTime && slotBookedQuintals[startTime] !== undefined) {
              slotBookedQuintals[startTime] += qty;
              slotBookedCount[startTime] += 1;
            } else {
              slotBookedQuintals['09:00:00'] += qty;
              slotBookedCount['09:00:00'] += 1;
            }
          });
        }
      } catch (err) {
        console.warn('Existing bookings slot load query error:', err);
      }
    }

    // Include local active bookings if any
    this.localBookings
      .filter(
        (b) =>
          b.centreId === centreId &&
          b.bookingDate === bookingDate &&
          b.workflowStatus !== 'CANCELLED' &&
          b.workflowStatus !== 'REJECTED'
      )
      .forEach((b) => {
        const qty = Number(b.quantityQuintals) || 0;
        const startTime = b.assignedStartTime ? b.assignedStartTime.substring(0, 8) : '09:00:00';
        if (slotBookedQuintals[startTime] !== undefined) {
          slotBookedQuintals[startTime] += qty;
          slotBookedCount[startTime] += 1;
        }
        totalDayBooked += qty;
      });

    const dayRemaining = Math.max(0, dailyCapacity - totalDayBooked);

    // 3. Build AvailableSlotInfo list
    const results: AvailableSlotInfo[] = OFFICIAL_OPERATING_SLOTS.map((slot) => {
      const booked = slotBookedQuintals[slot.startTime] || 0;
      const count = slotBookedCount[slot.startTime] || 0;
      const remaining = Math.max(0, slotCapacity - booked);
      // Available if slot has remaining quota OR if the daily capacity as a whole can accommodate the requested load
      const isAvailable = dayRemaining > 0 && (requestedQuantity <= 0 || requestedQuantity <= dayRemaining);

      return {
        slotId: slot.slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        formattedDisplay: slot.formattedDisplay,
        period: slot.period,
        slotCapacityQuintals: slotCapacity,
        bookedQuintals: booked,
        remainingQuintals: remaining,
        bookedFarmersCount: count,
        isAvailable,
      };
    });

    if (timePreference === 'morning') {
      return results.filter((s) => s.period === 'morning');
    }
    if (timePreference === 'afternoon') {
      return results.filter((s) => s.period === 'afternoon');
    }
    return results;
  }

  /**
   * Deterministic slot-assignment algorithm
   * Selects an available procurement slot based on:
   * 1. Centre operating hours (09:00 - 18:00, strictly excluding 14:00 - 15:00 lunch)
   * 2. Farmer's time preference ('morning', 'afternoon', or 'no_preference')
   * 3. Current booked load across slots
   * 4. Slot capacity
   */
  async findDeterministicSlot(
    centreId: string,
    bookingDate: string,
    timePreference: 'morning' | 'afternoon' | 'no_preference',
    requestedQuantity: number
  ): Promise<OperatingSlotDefinition> {
    const slots = await this.getAvailableSlots(centreId, bookingDate, timePreference, requestedQuantity);

    const availableSlots = slots.filter((s) => s.isAvailable);

    if (availableSlots.length === 0) {
      const prefLabel =
        timePreference === 'morning'
          ? 'Morning (09:00 AM – 02:00 PM)'
          : timePreference === 'afternoon'
          ? 'Afternoon (03:00 PM – 06:00 PM)'
          : 'the entire day';
      throw new Error(
        `No available procurement slots found for ${bookingDate} during ${prefLabel}. All slots have reached capacity. Please select another date or preference.`
      );
    }

    // Deterministic selection:
    // 1. Primary sort: lowest booked quintals (load balancing across mandi staff)
    // 2. Secondary sort: earliest slot time (tie breaker)
    availableSlots.sort((a, b) => {
      if (a.bookedQuintals !== b.bookedQuintals) {
        return a.bookedQuintals - b.bookedQuintals;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    const chosen = availableSlots[0];
    const match = OFFICIAL_OPERATING_SLOTS.find((s) => s.startTime === chosen.startTime);
    if (!match) {
      return OFFICIAL_OPERATING_SLOTS[0];
    }
    return match;
  }

  /**
   * Scans upcoming dates to discover the next realistically feasible appointment window.
   * Probes +1, +2, up to +14 days ahead until finding an available slot with sufficient capacity.
   */
  async findNextFeasibleAppointmentWindow(
    centreId: string,
    fromDate: string,
    requestedQuantity: number = 0,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference'
  ): Promise<FeasibleAppointmentWindow | undefined> {
    const startDate = new Date(fromDate);
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const nextDateObj = new Date(startDate);
      nextDateObj.setDate(startDate.getDate() + dayOffset);
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      try {
        const slots = await this.getAvailableSlots(centreId, nextDateStr, timePreference, requestedQuantity);
        const availableSlot = slots.find((s) => s.isAvailable);
        if (availableSlot) {
          const formattedDate = nextDateObj.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return {
            date: nextDateStr,
            formattedDate,
            slotTime: availableSlot.formattedDisplay,
            slotStartTime: availableSlot.startTime,
            slotEndTime: availableSlot.endTime,
            period: availableSlot.period,
          };
        }
      } catch {
        /* continue probing next day */
      }
    }
    return undefined;
  }

  /**
   * Checks real centre capacity and slot availability for a given date.
   */
  async checkCentreAvailability(
    centreId: string,
    bookingDate: string,
    requestedQuantity: number = 0,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference'
  ): Promise<CentreAvailabilityResult> {
    if (!centreId || !bookingDate) {
      return {
        isAvailable: false,
        capacityQuintals: 0,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus: 'UNKNOWN',
        message: 'Invalid centre or date selected.',
      };
    }

    // 1. Resolve centre details and daily intake capacity
    const centre = await centreService.getCentreById(centreId);
    if (!centre) {
      return {
        isAvailable: false,
        capacityQuintals: 0,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus: 'UNKNOWN',
        message: 'Procurement centre not found.',
      };
    }

    const capacity = Number(centre.capacityPerDayQuintals) || 3000;
    const operatingStatus = centre.status || 'OPEN';

    if ((operatingStatus as string) === 'CLOSED' || (operatingStatus as string) === 'MAINTENANCE') {
      const nextFeasibleSlot = await this.findNextFeasibleAppointmentWindow(
        centreId,
        bookingDate,
        requestedQuantity,
        timePreference
      );
      return {
        isAvailable: false,
        capacityQuintals: capacity,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus,
        message: 'Centre is currently closed for maintenance or intake suspension.',
        nextFeasibleSlot,
      };
    }

    // 2. Sum quantity from VALID bookings for this centre and date
    let totalBooked = 0;

    if (isSupabaseConfigured() && isValidUuid(centreId)) {
      try {
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('quantity')
          .eq('centre_id', centreId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress']);

        if (!bookingsErr && bookingsData) {
          totalBooked = bookingsData.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
        }
      } catch (err) {
        console.warn('Booking availability query error:', err);
      }
    }

    // Add any active in-memory bookings
    this.localBookings
      .filter(
        (b) =>
          b.centreId === centreId &&
          b.bookingDate === bookingDate &&
          b.workflowStatus !== 'CANCELLED' &&
          b.workflowStatus !== 'REJECTED'
      )
      .forEach((b) => {
        totalBooked += Number(b.quantityQuintals) || 0;
      });

    // 3. Compute remaining daily capacity
    const remaining = Math.max(0, capacity - totalBooked);
    const dayHasRoom = remaining > 0 && (requestedQuantity <= 0 || requestedQuantity <= remaining);

    if (!dayHasRoom) {
      const nextFeasibleSlot = await this.findNextFeasibleAppointmentWindow(
        centreId,
        bookingDate,
        requestedQuantity,
        timePreference
      );
      return {
        isAvailable: false,
        capacityQuintals: capacity,
        bookedQuintals: totalBooked,
        remainingQuintals: remaining,
        operatingStatus,
        message:
          requestedQuantity > remaining
            ? `Declared lot (${requestedQuantity} Q) exceeds remaining daily capacity (${remaining} Q).`
            : `${bookingDate} is currently at capacity (${capacity} Q booked).`,
        nextFeasibleSlot,
      };
    }

    return {
      isAvailable: true,
      capacityQuintals: capacity,
      bookedQuintals: totalBooked,
      remainingQuintals: remaining,
      operatingStatus,
      message: `Slots available (${remaining.toLocaleString()} Q remaining capacity)`,
    };
  }

  /**
   * Checks if the farmer already has an active booking that conflicts with the selected date.
   */
  async checkFarmerBookingConflict(
    farmerId: string,
    bookingDate: string
  ): Promise<{ hasConflict: boolean; conflictingToken?: string }> {
    if (!farmerId || !bookingDate) return { hasConflict: false };

    if (isSupabaseConfigured() && isValidUuid(farmerId)) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, token, preferred_date, assigned_date')
          .eq('farmer_id', farmerId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress'])
          .maybeSingle();

        if (!error && data) {
          return { hasConflict: true, conflictingToken: data.token };
        }
      } catch (err) {
        console.warn('Error checking booking conflict:', err);
      }
    }

    this.initLocalBookings();
    const localConflict = this.localBookings.find(
      (b) =>
        b.farmerId === farmerId &&
        (b.assignedDate === bookingDate || b.bookingDate === bookingDate) &&
        ['booked', 'confirmed', 'in_progress'].includes(b.bookingStatus)
    );
    if (localConflict) {
      return { hasConflict: true, conflictingToken: localConflict.token };
    }

    return { hasConflict: false };
  }

  /**
   * Retrieves the authenticated farmer's currently active booking directly from Supabase.
   * Supabase database is the sole authoritative source of truth.
   * Returns null if no active booking exists (clean empty state).
   */
  async getActiveBooking(): Promise<ProcurementBooking | null> {
    const currentUserId = await this.getResolvedCurrentUserId();
    if (!currentUserId) {
      return null;
    }

    if (isSupabaseConfigured() && isValidUuid(currentUserId)) {
      try {
        let { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
            crops (id, name, hindi_name),
            profiles (id, full_name, mobile, state, district)
          `)
          .eq('farmer_id', currentUserId)
          .in('booking_status', ['booked', 'confirmed', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Supabase active booking query notice:', error);
        }

        // If no pending or in_progress booking exists, check for today's completed booking
        if (!data) {
          const todayStr = new Date().toISOString().split('T')[0];
          const { data: completedRow } = await supabase
            .from('bookings')
            .select(`
              *,
              procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
              crops (id, name, hindi_name),
              profiles (id, full_name, mobile, state, district)
            `)
            .eq('farmer_id', currentUserId)
            .eq('booking_status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (completedRow) {
            const rowUpdated = completedRow.updated_at ? completedRow.updated_at.split('T')[0] : '';
            const rowCreated = completedRow.created_at ? completedRow.created_at.split('T')[0] : '';
            const rowAssigned = completedRow.assigned_date || '';
            if (rowUpdated === todayStr || rowCreated === todayStr || rowAssigned === todayStr) {
              data = completedRow;
            }
          }
        }

        if (data) {
          let rate = 2425;
          try {
            rate = await cropService.getCropPriceByState(
              (data.crops?.name || 'Wheat') as CropName,
              (data.procurement_centres?.state || 'Bihar') as IndianState
            );
          } catch {
            /* ignore rate lookup */
          }
          return mapDbBookingToUi(data, rate);
        }

        // If Supabase authenticated user query completed without finding an active booking,
        // check ONLY this user's scoped local store fallback
        this.initLocalBookings(currentUserId);
        const userLocalActive = this.localBookings.find(
          (b) => b.farmerId === currentUserId && ['booked', 'confirmed', 'in_progress'].includes(b.bookingStatus)
        );
        if (userLocalActive) return userLocalActive;

        return null;
      } catch (err) {
        console.warn('Active booking query exception:', err);
      }
    }

    // Local scoped fallback for authenticated / active user
    this.initLocalBookings(currentUserId);
    if (this.localBookings.length > 0) {
      const active = this.localBookings.find((b) =>
        b.farmerId === currentUserId && ['booked', 'confirmed', 'in_progress'].includes(b.bookingStatus)
      );
      if (active) return active;
    }

    return null;
  }

  /**
   * Alias for getActiveBooking
   */
  async getCurrentBooking(): Promise<ProcurementBooking | null> {
    return this.getActiveBooking();
  }

  /**
   * Retrieves all historical and current bookings strictly for the authenticated farmer.
   */
  async getMyBookings(): Promise<ProcurementBooking[]> {
    const currentUserId = await this.getResolvedCurrentUserId();
    if (!currentUserId) {
      return [];
    }

    if (isSupabaseConfigured() && isValidUuid(currentUserId)) {
      try {
        const map = new Map<string, ProcurementBooking>();

        // 1. First fetch authoritative bookings from Supabase strictly for this authenticated user
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            procurement_centres (id, name, state, district),
            crops (id, name, hindi_name),
            profiles (id, full_name, mobile)
          `)
          .eq('farmer_id', currentUserId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          data.forEach((item) => {
            const ui = mapDbBookingToUi(item);
            map.set(ui.id, ui);
          });
        }

        // 2. Load ONLY user-scoped local bookings for optimistic offline fallback
        this.initLocalBookings(currentUserId);
        this.localBookings.forEach((b) => {
          // Positively verify owner is the current user
          if (b.farmerId === currentUserId && !map.has(b.id)) {
            map.set(b.id, b);
          }
        });

        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      } catch (err) {
        console.warn('Booking history query exception:', err);
      }
    }

    // Supabase unconfigured / offline demo mode fallback, strictly scoped to current user
    this.initLocalBookings(currentUserId);
    return [...this.localBookings]
      .filter((b) => b && b.farmerId === currentUserId)
      .sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
  }

  /**
   * Alias for getMyBookings
   */
  async getBookingHistory(): Promise<ProcurementBooking[]> {
    return this.getMyBookings();
  }

  /**
   * Cancel an active booking in Supabase.
   * Updates booking status to 'cancelled', records cancellation in queue_events,
   * updates queue store, and broadcasts cancellation event to recalculate live queue positions.
   */
  async cancelBooking(tokenOrId: string, reason?: string): Promise<boolean> {
    const clean = tokenOrId.trim().toUpperCase();
    const cancellationReason = reason || 'Cancelled by farmer';

    let bookingDbId = isValidUuid(tokenOrId) ? tokenOrId : null;
    let centreId = '';
    let token = clean;
    let farmerId = '';
    let cropName = 'Produce';

    if (isSupabaseConfigured()) {
      try {
        let findQuery = supabase
          .from('bookings')
          .select('id, token, centre_id, farmer_id, quantity, crops(name)');

        if (isValidUuid(tokenOrId)) {
          findQuery = findQuery.eq('id', tokenOrId);
        } else {
          findQuery = findQuery.or(`token.ilike.${clean},qr_identifier.ilike.*${clean}*`);
        }

        const { data: bRow } = await findQuery.limit(1).maybeSingle();

        if (bRow) {
          bookingDbId = bRow.id;
          token = bRow.token;
          centreId = bRow.centre_id;
          farmerId = bRow.farmer_id;
          cropName = (bRow as any)?.crops?.name || 'Produce';
        }

        let updateQuery = supabase
          .from('bookings')
          .update({
            booking_status: 'cancelled',
            updated_at: new Date().toISOString(),
          });

        if (bookingDbId && isValidUuid(bookingDbId)) {
          updateQuery = updateQuery.eq('id', bookingDbId);
        } else {
          updateQuery = updateQuery.or(`token.ilike.${clean},qr_identifier.ilike.*${clean}*`);
        }

        const { error } = await updateQuery;

        if (error) {
          throw new Error(`Failed to cancel booking in database: ${error.message}`);
        }

        // Insert cancelled event in queue_events for queue tracking & telemetry
        if (centreId && isValidUuid(centreId) && bookingDbId && isValidUuid(bookingDbId)) {
          await supabase.from('queue_events').insert({
            centre_id: centreId,
            booking_id: bookingDbId,
            event_type: 'cancelled',
            notes: cancellationReason,
            event_time: new Date().toISOString(),
          });
        }

        // Update procurement request if one exists and booking ID is a valid UUID
        if (bookingDbId && isValidUuid(bookingDbId)) {
          await supabase
            .from('procurement_requests')
            .update({
              status: 'cancelled',
              notes: cancellationReason,
              updated_at: new Date().toISOString(),
            })
            .eq('booking_id', bookingDbId);
        }

        // Create notification for farmer
        if (farmerId) {
          await notificationService.createNotification({
            farmerId,
            bookingId: bookingDbId,
            type: 'system',
            title: 'Booking Cancelled',
            message: `Your procurement booking for ${cropName} (Token: ${token}) has been cancelled. Your slot has been released back to the centre queue.`,
          });
        }
      } catch (err: any) {
        console.warn('Database cancelBooking notice:', err);
      }
    }

    // Adjust in-memory/local operational queue store
    this.initLocalBookings();
    const local = this.localBookings.find((b) => b.id === tokenOrId || b.token.toUpperCase() === clean);
    if (local) {
      local.workflowStatus = 'CANCELLED';
      local.bookingStatus = 'cancelled';
      if (!centreId) centreId = local.centreId;
      if (!token) token = local.token;
      this.persistLocalBookings();
    }

    queueService.removeFarmerFromQueue({
      bookingId: bookingDbId || tokenOrId,
      token: token || clean,
      centreId,
      reason: cancellationReason,
    });

    // Notify window event for multi-tab or cross-component reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smartprocure_booking_cancelled', {
          detail: {
            bookingId: bookingDbId,
            token,
            centreId,
            reason: cancellationReason,
          },
        })
      );
    }

    return true;
  }

  /**
   * Looks up a booking by 6-character token, human-readable booking ID (e.g. 'book-z12v3ne'), or UUID.
   * Token validity is verified against public.bookings and local active stores.
   * Ensures non-UUID values are never cast to UUID in PostgreSQL, preventing 22P02 errors.
   */
  async getBookingByToken(tokenOrId: string): Promise<ProcurementBooking | null> {
    const clean = (tokenOrId || '').trim();
    if (!clean) return null;

    const upper = clean.toUpperCase();
    const lower = clean.toLowerCase();

    this.initLocalBookings();
    const localMatch = this.localBookings.find(
      (b) =>
        b.token.toUpperCase() === upper ||
        b.id === clean ||
        b.id.toLowerCase() === lower ||
        (b.id && clean.toLowerCase().includes(b.id.toLowerCase())) ||
        (b.opaqueQrIdentifier && b.opaqueQrIdentifier.includes(clean))
    );
    if (localMatch) return localMatch;

    if (!isSupabaseConfigured()) return null;

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
          crops (id, name, hindi_name),
          profiles (id, full_name, mobile, state, district)
        `);

      if (isValidUuid(clean)) {
        query = query.eq('id', clean);
      } else if (clean.length === 6 && !clean.includes('-')) {
        query = query.or(`token.eq.${upper},qr_identifier.ilike.*${clean}*`);
      } else {
        // Handles 'book-xxxxxx' human-readable booking identifier without invalid UUID cast
        query = query.or(`token.ilike.${clean},qr_identifier.ilike.*${clean}*`);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (!error && data) {
        return mapDbBookingToUi(data);
      }
      return null;
    } catch (err) {
      console.warn('Error fetching booking by token/id from Supabase:', err);
      return null;
    }
  }

  /**
   * Looks up a booking by ID (alias for getBookingByToken supporting UUID and 'book-xxxxxx')
   */
  async getBookingById(id: string): Promise<ProcurementBooking | null> {
    return this.getBookingByToken(id);
  }

  /**
   * Creates a real procurement booking in Supabase.
   *
   * 1. Validates farmer authentication.
   * 2. Validates crop, quantity, and date.
   * 3. Validates centre availability.
   * 4. Enforces no conflicting bookings on the same date.
   * 5. Runs deterministic slot assignment (Morning: 09-14, Afternoon: 15-18; Lunch: 14-15 excluded).
   * 6. Generates unique 6-character random token.
   * 7. Creates database record in 'bookings' linked to authenticated farmer.
   * 8. Records 'booking_created' in 'queue_events'.
   */
  async createBooking(params: CreateBookingParams): Promise<ProcurementBooking> {
    // 1. Validate farmer authentication
    const resolvedUserId = await this.getResolvedCurrentUserId();
    let currentUserId = resolvedUserId || 'farmer-rameshwar-01';
    let authUserEmail = 'farmer@smartprocure.gov.in';

    if (isSupabaseConfigured()) {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (!authErr && user) {
          currentUserId = user.id;
          authUserEmail = user.email || authUserEmail;
        } else if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('smartprocure_farmer_profile');
          if (cached) {
            const p = JSON.parse(cached);
            if (p.id) currentUserId = p.id;
            if (p.email) authUserEmail = p.email;
          }
        }
      } catch (authException) {
        console.warn('Auth inspection fallback notice:', authException);
      }
    }

    // 2. Validate declared quantity
    if (!params.quantityQuintals || params.quantityQuintals <= 0) {
      throw new Error('Declared harvest quantity must be greater than zero quintals.');
    }
    if (params.quantityQuintals > 500) {
      throw new Error('Declared quantity exceeds single-lot limit of 500 Quintals.');
    }

    // 3. Validate booking date
    const today = new Date().toISOString().split('T')[0];
    if (params.bookingDate < today) {
      throw new Error('Preferred procurement date cannot be in the past.');
    }

    // 4. Validate time preference
    const validPrefs = ['morning', 'afternoon', 'no_preference'];
    const timePref: TimeSlotPreference = validPrefs.includes(params.timePreference)
      ? (params.timePreference as TimeSlotPreference)
      : 'no_preference';

    // 5. Verify centre exists & check capacity availability
    const availability = await this.checkCentreAvailability(
      params.centreId,
      params.bookingDate,
      params.quantityQuintals,
      timePref
    );
    if (!availability.isAvailable) {
      throw new Error(availability.message || 'Slots are currently full for this centre and date.');
    }

    // 6. Verify no conflicting active booking for this farmer on this date
    const conflict = await this.checkFarmerBookingConflict(currentUserId, params.bookingDate);
    if (conflict.hasConflict) {
      throw new Error(
        `You already hold an active procurement booking on ${params.bookingDate} (Token: ${conflict.conflictingToken}). Multiple bookings on the same date are not permitted.`
      );
    }

    // 7. Deterministic Slot Assignment:
    const assignedSlot = await this.findDeterministicSlot(
      params.centreId,
      params.bookingDate,
      timePref,
      params.quantityQuintals
    );

    // 8. Resolve crop ID and verify existence
    let resolvedCropId = params.cropId || '';
    let verifiedCrop: any = null;

    try {
      const allCrops = await cropService.getCrops();
      verifiedCrop = allCrops.find(
        (c) => c.id === resolvedCropId || c.name.toLowerCase() === params.cropName?.toLowerCase()
      );
    } catch {
      /* ignore */
    }

    if (!verifiedCrop && isSupabaseConfigured() && isValidUuid(resolvedCropId)) {
      try {
        const { data: matchedCrop } = await supabase
          .from('crops')
          .select('id, name, hindi_name')
          .eq('id', resolvedCropId)
          .maybeSingle();
        if (matchedCrop) verifiedCrop = matchedCrop;
      } catch {
        /* ignore */
      }
    }

    if (!verifiedCrop) {
      verifiedCrop = {
        id: resolvedCropId || 'crop-wheat',
        name: params.cropName || 'Wheat',
        hindi_name: 'गेहूं',
      };
      resolvedCropId = verifiedCrop.id;
    } else {
      resolvedCropId = verifiedCrop.id;
    }

    // 9. Verify centre exists in centre network
    if (!params.centreId) {
      throw new Error('Please select a valid registered procurement centre.');
    }

    let verifiedCentre: any = await centreService.getCentreById(params.centreId);

    if (!verifiedCentre && isSupabaseConfigured() && isValidUuid(params.centreId)) {
      try {
        const { data: dbCentre } = await supabase
          .from('procurement_centres')
          .select('id, name, state, district, capacity_per_day_quintals, operating_status')
          .eq('id', params.centreId)
          .maybeSingle();
        if (dbCentre) {
          verifiedCentre = {
            id: dbCentre.id,
            name: dbCentre.name,
            state: dbCentre.state,
            district: dbCentre.district,
            capacityPerDayQuintals: dbCentre.capacity_per_day_quintals,
            operatingStatus: dbCentre.operating_status,
          };
        }
      } catch {
        /* ignore */
      }
    }

    if (!verifiedCentre) {
      verifiedCentre = {
        id: params.centreId,
        name: params.centreName || 'Procurement Centre',
        state: params.farmerState || 'Bihar',
        district: params.farmerDistrict || 'Patna',
        capacityPerDayQuintals: 3000,
        operatingStatus: 'OPEN',
      };
    }

    // 10. Generate unique random 6-character token, 6-digit verification PIN & opaque QR identifier
    const token = await this.generateUniqueToken();
    const verificationCode = generateVerificationCode();
    const tempId = 'book-' + Math.random().toString(36).substring(2, 9);
    const opaqueQrIdentifier = generateOpaqueQrPayload(tempId, token, verificationCode);
    const rate = params.ratePerQuintal || 2425;

    // 11. Persist booking
    let persistedRecord: any = null;

    if (
      isSupabaseConfigured() &&
      isValidUuid(currentUserId) &&
      isValidUuid(params.centreId) &&
      isValidUuid(resolvedCropId)
    ) {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUserId)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').upsert(
            {
              id: currentUserId,
              full_name: params.farmerName || authUserEmail?.split('@')[0] || 'Farmer',
              email: authUserEmail || 'farmer@smartprocure.gov.in',
              mobile: params.farmerMobile || null,
              state: params.farmerState || verifiedCentre.state || 'Bihar',
              district: params.farmerDistrict || verifiedCentre.district || 'Patna',
              preferred_language: 'en',
            },
            { onConflict: 'id' }
          );
        }

        const { data: insertedBooking, error: insertError } = await supabase
          .from('bookings')
          .insert({
            farmer_id: currentUserId,
            centre_id: params.centreId,
            crop_id: resolvedCropId,
            quantity: params.quantityQuintals,
            preferred_date: params.bookingDate,
            preferred_time_preference: timePref,
            assigned_date: params.bookingDate,
            assigned_start_time: assignedSlot.startTime,
            assigned_end_time: assignedSlot.endTime,
            token,
            qr_identifier: opaqueQrIdentifier,
            booking_status: 'booked',
          })
          .select()
          .single();

        if (!insertError && insertedBooking) {
          persistedRecord = insertedBooking;
        } else if (insertError?.code === '23505' && insertError.message?.includes('preferred_date')) {
          throw new Error(
            `You already have an active procurement booking on ${params.bookingDate}. Duplicate bookings on the same date are not allowed.`
          );
        }
      } catch (dbErr: any) {
        if (dbErr.message && dbErr.message.includes('Duplicate bookings')) {
          throw dbErr;
        }
        console.warn('Supabase insert skipped or failed, fallback to local store:', dbErr);
      }
    }

    if (!persistedRecord) {
      persistedRecord = {
        id: tempId,
        farmer_id: currentUserId,
        centre_id: params.centreId,
        crop_id: resolvedCropId,
        quantity: params.quantityQuintals,
        preferred_date: params.bookingDate,
        preferred_time_preference: timePref,
        assigned_date: params.bookingDate,
        assigned_start_time: assignedSlot.startTime,
        assigned_end_time: assignedSlot.endTime,
        token,
        qr_identifier: opaqueQrIdentifier,
        booking_status: 'booked',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const completeRecord = {
      ...persistedRecord,
      procurement_centres: {
        id: params.centreId,
        name: verifiedCentre.name || params.centreName || 'Procurement Centre',
        state: verifiedCentre.state || params.farmerState || 'Bihar',
        district: verifiedCentre.district || params.farmerDistrict || 'Patna',
        capacity_per_day_quintals: verifiedCentre.capacityPerDayQuintals || 3000,
        operating_status: verifiedCentre.operatingStatus || 'OPEN',
      },
      crops: {
        id: resolvedCropId,
        name: verifiedCrop.name || params.cropName || 'Wheat',
        hindi_name: verifiedCrop.hindi_name || '',
      },
      profiles: {
        id: currentUserId,
        full_name: params.farmerName || 'Farmer',
        mobile: params.farmerMobile || '',
        state: params.farmerState || verifiedCentre.state || 'Bihar',
        district: params.farmerDistrict || verifiedCentre.district || 'Patna',
      },
    };

    const uiBooking = mapDbBookingToUi(completeRecord, rate);
    uiBooking.verificationCode = verificationCode;

    // Persist to local bookings store & broadcast
    this.initLocalBookings(currentUserId);
    this.localBookings = [
      uiBooking,
      ...this.localBookings.filter((b) => b.id !== uiBooking.id && b.token !== uiBooking.token),
    ];
    this.persistLocalBookings(currentUserId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartprocure_booking_created', { detail: uiBooking }));
    }

    // Try audit queue event if UUIDs are valid
    if (isSupabaseConfigured() && isValidUuid(params.centreId) && isValidUuid(persistedRecord.id)) {
      try {
        await supabase.from('queue_events').insert({
          booking_id: persistedRecord.id,
          centre_id: params.centreId,
          event_type: 'booking_created',
          notes: `Slot scheduled by farmer. Token: ${token}. Assigned: ${assignedSlot.formattedDisplay}`,
          created_by: currentUserId,
        });
      } catch {
        /* non-blocking */
      }
    }

    // Create persistent in-app notification for the farmer
    try {
      const centreName = verifiedCentre.name || params.centreName || 'Procurement Centre';
      await notificationService.createNotification({
        farmerId: currentUserId,
        bookingId: persistedRecord.id,
        type: 'booking',
        title: 'Procurement Slot Booked',
        message: `Your procurement slot has been confirmed for ${params.quantityQuintals} Quintal ${params.cropName || 'harvest'} at ${centreName}.\nToken: ${token}\nScheduled: ${assignedSlot.formattedDisplay}`,
      });
    } catch (notifErr) {
      console.warn('[BookingService] Failed to create booking notification:', notifErr);
    }

    return uiBooking;
  }
}

export const bookingService = new BookingService();
