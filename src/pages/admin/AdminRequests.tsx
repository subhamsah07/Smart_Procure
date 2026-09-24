import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminRequestItem, AdminCentreItem } from '../../types/admin';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Calendar,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ShieldAlert,
  ShieldCheck,
  PauseCircle,
  KeyRound,
  ChevronRight,
  Lock,
  User,
  Check,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  Layers,
} from 'lucide-react';

export const AdminRequests: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = React.useState<AdminRequestItem[]>([]);
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [centreFilter, setCentreFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [presentDayOnly, setPresentDayOnly] = React.useState(true);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [qrInput, setQrInput] = React.useState('');
  const [qrVerifying, setQrVerifying] = React.useState(false);
  const [qrError, setQrError] = React.useState<string | null>(null);

  // Hold & Reschedule Modal State for Absent Farmer
  const [holdingRequest, setHoldingRequest] = React.useState<AdminRequestItem | null>(null);
  const [newDateInput, setNewDateInput] = React.useState('');
  const [newTimeInput, setNewTimeInput] = React.useState('09:00 - 11:00');
  const [rescheduleReason, setRescheduleReason] = React.useState('Farmer absent at counter during sequential call');
  const [isHolding, setIsHolding] = React.useState(false);
  const [holdSuccessMessage, setHoldSuccessMessage] = React.useState<string | null>(null);

  const todayIsoDate = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const [reqData, centreData] = await Promise.all([
        adminService.getRequestsByState(assignedState, {
          status: statusFilter,
          centreId: centreFilter,
          date: dateFilter || undefined,
          search: searchQuery,
          sortOrder: 'asc', // First-Come First-Served: earliest registration first
        }),
        adminService.getCentresByState(assignedState),
      ]);
      setRequests(reqData);
      setCentres(centreData);
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [assignedState, statusFilter, centreFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim() || !assignedState) return;

    setQrVerifying(true);
    setQrError(null);

    const result = await adminService.verifyQrIdentifier(qrInput.trim(), assignedState);
    setQrVerifying(false);

    if (result.success && result.request) {
      setQrModalOpen(false);
      setQrInput('');
      navigate(`/admin/requests/${result.request.id}`);
    } else {
      setQrError(result.error || 'QR Verification failed. Code not found.');
    }
  };

  // --------------------------------------------------------------------------
  // Sequential FCFS Queue Logic (First who booked appointment gets processed first)
  // --------------------------------------------------------------------------
  // Today's appointments only
  const todayRequests = React.useMemo(() => {
    return requests.filter((r) => {
      const date = r.assignedDate || r.preferredDate;
      return date === todayIsoDate;
    });
  }, [requests, todayIsoDate]);

  // Sorted strictly by registration / booking timestamp (FCFS)
  const sortedTodayQueue = React.useMemo(() => {
    return [...todayRequests].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [todayRequests]);

  // Current active farmer in front: earliest registered farmer whose procurement is not completed and not on hold
  const activeFrontFarmer = React.useMemo(() => {
    return sortedTodayQueue.find(
      (r) =>
        r.bookingStatus !== 'completed' &&
        r.workflowStatus !== 'procurement_completed' &&
        r.workflowStatus !== 'payment_processing' &&
        r.workflowStatus !== 'payment_completed' &&
        r.bookingStatus !== 'cancelled' &&
        r.bookingStatus !== 'no_show' &&
        r.workflowStatus !== 'on_hold'
    );
  }, [sortedTodayQueue]);

  // Upcoming farmers in line
  const upcomingFarmers = React.useMemo(() => {
    if (!activeFrontFarmer) return [];
    return sortedTodayQueue.filter(
      (r) =>
        r.id !== activeFrontFarmer.id &&
        r.bookingStatus !== 'completed' &&
        r.workflowStatus !== 'procurement_completed' &&
        r.workflowStatus !== 'payment_processing' &&
        r.workflowStatus !== 'payment_completed' &&
        r.bookingStatus !== 'cancelled' &&
        r.bookingStatus !== 'no_show' &&
        r.workflowStatus !== 'on_hold'
    );
  }, [sortedTodayQueue, activeFrontFarmer]);

  // Completed today count
  const completedTodayCount = React.useMemo(() => {
    return sortedTodayQueue.filter(
      (r) =>
        r.bookingStatus === 'completed' ||
        r.workflowStatus === 'procurement_completed' ||
        r.workflowStatus === 'payment_processing' ||
        r.workflowStatus === 'payment_completed'
    ).length;
  }, [sortedTodayQueue]);

  // Future bookings count
  const futureBookingsCount = React.useMemo(() => {
    return requests.filter((r) => {
      const date = r.assignedDate || r.preferredDate;
      return date && date > todayIsoDate;
    }).length;
  }, [requests, todayIsoDate]);

  // Filtered list to display in table
  const displayedRequests = React.useMemo(() => {
    if (presentDayOnly) {
      return sortedTodayQueue;
    }
    // When Present Day Only is OFF, show today's + upcoming bookings
    return [...requests].sort((a, b) => {
      const dateA = a.assignedDate || a.preferredDate || '';
      const dateB = b.assignedDate || b.preferredDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (a.assignedStartTime || '').localeCompare(b.assignedStartTime || '');
    });
  }, [presentDayOnly, sortedTodayQueue, requests]);

  // Handle Hold & Reschedule for absent farmer
  const handleHoldAndReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdingRequest || !newDateInput) return;

    setIsHolding(true);
    try {
      const res = await adminService.holdAndRescheduleBooking({
        bookingId: holdingRequest.id,
        newDate: newDateInput,
        newSlotTime: newTimeInput,
        reason: rescheduleReason,
      });

      if (res.success) {
        setHoldSuccessMessage(
          `Farmer ${holdingRequest.farmerName} placed on HOLD and rescheduled to ${newDateInput} (${newTimeInput}). Notification and SMS sent.`
        );
        setHoldingRequest(null);
        await loadData();
        setTimeout(() => setHoldSuccessMessage(null), 7000);
      } else {
        alert(res.error || 'Failed to hold and reschedule booking.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while putting booking on hold.');
    } finally {
      setIsHolding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Present Day Mandi Procurement Operations ({assignedState})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Procurement Desk & Sequential Queue
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enforces <strong>Present Day Only</strong> procurement rule and <strong>First-Come, First-Served (FCFS)</strong> sequential processing order.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-xs transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Verify Farmer QR</span>
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {holdSuccessMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{holdSuccessMessage}</span>
          </div>
          <button
            onClick={() => setHoldSuccessMessage(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROMINENT FRONT CARD: FIRST REGISTERED FARMER (SEQUENTIAL PROCUREMENT) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 rounded-2xl text-white p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-800/50">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                Priority Counter #1
              </span>
              <span className="text-xs font-medium text-emerald-200">
                First-Come, First-Served (FCFS) • Earliest Registered Farmer in Queue
              </span>
            </div>
            <div className="text-xs text-emerald-300 flex items-center gap-2">
              <span>Completed Today: <strong>{completedTodayCount}</strong></span>
              <span>•</span>
              <span>In Queue Today: <strong>{sortedTodayQueue.length}</strong></span>
            </div>
          </div>

          {activeFrontFarmer ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Farmer Particulars */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800/60 border border-emerald-600/60 flex items-center justify-center font-bold text-lg text-emerald-200 shadow-inner">
                    #1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {activeFrontFarmer.farmerName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/80 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {activeFrontFarmer.farmerMobile || 'No Mobile'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {activeFrontFarmer.farmerDistrict}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-300">
                        Reg: {new Date(activeFrontFarmer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Token Number</span>
                    <span className="text-base font-bold font-mono text-white">{activeFrontFarmer.token}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Arrival Intake</span>
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Scan QR / PIN</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Commodity</span>
                    <span className="text-sm font-bold text-white truncate block">{activeFrontFarmer.cropName}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Quantity</span>
                    <span className="text-base font-bold text-white">{activeFrontFarmer.quantityQuintals} Qtl</span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-200/90 flex flex-wrap items-center gap-2 pt-1">
                  <span>Centre: <strong>{activeFrontFarmer.centreName}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-300/90">🔒 Protected PIN & QR: <strong>Confidential to farmer</strong></span>
                  <span>•</span>
                  <span className="capitalize">Workflow: <strong className="text-amber-300">{activeFrontFarmer.workflowStatus.replace(/_/g, ' ')}</strong></span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-3 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50">
                <div className="text-xs text-emerald-200 leading-relaxed">
                  This farmer booked registration earliest for today. As per sequential procurement mandate, perform intake for this farmer first.
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    to={`/admin/requests/${activeFrontFarmer.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg transition"
                  >
                    <span>Process Procurement Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      const tmrw = new Date();
                      tmrw.setDate(tmrw.getDate() + 1);
                      setNewDateInput(tmrw.toISOString().split('T')[0]);
                      setHoldingRequest(activeFrontFarmer);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-amber-400/60 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 text-xs font-semibold transition"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-400" />
                    <span>Farmer Absent? Hold</span>
                  </button>
                </div>

                {upcomingFarmers.length > 0 && (
                  <div className="pt-2 border-t border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>Up next in sequence: <strong>#{2} {upcomingFarmers[0].farmerName}</strong> ({upcomingFarmers[0].token})</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                      +{upcomingFarmers.length} waiting
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">All Today's Scheduled Procurements Completed</h4>
              <p className="text-xs text-emerald-200 max-w-md mx-auto">
                There are currently no pending farmers waiting in today's intake queue. New bookings for present day will appear here sequentially.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by token, farmer name, mobile, vehicle..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Present Day Only Toggle */}
            <button
              type="button"
              onClick={() => setPresentDayOnly(!presentDayOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                presentDayOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Present Day Only {presentDayOnly ? '✓' : '(Off)'}</span>
              {futureBookingsCount > 0 && presentDayOnly && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-800 text-emerald-100 font-medium">
                  +{futureBookingsCount} future
                </span>
              )}
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>

            {/* Centre Filter */}
            <select
              id="admin-requests-centre-filter"
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[180px] truncate"
            >
              <option key="all" value="all">All Centres</option>
              {centres.map((c) => (
                <option key={c.id || c.code} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== todayIsoDate) {
                  setPresentDayOnly(false);
                }
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear Date
              </button>
            )}

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {presentDayOnly ? "Today's Sequential Intake Queue (FCFS Order)" : "All State Procurement Bookings (Today + Upcoming)"}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
              {displayedRequests.length} records
            </span>
          </div>
          <div className="flex items-center gap-3">
            {futureBookingsCount > 0 && presentDayOnly && (
              <button
                type="button"
                onClick={() => setPresentDayOnly(false)}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition"
              >
                <span>📅 {futureBookingsCount} future booking{futureBookingsCount > 1 ? 's' : ''} available</span>
                <span className="underline ml-0.5 font-bold">Show All</span>
              </button>
            )}
            {presentDayOnly && (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Procurement intake active for present day
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading procurement requests and bookings...
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <p className="text-slate-600 font-medium">
              No procurement requests found matching the current filters for {assignedState}.
            </p>
            {presentDayOnly && futureBookingsCount > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto text-blue-900">
                <p className="font-semibold mb-1">
                  📅 {futureBookingsCount} future booking{futureBookingsCount > 1 ? 's' : ''} scheduled
                </p>
                <p className="text-[11px] text-blue-700 mb-2">
                  "Present Day Only" is enabled, which filters out appointments scheduled for future dates.
                </p>
                <button
                  type="button"
                  onClick={() => setPresentDayOnly(false)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
                >
                  Show Today + Upcoming Bookings
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Seq # / Token</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Procurement Centre</th>
                  <th className="py-3 px-4">Crop & Quantity</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Procurement Status</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRequests.map((req, idx) => {
                  const appointmentDate = req.assignedDate || req.preferredDate || '';
                  const isFutureDate = appointmentDate > todayIsoDate;
                  const isPresentDay = appointmentDate === todayIsoDate;
                  const isPastDate = appointmentDate < todayIsoDate && appointmentDate !== '';

                  const isProcurementCompleted =
                    req.bookingStatus === 'completed' ||
                    req.workflowStatus === 'procurement_completed' ||
                    req.workflowStatus === 'payment_processing' ||
                    req.workflowStatus === 'payment_completed';

                  const isPaymentDone =
                    req.paymentStatus === 'completed' ||
                    req.workflowStatus === 'payment_completed';

                  const isCurrentFront = activeFrontFarmer && activeFrontFarmer.id === req.id;

                  return (
                    <tr
                      key={req.id}
                      className={`transition ${
                        isCurrentFront
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCurrentFront
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-mono font-bold text-emerald-800 text-xs">
                              {req.token}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {req.vehicleNumber ? `Veh: ${req.vehicleNumber}` : 'Arrival Pending'}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Reg: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{req.farmerName}</div>
                        <div className="text-[11px] text-slate-500">{req.farmerDistrict}</div>
                        {req.farmerMobile && (
                          <div className="text-[10px] text-slate-400 font-mono">{req.farmerMobile}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{req.centreName}</div>
                        <div className="text-[11px] text-slate-400">{req.centreDistrict}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{req.cropName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">
                          {req.quantityQuintals} Quintals
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">
                            {appointmentDate || 'Today'}
                          </div>
                          {isFutureDate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Future Date (Locked)</span>
                            </span>
                          ) : isPresentDay ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>Present Day Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              <span>Past Slot</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          if (req.workflowStatus === 'on_hold') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                <PauseCircle className="w-3 h-3 text-amber-700" />
                                <span>On Hold (Absent)</span>
                              </span>
                            );
                          }

                          if (isProcurementCompleted) {
                            if (isPaymentDone) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Completed
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                Payment Pending
                              </span>
                            );
                          }

                          if (req.bookingStatus === 'cancelled' || req.workflowStatus === 'cancelled' || req.workflowStatus === 'rejected') {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                Failed (Quality Not Approved)
                              </span>
                            );
                          }

                          return (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                req.workflowStatus === 'crop_quality_check' || req.workflowStatus === 'weight_rate_verification'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : req.workflowStatus === 'document_verification' || req.workflowStatus === 'qr_verified'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : req.workflowStatus === 'booking' || !req.workflowStatus
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300 font-bold'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {req.workflowStatus === 'booking' || !req.workflowStatus
                                ? 'Awaiting Arrival'
                                : req.workflowStatus.replace(/_/g, ' ')}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        {req.paymentStatus ? (
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                req.paymentStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : req.paymentStatus === 'processing'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : req.paymentStatus === 'failed'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {req.paymentStatus}
                            </span>
                            {req.paymentAmount != null && (
                              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                                ₹{req.paymentAmount.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not generated</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hold button for active absent farmer */}
                          {!isProcurementCompleted && req.workflowStatus !== 'on_hold' && (
                            <button
                              type="button"
                              onClick={() => {
                                const tmrw = new Date();
                                tmrw.setDate(tmrw.getDate() + 1);
                                setNewDateInput(tmrw.toISOString().split('T')[0]);
                                setHoldingRequest(req);
                              }}
                              className="p-1 rounded text-amber-700 hover:bg-amber-50 transition"
                              title="Farmer absent? Hold and move to next"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {isFutureDate ? (
                            <button
                              type="button"
                              disabled
                              title="Procurement restricted to present day only. Cannot proceed for future dates."
                              className="inline-flex items-center gap-1 font-semibold text-slate-400 text-xs px-2.5 py-1 rounded bg-slate-100 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </button>
                          ) : (
                            <Link
                              to={`/admin/requests/${req.id}`}
                              className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded transition ${
                                isCurrentFront
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              <span>{isCurrentFront ? 'Process' : 'Inspect'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hold & Reschedule Modal for Absent Farmer */}
      <AnimatePresence>
        {holdingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center">
                    <PauseCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Hold & Reschedule Absent Farmer</h4>
                    <p className="text-xs text-slate-500">
                      Token: <strong className="font-mono text-slate-700">{holdingRequest.token}</strong> • {holdingRequest.farmerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHoldingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleHoldAndReschedule} className="p-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  The farmer is absent from the Mandi counter. Putting this booking on <strong>HOLD</strong> frees the intake counter so the admin can proceed to the next farmer in sequence. The farmer will automatically receive an SMS with the newly assigned date & time.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Procurement Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Preferred Time Window
                  </label>
                  <select
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="09:00 - 11:00">Morning Slot: 09:00 - 11:00 AM</option>
                    <option value="11:00 - 13:00">Midday Slot: 11:00 AM - 01:00 PM</option>
                    <option value="13:00 - 15:00">Afternoon Slot: 01:00 PM - 03:00 PM</option>
                    <option value="15:00 - 17:00">Evening Slot: 03:00 PM - 05:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Hold & Reschedule
                  </label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. Farmer absent at gate during call, rescheduled"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHoldingRequest(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isHolding}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>{isHolding ? 'Holding & Notifying...' : 'Hold & Notify Farmer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Verification Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Verify Farmer QR Identifier</h3>
                  <p className="text-xs text-slate-500">Mandi Gate Intake Verification ({assignedState})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQrModalOpen(false);
                  setQrError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{qrError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyQr} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Enter Farmer's 6-Digit PIN or Scan QR Pass:
                </label>
                <input
                  type="text"
                  required
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="e.g. Enter 6-digit PIN presented by farmer"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Fair Verification Protocol: Enter the confidential 6-digit PIN spoken/presented by the farmer, or scan their physical gate pass.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qrVerifying}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {qrVerifying ? 'Verifying with RLS...' : 'Verify & Open Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
