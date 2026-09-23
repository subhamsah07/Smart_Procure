import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  CalendarPlus,
  Compass,
  ArrowRight,
  Loader2,
  RefreshCw,
  TrendingUp,
  Tag,
  XCircle,
  Leaf,
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FarmerProfile, ProcurementBooking, ProcurementWorkflowStatus } from '../../types';
import { farmerService } from '../../services/farmerService';
import { bookingService } from '../../services/bookingService';
import { queueService, FarmerLiveTelemetry } from '../../services/queueService';
import { paymentService, PaymentRecord } from '../../services/paymentService';
import { procurementService, ProcurementRequestDetails } from '../../services/procurementService';
import { notificationService } from '../../services/notificationService';
import { cropService, StateCropPrice } from '../../services/cropService';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { deriveVerificationCode, isValidUuid } from '../../lib/utils';

export const FarmerDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { profile: authProfile, user } = useAuth();
  const [, setLangVersion] = React.useState(i18n.language);

  React.useEffect(() => {
    const onLang = (lng: string) => setLangVersion(lng);
    i18n.on('languageChanged', onLang);
    return () => {
      i18n.off('languageChanged', onLang);
    };
  }, [i18n]);

  // Profile & Booking State
  const [farmerProfile, setFarmerProfile] = React.useState<FarmerProfile | null>(null);
  const [booking, setBooking] = React.useState<ProcurementBooking | null>(null);
  const [allBookings, setAllBookings] = React.useState<ProcurementBooking[]>([]);
  const [isLoadingBooking, setIsLoadingBooking] = React.useState<boolean>(true);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  // Live Telemetry & Queue State
  const [telemetry, setTelemetry] = React.useState<FarmerLiveTelemetry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);

  // Payment & Procurement Details State
  const [payment, setPayment] = React.useState<PaymentRecord | null>(null);
  const [procurementRequest, setProcurementRequest] = React.useState<ProcurementRequestDetails | null>(null);

  // Live Crop MSP Rate State
  const [liveCropRate, setLiveCropRate] = React.useState<number | null>(null);
  const [stateMspPrices, setStateMspPrices] = React.useState<StateCropPrice[]>([]);

  // Token copy feedback
  const [tokenCopied, setTokenCopied] = React.useState(false);

  // 1. Fetch updated farmer profile
  React.useEffect(() => {
    let active = true;
    async function fetchProfile() {
      try {
        const p = await farmerService.getProfile();
        if (active && p) {
          setFarmerProfile(p);
        }
      } catch (err) {
        console.warn('Could not fetch fresh profile in Dashboard:', err);
      }
    }
    fetchProfile();
    return () => {
      active = false;
    };
  }, [authProfile]);

  // Farmer display name
  const farmerName =
    farmerProfile?.fullName ||
    authProfile?.fullName ||
    (user?.user_metadata?.fullName as string) ||
    'Farmer';

  // Time-based greeting (Morning < 12:00, Afternoon 12:00-17:00, Evening >= 17:00)
  const greetingText = React.useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return t('dashboard.goodMorning', 'Good Morning');
    }
    if (currentHour >= 12 && currentHour < 17) {
      return t('dashboard.goodAfternoon', 'Good Afternoon');
    }
    return t('dashboard.goodEvening', 'Good Evening');
  }, [t, i18n.language]);

  // 2. Load active booking with fallback to latest booking
  const loadActiveBooking = React.useCallback(async () => {
    setIsLoadingBooking(true);
    setBookingError(null);
    try {
      const all = await bookingService.getMyBookings();
      setAllBookings(all);
      const current = await bookingService.getCurrentBooking();
      if (current) {
        setBooking(current);
      } else if (all && all.length > 0) {
        setBooking(all[0]);
      } else {
        setBooking(null);
      }
    } catch (err) {
      console.warn('Could not load current booking:', err);
      setBookingError('Unable to load your procurement status.');
    } finally {
      setIsLoadingBooking(false);
    }
  }, []);

  React.useEffect(() => {
    loadActiveBooking();
  }, [loadActiveBooking, user?.id]);

  // Dynamic Crop MSP Rate & State Schedule sync
  const farmerState = (farmerProfile?.state || authProfile?.state || (user?.user_metadata?.state as string) || 'Punjab') as any;

  React.useEffect(() => {
    let active = true;

    const fetchMspSchedule = async () => {
      try {
        const prices = await cropService.getActivePricesForState(farmerState);
        if (active) setStateMspPrices(prices);
        if (booking?.cropName) {
          const rate = await cropService.getCropPriceByState(booking.cropName as any, farmerState);
          if (active) setLiveCropRate(rate);
        }
      } catch (err) {
        console.warn('Error fetching crop pricing in FarmerDashboard:', err);
      }
    };

    fetchMspSchedule();

    const handlePriceUpdated = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.state.toLowerCase() === String(farmerState).toLowerCase()) {
        if (booking?.cropName && detail.cropName.toLowerCase() === booking.cropName.toLowerCase()) {
          setLiveCropRate(detail.newPrice);
        }
        cropService.getActivePricesForState(farmerState).then((p) => {
          if (active) setStateMspPrices(p);
        });
      }
    };

    window.addEventListener('smartprocure_price_updated', handlePriceUpdated);
    return () => {
      active = false;
      window.removeEventListener('smartprocure_price_updated', handlePriceUpdated);
    };
  }, [farmerState, booking?.cropName]);

  // 3. Stable references for subscription lifecycle
  const centreId = booking?.centreId;
  const bookingId = booking?.id;
  const farmerId = user?.id;

  const bookingRef = React.useRef<ProcurementBooking | null>(booking);
  bookingRef.current = booking;

  // 4. Initial load of telemetry, payment, and procurement details when booking changes
  React.useEffect(() => {
    if (!booking) {
      setTelemetry(null);
      setPayment(null);
      setProcurementRequest(null);
      return;
    }

    let active = true;
    Promise.all([
      queueService.getFarmerLiveTelemetry(booking),
      paymentService.getPaymentForBooking(booking.id),
      procurementService.getRequestByBookingId(booking.id),
    ])
      .then(([tel, pay, pr]) => {
        if (!active) return;
        setTelemetry(tel);
        setPayment(pay);
        setProcurementRequest(pr);

        // Real notification if payment is completed
        if (pay && pay.paymentStatus === 'completed' && farmerId && booking.id) {
          notificationService.createNotification({
            farmerId,
            bookingId: booking.id,
            type: 'payment',
            title: 'Payment Completed',
            message: `Your payment of ₹${pay.amount.toLocaleString('en-IN')} has been successfully disbursed via Direct Benefit Transfer (DBT).`,
          });
        }
        // Real notification if procurement is completed
        if ((tel?.status === 'COMPLETED' || booking.bookingStatus === 'completed' || booking.workflowStatus === 'PROCUREMENT_COMPLETED') && farmerId && booking.id) {
          notificationService.createNotification({
            farmerId,
            bookingId: booking.id,
            type: 'procurement',
            title: 'Procurement Completed',
            message: `Your procurement has been successfully completed.\n\nToken: ${booking.token}\nCentre: ${booking.centreName}\nCrop: ${booking.cropName}\nQuantity: ${booking.quantityQuintals} Quintal`,
          });
        }
        // Real notification if procurement is cancelled/failed
        if ((booking.bookingStatus === 'cancelled' || pr?.status === 'cancelled' || pr?.status === 'rejected') && farmerId && booking.id) {
          notificationService.createNotification({
            farmerId,
            bookingId: booking.id,
            type: 'procurement',
            title: 'Procurement Failed - Quality Not Approved',
            message: `Your procurement appointment for ${booking.cropName} (Token: ${booking.token}) at ${booking.centreName} has been cancelled because the produce did not meet mandatory Fair Average Quality (FAQ) standards.`,
          });
        }
      })
      .catch((err) => {
        console.warn('Error loading initial booking details:', err);
      });

    return () => {
      active = false;
    };
  }, [bookingId]);

  // 5. Supabase Realtime Subscription Lifecycle
  // Follows correct order:
  // 1. Create channel
  // 2. Register ALL postgres_changes listeners BEFORE calling subscribe()
  // 3. Call subscribe()
  // 4. Keep channel alive with stable dependency array [centreId, farmerId, bookingId]
  // 5. Cleanup on unmount with supabase.removeChannel
  // Realtime events update existing UI state directly without re-triggering subscription or full-page reload.
  React.useEffect(() => {
    if (!centreId) return;

    const handleRealtimeUpdate = async () => {
      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      try {
        const [freshTel, freshPay, freshPr] = await Promise.all([
          queueService.getFarmerLiveTelemetry(currentBooking),
          paymentService.getPaymentForBooking(currentBooking.id),
          procurementService.getRequestByBookingId(currentBooking.id),
        ]);

        setTelemetry(freshTel);
        if (freshPay) setPayment(freshPay);
        if (freshPr) setProcurementRequest(freshPr);

        // Check if booking status updated in database without resetting loading state
        if (isSupabaseConfigured() && currentBooking) {
          let bQuery = supabase.from('bookings').select('booking_status');
          if (isValidUuid(currentBooking.id)) {
            bQuery = bQuery.eq('id', currentBooking.id);
          } else if (currentBooking.token) {
            bQuery = bQuery.eq('token', currentBooking.token);
          } else {
            const cleanId = (currentBooking.id || '').trim();
            bQuery = bQuery.or(`token.ilike.${cleanId},qr_identifier.ilike.*${cleanId}*`);
          }

          const { data: bRow } = await bQuery.limit(1).maybeSingle();

          if (bRow) {
            setBooking((prev) => {
              if (!prev) return prev;
              const newWorkflowStatus = (bRow.booking_status?.toUpperCase() || 'BOOKED') as ProcurementWorkflowStatus;
              if (
                prev.bookingStatus !== bRow.booking_status ||
                prev.workflowStatus !== newWorkflowStatus
              ) {
                return {
                  ...prev,
                  bookingStatus: bRow.booking_status,
                  workflowStatus: newWorkflowStatus,
                };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Realtime update processing notice:', err);
      }
    };

    let channel: any = null;

    if (isSupabaseConfigured()) {
      // Step 1: Create channel with clean name
      channel = supabase.channel(`farmer-queue-${centreId}-${farmerId || 'anon'}`);

      // Step 2: Register ALL postgres_changes callbacks BEFORE calling subscribe()
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue_events',
            filter: `centre_id=eq.${centreId}`,
          },
          () => {
            handleRealtimeUpdate();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `centre_id=eq.${centreId}`,
          },
          () => {
            handleRealtimeUpdate();
          }
        );

      if (farmerId) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `farmer_id=eq.${farmerId}`,
          },
          () => {
            if (bookingRef.current?.id) {
              paymentService.getPaymentForBooking(bookingRef.current.id).then((p) => {
                if (p) {
                  setPayment(p);
                  if (p.paymentStatus === 'completed' && farmerId && bookingRef.current?.id) {
                    notificationService.createNotification({
                      farmerId,
                      bookingId: bookingRef.current.id,
                      type: 'payment',
                      title: 'Payment Completed',
                      message: `Your payment of ₹${p.amount.toLocaleString('en-IN')} has been successfully disbursed via Direct Benefit Transfer (DBT).`,
                    });
                  }
                }
              });
            }
          }
        );
      }

      if (bookingId) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'procurement_requests',
            filter: `booking_id=eq.${bookingId}`,
          },
          () => {
            if (bookingRef.current?.id) {
              procurementService.getRequestByBookingId(bookingRef.current.id).then((pr) => {
                if (pr) setProcurementRequest(pr);
              });
              paymentService.getPaymentForBooking(bookingRef.current.id).then((p) => {
                if (p) setPayment(p);
              });
            }
          }
        );
      }

      // Step 3: Call subscribe()
      channel.subscribe();
    }

    // Step 4: Also subscribe to local in-memory queue changes (for simulation / test fallback)
    const unsubLocal = queueService.subscribeToLocalEvents(centreId, () => {
      handleRealtimeUpdate();
    });

    // Step 5: Background interval check to ensure payment/procurement state from admin is synced
    const pollInterval = setInterval(() => {
      if (bookingRef.current?.id) {
        Promise.all([
          paymentService.getPaymentForBooking(bookingRef.current.id),
          procurementService.getRequestByBookingId(bookingRef.current.id),
        ])
          .then(([p, pr]) => {
            if (p) setPayment(p);
            if (pr) setProcurementRequest(pr);
          })
          .catch(() => {});
      }
    }, 5000);

    // Step 6: Clean up subscription on unmount or when centre/farmer ID changes
    return () => {
      clearInterval(pollInterval);
      if (channel && isSupabaseConfigured()) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* noop */
        }
      }
      if (unsubLocal) {
        unsubLocal();
      }
    };
  }, [centreId, farmerId, bookingId]);

  // 4. Elapsed timer when status is PROCESSING
  React.useEffect(() => {
    if (telemetry?.status !== 'PROCESSING') {
      setElapsedSeconds(0);
      return;
    }

    const startTs = telemetry.startedProcessingTime
      ? new Date(telemetry.startedProcessingTime).getTime()
      : Date.now() - (telemetry.elapsedMinutes || 0) * 60000;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry?.status, telemetry?.startedProcessingTime, telemetry?.elapsedMinutes]);

  const elapsedDisplay = React.useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }, [elapsedSeconds]);

  // Token copy handler
  const handleCopyToken = () => {
    if (!booking?.token) return;
    navigator.clipboard.writeText(booking.token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  // Appointment string formatting
  const appointmentFormatted = React.useMemo(() => {
    if (!booking) return '';
    try {
      let dateLabel = '';
      if (booking.slotDate) {
        const parts = booking.slotDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        }
      }
      const slotLabel =
        booking.slotName ||
        (booking.slotStartTime && booking.slotEndTime
          ? `${booking.slotStartTime.slice(0, 5)} - ${booking.slotEndTime.slice(0, 5)}`
          : 'Morning');
      return dateLabel ? `${dateLabel} · ${slotLabel}` : slotLabel;
    } catch {
      return booking.slotDate || 'Scheduled Window';
    }
  }, [booking]);

  // Effective Rate per Quintal (State MSP rate prioritized)
  const effectiveCropRate = liveCropRate || procurementRequest?.verifiedRate || procurementRequest?.configuredRate || booking?.ratePerQuintal || 2425;

  // Estimated crop price (simplified per Section 13: Estimated Price ₹XX,XXX)
  const estimatedPriceAmount = React.useMemo(() => {
    if (payment?.amount) return payment.amount;
    if (procurementRequest?.finalValue) return procurementRequest.finalValue;
    if (procurementRequest?.estimatedValue) return procurementRequest.estimatedValue;
    if (booking) {
      return booking.quantityQuintals * effectiveCropRate;
    }
    return 0;
  }, [payment, procurementRequest, booking, effectiveCropRate]);

  // QR Code value
  const qrValue = React.useMemo(() => {
    if (!booking) return '';
    return booking.opaqueQrIdentifier || booking.token || `SMARTPROCURE:${booking.id}`;
  }, [booking]);

  // Effective status
  const currentStatus = telemetry?.status || 'BOOKED';

  // Check if procurement has failed (e.g. quality check rejected/cancelled)
  const isProcurementFailed = React.useMemo(() => {
    return (
      booking?.bookingStatus === 'cancelled' ||
      booking?.bookingStatus === 'failed' ||
      (booking?.workflowStatus as string) === 'CANCELLED' ||
      (booking?.workflowStatus as string) === 'REJECTED' ||
      procurementRequest?.status === 'cancelled' ||
      procurementRequest?.status === 'rejected'
    );
  }, [booking?.bookingStatus, booking?.workflowStatus, procurementRequest?.status]);

  // 4-Stage Procurement Progress Milestones
  const workflowMilestones = React.useMemo(() => {
    if (isProcurementFailed) {
      return [
        {
          id: 1,
          title: t('dashboard.stepBooking', 'Booking Confirmed'),
          state: 'completed' as const,
        },
        {
          id: 2,
          title: t('dashboard.stepCheckin', 'Farmer Checked In'),
          state: 'completed' as const,
        },
        {
          id: 3,
          title: t('dashboard.stepQualityCheck', 'Quality Check'),
          state: 'completed' as const,
        },
        {
          id: 4,
          title: t('dashboard.stepQualityFailed', 'Procurement Failed (Quality Not Approved)'),
          state: 'failed' as const,
        },
      ];
    }

    const isCompleted = currentStatus === 'COMPLETED' || booking?.bookingStatus === 'completed';
    const isProcessing = currentStatus === 'PROCESSING';
    const isCheckedIn = currentStatus === 'WAITING' || currentStatus === 'CHECKED_IN' || isProcessing || isCompleted;

    return [
      {
        id: 1,
        title: t('dashboard.stepBooking', 'Booking Confirmed'),
        state: 'completed' as const,
      },
      {
        id: 2,
        title: t('dashboard.stepCheckin', 'Farmer Checked In'),
        state: isCheckedIn ? (isProcessing || isCompleted ? 'completed' : 'active') : ('pending' as const),
      },
      {
        id: 3,
        title: t('dashboard.stepProcessing', 'Procurement Processing'),
        state: isCompleted ? 'completed' : isProcessing ? 'active' : ('pending' as const),
      },
      {
        id: 4,
        title: t('dashboard.stepCompleted', 'Procurement Completed'),
        state: isCompleted ? 'completed' : ('pending' as const),
      },
    ];
  }, [isProcurementFailed, currentStatus, booking?.bookingStatus, t, i18n.language]);

  // Payment badge rendering - strictly synchronized with Admin completion state
  // If payment is completed by admin then show completed, otherwise show pending
  const paymentStatus: 'completed' | 'processing' | 'pending' | 'failed' = React.useMemo(() => {
    // 0. If procurement failed, payment is marked failed
    if (isProcurementFailed) {
      return 'failed';
    }
    // 1. Only completed if admin has completed the payment in the procurement workflow OR payment record is completed
    if (procurementRequest?.status === 'payment_completed' || payment?.paymentStatus === 'completed') {
      return 'completed';
    }
    // 2. Failed payment status
    if (payment?.paymentStatus === 'failed') {
      return 'failed';
    }
    // 3. Admin started payment processing
    if (procurementRequest?.status === 'payment_processing' || payment?.paymentStatus === 'processing') {
      return 'processing';
    }
    // 4. Default to pending if not completed by admin
    return 'pending';
  }, [isProcurementFailed, procurementRequest?.status, payment?.paymentStatus]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. GREETING */}
      <section className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/80 dark:border-emerald-800 mb-2">
            <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('dashboard.portalBadge', 'SmartProcure Farmer Portal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greetingText}, <span className="text-emerald-700 dark:text-emerald-400">{farmerName}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
            {t('dashboard.procurementStatusSubtitle', "Here's your procurement status.")}
          </p>
        </div>
      </section>

      {/* 2. LOADING STATE */}
      {isLoadingBooking && (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 rounded-2xl bg-slate-200 dark:bg-neutral-900" />
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-neutral-900" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-neutral-900" />
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!isLoadingBooking && bookingError && (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('dashboard.unableToLoad', 'Unable to load your procurement status.')}
          </p>
          <Button variant="outline" size="sm" onClick={loadActiveBooking} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('dashboard.retry', 'Retry')}</span>
          </Button>
        </div>
      )}

      {/* 4. EMPTY STATE (NO ACTIVE BOOKING) */}
      {!isLoadingBooking && !bookingError && !booking && (
        <div className="p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/60">
            <CalendarPlus className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('dashboard.noActiveBookingTitle', 'No Active Procurement Booking')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              {t('dashboard.noActiveBookingDesc', 'Book an appointment to start your procurement journey.')}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/farmer/booking">
              <Button variant="orange" size="md" className="font-semibold shadow-xs gap-2">
                <CalendarPlus className="h-4 w-4" />
                <span>{t('dashboard.bookAppointment', 'Book Appointment')}</span>
              </Button>
            </Link>
            <Link to="/farmer/centres">
              <Button variant="outline" size="md" className="font-semibold gap-2">
                <Compass className="h-4 w-4" />
                <span>{t('dashboard.findCentre', 'Find Procurement Centre')}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 5. CURRENT BOOKING (TOKEN + QR + DETAILS) */}
      {!isLoadingBooking && !bookingError && booking && (
        <>
          {/* Multiple Bookings Switcher Banner */}
          {allBookings.length > 1 && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {t('dashboard.multipleBookings', 'Multiple Bookings Available')} ({allBookings.length})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  You have {allBookings.length} procurement appointments. Switch below to view details, or track all tokens together in Track Token.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {allBookings.map((b) => {
                    const isSelected = booking?.id === b.id || booking?.token === b.token;
                    return (
                      <button
                        key={b.id || b.token}
                        type="button"
                        onClick={() => setBooking(b)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 hover:border-emerald-400'
                        }`}
                      >
                        <span className="font-mono font-bold">{b.token}</span>
                        <span className="opacity-80">• {b.cropName}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Link to="/farmer/token" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold bg-white dark:bg-neutral-900 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-neutral-800">
                  <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('dashboard.viewAllInTrackToken', 'Track All in Track Token')} ({allBookings.length})</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}

          {/* Card: Current Booking */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('dashboard.currentBooking', 'CURRENT BOOKING')}
              </span>
              {isProcurementFailed ? (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  {t('dashboard.failedQuality', 'Failed (Quality Not Approved)')}
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                  {booking.bookingStatus === 'completed'
                    ? t('dashboard.completed', 'Completed')
                    : t('dashboard.confirmed', 'Confirmed')}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Booking Key Information */}
              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 block">{t('dashboard.crop', 'Crop')}</span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {booking.cropName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Tag className="w-3 h-3" />
                      ₹{effectiveCropRate.toLocaleString('en-IN')} {t('bookSlot.perQtl', '/ Q')} (MSP)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-neutral-400 block">{t('dashboard.quantity', 'Quantity')}</span>
                    <span className="font-bold text-slate-800 dark:text-neutral-200">
                      {booking.quantityQuintals} {t('common.quintal', 'Quintal')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-neutral-400 block">{t('dashboard.appointment', 'Appointment')}</span>
                    <span className="font-bold text-slate-800 dark:text-neutral-200">
                      {appointmentFormatted}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 block">{t('dashboard.centre', 'Centre')}</span>
                    <span className="font-bold text-slate-800 dark:text-neutral-200 truncate block">
                      {booking.centreName}
                    </span>
                  </div>
                  {/* Simplified Estimated Price (Section 13) */}
                  <div className="sm:col-span-2 pt-1 border-t border-slate-100 dark:border-neutral-800">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 block">
                      {t('dashboard.estimatedPrice', 'Estimated Price')}
                    </span>
                    <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                      <span className="text-lg sm:text-xl font-black text-orange-500 block">
                        ₹{estimatedPriceAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                        ({booking.quantityQuintals} {t('common.quintal', 'Quintal')} × ₹{effectiveCropRate.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token + PIN + QR Code Container */}
              <div className="flex flex-row flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-center md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-neutral-800">
                {/* Compact Professional Token */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-100 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 min-w-[110px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    {t('dashboard.token', 'TOKEN')}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-slate-900 dark:text-white mt-0.5">
                    {booking.token || '---'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">{t('dashboard.copied', 'Copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{t('dashboard.copy', 'Copy')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 6-Digit Verification PIN */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 min-w-[110px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {t('dashboard.pin', '6-DIGIT PIN')}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-900 dark:text-amber-200 mt-0.5 select-all">
                    {booking.verificationCode || deriveVerificationCode(booking.token, booking.opaqueQrIdentifier)}
                  </span>
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 mt-1">
                    {t('dashboard.entryPin', 'Entry PIN')}
                  </span>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 shadow-2xs">
                  <div className="p-1 bg-white rounded-lg">
                    <QRCodeSVG value={qrValue} size={90} level="M" />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-neutral-400 mt-1">
                    {t('dashboard.entryQr', 'Entry QR')}
                  </span>
                </div>
              </div>
            </div>

            {/* STATE: CANCELLED / FAILED DUE TO QUALITY NOT APPROVED */}
            {isProcurementFailed && (
              <div className="mt-4 p-4 sm:p-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-900 dark:text-rose-100">
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{t('dashboard.procurementCancelledQualityTitle', 'Procurement Cancelled — Crop Quality Not Approved')}</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  {t('dashboard.procurementCancelledQualityDesc', {
                    crop: booking.cropName,
                    token: booking.token,
                    centre: booking.centreName,
                    defaultValue: `Your procurement appointment for ${booking.cropName} (Token: ${booking.token}) at ${booking.centreName} has been cancelled because the produce did not pass the mandatory Fair Average Quality (FAQ) standards during physical inspection.`
                  })}
                </p>
                <div className="pt-2 text-xs text-rose-800 dark:text-rose-300 border-t border-rose-200/80 dark:border-rose-800/80 flex items-center justify-between">
                  <span>{t('dashboard.status', 'Status')}: <strong className="uppercase">{t('dashboard.failed', 'Failed')}</strong></span>
                  <span className="font-medium text-[11px]">{t('dashboard.noticeDelivered', 'Notice delivered to your account')}</span>
                </div>
              </div>
            )}
          </div>

          {/* 6. LIVE QUEUE / CURRENT STATUS */}
          {/* STATE: PROCESSING NOW (Section 9) */}
          {currentStatus === 'PROCESSING' && (
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/25 p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-200">
                    {t('dashboard.processingNow', '🟢 Processing Now')}
                  </h3>
                </div>
                {elapsedDisplay && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white dark:bg-neutral-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {t('dashboard.elapsed', 'Elapsed')}: {elapsedDisplay}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-neutral-300">
                {t('dashboard.processingDesc', 'Your procurement is currently being processed.')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-emerald-200/60 dark:border-emerald-900/60">
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.token', 'Token')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.token}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.centre', 'Centre')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">{booking.centreName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.crop', 'Crop')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.cropName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.quantity', 'Quantity')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.quantityQuintals} {t('common.quintal', 'Quintal')}</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE: COMPLETED (Section 11) */}
          {currentStatus === 'COMPLETED' && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t('dashboard.procurementCompleted', '✓ Procurement Completed')}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">
                {t('dashboard.procurementIntakeCompletedDesc', 'Your procurement intake and weighbridge verification have been completed.')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-neutral-800">
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.token', 'Token')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.token}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.centre', 'Centre')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">{booking.centreName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.crop', 'Crop')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.cropName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block">{t('dashboard.quantity', 'Quantity')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.quantityQuintals} {t('common.quintal', 'Quintal')}</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE: WAITING / CHECKED IN (Section 7 & 10) */}
          {(currentStatus === 'WAITING' || currentStatus === 'CHECKED_IN') && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 space-y-4 shadow-xs">
              {/* Centre Delay Alert (Section 10) */}
              {telemetry?.activeDelay?.isActive && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {t('dashboard.centreDelaysTitle', '⚠️ Centre experiencing delays')}
                    </span>
                    <span className="text-amber-800 dark:text-amber-300">
                      {t('dashboard.centreDelaysDesc', 'Your estimated waiting time has been updated.')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('dashboard.liveQueue', 'LIVE QUEUE')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {t('dashboard.waiting', 'WAITING')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
                    {t('dashboard.position', 'Position')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    #{telemetry?.position ?? 1}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
                    {t('dashboard.farmersAhead', 'Farmers Ahead')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {telemetry?.farmersAhead ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
                    {t('dashboard.estimatedWait', 'Estimated Wait')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {telemetry?.formattedWaitTime || '~35 min'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">
                    {t('dashboard.centre', 'Centre')}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-1">
                    {telemetry?.centreName || booking.centreName}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-neutral-400 text-right pt-1">
                {t('dashboard.lastUpdated', 'Last Updated')}:{' '}
                {telemetry?.lastUpdated
                  ? new Date(telemetry.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : t('dashboard.justNow', 'Just now')}
              </div>
            </div>
          )}

          {/* STATE: BEFORE CHECK-IN (Section 8) */}
          {currentStatus === 'BOOKED' && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('dashboard.liveQueue', 'LIVE QUEUE')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                  {t('dashboard.awaitingArrival', 'Awaiting Check-in')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-neutral-800 text-center space-y-2">
                <Clock className="h-6 w-6 text-slate-400 dark:text-neutral-500 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-neutral-300 max-w-md mx-auto">
                  {t(
                    'dashboard.notCheckedInNotice',
                    'Your queue position will appear after check-in at the procurement centre.'
                  )}
                </p>
                {booking.slotStartTime && booking.slotEndTime && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    <span>
                      {t('dashboard.arrivalWindow', 'Arrival Window')}: {booking.slotStartTime.slice(0, 5)} –{' '}
                      {booking.slotEndTime.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. PROCUREMENT STATUS (Milestones) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
              {t('dashboard.procurementStatus', 'PROCUREMENT STATUS')}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {workflowMilestones.map((step, idx) => {
                const isCompleted = step.state === 'completed';
                const isActive = step.state === 'active';
                const isFailed = (step.state as string) === 'failed';

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isFailed
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30'
                        : isCompleted
                        ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : isActive
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-400 dark:ring-blue-600'
                        : 'border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isFailed ? (
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-neutral-600 shrink-0" />
                      )}
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500">
                        {t('dashboard.step', 'Step')} {idx + 1}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold block ${
                        isFailed
                          ? 'text-rose-900 dark:text-rose-200'
                          : isCompleted
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : isActive
                          ? 'text-blue-900 dark:text-blue-200'
                          : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. PAYMENT STATUS (Section 12) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('dashboard.paymentStatus', 'PAYMENT STATUS')}
              </span>
              {/* Simple status badge */}
              {paymentStatus === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{t('dashboard.completed', 'Completed')}</span>
                </span>
              )}
              {paymentStatus === 'processing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>{t('dashboard.processing', 'Processing')}</span>
                </span>
              )}
              {paymentStatus === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{t('dashboard.pending', 'Pending')}</span>
                </span>
              )}
              {paymentStatus === 'failed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>{t('dashboard.failed', 'Failed')}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-1">
              <div>
                <span className="text-xs text-slate-500 dark:text-neutral-400 block">
                  {t('dashboard.amount', 'Amount')}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  ₹{estimatedPriceAmount.toLocaleString('en-IN')}
                </span>
              </div>
              {paymentStatus === 'completed' && (payment?.paymentReference || booking?.paymentReferenceId || procurementRequest?.id) && (
                <div className="text-xs text-slate-500 dark:text-neutral-400 sm:text-right">
                  <span>{t('dashboard.reference', 'Reference')}: </span>
                  <span className="font-mono text-slate-700 dark:text-neutral-300">
                    {payment?.paymentReference || booking?.paymentReferenceId || `DBT-MSP-${(procurementRequest?.id || booking?.id || '').slice(-8)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 9. SMALL QUICK ACTIONS (Section 14) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Link to="/farmer/booking" className="flex-1">
              <Button
                variant="orange"
                className="w-full font-semibold py-2.5 rounded-xl shadow-xs gap-2 justify-center"
              >
                <CalendarPlus className="h-4 w-4" />
                <span>{t('dashboard.bookAppointment', 'Book Appointment')}</span>
              </Button>
            </Link>
            <Link to="/farmer/centres" className="flex-1">
              <Button
                variant="outline"
                className="w-full font-semibold py-2.5 rounded-xl gap-2 justify-center"
              >
                <Compass className="h-4 w-4" />
                <span>{t('dashboard.findCentre', 'Find Procurement Centre')}</span>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
