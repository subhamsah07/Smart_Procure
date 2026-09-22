/**
 * SmartProcure - Isolated Operational ETA & Processing Velocity Service
 *
 * Implements transparent, empirical waiting time estimation based on real
 * completed weighbridge durations, with clear fallback to baseline estimates
 * when insufficient history exists.
 *
 * Designed as an isolated module for easy future model upgrades.
 */

export const BASELINE_PROCESSING_MINUTES = 20;

export interface EtaCalculationResult {
  averageProcessingMinutes: number;
  sampleCount: number;
  isBaseline: boolean;
  label: string;
}

/**
 * Computes average processing time from an array of real completed durations.
 * Discards outlier values (< 5 mins or > 120 mins).
 */
export function calculateAverageProcessingTime(durations: number[]): EtaCalculationResult {
  const validDurations = durations.filter((d) => typeof d === 'number' && d >= 5 && d <= 120);

  if (validDurations.length === 0) {
    return {
      averageProcessingMinutes: BASELINE_PROCESSING_MINUTES,
      sampleCount: 0,
      isBaseline: true,
      label: `${BASELINE_PROCESSING_MINUTES} mins (Baseline estimate)`,
    };
  }

  const sum = validDurations.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(sum / validDurations.length);

  return {
    averageProcessingMinutes: avg,
    sampleCount: validDurations.length,
    isBaseline: false,
    label: `${avg} mins (Avg of ${validDurations.length} completed today)`,
  };
}

/**
 * Calculates estimated wait time for a waiting farmer at a given position.
 * Position is 1-based (1 = next in line to be served).
 *
 * @param position Position in the WAITING line (1 = first in waiting queue)
 * @param averageProcessingMinutes Average duration per farmer
 * @param currentlyProcessingElapsedMinutes Minutes elapsed for current active farmer (if any)
 * @param activeDelayMinutes Any active disruption / delay logged in the yard
 */
export function estimateWaitTimeForWaitingPosition(
  position: number,
  averageProcessingMinutes: number,
  currentlyProcessingElapsedMinutes: number = 0,
  activeDelayMinutes: number = 0
): number {
  if (position <= 0) return 0;

  // Remaining time for farmer currently on the weighbridge
  const remainingForCurrent = Math.max(0, averageProcessingMinutes - currentlyProcessingElapsedMinutes);

  // Time for all waiting farmers ahead of this one
  const waitingAheadTime = (position - 1) * averageProcessingMinutes;

  return remainingForCurrent + waitingAheadTime + Math.max(0, activeDelayMinutes);
}
