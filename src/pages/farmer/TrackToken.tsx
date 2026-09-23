import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  CalendarPlus,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { bookingService } from '../../services/bookingService';
import { ProcurementBooking } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { LiveQueueIntelligenceCard } from '../../components/farmer/LiveQueueIntelligenceCard';

export const TrackToken: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = React.useState<ProcurementBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = React.useState<ProcurementBooking | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  // Manual search lookup state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const activeCardRef = React.useRef<HTMLDivElement>(null);

  // Fetch all bookings for the farmer
  const fetchAllBookings = React.useCallback(async () => {
    try {
      const all = await bookingService.getMyBookings();
      setBookings(all);

      const requestedToken = (searchParams.get('token') || searchParams.get('id') || '').trim().toUpperCase();

      if (requestedToken && all.length > 0) {
        const found = all.find(
          (b) => b.token.toUpperCase() === requestedToken || b.id.toUpperCase() === requestedToken
        );
        if (found) {
          setSelectedBooking(found);
          return;
        }
      }

      // Check current active booking if available
      const active = await bookingService.getCurrentBooking();
      if (active) {
        // Prefer matching object from all to preserve reference
        const matched = all.find((b) => b.id === active.id || b.token === active.token) || active;
        setSelectedBooking(matched);
      } else if (all.length > 0) {
        setSelectedBooking(all[0]);
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      console.warn('Failed to load bookings in TrackToken:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllBookings();
    setIsRefreshing(false);
  };

  const handleSelectBooking = (b: ProcurementBooking) => {
    setSelectedBooking(b);
    setSearchParams({ token: b.token }, { replace: true });
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopy = (token: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => {
      setCopiedToken(null);
    }, 2000);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // First check in loaded bookings
      const localMatch = bookings.find(
        (b) => b.token.toUpperCase() === clean || b.id.toUpperCase() === clean
      );
      if (localMatch) {
        handleSelectBooking(localMatch);
        setSearchQuery('');
        return;
      }

      // Query database/service directly
      const fetched = await bookingService.getBookingByToken(clean);
      if (fetched) {
        setBookings((prev) => {
          if (!prev.some((b) => b.id === fetched.id || b.token === fetched.token)) {
            return [fetched, ...prev];
          }
          return prev;
        });
        handleSelectBooking(fetched);
        setSearchQuery('');
      } else {
        setSearchError(
          t('trackToken.tokenNotFoundDesc', {
            token: clean,
            defaultValue: `No booking matches token "${clean}". Please verify your token or check your registered appointments.`,
          })
        );
      }
    } catch (err) {
      console.warn('Token lookup error:', err);
      setSearchError('Error looking up token. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'procurement_completed') {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>{t('bookSlot.statusCompleted', 'Completed')}</span>
        </Badge>
      );
    }
    if (s === 'in_progress') {
      return (
        <Badge variant="warning" size="sm" className="gap-1">
          <Activity className="h-3 w-3 animate-pulse" />
          <span>{t('bookSlot.statusInProgress', 'In Progress')}</span>
        </Badge>
      );
    }
    if (s === 'cancelled' || s === 'failed') {
      return (
        <Badge variant="destructive" size="sm">
          <span>{t('bookSlot.statusCancelled', 'Cancelled')}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        <span>{t('bookSlot.statusBooked', 'Booked')}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-16 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs flex flex-col items-center justify-center text-center space-y-3 max-w-2xl mx-auto">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          {t('trackToken.tracking', 'Checking your active token status...')}
        </p>
      </div>
    );
  }

  if (bookings.length === 0 && !selectedBooking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
            <Activity className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('trackToken.tokenNotFoundTitle', 'No active procurement token')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md">
              {t('trackToken.tokenNotFoundDesc', {
                token: 'active',
                defaultValue:
                  'You do not currently have a scheduled or active foodgrain slot to track. Book a procurement slot to obtain an ingress token.',
              })}
            </p>
          </div>

          {/* Optional token search even when no active booking exists */}
          <form onSubmit={handleManualSearch} className="w-full max-w-md pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('trackToken.searchPlaceholder', 'Enter 6-char token or booking ID')}
                className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <Button type="submit" variant="outline" size="md" isLoading={isSearching} className="gap-1.5 shrink-0">
                <Search className="h-4 w-4" />
                <span>{t('trackToken.trackBtn', 'Track')}</span>
              </Button>
            </div>
            {searchError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 text-left">{searchError}</p>
            )}
          </form>

          <Link to="/farmer/booking" className="pt-2">
            <Button variant="primary" size="md" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span>{t('trackToken.bookNewSlot', 'Book a Procurement Slot')}</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>
              {bookings.length > 1
                ? `${bookings.length} Bookings Registered`
                : t('bookSlot.statusBooked', 'Procurement Token Active')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('trackToken.title', 'Live Queue & Token Status')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {bookings.length > 1
              ? `You have ${bookings.length} procurement bookings. Track live gate ingress and weighbridge queue for each token.`
              : `${t('trackToken.subtitle', 'Dynamic gate ingress & weighbridge queue telemetry for Token')} ${selectedBooking?.token || ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('dashboard.retry', 'Refresh')}</span>
          </Button>

          <Link to="/farmer/booking">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>{t('dashboard.bookAnother', 'Book Slot')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* MULTI-BOOKING SELECTOR: Rendered when a farmer has more than one booking */}
      {bookings.length > 1 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Select Booking to Track ({bookings.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Click any token to switch live tracker
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {bookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id || selectedBooking?.token === b.token;
              return (
                <button
                  key={b.id || b.token}
                  type="button"
                  onClick={() => handleSelectBooking(b)}
                  className={`text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-white dark:bg-neutral-900 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 hover:border-emerald-300 hover:bg-white dark:hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tracking-wider">
                      {b.token}
                    </span>
                    {getStatusBadge(b.bookingStatus)}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate">
                    {b.cropName} • {b.quantityQuintals} {t('common.quintal', 'Quintals')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                    {b.centreName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 mt-2 pt-1.5 border-t border-slate-100 dark:border-neutral-800">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-600" />
                      {b.slotDate}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <Check className="h-3 w-3" />
                        Tracking
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-neutral-400 hover:text-emerald-600 font-medium">
                        Click to Track →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CORE LIVE QUEUE INTELLIGENCE CARD FOR SELECTED BOOKING */}
      <div ref={activeCardRef}>
        {selectedBooking ? (
          <LiveQueueIntelligenceCard
            booking={selectedBooking}
            onBookingUpdated={fetchAllBookings}
          />
        ) : (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center text-sm text-slate-500">
            Please select a booking above to view live queue intelligence.
          </div>
        )}
      </div>

      {/* ALL BOOKINGS & TOKENS LIST: Displays all bookings with full details */}
      {bookings.length > 1 && (
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Registered Bookings & Tokens ({bookings.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Total {bookings.reduce((sum, b) => sum + (b.quantityQuintals || 0), 0)} Quintals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id || selectedBooking?.token === b.token;
              const isCopied = copiedToken === b.token;

              return (
                <div
                  key={b.id || b.token}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-xs'
                      : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-bold text-sm tracking-wider flex items-center gap-1.5 shadow-xs">
                        <span>{b.token}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(b.token, e)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs inline-flex items-center gap-1 transition-colors"
                        title="Copy Token"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {getStatusBadge(b.bookingStatus)}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/80">
                      <span className="text-slate-500 dark:text-neutral-400">Crop / Produce</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {b.cropName} ({b.quantityQuintals} Quintals)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/80">
                      <span className="text-slate-500 dark:text-neutral-400">Procurement Centre</span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[200px]" title={b.centreName}>
                        {b.centreName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/80">
                      <span className="text-slate-500 dark:text-neutral-400">Slot Date & Window</span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {b.slotDate}{' '}
                        {b.slotStartTime && b.slotEndTime
                          ? `(${b.slotStartTime.slice(0, 5)} - ${b.slotEndTime.slice(0, 5)})`
                          : ''}
                      </span>
                    </div>

                    {b.verificationCode && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/80">
                        <span className="text-slate-500 dark:text-neutral-400">Gate Verification PIN</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                          {b.verificationCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800">
                    {isSelected ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Currently Active on Tracker</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleSelectBooking(b)}
                        className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <Activity className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Track Live Status</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}

                    <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                      ID: {b.id.length > 15 ? `${b.id.slice(0, 8)}...` : b.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Token Search Bar for Farmer Convenience */}
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Track Another Booking Token
            </h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Have another token receipt? Enter the 6-character token code to track its live gate entry.
            </p>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. SP7K4Q"
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-full sm:w-36"
            />
            <Button type="submit" variant="primary" size="sm" isLoading={isSearching} className="gap-1 text-xs shrink-0">
              <Search className="h-3 w-3" />
              <span>Track</span>
            </Button>
          </form>
        </div>
        {searchError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{searchError}</span>
          </p>
        )}
      </div>
    </div>
  );
};
