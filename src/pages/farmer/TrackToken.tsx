import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  CalendarPlus,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { bookingService } from '../../services/bookingService';
import { ProcurementBooking } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { LiveQueueIntelligenceCard } from '../../components/farmer/LiveQueueIntelligenceCard';

export const TrackToken: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [booking, setBooking] = React.useState<ProcurementBooking | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchActiveBooking = React.useCallback(async () => {
    try {
      const active = await bookingService.getCurrentBooking();
      setBooking(active);
    } catch (err) {
      console.warn('Failed to load active booking in TrackToken:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchActiveBooking();
  }, [fetchActiveBooking, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveBooking();
    setIsRefreshing(false);
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

  if (!booking) {
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
              {t(
                'trackToken.tokenNotFoundDesc',
                {
                  token: 'active',
                  defaultValue: 'You do not currently have a scheduled or active foodgrain slot to track. Book a procurement slot to obtain an ingress token.'
                }
              )}
            </p>
          </div>
          <Link to="/farmer/booking">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>{t('bookSlot.statusBooked', 'Procurement Token Active')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('trackToken.title', 'Live Queue & Token Status')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('trackToken.subtitle', 'Dynamic gate ingress & weighbridge queue telemetry for Token')} {booking.token}
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
        </div>
      </div>

      {/* CORE LIVE QUEUE INTELLIGENCE CARD */}
      <LiveQueueIntelligenceCard
        booking={booking}
        onBookingUpdated={fetchActiveBooking}
      />
    </div>
  );
};
