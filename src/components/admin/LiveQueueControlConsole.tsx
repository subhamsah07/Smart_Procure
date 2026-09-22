import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Truck,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { queueService, LiveQueueEntry, CentreOperationalQueueState } from '../../services/queueService';
import { OperationalDelayReason } from '../../services/queueIntelligence';

interface LiveQueueControlConsoleProps {
  centreId: string;
  centreName: string;
  onQueueStateChanged?: () => void;
}

export const LiveQueueControlConsole: React.FC<LiveQueueControlConsoleProps> = ({
  centreId,
  centreName,
  onQueueStateChanged,
}) => {
  const [queueState, setQueueState] = React.useState<CentreOperationalQueueState | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = React.useState<number>(25);
  const [delayReason, setDelayReason] = React.useState<OperationalDelayReason>('PROCESSING_DELAY');
  const [delayNotes, setDelayNotes] = React.useState<string>('Weighbridge calibration & tare re-check in progress');
  const [customWeighDuration, setCustomWeighDuration] = React.useState<number>(26);

  const fetchState = React.useCallback(async () => {
    try {
      const state = await queueService.getOperationalQueueState(centreId);
      setQueueState(state);
    } catch (err) {
      console.warn('Queue control console fetch state error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [centreId]);

  React.useEffect(() => {
    fetchState();
    const unsub = queueService.subscribeToCentreQueue(centreId, (state) => {
      setQueueState(state);
      if (onQueueStateChanged) onQueueStateChanged();
    });
    return () => unsub();
  }, [centreId, fetchState, onQueueStateChanged]);

  const handleStartProcessing = async (token: string) => {
    setActionLoading(`start-${token}`);
    try {
      await queueService.startProcessing(token, centreId);
      await fetchState();
      if (onQueueStateChanged) onQueueStateChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteProcessing = async (token: string) => {
    setActionLoading(`comp-${token}`);
    try {
      await queueService.completeProcessing(token, centreId, customWeighDuration);
      await fetchState();
      if (onQueueStateChanged) onQueueStateChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyDelay = async () => {
    setActionLoading('apply-delay');
    try {
      await queueService.markDelay({
        centreId,
        delayMinutes,
        reason: delayReason,
        notes: delayNotes,
      });
      await fetchState();
      if (onQueueStateChanged) onQueueStateChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseProcurement = async () => {
    setActionLoading('pause-proc');
    try {
      await queueService.pauseProcurement(centreId, 'Operational halt instructed by Mandi In-Charge');
      await fetchState();
      if (onQueueStateChanged) onQueueStateChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeProcurement = async () => {
    setActionLoading('resume-proc');
    try {
      await queueService.resumeProcurement(centreId);
      await fetchState();
      if (onQueueStateChanged) onQueueStateChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const activeProcessingEntry = queueState?.entries.find((e) => e.status === 'PROCESSING') || null;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Operational Source of Truth
            </span>
            <span className="text-xs text-slate-400">
              Mandi Gate & Weighbridge Console
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{centreName}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin actions dynamically update all connected farmer dashboards via Supabase Realtime
          </p>
        </div>

        <div className="flex items-center gap-2">
          {queueState?.isPaused ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleResumeProcurement}
              isLoading={actionLoading === 'resume-proc'}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Resume Operations</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseProcurement}
              isLoading={actionLoading === 'pause-proc'}
              className="text-xs gap-1.5 border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause Intake</span>
            </Button>
          )}
        </div>
      </div>

      {/* ACTIVE DISRUPTION / DELAY STATUS BANNER */}
      {queueState?.activeDelay.isActive && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-amber-300">
                ACTIVE DELAY EVENT: {queueState.activeDelay.reason} (+{queueState.activeDelay.delayMinutes} mins)
              </span>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {queueState.activeDelay.notes}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResumeProcurement}
            isLoading={actionLoading === 'resume-proc'}
            className="shrink-0 text-xs border-amber-600 text-amber-300 hover:bg-amber-900/50"
          >
            Clear Delay
          </Button>
        </div>
      )}

      {/* CURRENTLY SERVING AT WEIGHBRIDGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-400" />
              Counter #1 Electronic Weighbridge (Current Ingress)
            </span>
            {activeProcessingEntry ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                Processing Active
              </span>
            ) : (
              <span className="text-xs text-slate-500">Weighbridge Idle</span>
            )}
          </div>

          {activeProcessingEntry ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-lg bg-slate-900/90 border border-slate-700/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-black text-white">
                    {activeProcessingEntry.token}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    Position #{activeProcessingEntry.position}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeProcessingEntry.farmerNameHint} &bull; {activeProcessingEntry.crop}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-slate-400">Duration:</span>
                  <input
                    type="number"
                    value={customWeighDuration}
                    onChange={(e) => setCustomWeighDuration(Math.max(5, parseInt(e.target.value, 10) || 25))}
                    className="w-12 text-center bg-slate-900 border border-slate-600 rounded text-xs text-white font-mono py-0.5"
                    title="Actual completed weighment duration in minutes"
                  />
                  <span className="text-[11px] text-slate-400">m</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompleteProcessing(activeProcessingEntry.token)}
                  isLoading={actionLoading === `comp-${activeProcessingEntry.token}`}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Complete Weighment</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
              No vehicle currently on the weighbridge. Select a waiting farmer below to start processing.
            </div>
          )}

          {/* RECENT VELOCITY HISTORY */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Recent Completed Weighments:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              {queueState?.recentCompletedDurations && queueState.recentCompletedDurations.length > 0 ? (
                queueState.recentCompletedDurations.map((dur, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {dur}m
                  </span>
                ))
              ) : (
                <span>Using 30m baseline</span>
              )}
            </div>
          </div>
        </div>

        {/* DELAY INJECTOR PANEL */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Operational Delay Injector
          </span>
          <p className="text-[11px] text-slate-400">
            Log observable mandi events to update farmer waiting time forecasts in real-time.
          </p>

          <div className="space-y-2">
            <select
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value as OperationalDelayReason)}
              className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="PROCESSING_DELAY">Processing Delay (Weighbridge/Moisture)</option>
              <option value="PROCUREMENT_PAUSED">Procurement Paused (Intake Halt)</option>
              <option value="COUNTER_UNAVAILABLE">Counter Unavailable</option>
              <option value="SYSTEM_ISSUE">System / Network Connectivity Issue</option>
              <option value="DOCUMENT_VERIFICATION_DELAY">Document Verification Delay</option>
              <option value="OTHER_OPERATIONAL_DELAY">Other Operational Delay</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0">Add Delay:</span>
              {[15, 25, 40, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDelayMinutes(mins)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    delayMinutes === mins
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>

            <input
              type="text"
              value={delayNotes}
              onChange={(e) => setDelayNotes(e.target.value)}
              placeholder="Reason notes visible to farmers..."
              className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyDelay}
              isLoading={actionLoading === 'apply-delay'}
              className="w-full text-xs border-amber-600/80 text-amber-300 hover:bg-amber-950/60"
            >
              Apply +{delayMinutes}m Operational Delay
            </Button>
          </div>
        </div>
      </div>

      {/* PHYSICAL QUEUE TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider">
            Active Mandi Yard Line ({queueState?.entries.length || 0} Vehicles Checked In)
          </span>
          <span>Order determined strictly by gate check-in time</span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 text-xs">
          {queueState?.entries && queueState.entries.length > 0 ? (
            queueState.entries.map((entry) => (
              <div
                key={entry.token}
                className={`p-3 flex items-center justify-between gap-3 ${
                  entry.status === 'PROCESSING' ? 'bg-emerald-950/30' : 'bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    entry.status === 'PROCESSING' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                  }`}>
                    #{entry.position}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {entry.token}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {entry.farmerNameHint}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {entry.crop} &bull; Checked in at {new Date(entry.checkInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === 'PROCESSING' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCompleteProcessing(entry.token)}
                      isLoading={actionLoading === `comp-${entry.token}`}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Complete</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartProcessing(entry.token)}
                      isLoading={actionLoading === `start-${entry.token}`}
                      className="text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    >
                      <Play className="h-3 w-3 text-emerald-400" />
                      <span>Start Weighment</span>
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900">
              No vehicles currently checked in at this centre yard. Click &ldquo;Check-in New Farmer&rdquo; above to populate the live physical queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
