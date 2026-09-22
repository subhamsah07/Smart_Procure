import * as React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { ProcurementWorkflowStatus } from '../../types';
import { PROCUREMENT_WORKFLOW_STEPS } from '../../constants';
import { cn } from '../../lib/utils';

export interface StatusTimelineProps {
  currentStatus: ProcurementWorkflowStatus;
  className?: string;
  isCompact?: boolean;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  className,
  isCompact = false,
}) => {
  const currentIndex = PROCUREMENT_WORKFLOW_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';

  return (
    <div className={cn('w-full', className)}>
      {isCancelled && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>This procurement booking has been marked as <strong>{currentStatus}</strong>.</span>
        </div>
      )}

      {/* Desktop/Tablet Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{
                width: `${currentIndex >= 0 ? (currentIndex / (PROCUREMENT_WORKFLOW_STEPS.length - 1)) * 100 : 0}%`,
              }}
            />
          </div>

          {PROCUREMENT_WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            const isPending = currentIndex < idx;

            return (
              <div key={step.status} className="flex flex-col items-center relative z-10 group">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all shadow-xs',
                    isCompleted && 'bg-emerald-600 border-emerald-600 text-white',
                    isCurrent && 'bg-white border-emerald-600 text-emerald-700 ring-4 ring-emerald-100',
                    isPending && 'bg-white border-slate-300 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 animate-pulse text-emerald-600" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                <div className="mt-2.5 text-center max-w-[110px]">
                  <p
                    className={cn(
                      'text-xs font-medium leading-tight',
                      isCurrent ? 'text-emerald-900 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden lg:block">
                    {step.hindiLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {PROCUREMENT_WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isPending = currentIndex < idx;

          return (
            <div key={step.status} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {idx < PROCUREMENT_WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute left-4 top-8 -bottom-4 w-0.5',
                    isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                  )}
                />
              )}

              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2 z-10 shadow-xs',
                  isCompleted && 'bg-emerald-600 border-emerald-600 text-white',
                  isCurrent && 'bg-white border-emerald-600 text-emerald-700 ring-3 ring-emerald-100',
                  isPending && 'bg-white border-slate-300 text-slate-400'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.stepNumber}
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-emerald-800' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                    )}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.hindiLabel}</p>
                {!isCompact && (
                  <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
