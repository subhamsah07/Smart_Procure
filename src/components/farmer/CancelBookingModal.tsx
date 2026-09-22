import * as React from 'react';
import {
  AlertTriangle,
  X,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Wheat,
  ShieldAlert,
} from 'lucide-react';
import { ProcurementBooking } from '../../types';
import { Button } from '../ui/Button';
import { bookingService } from '../../services/bookingService';
import { queueService } from '../../services/queueService';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ProcurementBooking;
  onCancelled: () => void;
}

const CANCELLATION_REASONS = [
  'Unable to transport produce on scheduled date',
  'Crop harvesting or moisture drying delayed',
  'Prefer a different procurement centre or date',
  'Personal emergency or scheduling conflict',
  'Other reason',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCancelled,
}) => {
  const [selectedReason, setSelectedReason] = React.useState<string>(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const fullReason =
        selectedReason === 'Other reason' && customNotes.trim()
          ? customNotes.trim()
          : selectedReason + (customNotes.trim() ? ` - ${customNotes.trim()}` : '');

      await bookingService.cancelBooking(booking.id, fullReason);

      // Adjust queue positions and update all listeners immediately
      queueService.handleBookingCancelled({
        bookingId: booking.id,
        token: booking.token,
        centreId: booking.centreId,
        reason: fullReason,
      });

      onCancelled();
      onClose();
    } catch (err: any) {
      console.error('Cancellation failed:', err);
      setErrorMessage(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cancel-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Cancel Procurement Booking
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Token: <strong className="font-mono text-slate-800 dark:text-neutral-200">{booking.token}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Booking Particulars */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 dark:text-neutral-400 block">Commodity & Quantity</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.cropName} • {booking.quantityQuintals} Q
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 dark:text-neutral-400 block">Procurement Centre</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {booking.centreName}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2 pt-2 border-t border-slate-200/60 dark:border-neutral-800">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 dark:text-neutral-400 block">Scheduled Slot</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.assignedDate || booking.bookingDate} &bull; {booking.slotStartTime} – {booking.slotEndTime}
                </span>
              </div>
            </div>
          </div>

          {/* Impact Warning Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Queue Recalculation Notice</p>
              <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                Cancelling your appointment releases your reserved slot back to the mandi. The queue positions and estimated wait times for other waiting farmers will automatically adjust immediately.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Select Reason for Cancellation
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-semibold'
                      : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 block">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Will re-schedule next week after tractor repair..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-neutral-950/60 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Keep Appointment
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleConfirmCancel}
            className="text-xs gap-1.5 font-bold shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Confirm Cancellation</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
