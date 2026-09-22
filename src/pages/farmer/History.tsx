import * as React from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Download, CheckCircle2, CalendarPlus, Loader2, Calendar, MapPin, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { bookingService } from '../../services/bookingService';
import { ProcurementBooking } from '../../types';
import { formatCurrencyINR, formatQuantityQuintals } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export const ProcurementHistory: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = React.useState<ProcurementBooking[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let active = true;
    async function loadHistory() {
      setIsLoading(true);
      try {
        const items = await bookingService.getBookingHistory();
        if (active) {
          setHistoryItems(items);
        }
      } catch (err) {
        console.warn('Failed to fetch booking history:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'BOOKED':
        return <Badge variant="info">{t('bookSlot.statusBooked', 'Booked')}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">{t('dashboard.confirmed', 'Confirmed')}</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">{t('dashboard.processing', 'In Progress')}</Badge>;
      case 'COMPLETED':
      case 'PAYMENT_PROCESSED':
        return <Badge variant="success">{t('dashboard.completed', 'Completed')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">{t('dashboard.failed', 'Cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status || 'Booked'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('history.title', 'Procurement & Booking History')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('history.subtitle', 'Verified electronic records, scheduled slot tokens, and MSP procurement entries')}
          </p>
        </div>

        <Link to="/farmer/booking">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
            <CalendarPlus className="h-4 w-4" />
            <span>{t('history.bookNewSlot', 'Book New Slot')}</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            {t('history.loadingRecords', 'Loading your official procurement records from database...')}
          </p>
        </div>
      ) : historyItems.length === 0 ? (
        /* CLEAN EMPTY STATE */
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500">
            <HistoryIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {t('history.noHistoryTitle', 'No booking history yet')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md">
              {t(
                'history.noHistoryDesc',
                'You do not have any recorded procurement bookings in the central system yet. Schedule a slot to begin government mandi procurement.'
              )}
            </p>
          </div>
          <Link to="/farmer/booking">
            <Button variant="primary" size="md" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span>{t('history.bookSlotCta', 'Book a Procurement Slot')}</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <Card key={item.id} className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm overflow-hidden">
              <div className="bg-black text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {t('history.tokenLabel', 'TOKEN')}: {item.token}
                  </span>
                  <span className="font-semibold text-neutral-300">
                    {t('history.createdLabel', 'Created')}: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.workflowStatus)}
                </div>
              </div>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('history.procuredCrop', 'Procured Crop')}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      {item.cropName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('history.slotDate', 'Slot Date')}: {item.bookingDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('history.quantity', 'Quantity')}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      {formatQuantityQuintals(item.quantityQuintals)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('history.declaredLot', 'Declared Lot')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('history.govtMspRate', 'Government MSP Rate')}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      ₹{item.ratePerQuintal} / Q
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('history.benchmarkMsp', 'Benchmark MSP')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      {t('history.estimatedValue', 'Estimated Value')}
                    </span>
                    <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 block mt-0.5">
                      {formatCurrencyINR(item.estimatedValue)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('history.certifiedUpon', 'Certified upon weighbridge')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    {t('history.centre', 'Centre')}: <strong className="text-slate-800 dark:text-slate-200">{item.centreName}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('history.slot', 'Slot')}: <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">{item.assignedSlotTime}</strong> ({item.assignedDate || item.bookingDate})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
