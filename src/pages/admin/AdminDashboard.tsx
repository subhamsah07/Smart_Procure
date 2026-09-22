import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminOverviewStats, AdminRequestItem, AdminCentreItem } from '../../types/admin';
import { StateProcurementAnalysis } from '../../components/admin/StateProcurementAnalysis';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Calendar,
  Filter,
  PhoneCall,
  Check,
  Search,
  Play,
  BarChart3,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { assignedState, admin } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'analysis' ? 'analysis' : 'overview';

  const [stats, setStats] = React.useState<AdminOverviewStats | null>(null);
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [requests, setRequests] = React.useState<AdminRequestItem[]>([]);
  const [allStateRequests, setAllStateRequests] = React.useState<AdminRequestItem[]>([]);
  const [centreSummaries, setCentreSummaries] = React.useState<{ operatingStatus: string; count: number }[]>([]);

  // Filter Selectors
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('all');
  const [selectedCentre, setSelectedCentre] = React.useState<string>('all');
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [searchToken, setSearchToken] = React.useState<string>('');

  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Load centres & initial overview stats & complete state requests for analysis
  const loadInitialData = async () => {
    if (!assignedState) return;
    try {
      const [overviewData, stateCentres, stateReqs] = await Promise.all([
        adminService.getOverviewStats(assignedState),
        adminService.getCentresByState(assignedState),
        adminService.getRequestsByState(assignedState),
      ]);
      setStats(overviewData.stats);
      setCentreSummaries(overviewData.centreSummaries);
      setCentres(stateCentres);
      setAllStateRequests(stateReqs);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    }
  };

  // Load requests based on active selectors
  const loadFilteredRequests = async () => {
    if (!assignedState) return;
    try {
      const reqs = await adminService.getRequestsByState(assignedState, {
        district: selectedDistrict,
        centreId: selectedCentre,
        date: selectedDate || undefined,
        status: selectedStatus,
        search: searchToken || undefined,
      });
      setRequests(reqs);
    } catch (err) {
      console.error('Failed to load filtered requests:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadInitialData(), loadFilteredRequests()]);
    setLoading(false);
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadAll();
  }, [assignedState]);

  React.useEffect(() => {
    loadFilteredRequests();
  }, [selectedDistrict, selectedCentre, selectedDate, selectedStatus, searchToken]);

  // Live real-time event listener: graphs and register adjust automatically when any activity is done
  React.useEffect(() => {
    const handleLiveActivity = () => {
      loadAll();
    };

    window.addEventListener('smartprocure_booking_cancelled', handleLiveActivity);
    window.addEventListener('smartprocure_booking_created', handleLiveActivity);
    window.addEventListener('smartprocure_queue_updated', handleLiveActivity);
    window.addEventListener('smartprocure_procurement_updated', handleLiveActivity);
    window.addEventListener('smartprocure_price_updated', handleLiveActivity);
    window.addEventListener('storage', handleLiveActivity);

    return () => {
      window.removeEventListener('smartprocure_booking_cancelled', handleLiveActivity);
      window.removeEventListener('smartprocure_booking_created', handleLiveActivity);
      window.removeEventListener('smartprocure_queue_updated', handleLiveActivity);
      window.removeEventListener('smartprocure_procurement_updated', handleLiveActivity);
      window.removeEventListener('smartprocure_price_updated', handleLiveActivity);
      window.removeEventListener('storage', handleLiveActivity);
    };
  }, [assignedState]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  // Derive districts from state centres
  const availableDistricts = React.useMemo(() => {
    const dSet = new Set<string>();
    centres.forEach((c) => {
      if (c.district) dSet.add(c.district);
    });
    return Array.from(dSet).sort();
  }, [centres]);

  // Derive centres filtered by district
  const filteredCentresList = React.useMemo(() => {
    if (selectedDistrict === 'all') return centres;
    return centres.filter((c) => c.district === selectedDistrict);
  }, [centres, selectedDistrict]);

  // Queue operations: advance token status
  const handleQueueCheckIn = async (req: AdminRequestItem) => {
    setProcessingId(req.id);
    setActionMessage(null);
    try {
      const success = await adminService.logQueueAction({
        centreId: req.centreId,
        bookingId: req.id,
        eventType: 'checked_in',
        notes: `Farmer ${req.farmerName} called / marked arrived at Mandi gate.`,
      });
      if (success) {
        setActionMessage(`Token ${req.token} marked as Arrived (In Progress).`);
        await loadAll();
      }
    } catch (err) {
      console.error('Queue check-in failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const setTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with State Scope with Deep Neutral Black Dark Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-neutral-950 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Official State Agricultural Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {assignedState} Administration
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              State: {assignedState}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Active Officer: <strong className="text-slate-700 dark:text-neutral-200">{admin?.adminName || 'State Administrator'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/admin/queue"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Live Queue Console</span>
          </Link>
        </div>
      </div>

      {/* Primary Dashboard Navigation Tabs: Overview vs Procurement Analysis */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-neutral-950 rounded-2xl border border-slate-300/80 dark:border-neutral-800 w-fit">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Live Register & Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'analysis' })}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'analysis'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Procurement Analysis</span>
          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full tracking-wide ${
            activeTab === 'analysis'
              ? 'bg-white/20 text-white'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
          }`}>
            7-Day Trends
          </span>
        </button>
      </div>

      {/* Conditional View: Procurement Analysis or Standard Register */}
      {activeTab === 'analysis' ? (
        <StateProcurementAnalysis
          assignedState={assignedState}
          centres={centres}
          requests={allStateRequests.length > 0 ? allStateRequests : requests}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <>
          {/* Action notification */}
          {actionMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">{actionMessage}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Requests Got */}
            <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  Total Requests Got
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? (
                    <span className="w-8 h-8 inline-block bg-slate-100 dark:bg-neutral-900 rounded animate-pulse" />
                  ) : (
                    stats?.totalRequests ?? (allStateRequests.length > 0 ? allStateRequests.length : requests.length) ?? 0
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">Actual farmer booking requests</p>
              </div>
            </div>

            {/* Today's Requests */}
            <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  Today's Slots
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? (
                    <span className="w-8 h-8 inline-block bg-slate-100 dark:bg-neutral-900 rounded animate-pulse" />
                  ) : (
                    stats?.todayRequests ?? 0
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">Slot assignments scheduled today</p>
              </div>
            </div>

            {/* Pending Verification */}
            <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  Pending Verification
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {loading ? (
                    <span className="w-8 h-8 inline-block bg-slate-100 dark:bg-neutral-900 rounded animate-pulse" />
                  ) : (
                    stats?.pendingVerification ?? 0
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">Awaiting physical gate check / QR</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  In Progress
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {loading ? (
                    <span className="w-8 h-8 inline-block bg-slate-100 dark:bg-neutral-900 rounded animate-pulse" />
                  ) : (
                    stats?.inProgress ?? 0
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">Weighbridge & inspection active</p>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  Procured & Completed
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 flex items-center justify-center border border-slate-200 dark:border-neutral-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? (
                    <span className="w-8 h-8 inline-block bg-slate-100 dark:bg-neutral-900 rounded animate-pulse" />
                  ) : (
                    stats?.completed ?? 0
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">Successfully fulfilled loads</p>
              </div>
            </div>
          </div>

          {/* Interactive State Filtering Console: District, Centre, Date, Status */}
          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>State Procurement Filter Controls</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                Jurisdiction: <strong className="text-emerald-700 dark:text-emerald-400">{assignedState}</strong> (Isolated via RLS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. State (Fixed by Auth) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-neutral-400 mb-1">State Jurisdiction</label>
                <div className="py-2 px-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 font-bold flex items-center justify-between">
                  <span>{assignedState}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-mono font-bold">Enforced</span>
                </div>
              </div>

              {/* 2. District Selector */}
              <div>
                <label htmlFor="district-selector" className="block text-[11px] font-bold text-slate-600 dark:text-neutral-400 mb-1">
                  District
                </label>
                <select
                  id="district-selector"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedCentre('all');
                  }}
                  className="w-full py-2 px-2.5 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option key="all" value="all">All Districts ({assignedState})</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Procurement Centre Selector */}
              <div>
                <label htmlFor="centre-selector" className="block text-[11px] font-bold text-slate-600 dark:text-neutral-400 mb-1">
                  Procurement Centre
                </label>
                <select
                  id="centre-selector"
                  value={selectedCentre}
                  onChange={(e) => setSelectedCentre(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
                >
                  <option key="all" value="all">All Centres ({filteredCentresList.length})</option>
                  {filteredCentresList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Date Selector */}
              <div>
                <label htmlFor="date-selector" className="block text-[11px] font-bold text-slate-600 dark:text-neutral-400 mb-1">
                  Assigned Date
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="date-selector"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={setTodayDate}
                    title="Filter by Today"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-[10px] font-bold text-slate-700 dark:text-neutral-300 shrink-0 transition"
                  >
                    Today
                  </button>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      title="Clear Date"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-[10px] font-bold text-slate-500 dark:text-neutral-400 shrink-0 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* 5. Status Selector */}
              <div>
                <label htmlFor="status-selector" className="block text-[11px] font-bold text-slate-600 dark:text-neutral-400 mb-1">
                  Booking Status
                </label>
                <select
                  id="status-selector"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="booked">Booked (Pending)</option>
                  <option value="in_progress">In Progress (At Yard)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Booking / Token List & Queue Operations */}
          <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Booking & Token Register ({assignedState})
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Showing {requests.length} tokens matching active district, centre, and date filters.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="Search token / farmer..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                  />
                </div>
                <Link
                  to="/admin/requests"
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 shrink-0"
                >
                  <span>Full Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-neutral-500 animate-pulse">
                Loading tokens and state queues for {assignedState}...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 dark:text-neutral-400">
                No bookings found for the selected state and filter parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-neutral-300">
                  <thead className="bg-slate-50 dark:bg-neutral-900/80 text-slate-600 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">District / Centre</th>
                      <th className="py-3 px-4">Crop & Quantity</th>
                      <th className="py-3 px-4">Assigned Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Queue Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-neutral-900/50 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg">
                            {req.token}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{req.farmerName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">{req.farmerMobile}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-neutral-200">{req.centreName}</div>
                          <div className="text-[11px] text-slate-400 dark:text-neutral-400">Dist: {req.centreDistrict}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-neutral-100">{req.cropName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-semibold">{req.quantityQuintals} Quintals</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-neutral-200">{req.assignedDate || req.preferredDate || 'Pending'}</div>
                          <div className="text-[11px] text-slate-400 dark:text-neutral-400">
                            {req.assignedStartTime ? `${req.assignedStartTime.slice(0, 5)} - ${req.assignedEndTime?.slice(0, 5)}` : 'Standard Slot'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {(() => {
                            const isProcurementCompleted =
                              req.bookingStatus === 'completed' ||
                              req.workflowStatus === 'procurement_completed' ||
                              req.workflowStatus === 'payment_processing' ||
                              req.workflowStatus === 'payment_completed';

                            const isPaymentDone =
                              req.paymentStatus === 'completed' ||
                              req.workflowStatus === 'payment_completed';

                            if (isProcurementCompleted) {
                              if (isPaymentDone) {
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    Completed
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  Payment Pending
                                </span>
                              );
                            }

                            if (req.bookingStatus === 'in_progress') {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  In Progress
                                </span>
                              );
                            }

                            if (req.bookingStatus === 'cancelled') {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
                                  Cancelled
                                </span>
                              );
                            }

                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-neutral-300 border border-slate-300 dark:border-neutral-800">
                                Booked
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.bookingStatus === 'booked' && (
                              <button
                                type="button"
                                disabled={processingId === req.id}
                                onClick={() => handleQueueCheckIn(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition shadow-xs disabled:opacity-50"
                                title="Mark arrival / Call token"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Call / Arrive</span>
                              </button>
                            )}

                            {req.bookingStatus === 'in_progress' &&
                              req.workflowStatus !== 'procurement_completed' &&
                              req.workflowStatus !== 'payment_processing' &&
                              req.workflowStatus !== 'payment_completed' && (
                                <Link
                                  to={`/admin/requests/${req.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                                  title="Start Procurement"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Start</span>
                                </Link>
                              )}

                            <Link
                              to={`/admin/requests/${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 text-[11px] font-semibold transition"
                            >
                              Inspect
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
