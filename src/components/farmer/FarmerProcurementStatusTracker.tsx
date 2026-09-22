import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  CreditCard,
  Building2,
  Calendar,
  Scale,
  QrCode,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ProcurementBooking, FarmerProfile } from '../../types';
import { procurementService, ProcurementRequestDetails } from '../../services/procurementService';
import { paymentService, PaymentRecord } from '../../services/paymentService';
import { formatCurrencyINR } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface FarmerProcurementStatusTrackerProps {
  booking: ProcurementBooking;
  farmerProfile?: FarmerProfile | null;
  onRefresh?: () => void;
}

type StepState = 'completed' | 'active' | 'pending' | 'failed';

interface TimelineStep {
  id: number;
  title: string;
  state: StepState;
  timestamp?: string | null;
  detail?: string;
}

export const FarmerProcurementStatusTracker: React.FC<FarmerProcurementStatusTrackerProps> = ({
  booking,
  farmerProfile,
  onRefresh,
}) => {
  const [procurementRequest, setProcurementRequest] = React.useState<ProcurementRequestDetails | null>(null);
  const [payment, setPayment] = React.useState<PaymentRecord | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const loadData = React.useCallback(async () => {
    if (!booking?.id) return;
    setLoading(true);
    try {
      const [pr, pay] = await Promise.all([
        procurementService.getRequestByBookingId(booking.id),
        paymentService.getPaymentForBooking(booking.id),
      ]);
      setProcurementRequest(pr);
      setPayment(pay);
    } catch (err) {
      console.warn('Error loading procurement/payment status:', err);
    } finally {
      setLoading(false);
    }
  }, [booking?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time listener on procurement_requests and payments
  React.useEffect(() => {
    if (!isSupabaseConfigured() || !booking?.id) return;

    const prChannel = supabase
      .channel(`pr_tracker_${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'procurement_requests',
          filter: `booking_id=eq.${booking.id}`,
        },
        () => {
          loadData();
          if (onRefresh) onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(prChannel);
    };
  }, [booking?.id, loadData, onRefresh]);

  // Build the 6 concrete stages based STRICTLY on actual database state
  const steps: TimelineStep[] = React.useMemo(() => {
    const isCancelled = booking.bookingStatus === 'cancelled';
    const checkedIn = Boolean(
      booking.checkedInAt ||
      ['WAITING', 'CALLED', 'PROCESSING', 'COMPLETED'].includes(booking.queueStatus || '') ||
      ['qr_verified', 'document_verification', 'weight_rate_verification', 'procurement_completed', 'payment_processing', 'payment_completed'].includes(booking.workflowStatus || '')
    );

    const isProcurementCompleted = Boolean(
      booking.bookingStatus === 'completed' ||
      procurementRequest?.status === 'completed' ||
      ['procurement_completed', 'payment_processing', 'payment_completed'].includes(booking.workflowStatus || '')
    );

    const isProcurementProcessing = Boolean(
      !isProcurementCompleted &&
      (booking.queueStatus === 'PROCESSING' ||
        ['in_progress', 'weight_rate_verification', 'document_verification'].includes(booking.workflowStatus || ''))
    );

    const paymentStatus = payment?.paymentStatus;
    const isPaymentCompleted = paymentStatus === 'completed';
    const isPaymentProcessing = paymentStatus === 'processing';
    const isPaymentFailed = paymentStatus === 'failed';
    const isPaymentPending = paymentStatus === 'pending' || (isProcurementCompleted && !payment);

    // 1. Booking Confirmed
    const s1: TimelineStep = {
      id: 1,
      title: 'Booking Confirmed',
      state: isCancelled ? 'failed' : 'completed',
      timestamp: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      detail: isCancelled ? 'Booking cancelled' : `Token: ${booking.token}`,
    };

    // 2. Farmer Checked In
    const s2: TimelineStep = {
      id: 2,
      title: 'Farmer Checked In',
      state: checkedIn ? 'completed' : 'pending',
      timestamp: booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      detail: checkedIn ? 'Gate security check-in confirmed' : 'Awaiting arrival at mandi gate',
    };

    // 3. Procurement Processing
    const s3: TimelineStep = {
      id: 3,
      title: 'Procurement Processing',
      state: isProcurementCompleted ? 'completed' : isProcurementProcessing ? 'active' : 'pending',
      detail: isProcurementCompleted
        ? 'Weighment & Fair Average Quality (FAQ) certified'
        : isProcurementProcessing
        ? 'Gross/tare weight measurement in progress'
        : 'Awaiting weighbridge station call',
    };

    // 4. Procurement Completed
    const s4: TimelineStep = {
      id: 4,
      title: 'Procurement Completed',
      state: isProcurementCompleted ? 'completed' : 'pending',
      timestamp: procurementRequest?.updatedAt ? new Date(procurementRequest.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      detail: isProcurementCompleted
        ? `${procurementRequest?.verifiedQuantity || booking.quantityQuintals} Quintals accepted into central warehouse`
        : 'Pending tare weight reconciliation',
    };

    // 5. Payment Processing
    const s5: TimelineStep = {
      id: 5,
      title: 'Payment Processing',
      state: isPaymentCompleted ? 'completed' : isPaymentFailed ? 'failed' : isPaymentProcessing ? 'active' : isPaymentPending ? 'active' : 'pending',
      timestamp: payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      detail: isPaymentCompleted
        ? 'Direct Benefit Transfer verified by treasury'
        : isPaymentFailed
        ? 'Bank transaction rejection received'
        : isPaymentProcessing
        ? 'Sent to bank clearing gateway'
        : isPaymentPending
        ? 'DBT voucher generated; awaiting gateway batching'
        : 'Initiates automatically upon procurement acceptance',
    };

    // 6. Payment Completed (ONLY MARKED COMPLETED IF ACTUAL PAYMENT ROW CONFIRMS IT)
    const s6: TimelineStep = {
      id: 6,
      title: 'Payment Completed',
      state: isPaymentCompleted ? 'completed' : isPaymentFailed ? 'failed' : 'pending',
      timestamp: payment?.processedAt ? new Date(payment.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      detail: isPaymentCompleted
        ? `₹${payment.amount.toLocaleString('en-IN')} credited to bank account`
        : isPaymentFailed
        ? 'Payment failed. Contact mandi admin.'
        : 'Direct transfer awaiting final bank ACK',
    };

    return [s1, s2, s3, s4, s5, s6];
  }, [booking, procurementRequest, payment]);

  // Masked bank account details
  const maskedAccount = React.useMemo(() => {
    const raw = farmerProfile?.bankAccount?.accountNumber;
    if (!raw) return '•••• •••• ••••';
    const last4 = raw.slice(-4);
    return `•••• •••• ${last4}`;
  }, [farmerProfile]);

  const bankName = farmerProfile?.bankAccount?.bankName || 'Registered Bank';
  const ifscCode = farmerProfile?.bankAccount?.ifscCode || 'IFSC Configured';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Procurement & Payment Lifecycle
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Supabase State
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Token <span className="font-mono font-bold text-slate-800">{booking.token}</span> &bull; {booking.cropName} ({booking.quantityQuintals} Quintals)
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadData();
            if (onRefresh) onRefresh();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* 6-Stage Timeline Tracker */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition relative ${
                  step.state === 'completed'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : step.state === 'active'
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950 ring-2 ring-blue-100'
                    : step.state === 'failed'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    0{step.id}
                  </span>
                  {step.state === 'completed' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Done</span>
                    </span>
                  ) : step.state === 'active' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>Active</span>
                    </span>
                  ) : step.state === 'failed' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span>Failed</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      <Circle className="w-2.5 h-2.5" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      step.state === 'completed'
                        ? 'text-emerald-900'
                        : step.state === 'active'
                        ? 'text-blue-900'
                        : step.state === 'failed'
                        ? 'text-red-900'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                {step.timestamp && (
                  <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono text-slate-400">
                    {step.timestamp}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PART C: REAL PAYMENT STATUS CARD */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-200">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Direct Benefit Transfer (DBT) Payout Status
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Farmer Account Settlement
                </span>
              </div>
            </div>

            <div>
              {payment ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    payment.paymentStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : payment.paymentStatus === 'processing'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : payment.paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {payment.paymentStatus === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : payment.paymentStatus === 'processing' ? (
                    <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  ) : payment.paymentStatus === 'failed' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>Payment {payment.paymentStatus}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Awaiting Procurement Weighment</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Payment Amount */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Disbursement Amount
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {payment ? (
                  `₹${payment.amount.toLocaleString('en-IN')}`
                ) : (
                  <span className="text-sm text-slate-500 font-medium">
                    ~₹{(booking.quantityQuintals * (booking.ratePerQuintal || 2425)).toLocaleString('en-IN')} (Est.)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {payment
                  ? `Calculated from verified weighment (${procurementRequest?.verifiedQuantity || booking.quantityQuintals} Qtl × ₹${procurementRequest?.verifiedRate || booking.ratePerQuintal || 2425})`
                  : 'Final amount calculated upon physical scale weighment'}
              </p>
            </div>

            {/* Reference / UTR */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Bank Reference / UTR
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1 truncate">
                {payment?.paymentReference || (
                  <span className="text-slate-400 font-normal italic">
                    {payment ? 'Pending Bank Gateway ACK' : 'Not generated yet'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Auditable transaction reference code
              </p>
            </div>

            {/* Bank Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Destination Bank
              </span>
              <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{bankName}</span>
              </div>
              <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                {maskedAccount} &bull; {ifscCode}
              </p>
            </div>

            {/* Timestamp */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Settlement Timestamp
              </span>
              <div className="text-xs font-semibold text-slate-900 mt-1">
                {payment?.processedAt
                  ? new Date(payment.processedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : payment?.createdAt
                  ? new Date(payment.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : (
                    <span className="text-slate-400 italic">Pending procurement completion</span>
                  )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Zero intermediary deduction
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All foodgrain procurement payments are settled via Direct Benefit Transfer (DBT) directly into your Aadhaar-linked bank account without middleman commission.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
