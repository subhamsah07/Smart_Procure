import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OperatingHours } from '../types';
import { DEFAULT_OPERATING_HOURS } from '../constants';

/**
 * Standard className merging utility for Tailwind CSS
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random, non-sequential 6-character procurement token.
 * Example output: "SP7K4Q", "TR8N2P", "KA9M5X"
 * Excludes easily ambiguous characters (0, O, 1, I) to prevent reading errors for farmers and field staff.
 */
export function generateProcurementToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  // Cryptographically strong random if available, else Math.random
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(6);
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 6; i++) {
      token += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Generates a 6-digit numeric verification code for booking and QR gate pass verification.
 * Example: "481920", "839104"
 */
export function generateVerificationCode(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    const code = 100000 + (randomArray[0] % 900000);
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Deterministically derives or extracts the 6-digit verification code linked to a token and QR payload.
 * Ensures consistent verification whether scanned via QR or typed manually by admin.
 */
export function deriveVerificationCode(token: string, qrIdentifier?: string): string {
  if (qrIdentifier) {
    try {
      if (qrIdentifier.startsWith('{')) {
        const parsed = JSON.parse(qrIdentifier);
        if (parsed.code && /^\d{6}$/.test(String(parsed.code))) {
          return String(parsed.code);
        }
      }
      const match = qrIdentifier.match(/(\d{6})/);
      if (match) {
        return match[1];
      }
    } catch {
      // fallback to token derivation
    }
  }

  // Deterministic 6-digit PIN based on token string
  let hash = 5381;
  const str = (token || '').trim().toUpperCase();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  const codeNum = 100000 + (hash % 900000);
  return codeNum.toString();
}

/**
 * Generates an opaque identifier for QR code serialization.
 * Links the 6-digit verification code with the token and booking ID.
 * Never embed sensitive farmer data (such as bank details, phone, or name) in the QR code!
 */
export function generateOpaqueQrPayload(
  bookingId: string,
  token: string,
  verificationCode?: string
): string {
  const code = verificationCode || deriveVerificationCode(token);
  return JSON.stringify({
    v: 1, // protocol version
    bid: bookingId,
    tok: token,
    code, // 6-digit numeric verification code linked with QR
    iat: Math.floor(Date.now() / 1000),
  });
}

/**
 * Calculate Estimated Procurement Value:
 * quantity (quintals) * configured rate (INR/quintal)
 * Clearly labeled as an estimated value.
 */
export function calculateEstimatedProcurementValue(quantityQuintals: number, ratePerQuintal: number): number {
  if (!quantityQuintals || quantityQuintals <= 0 || !ratePerQuintal || ratePerQuintal <= 0) {
    return 0;
  }
  return Math.round(quantityQuintals * ratePerQuintal);
}

/**
 * Format currency in Indian Rupees format (e.g. ₹ 2,27,500)
 */
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format quantity in Quintals and Metric Tons
 */
export function formatQuantityQuintals(quintals: number): string {
  const tons = (quintals / 10).toFixed(1);
  return `${quintals} Quintals (~${tons} MT)`;
}

export interface QueueEtaResult {
  queuePosition: number;
  estimatedWaitMinutes: number;
  estimatedArrivalTime: string; // Formatted HH:MM AM/PM
  isLunchBreakCrossed: boolean;
  lunchBreakMinutesAdded: number;
  centreStatusAtEta: 'OPEN' | 'LUNCH_BREAK' | 'CLOSED_FOR_DAY';
  statusDescription: string;
}

/**
 * Queue Intelligence ETA Calculator
 *
 * Respects procurement centre working hours:
 * Morning: 09:00 AM - 02:00 PM (14:00)
 * Lunch Break: 02:00 PM (14:00) - 03:00 PM (15:00) -> 60 minutes pause
 * Afternoon: 03:00 PM (15:00) - 06:00 PM (18:00)
 *
 * Does NOT blindly calculate ETA through the lunch break.
 */
export function calculateQueueEta(
  queuePosition: number,
  averageMinutesPerFarmer: number = 25,
  referenceDate: Date = new Date(),
  operatingHours: OperatingHours = DEFAULT_OPERATING_HOURS
): QueueEtaResult {
  if (queuePosition <= 0) {
    return {
      queuePosition: 0,
      estimatedWaitMinutes: 0,
      estimatedArrivalTime: 'Immediate',
      isLunchBreakCrossed: false,
      lunchBreakMinutesAdded: 0,
      centreStatusAtEta: 'OPEN',
      statusDescription: 'Your turn is active. Please proceed to the verification counter.',
    };
  }

  // Base raw processing time needed before this farmer's turn
  const farmersAhead = queuePosition - 1;
  const rawWaitMinutes = farmersAhead * averageMinutesPerFarmer;

  // Clone reference date
  const targetTime = new Date(referenceDate.getTime());
  
  // Parse operating hours in reference date's local time
  const [openHour, openMin] = operatingHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = operatingHours.closeTime.split(':').map(Number);
  const [lunchStartHour, lunchStartMin] = operatingHours.lunchStartTime.split(':').map(Number);
  const [lunchEndHour, lunchEndMin] = operatingHours.lunchEndTime.split(':').map(Number);

  const openDate = new Date(referenceDate);
  openDate.setHours(openHour, openMin, 0, 0);

  const closeDate = new Date(referenceDate);
  closeDate.setHours(closeHour, closeMin, 0, 0);

  const lunchStartDate = new Date(referenceDate);
  lunchStartDate.setHours(lunchStartHour, lunchStartMin, 0, 0);

  const lunchEndDate = new Date(referenceDate);
  lunchEndDate.setHours(lunchEndHour, lunchEndMin, 0, 0);

  // If calculating before centre opens, start clock at opening time
  let effectiveStartTime = new Date(referenceDate);
  if (effectiveStartTime < openDate) {
    effectiveStartTime = new Date(openDate);
  }

  // Minute-by-minute simulation of queue progression to accurately handle lunch break
  let simulatedTime = new Date(effectiveStartTime);
  let remainingProcessingMinutes = rawWaitMinutes;
  let isLunchBreakCrossed = false;
  let lunchMinutesAdded = 0;

  while (remainingProcessingMinutes > 0) {
    // Check if simulatedTime falls into lunch break [14:00, 15:00)
    if (simulatedTime >= lunchStartDate && simulatedTime < lunchEndDate) {
      // Centre is on lunch break; advance simulated time to lunch end
      const diffMs = lunchEndDate.getTime() - simulatedTime.getTime();
      const diffMinutes = Math.ceil(diffMs / (60 * 1000));
      lunchMinutesAdded += diffMinutes;
      isLunchBreakCrossed = true;
      simulatedTime = new Date(lunchEndDate);
    } else {
      // Advance by 1 minute of active processing
      simulatedTime.setMinutes(simulatedTime.getMinutes() + 1);
      remainingProcessingMinutes--;
    }
  }

  // Total minutes from original referenceDate
  const totalWaitMinutes = Math.max(
    0,
    Math.round((simulatedTime.getTime() - referenceDate.getTime()) / (60 * 1000))
  );

  let centreStatusAtEta: 'OPEN' | 'LUNCH_BREAK' | 'CLOSED_FOR_DAY' = 'OPEN';
  let statusDescription = `Estimated wait: ~${totalWaitMinutes} minutes (${farmersAhead} farmers ahead).`;

  if (simulatedTime >= lunchStartDate && simulatedTime < lunchEndDate) {
    centreStatusAtEta = 'LUNCH_BREAK';
    statusDescription = `Includes scheduled lunch pause (14:00 - 15:00). Please plan arrival for post-lunch shift.`;
  } else if (simulatedTime > closeDate) {
    centreStatusAtEta = 'CLOSED_FOR_DAY';
    statusDescription = `Slot extends beyond closing time (06:00 PM). Next available session will be allocated.`;
  } else if (isLunchBreakCrossed) {
    statusDescription = `Wait accounts for 60-min mandatory lunch pause (02:00 PM - 03:00 PM). Arrive at ${simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  }

  const formattedEta = simulatedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    queuePosition,
    estimatedWaitMinutes: totalWaitMinutes,
    estimatedArrivalTime: formattedEta,
    isLunchBreakCrossed,
    lunchBreakMinutesAdded: lunchMinutesAdded,
    centreStatusAtEta,
    statusDescription,
  };
}

/**
 * Checks whether a string is a valid UUID (PostgreSQL standard 8-4-4-4-12 hex format) to avoid SQL syntax errors
 */
export function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
