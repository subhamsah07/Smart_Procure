import * as React from 'react';
import { QrCode, Clock, ShieldCheck, MapPin, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from './Card';
import { Badge } from './Badge';
import { cn, formatCurrencyINR, formatQuantityQuintals } from '../../lib/utils';
import { CropName } from '../../types';

export interface TokenCardProps {
  token: string;
  queuePosition: number;
  cropName: CropName;
  quantityQuintals: number;
  estimatedValue: number;
  centreName: string;
  assignedSlotTime: string;
  estimatedArrivalTime: string;
  delayMinutes?: number;
  isLunchBreakCrossed?: boolean;
  className?: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  queuePosition,
  cropName,
  quantityQuintals,
  estimatedValue,
  centreName,
  assignedSlotTime,
  estimatedArrivalTime,
  delayMinutes = 0,
  isLunchBreakCrossed = false,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn('overflow-hidden border-2 border-emerald-600 shadow-md bg-white dark:bg-neutral-900', className)}>
      <div className="bg-emerald-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
            Official Procurement Token
          </span>
        </div>
        <Badge variant="outline" size="sm" className="bg-emerald-900/60 text-emerald-200 border-emerald-600">
          Position #{queuePosition}
        </Badge>
      </div>

      <CardHeader className="pb-3 text-center border-b border-slate-100 dark:border-neutral-800 bg-emerald-50/40 dark:bg-emerald-950/20">
        <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
          Unique Random Identifier
        </span>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-slate-900 dark:text-white bg-white dark:bg-neutral-800 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 shadow-xs">
            {token}
          </span>
          <button
            onClick={handleCopy}
            title="Copy Token"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
          Present this 6-character token or QR code at the procurement centre gate
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Realtime Queue ETA block */}
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              Expected Arrival (ETA)
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {estimatedArrivalTime}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span>Assigned Slot</span>
            <span className="font-medium text-slate-700 dark:text-neutral-200">{assignedSlotTime}</span>
          </div>

          {delayMinutes > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
              <span>Operational Delay:</span>
              <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[11px]">+{delayMinutes} mins</span>
            </div>
          )}

          {isLunchBreakCrossed && (
            <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
              * ETA automatically accounts for scheduled lunch break (02:00 PM - 03:00 PM).
            </div>
          )}
        </div>

        {/* Commodity and value estimation */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
            <span className="text-slate-500 dark:text-neutral-400 block mb-0.5">Crop & Quantity</span>
            <span className="font-semibold text-slate-900 dark:text-white">{cropName}</span>
            <span className="text-slate-600 dark:text-neutral-300 block text-[11px] mt-0.5">
              {formatQuantityQuintals(quantityQuintals)}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
            <span className="text-slate-500 dark:text-neutral-400 block mb-0.5">Est. Procurement Value</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
              {formatCurrencyINR(estimatedValue)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-neutral-400 block mt-0.5">
              Subject to FAQ weight check
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 pt-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
          <span className="truncate">{centreName}</span>
        </div>
      </CardContent>
    </Card>
  );
};
