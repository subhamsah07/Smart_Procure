/**
 * SmartProcure - Real-Time Rule-Based Queue Intelligence Engine
 * 
 * CORE PHILOSOPHY:
 * "Don't make farmers wait for the queue. Let the queue tell farmers when to arrive."
 * 
 * STRICT OPERATIONAL RULES:
 * 1. SEPARATE APPOINTMENT FROM LIVE QUEUE:
 *    - Appointment: Assigned arrival window (e.g. 10:00–11:00 AM) based on capacity.
 *    - Live Queue: Actual physical position after mandi gate check-in.
 *    - Booked farmers with pending check-in DO NOT participate in the live physical queue.
 * 2. NO SIMPLE "QUEUE × 30 MINS":
 *    - Uses rolling average of recent actual completed weighbridge processing durations.
 *    - Falls back to configurable baseline (30 mins) only if insufficient historical data (< 2 samples).
 *    - Explicitly distinguishes BASELINE vs ACTUAL RECENT PROCESSING TIME.
 * 3. WORKING-HOURS AWARE WAIT CALCULATION:
 *    - Morning session:   09:00 - 14:00 (300 mins)
 *    - Lunch break:       14:00 - 15:00 (60 mins pause; strictly NO processing counted)
 *    - Afternoon session: 15:00 - 18:00 (180 mins)
 *    - Mandatory pause at 14:00-15:00; skips lunch break when wait crosses into afternoon.
 *    - Closes at 18:00; carries over remaining work into next operating day (09:00 AM)
 *      rather than generating absurd 10-hour same-day estimates.
 * 4. TOKEN DOES NOT DETERMINE POSITION:
 *    - Position is determined by gate check-in timestamp / queue order.
 *    - Token (e.g. SP7K4Q) is solely a secure identifier.
 * 5. POSITION AND WAITING TIME ARE DIFFERENT:
 *    - Position is the physical order in line.
 *    - Waiting time is calculated from operational conditions (delays, velocity).
 */

export type OperationalDelayReason =
  | 'PROCESSING_DELAY'
  | 'PROCUREMENT_PAUSED'
  | 'COUNTER_UNAVAILABLE'
  | 'SYSTEM_ISSUE'
  | 'DOCUMENT_VERIFICATION_DELAY'
  | 'OTHER_OPERATIONAL_DELAY';

export interface ActiveDelayInfo {
  isActive: boolean;
  reason: OperationalDelayReason | string;
  delayMinutes: number;
  notes?: string;
  startedAt?: string;
}

export interface ProcessingVelocityInfo {
  type: 'ACTUAL_RECENT' | 'BASELINE';
  minutesPerFarmer: number;
  sampleCount: number;
  label: string; // e.g. "26m avg based on last 4 completed weighments" or "30m standard baseline"
}

export interface WorkingHoursProjection {
  totalWaitMinutes: number;
  formattedWaitTime: string; // e.g. "~2h 35m" or "Carried to Tomorrow ~09:45 AM"
  estimatedServiceTime: string; // e.g. "11:35 AM" or "Tomorrow 09:45 AM"
  isLunchBreakCrossed: boolean;
  isCarriedOverToNextDay: boolean;
  carriedDaysCount: number;
  carriedNotice?: string;
}

export interface QueueIntelligenceResult {
  // Physical Queue Position Metrics
  position: number; // 1-based position (1 = currently serving or next up)
  farmersAhead: number; // 0 if position 1, 1 if position 2, etc.
  totalInQueue: number; // Total farmers currently in physical line
  
  // Operational Wait Estimation
  estimatedWaitMinutes: number;
  formattedWaitTime: string; // e.g. "~2h 35m"
  estimatedServiceTime: string; // e.g. "11:35 AM" or "Tomorrow 09:45 AM"
  
  // Operational Status & Alerts
  operationalStatus: 'NORMAL' | 'DELAYED' | 'PAUSED' | 'LUNCH_BREAK' | 'CLOSED';
  statusLabel: string; // "PROCESSING NORMALLY", "⚠ Centre Delay", "Intake Paused", etc.
  statusDescription: string;
  currentlyServingToken: string | null;
  currentlyServingCrop?: string;
  
  // Delay Details (if active)
  delayInfo: ActiveDelayInfo;
  
  // Processing Velocity Breakdown
  velocityInfo: ProcessingVelocityInfo;
  
  // Working Hours & Schedule Constraints
  isLunchBreakCrossed: boolean;
  isCarriedOverToNextDay: boolean;
  carriedNotice?: string;
  
  // Telemetry metadata
  lastUpdated: string;
  isRealtimeActive: boolean;
}

export const BASELINE_PROCESSING_MINUTES = 30; // Configurable standard baseline

/**
 * Calculates rolling average of recent completed processing durations.
 * Discards outliers (< 5 mins or > 120 mins).
 */
export function calculateRecentProcessingVelocity(
  recentCompletedDurations: number[],
  baselineMinutes: number = BASELINE_PROCESSING_MINUTES
): ProcessingVelocityInfo {
  const valid = recentCompletedDurations.filter((m) => m >= 5 && m <= 120);

  if (valid.length >= 2) {
    const sum = valid.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round((sum / valid.length) * 10) / 10;
    return {
      type: 'ACTUAL_RECENT',
      minutesPerFarmer: avg,
      sampleCount: valid.length,
      label: `${Math.round(avg)}m avg based on last ${valid.length} completed weighments`,
    };
  }

  return {
    type: 'BASELINE',
    minutesPerFarmer: baselineMinutes,
    sampleCount: valid.length,
    label: `${baselineMinutes}m standard operational baseline`,
  };
}

/**
 * Parses time string (e.g. "09:00", "14:30:00") into minutes since midnight.
 */
function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Formats minutes since midnight into 12-hour AM/PM string.
 */
function minutesToClockTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = Math.floor(normalized % 60);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mm} ${period}`;
}

/**
 * Formats duration in minutes into clean human-readable text.
 * e.g. 25 -> "~25m", 155 -> "~2h 35m"
 */
export function formatWaitDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded === 0) return 'Immediate / Serving Now';
  if (rounded < 60) return `~${rounded}m`;
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
}

/**
 * PROJECTS WAIT TIME RESPECTING WORKING HOURS & LUNCH BREAK:
 * 
 * Operating hours:
 * Morning:   09:00 - 14:00 (540 to 840 mins = 300 working mins)
 * Lunch:     14:00 - 15:00 (840 to 900 mins = 60 mins MANDATORY PAUSE)
 * Afternoon: 15:00 - 18:00 (900 to 1080 mins = 180 working mins)
 * Closing:   18:00 (1080 mins)
 * Total working capacity per day: 480 mins (8 hours)
 * 
 * Rules:
 * - If wait crosses 14:00, lunch break (60 mins) is skipped.
 * - If remaining work exceeds today's remaining operating capacity before 18:00,
 *   the system carries the work into the next operating day (09:00 AM).
 * - Never produces absurd same-day estimates like "10 hours today".
 */
export function projectWorkingHoursWaitTime(params: {
  workMinutesRequired: number; // (farmersAhead * velocity) + activeDelay
  currentTime?: Date;
  centreOpenTime?: string; // default "09:00"
  centreCloseTime?: string; // default "18:00"
  lunchStartTime?: string; // default "14:00"
  lunchEndTime?: string; // default "15:00"
}): WorkingHoursProjection {
  const {
    workMinutesRequired,
    currentTime = new Date(),
    centreOpenTime = '09:00',
    centreCloseTime = '18:00',
    lunchStartTime = '14:00',
    lunchEndTime = '15:00',
  } = params;

  if (workMinutesRequired <= 0) {
    return {
      totalWaitMinutes: 0,
      formattedWaitTime: 'Immediate / Next in Line',
      estimatedServiceTime: minutesToClockTime(currentTime.getHours() * 60 + currentTime.getMinutes()),
      isLunchBreakCrossed: false,
      isCarriedOverToNextDay: false,
      carriedDaysCount: 0,
    };
  }

  const openM = timeStringToMinutes(centreOpenTime); // 540 (09:00)
  const lunchStartM = timeStringToMinutes(lunchStartTime); // 840 (14:00)
  const lunchEndM = timeStringToMinutes(lunchEndTime); // 900 (15:00)
  const closeM = timeStringToMinutes(centreCloseTime); // 1080 (18:00)

  const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  // Starting simulation time
  let simTime = nowM;
  let remainingWork = workMinutesRequired;
  let isLunchBreakCrossed = false;
  let carriedDaysCount = 0;

  // If current time is before centre opens today, fast forward to opening
  if (simTime < openM) {
    simTime = openM;
  }

  // If current time is after closing today, carry to tomorrow morning
  if (simTime >= closeM) {
    carriedDaysCount += 1;
    simTime = openM;
  }

  // If current time is during lunch break, fast forward to end of lunch
  if (simTime >= lunchStartM && simTime < lunchEndM) {
    simTime = lunchEndM;
    isLunchBreakCrossed = true;
  }

  const maxDays = 5; // Safety bound
  while (remainingWork > 0 && carriedDaysCount < maxDays) {
    // 1. In Morning session: openM -> lunchStartM (09:00 - 14:00)
    if (simTime < lunchStartM) {
      const availableMorning = lunchStartM - simTime;
      if (remainingWork <= availableMorning) {
        simTime += remainingWork;
        remainingWork = 0;
        break;
      } else {
        remainingWork -= availableMorning;
        // Cross lunch break!
        simTime = lunchEndM;
        isLunchBreakCrossed = true;
      }
    }

    // 2. In Lunch pause: lunchStartM -> lunchEndM (14:00 - 15:00)
    if (simTime >= lunchStartM && simTime < lunchEndM) {
      simTime = lunchEndM;
      isLunchBreakCrossed = true;
    }

    // 3. In Afternoon session: lunchEndM -> closeM (15:00 - 18:00)
    if (simTime >= lunchEndM && simTime < closeM) {
      const availableAfternoon = closeM - simTime;
      if (remainingWork <= availableAfternoon) {
        simTime += remainingWork;
        remainingWork = 0;
        break;
      } else {
        remainingWork -= availableAfternoon;
        // Day has ended at 18:00! Carry over to tomorrow 09:00 AM!
        carriedDaysCount += 1;
        simTime = openM;
      }
    }

    // If simTime >= closeM without processing
    if (simTime >= closeM) {
      carriedDaysCount += 1;
      simTime = openM;
    }
  }

  const isCarriedOver = carriedDaysCount > 0;
  const clockFormatted = minutesToClockTime(simTime);

  let formattedWaitTime = formatWaitDuration(workMinutesRequired);
  let estimatedServiceTime = clockFormatted;
  let carriedNotice: string | undefined = undefined;

  if (isCarriedOver) {
    const dayLabel = carriedDaysCount === 1 ? 'Tomorrow' : `In ${carriedDaysCount} days`;
    formattedWaitTime = `Carried to ${dayLabel} ~${clockFormatted}`;
    estimatedServiceTime = `${dayLabel} ~${clockFormatted}`;
    carriedNotice = `Remaining line exceeds today's 6:00 PM operating capacity. Estimated appointment scheduled for ${dayLabel} morning at ${clockFormatted}.`;
  }

  return {
    totalWaitMinutes: workMinutesRequired,
    formattedWaitTime,
    estimatedServiceTime,
    isLunchBreakCrossed,
    isCarriedOverToNextDay: isCarriedOver,
    carriedDaysCount,
    carriedNotice,
  };
}

/**
 * Master Queue Intelligence Calculation
 */
export function computeQueueIntelligence(params: {
  bookingIdOrToken: string;
  checkedInQueue: Array<{
    bookingId: string;
    token: string;
    status: 'WAITING' | 'PROCESSING';
    checkInTimestamp: string;
    farmerNameHint?: string;
    crop?: string;
  }>;
  recentCompletedDurations: number[]; // actual completed minutes from past weighments
  activeDelay?: ActiveDelayInfo;
  isProcurementPaused?: boolean;
  pauseReason?: string;
  currentTime?: Date;
  centreOpenTime?: string;
  centreCloseTime?: string;
}): QueueIntelligenceResult {
  const {
    bookingIdOrToken,
    checkedInQueue,
    recentCompletedDurations,
    activeDelay = { isActive: false, reason: 'NONE', delayMinutes: 0 },
    isProcurementPaused = false,
    pauseReason = 'Intake paused by centre officer',
    currentTime = new Date(),
    centreOpenTime = '09:00',
    centreCloseTime = '18:00',
  } = params;

  // Clean lookup target
  const target = bookingIdOrToken.trim().toUpperCase();

  // Find target in checked-in queue
  const targetIndex = checkedInQueue.findIndex(
    (item) => item.token.toUpperCase() === target || item.bookingId === target
  );

  const currentlyServing = checkedInQueue.find((item) => item.status === 'PROCESSING') || null;

  // Position is 1-based queue order
  const position = targetIndex >= 0 ? targetIndex + 1 : checkedInQueue.length + 1;
  const farmersAhead = Math.max(0, position - 1);

  // Velocity calculation (Actual Rolling Average vs Baseline)
  const velocityInfo = calculateRecentProcessingVelocity(recentCompletedDurations);

  // Raw work minutes needed for farmers ahead + active delays
  let rawWorkMinutes = farmersAhead * velocityInfo.minutesPerFarmer;

  if (activeDelay.isActive && activeDelay.delayMinutes > 0) {
    rawWorkMinutes += activeDelay.delayMinutes;
  }

  // Project wait across working hours (09:00-14:00, 15:00-18:00, lunch break skipped)
  const projection = projectWorkingHoursWaitTime({
    workMinutesRequired: rawWorkMinutes,
    currentTime,
    centreOpenTime,
    centreCloseTime,
  });

  // Determine operational status
  let operationalStatus: 'NORMAL' | 'DELAYED' | 'PAUSED' | 'LUNCH_BREAK' | 'CLOSED' = 'NORMAL';
  let statusLabel = 'PROCESSING NORMALLY';
  let statusDescription = 'Procurement and electronic weighbridges are operating at standard speed.';

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const lunchStart = timeStringToMinutes('14:00');
  const lunchEnd = timeStringToMinutes('15:00');
  const closeTime = timeStringToMinutes(centreCloseTime);

  if (isProcurementPaused) {
    operationalStatus = 'PAUSED';
    statusLabel = 'INTAKE PAUSED';
    statusDescription = pauseReason || 'Procurement temporarily paused by centre officer.';
  } else if (activeDelay.isActive && activeDelay.delayMinutes > 0) {
    operationalStatus = 'DELAYED';
    statusLabel = '⚠ CENTRE DELAY';
    statusDescription =
      activeDelay.notes ||
      `Processing is currently slower than usual due to ${activeDelay.reason.replace(/_/g, ' ').toLowerCase()} (+${activeDelay.delayMinutes} mins).`;
  } else if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
    operationalStatus = 'LUNCH_BREAK';
    statusLabel = 'LUNCH BREAK IN PROGRESS';
    statusDescription = 'Centre operations resume at 03:00 PM. Lunch pause is factored into ETA.';
  } else if (currentMinutes >= closeTime) {
    operationalStatus = 'CLOSED';
    statusLabel = 'CENTRE CLOSED FOR TODAY';
    statusDescription = 'Operating hours completed. Queue resumes tomorrow at 09:00 AM.';
  }

  return {
    position,
    farmersAhead,
    totalInQueue: checkedInQueue.length,
    estimatedWaitMinutes: projection.totalWaitMinutes,
    formattedWaitTime: projection.formattedWaitTime,
    estimatedServiceTime: projection.estimatedServiceTime,
    operationalStatus,
    statusLabel,
    statusDescription,
    currentlyServingToken: currentlyServing ? currentlyServing.token : null,
    currentlyServingCrop: currentlyServing?.crop,
    delayInfo: activeDelay,
    velocityInfo,
    isLunchBreakCrossed: projection.isLunchBreakCrossed,
    isCarriedOverToNextDay: projection.isCarriedOverToNextDay,
    carriedNotice: projection.carriedNotice,
    lastUpdated: 'Just now',
    isRealtimeActive: true,
  };
}
