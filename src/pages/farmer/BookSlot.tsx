import * as React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CalendarPlus,
  Sprout,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { calculateEstimatedProcurementValue, formatCurrencyINR, deriveVerificationCode } from '../../lib/utils';
import { bookingService, CentreAvailabilityResult } from '../../services/bookingService';
import { cropService } from '../../services/cropService';
import { centreService } from '../../services/centreService';
import { districtService } from '../../services/districtService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Crop, CropName, IndianState, ProcurementCentre, ProcurementBooking, District } from '../../types';
import { MOCK_FARMER } from '../../data/mockData';

export const BookSlot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCentreId = searchParams.get('centreId');

  const { profile: authProfile, user, isAuthenticated } = useAuth();
  const [crops, setCrops] = React.useState<Crop[]>([]);
  const [selectedCropName, setSelectedCropName] = React.useState<CropName>('Wheat');

  // Consolidated farmer profile
  const farmerState = (authProfile?.state || user?.user_metadata?.state || MOCK_FARMER.state) as IndianState;
  const farmerName = authProfile?.fullName || (user?.user_metadata?.fullName as string) || MOCK_FARMER.fullName;
  const farmerMobile = authProfile?.mobileNumber || (user?.user_metadata?.mobileNumber as string) || MOCK_FARMER.mobileNumber;
  const farmerDistrict = authProfile?.district || (user?.user_metadata?.district as string) || MOCK_FARMER.district;

  // Real-time map of cropName -> state MSP rate configured by admin
  const [cropPrices, setCropPrices] = React.useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const defaultCrops = ['Wheat', 'Paddy', 'Maize', 'Rice', 'Mustard'];
    defaultCrops.forEach((name) => {
      map[name] = cropService.getCropPriceSync(name, farmerState);
    });
    return map;
  });

  // The active MSP rate for the currently selected crop - strictly synchronized with admin pricing
  const activeRatePerQuintal =
    cropPrices[selectedCropName] ??
    cropService.getCropPriceSync(selectedCropName, farmerState);

  const [districts, setDistricts] = React.useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>(authProfile?.district || 'all');
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState<boolean>(false);
  const [quantity, setQuantity] = React.useState<number>(25);

  const [centres, setCentres] = React.useState<ProcurementCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = React.useState<string>('');
  const [bookingDate, setBookingDate] = React.useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timePreference, setTimePreference] = React.useState<'morning' | 'afternoon' | 'no_preference'>('morning');
  
  // Availability & conflict states
  const [availability, setAvailability] = React.useState<CentreAvailabilityResult | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = React.useState(false);
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = React.useState(true);
  const [confirmedBooking, setConfirmedBooking] = React.useState<ProcurementBooking | null>(null);
  const [tokenCopied, setTokenCopied] = React.useState(false);

  // 1. Fetch real crops from Supabase
  React.useEffect(() => {
    let active = true;
    async function fetchCrops() {
      try {
        const loadedCrops = await cropService.getCrops(farmerState);
        if (active && loadedCrops.length > 0) {
          setCrops(loadedCrops);
          setSelectedCropName(loadedCrops[0].name as CropName);
        }
      } catch (err) {
        console.warn('Could not load crops from Supabase:', err);
      }
    }
    fetchCrops();
    return () => {
      active = false;
    };
  }, [farmerState]);

  // 2. Fetch state-specific MSP prices decided by admin for all crops
  React.useEffect(() => {
    let active = true;
    async function fetchPrices() {
      try {
        const statePrices = await cropService.getActivePricesForState(farmerState);
        if (active && statePrices.length > 0) {
          const map: Record<string, number> = {};
          statePrices.forEach((p) => {
            map[p.cropName] = p.ratePerQuintal;
          });
          setCropPrices((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('Could not load state crop prices:', err);
      }
    }
    fetchPrices();

    // Listen for state admin crop price updates in real-time
    const handlePriceUpdate = (e: any) => {
      const detail = e.detail;
      if (detail && detail.state === farmerState && detail.cropName) {
        setCropPrices((prev) => ({
          ...prev,
          [detail.cropName]: detail.newPrice,
        }));
      }
    };
    window.addEventListener('smartprocure_price_updated', handlePriceUpdate);

    return () => {
      active = false;
      window.removeEventListener('smartprocure_price_updated', handlePriceUpdate);
    };
  }, [farmerState]);

  // 3. Fetch districts for farmer state
  React.useEffect(() => {
    let active = true;
    async function fetchDistricts() {
      setIsLoadingDistricts(true);
      try {
        const list = await districtService.getDistrictsByState(farmerState);
        if (active) {
          setDistricts(list);
        }
      } catch (err) {
        console.warn('Could not load districts for state:', err);
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }
    fetchDistricts();
    return () => {
      active = false;
    };
  }, [farmerState]);

  // 4. Fetch procurement centres from Supabase filtered by state and selected district
  React.useEffect(() => {
    let active = true;
    async function fetchCentres() {
      setIsLoadingCentres(true);
      try {
        const list = await centreService.getCentres({
          state: farmerState,
          district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        });
        if (active) {
          setCentres(list);
          if (preselectedCentreId && list.some((c) => c.id === preselectedCentreId)) {
            setSelectedCentreId(preselectedCentreId);
          } else if (selectedCentreId && list.some((c) => c.id === selectedCentreId)) {
            // Keep current valid selection
          } else if (list.length > 0) {
            setSelectedCentreId(list[0].id);
          } else {
            // No registered centres found: do NOT select a centre, do NOT assign default centre ID
            setSelectedCentreId('');
          }
        }
      } catch (err) {
        console.warn('Could not load centres from Supabase:', err);
      } finally {
        if (active) setIsLoadingCentres(false);
      }
    }
    fetchCentres();
    return () => {
      active = false;
    };
  }, [farmerState, selectedDistrict, preselectedCentreId]);

  // 4. Real-time availability & conflict check whenever centre, date, quantity, or timePreference changes
  React.useEffect(() => {
    let active = true;
    if (!selectedCentreId || !bookingDate) {
      setAvailability(null);
      return;
    }

    async function checkCentreCapacityAndConflict() {
      setIsCheckingAvailability(true);
      setSubmissionError(null);
      try {
        // A. Check centre capacity and slot availability
        const avail = await bookingService.checkCentreAvailability(
          selectedCentreId,
          bookingDate,
          quantity,
          timePreference
        );
        if (active) {
          setAvailability(avail);
        }

        // B. Check farmer conflicting active booking
        if (user?.id) {
          const conflict = await bookingService.checkFarmerBookingConflict(user.id, bookingDate);
          if (active) {
            if (conflict.hasConflict) {
              setConflictWarning(
                `Notice: You already hold an active booking on ${bookingDate} (Token: ${conflict.conflictingToken}). Multiple active bookings on the same date are not permitted.`
              );
            } else {
              setConflictWarning(null);
            }
          }
        }
      } catch (err) {
        console.warn('Error checking slot availability:', err);
      } finally {
        if (active) setIsCheckingAvailability(false);
      }
    }

    checkCentreCapacityAndConflict();
    return () => {
      active = false;
    };
  }, [selectedCentreId, bookingDate, quantity, timePreference, user?.id]);

  const selectedCrop = crops.find((c) => c.name === selectedCropName) || (crops.length > 0 ? crops[0] : null);

  // Strictly resolve selected centre from registered database centres; never fall back to mock or arbitrary centre
  const selectedCentre = selectedCentreId ? centres.find((c) => c.id === selectedCentreId) || null : null;
  const estimatedValue = calculateEstimatedProcurementValue(quantity, activeRatePerQuintal);

  const handleCopyToken = () => {
    if (!confirmedBooking) return;
    navigator.clipboard.writeText(confirmedBooking.token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    // Validation checks
    if (!isAuthenticated && !user) {
      setSubmissionError(t('bookSlot.loginRequiredError', 'You must be logged in with a verified farmer account to book a procurement slot.'));
      return;
    }

    if (!selectedCentre || !selectedCentreId) {
      setSubmissionError(t('bookSlot.noCentresError', 'No registered procurement centres found for this location. Booking cannot proceed.'));
      return;
    }

    if (!selectedCrop) {
      setSubmissionError(t('bookSlot.noCropsError', 'No registered crops found in the database. Booking cannot proceed.'));
      return;
    }

    if (quantity <= 0) {
      setSubmissionError(t('bookSlot.quantityZeroError', 'Declared harvest quantity must be greater than zero quintals.'));
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (bookingDate < today) {
      setSubmissionError(t('bookSlot.datePastError', 'Preferred procurement date cannot be in the past.'));
      return;
    }

    if (availability && !availability.isAvailable) {
      setSubmissionError(availability.message || t('bookSlot.slotsFullError', 'Slots are currently full for this centre and date.'));
      return;
    }

    if (conflictWarning) {
      setSubmissionError(conflictWarning);
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = await bookingService.createBooking({
        cropId: selectedCrop.id,
        cropName: selectedCropName,
        quantityQuintals: quantity,
        ratePerQuintal: activeRatePerQuintal,
        centreId: selectedCentre.id,
        centreName: selectedCentre.name,
        bookingDate,
        timePreference,
        farmerName,
        farmerMobile,
        farmerState,
        farmerDistrict,
      });

      setIsSubmitting(false);
      setConfirmedBooking(newBooking);
      // Scroll to top to see confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      const errMsg = err?.message || t('bookSlot.bookingFailedError', 'Failed to complete booking. Please verify inputs and retry.');
      setSubmissionError(errMsg);
      // Automatically scroll to the visible error message so the user receives clear feedback
      setTimeout(() => {
        const errorEl = document.getElementById('booking-submit-error') || document.getElementById('booking-top-error');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // =========================================================================
  // VIEW: BOOKING CONFIRMATION SCREEN
  // =========================================================================
  if (confirmedBooking) {
    const preferenceLabel =
      timePreference === 'morning'
        ? 'Morning (09:00 AM – 02:00 PM)'
        : timePreference === 'afternoon'
        ? 'Afternoon (03:00 PM – 06:00 PM)'
        : 'No Preference (09:00 AM – 06:00 PM)';

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
        {/* Top Success Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-sm mx-auto">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('bookSlot.bookingConfirmedTitle', 'Booking Confirmed')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('bookSlot.bookingConfirmedDesc', 'Your foodgrain procurement slot has been scheduled and stored in the central register.')}
          </p>
        </div>

        {/* Hero Token Card */}
        <Card className="border-2 border-emerald-600 shadow-xl overflow-hidden bg-white dark:bg-neutral-900">
          <div className="bg-emerald-900 text-white px-6 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              {t('bookSlot.officialFarmerToken', 'OFFICIAL FARMER TOKEN')}
            </span>
            <Badge variant="success">{t('bookSlot.statusBooked', 'Status: Booked')}</Badge>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Token & 6-Digit Verification Code Block */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-center space-y-4 shadow-md">
              <div>
                <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase block">
                  {t('bookSlot.yourToken', 'YOUR TOKEN')}
                </span>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-emerald-400 select-all">
                    {confirmedBooking.token}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title={t('bookSlot.copyToken', 'Copy Token')}
                  >
                    {tokenCopied ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 6-Digit Verification Code Linked with QR */}
              <div className="pt-3 border-t border-slate-700/70 flex flex-col items-center">
                <span className="text-[11px] text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  {t('bookSlot.verificationPin', '6-Digit Verification PIN')}
                </span>
                <div className="mt-1.5 px-4 py-1.5 bg-slate-800/90 border border-amber-500/40 rounded-xl">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-amber-300 select-all">
                    {confirmedBooking.verificationCode || deriveVerificationCode(confirmedBooking.token, confirmedBooking.opaqueQrIdentifier)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {t('bookSlot.pinLinkedNotice', 'Linked with QR code. Admin can verify via QR scanning or manual 6-digit PIN entry.')}
                </p>
              </div>
            </div>

            {/* Official QR Code Block */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-bold tracking-wider uppercase">
                {t('bookSlot.officialIntakeQr', 'Official Intake Verification QR')}
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-sm">
                <QRCodeSVG
                  value={confirmedBooking.opaqueQrIdentifier}
                  size={168}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-xs text-slate-600 dark:text-neutral-300 font-medium">
                {t('bookSlot.linkedPin', 'Linked PIN')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{confirmedBooking.verificationCode || deriveVerificationCode(confirmedBooking.token, confirmedBooking.opaqueQrIdentifier)}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 max-w-sm">
                {t('bookSlot.presentQrGate', 'Present this QR code or provide the 6-digit PIN to the procurement centre operator at entry gate for instant intake verification.')}
              </p>
            </div>

            {/* Procurement Details Table */}
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden text-sm">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-medium">{t('bookSlot.procurementCentre', 'Procurement Centre')}</span>
                <span className="font-extrabold text-slate-900 text-right sm:max-w-md">
                  {confirmedBooking.centreName}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('bookSlot.date', 'Date')}</span>
                <span className="font-extrabold text-slate-900">
                  {confirmedBooking.assignedDate || confirmedBooking.bookingDate}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between bg-emerald-50/30">
                <span className="text-slate-600 font-medium">{t('bookSlot.assignedTime', 'Assigned Time')}</span>
                <span className="font-black text-emerald-800 text-sm">
                  {confirmedBooking.assignedSlotTime}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('bookSlot.crop', 'Crop')}</span>
                <span className="font-extrabold text-slate-900">
                  {confirmedBooking.cropName}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('bookSlot.quantity', 'Quantity')}</span>
                <span className="font-extrabold text-slate-900">
                  {confirmedBooking.quantityQuintals} Quintals (~{(confirmedBooking.quantityQuintals / 10).toFixed(1)} MT)
                </span>
              </div>

              <div className="p-4 flex items-center justify-between bg-emerald-50/60">
                <div>
                  <span className="text-slate-700 font-bold block">{t('bookSlot.estimatedProcurementValue', 'Estimated Procurement Value')}</span>
                  <span className="text-[10px] text-slate-500">{t('bookSlot.subjectToCert', 'Subject to weighbridge quality certification')}</span>
                </div>
                <span className="font-black text-emerald-800 text-base">
                  {formatCurrencyINR(confirmedBooking.estimatedValue)}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('bookSlot.status', 'Status')}</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full text-xs border border-emerald-300 uppercase tracking-wide">
                  {t('dashboard.statusBooked', 'BOOKED')}
                </span>
              </div>
            </div>

            {/* Required Informational Notice */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm block text-blue-950">
                  {t('bookSlot.liveQueueNote', 'Live Queue Note')}
                </span>
                <p className="leading-relaxed">
                  {t('bookSlot.liveQueueNoteDesc', 'Your live queue position and estimated waiting time will appear once you check in at the procurement centre.')}
                </p>
                <p className="text-[11px] text-blue-700 pt-0.5">
                  {t('bookSlot.liveQueueHours', 'Operates 09:00 AM – 06:00 PM with scheduled lunch pause between 02:00 PM – 03:00 PM.')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link to="/farmer" className="w-full sm:flex-1">
                <Button variant="primary" size="lg" className="w-full gap-2 shadow-sm">
                  <span>{t('bookSlot.viewBooking', 'View My Booking')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/farmer" className="w-full sm:flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  {t('bookSlot.backToDashboard', 'Back to Dashboard')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW: BOOKING FORM SCREEN
  // =========================================================================
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/farmer" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('bookSlot.backToDashboard', 'Back to Dashboard')}</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('bookSlot.title', 'Book Procurement Slot')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {t('bookSlot.subtitle', { state: farmerState, defaultValue: `Select foodgrain commodity, declared harvest quantity, and preferred arrival window for ${farmerState}` })}
        </p>
      </div>

      {/* ERROR ALERT BANNER */}
      {submissionError && (
        <div id="booking-top-error" className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block text-rose-950">{t('bookSlot.bookingIssue', 'Booking Issue')}</span>
            <p className="text-xs leading-relaxed">{submissionError}</p>
          </div>
        </div>
      )}

      {/* CONFLICT WARNING BANNER */}
      {conflictWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block text-amber-950">{t('bookSlot.scheduleConflict', 'Schedule Conflict')}</span>
            <p className="text-xs leading-relaxed">{conflictWarning}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: COMMODITY SELECTION */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                {t('bookSlot.step1Title', 'Step 1: Crop & Quantity')}
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {t('bookSlot.stateBadge', { state: farmerState, defaultValue: `State: ${farmerState}` })}
              </span>
            </div>
            <CardTitle className="text-base">{t('bookSlot.step1Heading', 'Select Foodgrain Commodity')}</CardTitle>
            <CardDescription>
              {t('bookSlot.step1Desc', { state: farmerState, defaultValue: `Real-time Minimum Support Price (MSP) benchmarks for the 2026 procurement cycle in ${farmerState}.` })}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {crops.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {crops.map((crop) => {
                  const isSelected = crop.name === selectedCropName;
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => setSelectedCropName(crop.name as CropName)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 shadow-xs ring-2 ring-emerald-600/10'
                          : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{crop.name}</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 block">{crop.hindiName}</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-neutral-500">{t('bookSlot.mspRate', 'MSP Rate')}</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-400">
                          ₹{cropPrices[crop.name] ?? crop.configuredRatePerQuintal} {t('bookSlot.perQtl', '/ Q')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{t('bookSlot.noCrops', 'No official procurement crops are registered in the database.')}</span>
              </div>
            )}

            <div className="pt-2">
              <Input
                label={t('bookSlot.declaredQuantityLabel', 'Declared Harvest Quantity (in Quintals)')}
                type="number"
                min={1}
                max={500}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                helperText={t('bookSlot.declaredQuantityHelper', '1 Metric Ton (MT) = 10 Quintals. Subject to electronic weighbridge certification.')}
              />
            </div>

            {/* Estimated Procurement Value Box */}
            <div className="p-4 rounded-xl bg-black border border-neutral-800 text-white shadow-md">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                {t('bookSlot.estimatedProcurementValue', 'Estimated Procurement Value')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-500 block mt-1">
                {formatCurrencyINR(estimatedValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: CENTRE SELECTION & AVAILABILITY */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {t('bookSlot.step2Title', 'Step 2: Centre & Preferred Schedule')}
            </span>
            <CardTitle className="text-base">{t('bookSlot.step2Heading', 'Mandi Yard & Arrival Window')}</CardTitle>
            <CardDescription>
              {t('bookSlot.step2Desc', 'Select your nearby procurement yard and time preference. Real-time availability is checked directly against mandi daily capacity.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* District Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('bookSlot.districtFilter', 'District Filter')}
                  </label>
                  {isLoadingDistricts && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> {t('bookSlot.loadingDistricts', 'Loading districts...')}
                    </span>
                  )}
                </div>
                <select
                  id="book-slot-district-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={isLoadingDistricts}
                  className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-50 dark:disabled:bg-neutral-950"
                >
                  <option key="all" value="all" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                    {t('bookSlot.allDistrictsInState', { state: farmerState, count: districts.length, defaultValue: `All Districts in ${farmerState} (${districts.length})` })}
                  </option>
                  {districts.map((d) => (
                    <option key={d.id || d.districtCode || d.districtName} value={d.districtName} className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                      {d.districtName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Centre Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">
                  {t('bookSlot.procurementCentre', 'Procurement Centre')}
                </label>
                {isLoadingCentres ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>{t('bookSlot.loadingCentres', 'Loading verified centres from database...')}</span>
                  </div>
                ) : centres.length > 0 ? (
                  <select
                    id="book-slot-centre-select"
                    value={selectedCentreId}
                    onChange={(e) => setSelectedCentreId(e.target.value)}
                    className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    <option value="" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                      {t('bookSlot.selectCentrePlaceholder', '-- Select a registered procurement centre --')}
                    </option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                        {c.name} ({c.district}) — {c.capacityPerDayQuintals.toLocaleString()} Q/day{c.distanceKm !== undefined ? ` • ${c.distanceKm} km away` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{t('bookSlot.noCentresFound', 'No registered procurement centres found for this location.')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* MANDATED NOTIFICATION WHEN SELECTED STATE/DISTRICT HAS ZERO REGISTERED PROCUREMENT CENTRES */}
            {!isLoadingCentres && centres.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm block text-amber-950">
                      {t('bookSlot.noCentresFound', 'No registered procurement centres found for this location.')}
                    </span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {t('bookSlot.noCentresDetailed', {
                        state: farmerState,
                        districtText: selectedDistrict !== 'all' ? ` (${selectedDistrict} district)` : '',
                        defaultValue: `There are no verified procurement centres registered in ${farmerState}${selectedDistrict !== 'all' ? ` (${selectedDistrict} district)` : ''} in the central database. Procurement slots can only be scheduled at official centres registered by the State Agricultural Administration.`
                      })}
                    </p>
                  </div>
                </div>
                {selectedDistrict !== 'all' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDistrict('all')}
                    className="shrink-0 text-xs text-amber-950 border-amber-300 hover:bg-amber-100 font-semibold"
                  >
                    {t('bookSlot.viewAllInState', { state: farmerState, defaultValue: `View All in ${farmerState}` })}
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('bookSlot.preferredDateLabel', 'Preferred Date')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />

              {/* Time Preference selection: Morning, Afternoon, No Preference */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">
                  {t('bookSlot.timePreferenceLabel', 'Time Preference')}
                </label>
                <select
                  value={timePreference}
                  onChange={(e) => setTimePreference(e.target.value as any)}
                  className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                >
                  <option value="morning" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">{t('bookSlot.morningPreference', 'Morning (9:00 AM – 2:00 PM)')}</option>
                  <option value="afternoon" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">{t('bookSlot.afternoonPreference', 'Afternoon (3:00 PM – 6:00 PM)')}</option>
                  <option value="no_preference" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">{t('bookSlot.noPreference', 'No Preference (9:00 AM – 6:00 PM)')}</option>
                </select>
              </div>
            </div>

            {/* REAL-TIME AVAILABILITY STATUS BOX */}
            <div className="p-3.5 rounded-xl border transition-colors bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs font-semibold pb-1.5 border-b border-slate-200 dark:border-neutral-800">
                <span className="text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  {t('bookSlot.mandiSlotAvailabilityCheck', 'Mandi Slot Availability Check')}
                </span>
                {isCheckingAvailability ? (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                    {t('bookSlot.checkingDatabase', 'Checking database...')}
                  </span>
                ) : centres.length === 0 ? (
                  <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-300">
                    {t('bookSlot.noCentreRegistered', 'No Centre Registered')}
                  </span>
                ) : !selectedCentreId ? (
                  <span className="text-slate-600 font-medium bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {t('bookSlot.selectCentreAbove', 'Select Centre Above')}
                  </span>
                ) : availability?.isAvailable ? (
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                    {t('bookSlot.slotsAvailable', 'Slots Available')}
                  </span>
                ) : (
                  <span className="text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded text-[11px] border border-rose-300">
                    {t('bookSlot.slotsFull', 'Slots Full')}
                  </span>
                )}
              </div>

              <div className="pt-2 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="text-slate-600">
                  {availability ? (
                    <span>
                      {t('bookSlot.dailyCapacity', 'Daily Capacity')}: <strong>{availability.capacityQuintals.toLocaleString()} Q</strong> &bull; {t('bookSlot.booked', 'Booked')}: <strong>{availability.bookedQuintals.toLocaleString()} Q</strong> &bull; {t('bookSlot.remaining', 'Remaining')}: <strong className={availability.remainingQuintals < quantity ? 'text-rose-700' : 'text-emerald-700'}>{availability.remainingQuintals.toLocaleString()} Q</strong>
                    </span>
                  ) : centres.length === 0 ? (
                    <span className="text-amber-800 font-medium">
                      {t('bookSlot.noCentresFound', 'No registered procurement centres found for this location.')}
                    </span>
                  ) : !selectedCentreId ? (
                    <span>{t('bookSlot.selectCentrePrompt', 'Please select a registered procurement centre from the dropdown to check capacity.')}</span>
                  ) : (
                    <span>{t('bookSlot.checkingCapacityForDate', { date: bookingDate, defaultValue: `Checking verified capacity for ${bookingDate}...` })}</span>
                  )}
                </div>
                {availability && !availability.isAvailable && (
                  <div className="w-full mt-2 pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-rose-700 font-bold block text-xs">
                      {t('bookSlot.dateAtCapacity', { date: bookingDate, defaultValue: `${bookingDate} is currently at capacity.` })}
                    </span>
                    {availability.nextFeasibleSlot && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold block text-amber-900">
                            {t('bookSlot.nextAvailable', 'Next available')}: {availability.nextFeasibleSlot.formattedDate}, {availability.nextFeasibleSlot.slotTime}
                          </span>
                          <span className="text-[11px] text-amber-700 block">
                            {t('bookSlot.capacityVerifiedNotice', 'Capacity verified. No waiting for unavailable slots.')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookingDate(availability.nextFeasibleSlot!.date)}
                          className="shrink-0 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-md border border-emerald-300 transition-colors"
                        >
                          {t('bookSlot.switchToDate', { date: `${availability.nextFeasibleSlot.formattedDate.split(' ')[0]} ${availability.nextFeasibleSlot.formattedDate.split(' ')[1]}`, defaultValue: `Switch to ${availability.nextFeasibleSlot.formattedDate.split(' ')[0]} ${availability.nextFeasibleSlot.formattedDate.split(' ')[1]}` })}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* OPERATING HOURS & MANDATORY LUNCH RECESS NOTICE */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {t('bookSlot.operatingScheduleTitle', 'Procurement Centre Operating Schedule:')}
                </span>
                <p>
                  &bull; <strong>{t('bookSlot.morningSession', 'Morning Session:')}</strong> 9:00 AM – 2:00 PM<br />
                  &bull; <strong>{t('bookSlot.scheduledBreak', 'Scheduled Break:')}</strong> 2:00 PM – 3:00 PM ({t('bookSlot.scheduledBreakDesc', 'No weighbridge bookings scheduled')})<br />
                  &bull; <strong>{t('bookSlot.secondSession', 'Second Session:')}</strong> 3:00 PM – 6:00 PM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NOTICE EXPLAINING WHY BOOKING IS DISABLED WHEN ZERO CENTRES ARE FOUND */}
        {!isLoadingCentres && centres.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>{t('bookSlot.bookingDisabledTitle', 'Booking Disabled:')}</strong> {t('bookSlot.bookingDisabledDesc', 'No registered procurement centres found for this location. Slots cannot be scheduled until a verified centre is registered in the database.')}
            </span>
          </div>
        )}

        {/* INLINE ERROR ALERT IMMEDIATELY ABOVE SUBMIT BUTTON */}
        {submissionError && (
          <div
            id="booking-submit-error"
            className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block text-rose-950">{t('bookSlot.bookingIssue', 'Booking Issue')}</span>
              <p className="text-xs leading-relaxed">{submissionError}</p>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTONS */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/farmer')}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={
                isSubmitting ||
                isLoadingCentres ||
                centres.length === 0 ||
                !selectedCentreId ||
                !selectedCentre ||
                !selectedCrop ||
                (availability !== null && !availability.isAvailable)
              }
              className="gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('bookSlot.confirmButton', 'Confirm Booking')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {!isLoadingCentres && centres.length === 0 && (
            <p className="text-xs text-amber-800 font-medium text-right">
              {t('bookSlot.bookingSubmissionDisabledNote', 'Booking submission is disabled: No registered procurement centres found for this location.')}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
