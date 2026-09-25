import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  RefreshCw,
  CalendarPlus,
  Loader2,
  Layers,
  Search,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { bookingService } from '../../services/bookingService';
import { queueService, FarmerLiveTelemetry } from '../../services/queueService';
import { ProcurementBooking } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { LiveQueueIntelligenceCard } from '../../components/farmer/LiveQueueIntelligenceCard';

export const TrackToken: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = React.useState<ProcurementBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = React.useState<ProcurementBooking | null>(null);
  const [bookingTelemetry, setBookingTelemetry] = React.useState<FarmerLiveTelemetry | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSwitchingBooking, setIsSwitchingBooking] = React.useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Manual search lookup state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const searchParamsRef = React.useRef(searchParams);
  searchParamsRef.current = searchParams;

  // References to prevent race conditions and unwanted resets
  const switchSeqRef = React.useRef(0);
  const selectedBookingTokenRef = React.useRef<string>('');

  // Fetch all bookings for the farmer
  const fetchAllBookings = React.useCallback(async (preserveActiveToken = true) => {
    try {
      const all = await bookingService.getMyBookings();
      setBookings(all);

      if (all.length === 0) {
        setSelectedBooking(null);
        setBookingTelemetry(null);
        setIsSwitchingBooking(false);
        return;
      }

      // 1. If preserving user selection, find the active token in the new bookings list
      const currentToken = selectedBookingTokenRef.current;
      if (preserveActiveToken && currentToken) {
        const found = all.find(
          (b) => b.token.toUpperCase() === currentToken || b.id.toUpperCase() === currentToken
        );
        if (found) {
          setSelectedBooking(found);
          return;
        }
      }

      // 2. Check URL searchParams for requested token
      const requestedToken = (searchParamsRef.current.get('token') || searchParamsRef.current.get('id') || '').trim().toUpperCase();
      if (requestedToken) {
        const found = all.find(
          (b) => b.token.toUpperCase() === requestedToken || b.id.toUpperCase() === requestedToken
        );
        if (found) {
          selectedBookingTokenRef.current = found.token;
          setSelectedBooking(found);
          return;
        }
      }

      // 3. Fall back to current active booking or first booking
      const active = await bookingService.getCurrentBooking();
      if (active) {
        const matched = all.find((b) => b.id === active.id || b.token === active.token) || active;
        selectedBookingTokenRef.current = matched.token;
        setSelectedBooking(matched);
      } else {
        selectedBookingTokenRef.current = all[0].token;
        setSelectedBooking(all[0]);
      }
    } catch (err) {
      console.warn('Failed to load bookings in TrackToken:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchAllBookings(false);
  }, [fetchAllBookings, user?.id]);

  // Unified single-source telemetry loader whenever selectedBooking changes
  React.useEffect(() => {
    if (!selectedBooking) {
      setBookingTelemetry(null);
      setIsSwitchingBooking(false);
      return;
    }

    const currentSeq = ++switchSeqRef.current;
    let isCancelled = false;

    queueService.getFarmerLiveTelemetry(selectedBooking)
      .then((tel) => {
        if (!isCancelled && currentSeq === switchSeqRef.current) {
          setBookingTelemetry(tel);
          setIsSwitchingBooking(false);
        }
      })
      .catch((err) => {
        console.warn('Telemetry load warning:', err);
        if (!isCancelled && currentSeq === switchSeqRef.current) {
          setIsSwitchingBooking(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedBooking?.id, selectedBooking?.token]);

  // Handle switching booking cleanly with no race conditions or UI alternating
  const handleSelectBooking = React.useCallback((b: ProcurementBooking) => {
    if (!b) return;
    if (selectedBooking && (b.id === selectedBooking.id || b.token === selectedBooking.token) && !isSwitchingBooking) {
      return;
    }

    selectedBookingTokenRef.current = b.token;

    // 1. Immediately hide previous booking's telemetry and show transition skeleton
    setIsSwitchingBooking(true);
    setBookingTelemetry(null);
    setSelectedBooking(b);

    // 2. Keep URL in sync without triggering a re-fetch loop
    setSearchParams({ token: b.token }, { replace: true });
  }, [selectedBooking, isSwitchingBooking, setSearchParams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllBookings(true);
    if (selectedBooking) {
      try {
        const tel = await queueService.getFarmerLiveTelemetry(selectedBooking);
        setBookingTelemetry(tel);
      } catch (e) {
        console.warn('Failed to refresh telemetry:', e);
      } finally {
        setIsSwitchingBooking(false);
      }
    }
    setIsRefreshing(false);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // First check in already loaded bookings
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
        if (user?.id && fetched.farmerId && fetched.farmerId !== user.id) {
          setSearchError('This procurement booking is registered under a different farmer account.');
          return;
        }
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
            defaultValue: `No booking matches token "${clean}". Please verify your token or check your registered appointments.`
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
                  'You do not currently have a scheduled or active foodgrain slot to track. Book a procurement slot to obtain an ingress token.'
              })}
            </p>
          </div>

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
    <div className="space-y-5 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{t('bookSlot.statusBooked', 'Procurement Token Active')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('trackToken.title', 'Live Queue & Token Status')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('trackToken.subtitle', 'Dynamic gate ingress & weighbridge queue telemetry for Token')}{' '}
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {selectedBooking?.token || ''}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="gap-1.5 text-xs h-8 sm:h-9"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('dashboard.retry', 'Refresh')}</span>
          </Button>
          <Link to="/farmer/booking">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs h-8 sm:h-9">
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>{t('dashboard.bookAnother', 'Book Slot')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* COMPACT MULTI-BOOKING SELECTOR */}
      {bookings.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold text-xs shrink-0">
            <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('trackToken.switchBooking', { count: bookings.length, defaultValue: `Switch Booking (${bookings.length}):` })}</span>
          </div>
          <div className="flex-1 w-full sm:max-w-md">
            <select
              value={selectedBooking?.id || selectedBooking?.token || ''}
              disabled={isSwitchingBooking}
              onChange={(e) => {
                const b = bookings.find((item) => item.id === e.target.value || item.token === e.target.value);
                if (b) handleSelectBooking(b);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:opacity-60"
              aria-label="Select booking to track"
            >
              {bookings.map((b) => (
                <option key={b.id || b.token} value={b.id || b.token}>
                  {b.token} — {b.cropName} ({b.quantityQuintals} Quintals) • {b.slotDate} [{b.bookingStatus?.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* PRIMARY LIVE QUEUE INTELLIGENCE CARD OR TRANSITION SKELETON */}
      <div>
        {selectedBooking ? (
          isSwitchingBooking ? (
            /* Transition loading skeleton matching exact card geometry to prevent layout shift */
            <div className="bg-white dark:bg-neutral-950 rounded-2xl border-2 border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-pulse">
              {/* Header Bar */}
              <div className="bg-slate-900 dark:bg-black text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 dark:border-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {t('dashboard.centre', 'Procurement Center')}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-neutral-400 font-medium">
                      {t('trackToken.slotArrivalWindow', 'Slot Arrival Window')}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      {selectedBooking.slotStartTime || '08:00'} – {selectedBooking.slotEndTime || '10:00'} &bull; {selectedBooking.slotDate || selectedBooking.bookingDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-emerald-400 border border-slate-700/80 text-xs font-semibold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>{t('trackToken.loadingTelemetry', 'Loading Telemetry...')}</span>
                  </div>
                </div>
              </div>

              {/* Main Stats Skeleton Grid */}
              <div className="p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold">
                      {t('trackToken.activeTokenTelemetry', 'Active Token Telemetry')}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                      <span>{selectedBooking.token}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-sans">
                        {selectedBooking.cropName} • {selectedBooking.quantityQuintals} Q
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    {t('trackToken.centreLabel', 'Centre')}: <span className="font-semibold text-slate-800 dark:text-neutral-200">{selectedBooking.centreName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Position */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 space-y-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                    <div className="h-7 w-12 bg-slate-300 dark:bg-neutral-700 rounded"></div>
                    <div className="h-2 w-20 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  </div>
                  {/* Farmers Ahead */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 space-y-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                    <div className="h-7 w-10 bg-slate-300 dark:bg-neutral-700 rounded"></div>
                    <div className="h-2 w-24 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  </div>
                  {/* Estimated Wait */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 space-y-2">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                    <div className="h-7 w-20 bg-slate-300 dark:bg-neutral-700 rounded"></div>
                    <div className="h-2 w-16 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  </div>
                  {/* Centre Status */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 space-y-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                    <div className="h-7 w-16 bg-slate-300 dark:bg-neutral-700 rounded"></div>
                    <div className="h-2 w-20 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  </div>
                </div>

                {/* Queue Process Tracker Skeleton */}
                <div className="pt-2 space-y-2">
                  <div className="h-3 w-40 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-14 w-full bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800"></div>
                </div>
              </div>
            </div>
          ) : (
            <LiveQueueIntelligenceCard
              key={selectedBooking.id || selectedBooking.token}
              booking={selectedBooking}
              initialTelemetry={bookingTelemetry}
              onBookingUpdated={() => fetchAllBookings(true)}
            />
          )
        ) : (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center text-sm text-slate-500">
            {t('trackToken.selectBookingPrompt', 'Please select a booking above to view live queue intelligence.')}
          </div>
        )}
      </div>

      {/* COMPACT OPTIONAL SEARCH BAR */}
      <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('trackToken.trackAnotherTitle', 'Track Another Booking Token')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              {t('trackToken.trackAnotherDesc', 'Have another token receipt? Enter the 6-character token code to view its queue status.')}
            </p>
          </div>
          <form onSubmit={handleManualSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('trackToken.trackAnotherPlaceholder', 'e.g. SP7K4Q')}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-full sm:w-36"
            />
            <Button type="submit" variant="primary" size="sm" isLoading={isSearching} className="gap-1 text-xs shrink-0">
              <Search className="h-3 w-3" />
              <span>{t('trackToken.trackBtn', 'Track')}</span>
            </Button>
          </form>
        </div>
        {searchError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{searchError}</span>
          </p>
        )}
      </div>
    </div>
  );
};
