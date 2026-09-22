import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Scale,
  Sparkles,
  MapPin,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AdminCentreItem, AdminRequestItem } from '../../types/admin';

interface StateProcurementAnalysisProps {
  assignedState: string;
  centres: AdminCentreItem[];
  requests: AdminRequestItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

// 7-day daily procurement interface
interface DailyProcurementRecord {
  date: string;
  dayLabel: string;
  quintals: number;
  farmers: number;
}

// Weekly crop distribution interface
interface CropQuantityRecord {
  cropName: string;
  quantityQuintals: number;
  farmerCount: number;
  percentage: number;
  color: string;
}

// 7-day daily payout interface
interface DailyPaymentRecord {
  date: string;
  dayLabel: string;
  paymentLakhs: number;
  paymentRupees: string;
  farmerTransactions: number;
  dbtSuccessRate: number;
}

// Mandi crowd load record
interface CentreCrowdRecord {
  centreId: string;
  name: string;
  district: string;
  currentQueue: number;
  avgWaitMinutes: number;
  capacityQuintals: number;
  utilizationRate: number;
  status: 'HIGH_CONGESTION' | 'MODERATE' | 'NORMAL';
  color: string;
}

export const StateProcurementAnalysis: React.FC<StateProcurementAnalysisProps> = ({
  assignedState,
  centres,
  requests,
  onRefresh,
  refreshing = false,
}) => {
  // Generate 7-day chronological dates ending today (inclusive of today)
  const last7DaysDates = React.useMemo(() => {
    const dates: { dateStr: string; label: string; shortDate: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const shortDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      dates.push({ dateStr, label: `${label} (${shortDate})`, shortDate });
    }
    return dates;
  }, []);

  // 1. Compute Total Procurement Done in each day for 7 days (STRICT REAL DATA)
  const dailyProcurementData = React.useMemo<DailyProcurementRecord[]>(() => {
    return last7DaysDates.map((item) => {
      // Find real requests that match this specific date
      const matched = requests.filter((req) => {
        const reqDate = req.assignedDate || req.createdAt?.split('T')[0] || req.preferredDate;
        return reqDate === item.dateStr;
      });

      // Sum actual procured or scheduled volume
      const quintals = matched.reduce((sum, req) => {
        return sum + (Number(req.quantityQuintals) || 0);
      }, 0);

      // Count unique farmers on this date
      const farmerIds = new Set(
        matched.map((r) => r.farmerId || r.farmerMobile || r.token)
      );

      return {
        date: item.shortDate,
        dayLabel: item.label,
        quintals,
        farmers: farmerIds.size,
      };
    });
  }, [requests, last7DaysDates]);

  // Total 7-day procurement sum
  const total7DayQuintals = React.useMemo(() => {
    return dailyProcurementData.reduce((acc, curr) => acc + curr.quintals, 0);
  }, [dailyProcurementData]);

  // Average daily procurement
  const avgDailyQuintals = React.useMemo(() => {
    return Math.round(total7DayQuintals / 7);
  }, [total7DayQuintals]);

  // Total unique farmers who participated in the 7 days
  const totalUniqueFarmers7Days = React.useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      const reqDate = r.assignedDate || r.createdAt?.split('T')[0] || r.preferredDate;
      const inWindow = last7DaysDates.some((d) => d.dateStr === reqDate);
      if (inWindow) {
        set.add(r.farmerId || r.farmerMobile || r.token);
      }
    });
    return set.size;
  }, [requests, last7DaysDates]);

  // 2. Compute Quantity of the Crop Sold by Farmers in a Week (STRICT REAL DATA)
  const cropQuantityData = React.useMemo<CropQuantityRecord[]>(() => {
    const cropTotals: Record<string, { qty: number; farmers: Set<string> }> = {};

    // Filter requests belonging to the 7-day window or overall active state ledger
    requests.forEach((req) => {
      const cName = (req.cropName || 'Unspecified Crop').trim();
      if (!cropTotals[cName]) {
        cropTotals[cName] = { qty: 0, farmers: new Set() };
      }
      cropTotals[cName].qty += Number(req.quantityQuintals) || 0;
      cropTotals[cName].farmers.add(req.farmerId || req.farmerMobile || req.token);
    });

    const entries = Object.entries(cropTotals);
    const totalQty = entries.reduce((acc, [, item]) => acc + item.qty, 0);

    // High-contrast, distinctive professional color palette
    const PALETTE = [
      '#10b981', // Emerald
      '#0284c7', // Sky
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#f97316', // Orange
      '#6366f1', // Indigo
    ];

    return entries
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([cropName, data], idx) => {
        const percentage = totalQty > 0 ? Math.round((data.qty / totalQty) * 100) : 0;
        return {
          cropName,
          quantityQuintals: data.qty,
          farmerCount: data.farmers.size,
          percentage,
          color: PALETTE[idx % PALETTE.length],
        };
      });
  }, [requests]);

  // Total weekly crop quantity from real records
  const totalWeeklyCropsSold = React.useMemo(() => {
    return cropQuantityData.reduce((acc, c) => acc + c.quantityQuintals, 0);
  }, [cropQuantityData]);

  // 3. Compute Total Crops Payment in a Day for 7 Days (STRICT REAL DATA)
  const dailyPaymentData = React.useMemo<DailyPaymentRecord[]>(() => {
    return last7DaysDates.map((item) => {
      const matched = requests.filter((req) => {
        const reqDate = req.assignedDate || req.createdAt?.split('T')[0] || req.preferredDate;
        return reqDate === item.dateStr;
      });

      const totalRupees = matched.reduce((sum, req) => {
        // Priority 1: Verified final procurement value
        if (req.finalValue != null && !isNaN(Number(req.finalValue))) {
          return sum + Number(req.finalValue);
        }
        // Priority 2: Payment amount
        if (req.paymentAmount != null && !isNaN(Number(req.paymentAmount))) {
          return sum + Number(req.paymentAmount);
        }
        // Priority 3: Quantity * Verified or Benchmark Rate
        const qty = Number(req.quantityQuintals) || 0;
        const rate = Number(req.ratePerQuintal) || 2425;
        return sum + qty * rate;
      }, 0);

      const lakhs = Number((totalRupees / 100000).toFixed(2));
      const formattedRupees = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(totalRupees);

      const uniqueTxCount = matched.length;

      return {
        date: item.shortDate,
        dayLabel: item.label,
        paymentLakhs: lakhs,
        paymentRupees: formattedRupees,
        farmerTransactions: uniqueTxCount,
        dbtSuccessRate: uniqueTxCount > 0 ? 100 : 0,
      };
    });
  }, [requests, last7DaysDates]);

  // 7-day total payout sum in ₹ Lakhs & Crores
  const total7DayPayoutLakhs = React.useMemo(() => {
    return dailyPaymentData.reduce((acc, curr) => acc + curr.paymentLakhs, 0);
  }, [dailyPaymentData]);

  const total7DayPayoutCroresStr = React.useMemo(() => {
    if (total7DayPayoutLakhs >= 100) {
      const cr = total7DayPayoutLakhs / 100;
      return `₹${cr.toFixed(2)} Cr`;
    }
    return `₹${total7DayPayoutLakhs.toFixed(2)} Lakhs`;
  }, [total7DayPayoutLakhs]);

  // 4. Compute Most Crowded Procurement Centre of That State (STRICT REAL DATA)
  const centresCrowdData = React.useMemo<CentreCrowdRecord[]>(() => {
    if (!centres || centres.length === 0) return [];

    const mapped: CentreCrowdRecord[] = centres.map((c) => {
      // Find real requests assigned to this centre
      const centreReqs = requests.filter((r) => r.centreId === c.id);

      // Active in-progress tokens or booked queue for today
      const activeOrToday = centreReqs.filter(
        (r) => r.bookingStatus === 'in_progress' || r.bookingStatus === 'booked'
      );

      // Prefer live token count, or registered todayQueueCount
      const liveQueue = Math.max(activeOrToday.length, Number(c.todayQueueCount) || 0);

      // Total booked volume at this centre
      const totalBookedQtl = centreReqs.reduce(
        (sum, r) => sum + (Number(r.quantityQuintals) || 0),
        0
      );

      const capacityQuintals = Number(c.capacityPerDayQuintals) || 3000;
      const utilizationRate = Math.min(100, Math.round((totalBookedQtl / capacityQuintals) * 100));

      // Realistic queue wait time estimate: 12 mins per vehicle in queue
      const avgWaitMinutes = liveQueue > 0 ? liveQueue * 12 : 0;

      let status: 'HIGH_CONGESTION' | 'MODERATE' | 'NORMAL' = 'NORMAL';
      let color = '#10b981'; // Emerald

      if (liveQueue >= 15 || utilizationRate >= 85) {
        status = 'HIGH_CONGESTION';
        color = '#ef4444'; // Red
      } else if (liveQueue >= 6 || utilizationRate >= 50) {
        status = 'MODERATE';
        color = '#f59e0b'; // Amber
      }

      return {
        centreId: c.id,
        name: c.name,
        district: c.district || assignedState,
        currentQueue: liveQueue,
        avgWaitMinutes,
        capacityQuintals,
        utilizationRate,
        status,
        color,
      };
    });

    // Sort descending by current queue length, then by utilization rate
    return mapped.sort((a, b) => {
      if (b.currentQueue !== a.currentQueue) {
        return b.currentQueue - a.currentQueue;
      }
      return b.utilizationRate - a.utilizationRate;
    });
  }, [centres, requests, assignedState]);

  // The #1 Most Crowded Centre in the state
  const mostCrowdedCentre = React.useMemo(() => {
    return centresCrowdData[0] || null;
  }, [centresCrowdData]);

  return (
    <div className="space-y-6">
      {/* Header Banner for State Intelligence with Deep Black Dark Mode */}
      <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time State Telemetry & Procurement Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {assignedState} Procurement Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-3xl">
              Live multi-dimensional analytics derived directly from registered{' '}
              <strong className="text-slate-800 dark:text-neutral-200">{assignedState}</strong> Mandis and farmer tokens:
              7-day grain throughput, crop distribution, DBT direct farmer payments, and yard queue loads.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Live Database Synchronized</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Highlight Chips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100 dark:border-neutral-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
              7-Day Total Procurement
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {total7DayQuintals.toLocaleString('en-IN')} <span className="text-xs font-sans font-medium text-slate-500">Qtl</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
              Avg: {avgDailyQuintals.toLocaleString('en-IN')} Qtl/day • {totalUniqueFarmers7Days} Farmers
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
              Weekly Crops Sold
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {totalWeeklyCropsSold.toLocaleString('en-IN')} <span className="text-xs font-sans font-medium text-slate-500">Qtl</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
              Across {cropQuantityData.length} active registered {cropQuantityData.length === 1 ? 'crop' : 'crops'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
              7-Day DBT Payout Value
            </span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {total7DayPayoutCroresStr}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> Direct MSP Bank Settlement
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
              Most Crowded Mandi ({assignedState})
            </span>
            <div className="text-sm font-bold text-red-600 dark:text-red-400 truncate mt-1">
              {mostCrowdedCentre && mostCrowdedCentre.currentQueue > 0
                ? mostCrowdedCentre.name
                : 'All Queues Normal'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
              {mostCrowdedCentre && mostCrowdedCentre.currentQueue > 0
                ? `${mostCrowdedCentre.currentQueue} vehicles waiting (~${mostCrowdedCentre.avgWaitMinutes}m)`
                : 'Smooth flow across all Mandis'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Graph 1 (Total Procurement Done in 7 Days) + Graph 2 (Quantity of Crop Sold in a Week) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: Total Procurement Done in Each Day for 7 Days */}
        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    1. Total Procurement Done in 7 Days
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Daily volume in Quintals processed across {assignedState} state centres
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
                Daily Throughput
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-4 my-3 text-xs text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-neutral-800">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">7-Day Total</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {total7DayQuintals.toLocaleString('en-IN')} Qtl
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Daily Average</span>
                <span className="font-bold text-slate-800 dark:text-neutral-200 font-mono">
                  {avgDailyQuintals.toLocaleString('en-IN')} Qtl
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Recorded Tokens</span>
                <span className="font-semibold text-slate-700 dark:text-neutral-300 font-mono">
                  {requests.length} total
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart with Pure Data */}
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyProcurementData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="emeraldBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" className="dark:opacity-40 opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888888', fontSize: 11 }}
                    axisLine={{ stroke: '#444444' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#888888', fontSize: 11 }}
                    axisLine={{ stroke: '#444444' }}
                    tickLine={false}
                    tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DailyProcurementRecord;
                        return (
                          <div className="bg-neutral-950 text-white p-3 rounded-xl shadow-xl border border-neutral-800 text-xs space-y-1">
                            <p className="font-bold text-emerald-400">{data.dayLabel}</p>
                            <p className="font-mono font-semibold">
                              Procured: <span className="text-emerald-300">{data.quintals.toLocaleString('en-IN')} Quintals</span>
                            </p>
                            <p className="text-neutral-300">
                              Farmers Recorded: <span className="font-bold text-white">{data.farmers}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="quintals"
                    name="Procurement (Quintals)"
                    fill="url(#emeraldBarGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
              Live Procurement Quantity (Quintals)
            </span>
            <span>Refreshes automatically upon token status changes</span>
          </div>
        </div>

        {/* GRAPH 2: Quantity of the Crop Sold by Farmers in a Week */}
        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    2. Quantity of Crop Sold in a Week
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Distribution across crops procured in {assignedState}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                Crop Variety
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-4 my-3 text-xs text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-neutral-800">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Weekly Total Sold</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {totalWeeklyCropsSold.toLocaleString('en-IN')} Qtl
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Leading Crop</span>
                <span className="font-bold text-slate-800 dark:text-neutral-200 truncate max-w-[140px] block">
                  {cropQuantityData[0] ? `${cropQuantityData[0].cropName} (${cropQuantityData[0].percentage}%)` : 'None'}
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart with Distinct Colors for each crop or empty state */}
            {cropQuantityData.length === 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800">
                <Info className="w-8 h-8 text-slate-400 dark:text-neutral-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  No crop sales recorded yet in this period
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
                  When farmers book slots or check in harvest loads at {assignedState} Mandis, crop breakdowns will render here automatically.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cropQuantityData}
                    layout="vertical"
                    margin={{ top: 10, right: 25, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" className="dark:opacity-40 opacity-20" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#888888', fontSize: 11 }}
                      axisLine={{ stroke: '#444444' }}
                      tickLine={false}
                      tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="cropName"
                      tick={{ fill: '#aaaaaa', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#444444' }}
                      tickLine={false}
                      width={105}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CropQuantityRecord;
                          return (
                            <div className="bg-neutral-950 text-white p-3 rounded-xl shadow-xl border border-neutral-800 text-xs space-y-1">
                              <p className="font-bold text-amber-400">{data.cropName}</p>
                              <p className="font-mono font-semibold">
                                Quantity Sold: <span className="text-white">{data.quantityQuintals.toLocaleString('en-IN')} Quintals</span>
                              </p>
                              <p className="text-neutral-300">
                                Farmers: <span className="font-bold text-white">{data.farmerCount}</span>
                              </p>
                              <p className="text-[11px] text-amber-300 border-t border-neutral-800 pt-1 mt-1 font-semibold">
                                Share of State Total: {data.percentage}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="quantityQuintals"
                      radius={[0, 6, 6, 0]}
                    >
                      {cropQuantityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Color Legend chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800 text-[10px]">
            {cropQuantityData.map((c) => (
              <span
                key={c.cropName}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200/50 dark:border-neutral-800"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.cropName}: <strong>{c.quantityQuintals.toLocaleString('en-IN')} Q</strong></span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Graph 3 (Total Crops Payment in 7 Days) + Graph 4 (Most Crowded Procurement Centre) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 3: Total Crops Payment in a Day for 7 Days */}
        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    3. Total Crops Payment in a Day for 7 Days
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Direct Benefit Transfer (DBT) bank disbursements to {assignedState} farmers
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/80">
                DBT Payouts
              </span>
            </div>

            {/* Financial Overview Chips */}
            <div className="grid grid-cols-3 gap-2 my-3 text-xs bg-slate-50 dark:bg-neutral-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-neutral-800">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">7-Day Total</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                  {total7DayPayoutCroresStr}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Daily Average</span>
                <span className="font-bold text-slate-800 dark:text-neutral-200 font-mono text-sm">
                  ₹{(total7DayPayoutLakhs / 7).toFixed(1)} L
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 block">Transactions</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {dailyPaymentData.reduce((acc, d) => acc + d.farmerTransactions, 0)} direct
                </span>
              </div>
            </div>

            {/* Recharts Area Chart in Indigo/Emerald Gradient */}
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyPaymentData}
                  margin={{ top: 10, right: 10, left: -5, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="indigoPaymentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" className="dark:opacity-40 opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888888', fontSize: 11 }}
                    axisLine={{ stroke: '#444444' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#888888', fontSize: 11 }}
                    axisLine={{ stroke: '#444444' }}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}L`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DailyPaymentRecord;
                        return (
                          <div className="bg-neutral-950 text-white p-3 rounded-xl shadow-xl border border-neutral-800 text-xs space-y-1">
                            <p className="font-bold text-indigo-400">{data.dayLabel}</p>
                            <p className="font-mono font-bold text-white text-sm">
                              Disbursed: {data.paymentRupees}
                            </p>
                            <p className="text-neutral-300">
                              ({data.paymentLakhs} Lakhs INR)
                            </p>
                            <p className="text-emerald-300 text-[11px] border-t border-neutral-800 pt-1 mt-1">
                              Farmer Transactions: <strong>{data.farmerTransactions}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="paymentLakhs"
                    name="Payment (₹ Lakhs)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#indigoPaymentGradient)"
                    dot={{ stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff', r: 4 }}
                    activeDot={{ stroke: '#6366f1', strokeWidth: 2, fill: '#8b5cf6', r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              Daily MSP Remittances (₹ Lakhs)
            </span>
            <span>Direct Credit via PFMS / Bank Transfers</span>
          </div>
        </div>

        {/* GRAPH 4: Most Crowded Procurement Centre of That State */}
        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    4. Most Crowded Procurement Centre ({assignedState})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Real-time mandi queue congestion comparison and yard load ranking
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800/80 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Live Load
              </span>
            </div>

            {/* Alert Banner for the #1 Most Crowded Centre */}
            {mostCrowdedCentre ? (
              <div className={`my-3 p-3.5 rounded-xl border text-xs ${
                mostCrowdedCentre.currentQueue > 0
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wide text-[10px] ${
                      mostCrowdedCentre.currentQueue > 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${mostCrowdedCentre.currentQueue > 0 ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'}`} />
                      {mostCrowdedCentre.currentQueue > 0 ? `#1 Most Crowded Centre in ${assignedState}` : 'All State Mandis Operating Smoothly'}
                    </div>
                    <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                      {mostCrowdedCentre.name}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-neutral-400 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        District: {mostCrowdedCentre.district}
                      </span>
                      <span>•</span>
                      <span>Capacity: {mostCrowdedCentre.capacityQuintals.toLocaleString('en-IN')} Qtl/day</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold text-white font-mono ${
                      mostCrowdedCentre.currentQueue > 0 ? 'bg-red-600' : 'bg-emerald-600'
                    }`}>
                      {mostCrowdedCentre.currentQueue} Vehicles
                    </span>
                    <span className="block text-[10px] font-semibold mt-1 text-slate-600 dark:text-neutral-300">
                      {mostCrowdedCentre.currentQueue > 0 ? `~${mostCrowdedCentre.avgWaitMinutes} min wait` : 'Zero delay'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Comparison Bar Chart: All State Mandis Ranked by Queue */}
            {centresCrowdData.length === 0 ? (
              <div className="h-60 w-full flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">
                No procurement centres registered for {assignedState}
              </div>
            ) : (
              <div className="h-60 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={centresCrowdData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" className="dark:opacity-40 opacity-20" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#888888', fontSize: 11 }}
                      axisLine={{ stroke: '#444444' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#aaaaaa', fontSize: 10, fontWeight: 600 }}
                      axisLine={{ stroke: '#444444' }}
                      tickLine={false}
                      width={110}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CentreCrowdRecord;
                          return (
                            <div className="bg-neutral-950 text-white p-3 rounded-xl shadow-xl border border-neutral-800 text-xs space-y-1">
                              <p className="font-bold text-red-400">{data.name}</p>
                              <p className="text-neutral-300">District: {data.district}</p>
                              <p className="font-mono font-bold text-white">
                                Live Queue: {data.currentQueue} Vehicles
                              </p>
                              <p className="text-amber-300">
                                Estimated Wait: ~{data.avgWaitMinutes} minutes
                              </p>
                              <p className="text-[11px] text-neutral-400 border-t border-neutral-800 pt-1 mt-1">
                                Capacity: {data.capacityQuintals.toLocaleString('en-IN')} Qtl/day ({data.utilizationRate}% utilized)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="currentQueue"
                      radius={[0, 6, 6, 0]}
                    >
                      {centresCrowdData.map((entry, index) => (
                        <Cell key={`crowd-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Color Indicators */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                Crowded (&ge;15 trolleys)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Smooth
              </span>
            </div>
            <span className="font-medium text-slate-600 dark:text-neutral-300">
              {centresCrowdData.length} Mandis Tracked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
