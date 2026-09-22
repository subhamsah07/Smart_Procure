import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { cropService } from '../../services/cropService';
import { AdminRequestItem, VerificationRecordItem } from '../../types/admin';
import { ProcurementWorkflowStatus } from '../../types/database';
import { deriveVerificationCode } from '../../lib/utils';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  QrCode,
  FileCheck,
  Scale,
  CreditCard,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Camera,
  CameraOff,
  Check,
  X,
  RefreshCw,
  Play,
  AlertTriangle,
  ExternalLink,
  IndianRupee,
  ShieldAlert,
  Upload,
  XCircle,
  KeyRound,
  PauseCircle,
  Sparkles,
  Download,
  FileText,
  Bell,
  Lock,
} from 'lucide-react';
import { downloadProcurementReceiptPdf } from '../../utils/receiptPdfGenerator';

export const AdminRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { assignedState } = useAdminAuth();
  const navigate = useNavigate();

  const [request, setRequest] = React.useState<AdminRequestItem | null>(null);
  const [verificationRecords, setVerificationRecords] = React.useState<VerificationRecordItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [advancing, setAdvancing] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // QR Scanner State
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scannedQrCode, setScannedQrCode] = React.useState<string | null>(null);
  const [qrVerifiedSuccess, setQrVerifiedSuccess] = React.useState(false);
  const [qrVerificationStatus, setQrVerificationStatus] = React.useState<'idle' | 'verified' | 'not_verified'>('idle');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const isScanningRef = React.useRef<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Document Verification State
  const [aadhaarVerified, setAadhaarVerified] = React.useState(false);
  const [farmerIdCardVerified, setFarmerIdCardVerified] = React.useState(false);

  // Weight & Rate State
  const [givenWeight, setGivenWeight] = React.useState<number | ''>('');
  const [verifiedRate, setVerifiedRate] = React.useState<number | ''>('');
  const [weighbridgeNotes, setWeighbridgeNotes] = React.useState('');

  // Crop Quality State: 'approved' (According to FAQ rules) vs 'not_approved'
  const [qualityStatus, setQualityStatus] = React.useState<'approved' | 'not_approved'>('approved');
  const [qualityNotes, setQualityNotes] = React.useState('');
  const [qualityCancellationReason, setQualityCancellationReason] = React.useState(
    'Produce does not meet Fair Average Quality (FAQ) standards. High impurities or moisture exceeding official Mandi limits.'
  );

  // Manual QR Override / Bypass State
  const [manualCodeInput, setManualCodeInput] = React.useState('');

  // Hold & Reschedule Modal State (For Absent Farmers)
  const [rescheduleModalOpen, setRescheduleModalOpen] = React.useState(false);
  const [newDateInput, setNewDateInput] = React.useState('');
  const [newTimeInput, setNewTimeInput] = React.useState('09:00 AM – 10:00 AM');
  const [rescheduleReason, setRescheduleReason] = React.useState('Farmer absent at Mandi counter when token called');
  const [isRescheduling, setIsRescheduling] = React.useState(false);

  // Payment Processing State
  const [paymentUtr, setPaymentUtr] = React.useState('');
  const [paymentNotes, setPaymentNotes] = React.useState('');

  const workflowSteps: { status: ProcurementWorkflowStatus; label: string; icon: any; stepNumber: number }[] = [
    { status: 'booking', label: '1. Booking Created', icon: Calendar, stepNumber: 1 },
    { status: 'qr_verified', label: '2. QR Verified', icon: QrCode, stepNumber: 2 },
    { status: 'document_verification', label: '3. Documents Verified', icon: FileCheck, stepNumber: 3 },
    { status: 'weight_rate_verification', label: '4. Weight & Quality', icon: Scale, stepNumber: 4 },
    { status: 'procurement_completed', label: '5. Procurement Done', icon: CheckCircle2, stepNumber: 5 },
    { status: 'payment_processing', label: '6. Payment Processing', icon: Clock, stepNumber: 6 },
    { status: 'payment_completed', label: '7. Payment Complete', icon: CreditCard, stepNumber: 7 },
  ];

  const loadDetails = async () => {
    if (!id) return;
    const effectiveState = assignedState || 'Bihar';
    setLoading(true);
    try {
      const data = await adminService.getRequestById(id, effectiveState);
      if (data.request) {
        setRequest(data.request);
        setVerificationRecords(data.verificationRecords);
        setGivenWeight(data.request.quantityQuintals);

        // Fetch state-specific revised MSP rate
        try {
          const mspRate = await cropService.getCropPriceByState(
            data.request.cropName as any,
            (data.request.centreState || effectiveState) as any
          );
          setVerifiedRate(mspRate || data.request.ratePerQuintal || 2425);
        } catch {
          setVerifiedRate(data.request.ratePerQuintal || 2425);
        }

        // Generate default UTR reference for payment completion
        setPaymentUtr(`DBT-${effectiveState.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-8)}`);

        // Normalize workflow status
        const rawWf = (data.request.workflowStatus || '').toLowerCase().trim();
        const normWf: ProcurementWorkflowStatus =
          rawWf === 'booked' || rawWf === 'booking' || !rawWf
            ? 'booking'
            : rawWf === 'qr_verified'
            ? 'qr_verified'
            : rawWf === 'document_verification' || rawWf === 'documents_verified'
            ? 'document_verification'
            : rawWf === 'weight_rate_verification' || rawWf === 'crop_quality_check' || rawWf === 'quality_check'
            ? 'weight_rate_verification'
            : rawWf === 'procurement_completed' || rawWf === 'completed'
            ? 'procurement_completed'
            : rawWf === 'payment_processing'
            ? 'payment_processing'
            : rawWf === 'payment_completed'
            ? 'payment_completed'
            : (rawWf as ProcurementWorkflowStatus);

        data.request.workflowStatus = normWf;

        // Check if QR was already completed in subsequent checkpoints (steps 2-7)
        const isPastQrStep = [
          'qr_verified',
          'document_verification',
          'weight_rate_verification',
          'crop_quality_check',
          'procurement_completed',
          'payment_processing',
          'payment_completed',
        ].includes(normWf);

        if (isPastQrStep) {
          setQrVerifiedSuccess(true);
          setQrVerificationStatus('verified');
        } else {
          // On active QR verification step: must be scanned in this session
          setQrVerifiedSuccess(false);
          setQrVerificationStatus('idle');
          setScannedQrCode(null);
        }

        const hasDocRecord = data.verificationRecords.some((r) => r.verificationType === 'document verification');
        if (hasDocRecord || isPastQrStep) {
          setAadhaarVerified(true);
          setFarmerIdCardVerified(true);
        }
      } else {
        setRequest(null);
      }
    } catch (err) {
      console.error('Failed to load request detail:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetails();
  }, [id, assignedState]);

  // Listen to cross-component booking and queue update events
  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      const updatedId = e?.detail?.id;
      const updatedToken = e?.detail?.token;
      if (!id || updatedId === id || updatedToken === id) {
        loadDetails();
      }
    };
    window.addEventListener('smartprocure_booking_updated', handleUpdate);
    window.addEventListener('smartprocure_queue_updated', loadDetails);
    return () => {
      window.removeEventListener('smartprocure_booking_updated', handleUpdate);
      window.removeEventListener('smartprocure_queue_updated', loadDetails);
    };
  }, [id, assignedState]);

  // Clean up camera stream when unmounting
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const normalizedStatus = React.useMemo<ProcurementWorkflowStatus>(() => {
    if (!request) return 'booking';
    const raw = (request.workflowStatus || '').toLowerCase().trim();
    if (raw === 'booked' || raw === 'booking' || !raw) return 'booking';
    if (raw === 'qr_verified') return 'qr_verified';
    if (raw === 'document_verification' || raw === 'documents_verified') return 'document_verification';
    if (raw === 'weight_rate_verification' || raw === 'crop_quality_check' || raw === 'quality_check') return 'weight_rate_verification';
    if (raw === 'procurement_completed' || raw === 'completed') return 'procurement_completed';
    if (raw === 'payment_processing') return 'payment_processing';
    if (raw === 'payment_completed') return 'payment_completed';
    if (raw === 'cancelled' || raw === 'rejected') return raw as ProcurementWorkflowStatus;
    return 'booking';
  }, [request]);

  const currentStepIndex = React.useMemo(() => {
    if (!request) return 0;
    const idx = workflowSteps.findIndex((s) => s.status === normalizedStatus);
    return idx === -1 ? 0 : idx;
  }, [request, normalizedStatus]);

  // Check if procurement has failed (cancelled or rejected due to quality)
  const isProcurementFailed = React.useMemo(() => {
    return (
      normalizedStatus === 'cancelled' ||
      normalizedStatus === 'rejected' ||
      request?.bookingStatus === 'cancelled'
    );
  }, [request, normalizedStatus]);

  // Check if procurement has already started
  const isProcurementStarted = React.useMemo(() => {
    if (!request) return false;
    return normalizedStatus !== 'booking';
  }, [request, normalizedStatus]);

  const [activeViewStep, setActiveViewStep] = React.useState<number | null>(null);
  const effectiveStepIndex = activeViewStep !== null ? activeViewStep : currentStepIndex;

  // Today ISO Date and Future Date check
  const todayIsoDate = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const bookingDay = request?.assignedDate || request?.preferredDate || '';
  const isFutureDate = React.useMemo(() => {
    if (!bookingDay) return false;
    return bookingDay > todayIsoDate;
  }, [bookingDay, todayIsoDate]);

  // QR matching logic: checks scanned text or manual input against token, qrIdentifier, 6-digit PIN, and booking ID
  const checkQrMatch = (scannedText: string, targetReq: AdminRequestItem | null): boolean => {
    if (!scannedText || !targetReq) return false;
    const raw = scannedText.trim();
    const lower = raw.toLowerCase();
    const token = (targetReq.token || '').trim().toLowerCase();
    const qrId = (targetReq.qrIdentifier || '').trim().toLowerCase();
    const id = (targetReq.id || '').trim().toLowerCase();
    const pin = (targetReq.verificationCode || deriveVerificationCode(targetReq.token, targetReq.qrIdentifier)).trim().toLowerCase();

    // 1. Direct equality match (Token, QR Identifier, ID, or 6-digit PIN)
    if (token && lower === token) return true;
    if (qrId && lower === qrId) return true;
    if (pin && lower === pin) return true;
    if (id && lower === id) return true;

    // 2. Substring matching (e.g. SMARTPROCURE:id or URL with token/PIN)
    if (token && lower.includes(token)) return true;
    if (qrId && lower.includes(qrId)) return true;
    if (pin && lower.includes(pin)) return true;
    if (id && lower.includes(id)) return true;

    // 3. JSON payload parse
    try {
      const obj = JSON.parse(raw);
      if (obj.token && obj.token.toLowerCase() === token) return true;
      if (obj.qrIdentifier && obj.qrIdentifier.toLowerCase() === qrId) return true;
      if (obj.verificationCode && String(obj.verificationCode).toLowerCase() === pin) return true;
      if (obj.code && String(obj.code).toLowerCase() === pin) return true;
      if (obj.pin && String(obj.pin).toLowerCase() === pin) return true;
      if (obj.bookingId && obj.bookingId.toLowerCase() === id) return true;
      if (obj.id && obj.id.toLowerCase() === id) return true;
    } catch {}

    return false;
  };

  // Camera QR Scanner handlers
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not accessible in this browser window. Use Image Upload or Manual Identifier.');
        return;
      }

      // Stop any existing stream
      stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        scanQrFrame();
      }
    } catch (err: any) {
      console.warn('Camera stream failed:', err);
      setCameraError('Unable to open camera feed. Check browser camera permissions or use Image Upload / Manual Identifier below.');
      setCameraActive(false);
      isScanningRef.current = false;
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanQrFrame = () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        const maxDim = 640;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim()) {
          handleQrDetected(code.data.trim());
          return;
        }
      }
    }

    if (isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanQrFrame);
    }
  };

  const handleQrDetected = (dataString: string) => {
    stopCamera();
    setScannedQrCode(dataString);

    const isMatch = checkQrMatch(dataString, request);

    if (isMatch) {
      setQrVerificationStatus('verified');
      setQrVerifiedSuccess(true);
      setStatusMessage({
        type: 'success',
        text: `VERIFIED: Farmer Token ${request?.token} matched successfully! Physical gate pass authenticated.`,
      });
    } else {
      setQrVerificationStatus('not_verified');
      setQrVerifiedSuccess(false);
      setStatusMessage({
        type: 'error',
        text: `NOT VERIFIED: Scanned code does NOT match expected Token ${request?.token}. Procurement process stopped until correct QR is scanned.`,
      });
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data && code.data.trim()) {
            handleQrDetected(code.data.trim());
          } else {
            setQrVerificationStatus('not_verified');
            setQrVerifiedSuccess(false);
            setStatusMessage({
              type: 'error',
              text: 'NOT VERIFIED: No valid QR code detected in the uploaded image. Please try another photo.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual QR Override / Surpass Handler (Admin verifies using 6-digit PIN, scanned QR payload, Token, or ID)
  const handleManualQrSurpass = (codeToVerify?: string) => {
    const raw = codeToVerify !== undefined ? codeToVerify : manualCodeInput;
    const code = (raw || request?.token || '').trim();
    if (!code) {
      setStatusMessage({
        type: 'error',
        text: "Please enter or select a verification code (Token, 6-digit PIN, or QR ID).",
      });
      return;
    }
    const lower = code.toLowerCase();
    const token = (request?.token || '').trim().toLowerCase();
    const qrId = (request?.qrIdentifier || '').trim().toLowerCase();
    const id = (request?.id || '').trim().toLowerCase();
    const pin = (request?.verificationCode || deriveVerificationCode(request?.token, request?.qrIdentifier)).trim().toLowerCase();

    // Check match against PIN, QR ID, Token, or ID
    const isPinMatch = Boolean(pin && (lower === pin || lower.includes(pin)));
    const isQrIdMatch = Boolean(qrId && (lower === qrId || lower.includes(qrId)));
    const isTokenMatch = Boolean(token && (lower === token || lower.includes(token)));
    const isIdMatch = Boolean(id && (lower === id || lower.includes(id)));

    if (isPinMatch || isQrIdMatch || isTokenMatch || isIdMatch) {
      setQrVerificationStatus('verified');
      setQrVerifiedSuccess(true);
      setScannedQrCode(code);
      setStatusMessage({
        type: 'success',
        text: `ARRIVAL VERIFIED: Farmer authenticated successfully for Token ${request?.token}. Gate arrival approved.`,
      });
    } else {
      setQrVerificationStatus('not_verified');
      setQrVerifiedSuccess(false);
      setStatusMessage({
        type: 'error',
        text: `VERIFICATION FAILED: "${code}" does not match this booking. Click "Clear with Token" or check PIN.`,
      });
    }
  };

  // Hold and Reschedule Handler for Absent Farmers
  const handleHoldAndReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    if (!newDateInput) {
      setStatusMessage({ type: 'error', text: 'Please select a new appointment date.' });
      return;
    }
    setIsRescheduling(true);
    setStatusMessage(null);

    const res = await adminService.holdAndRescheduleBooking({
      bookingId: request.id,
      newDate: newDateInput,
      newSlotTime: newTimeInput,
      reason: rescheduleReason,
    });

    setIsRescheduling(false);
    if (res.success) {
      setRescheduleModalOpen(false);
      setStatusMessage({
        type: 'info',
        text: `Procurement placed on HOLD for absent farmer. Re-assigned to ${newDateInput} (${newTimeInput}). Notification and SMS alert sent to ${request.farmerName}. Moving to next procurement.`,
      });
      await loadDetails();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to hold and reschedule booking.',
      });
    }
  };

  // Workflow Progression Handlers
  const handleStartProcurement = async () => {
    if (!request) return;

    setAdvancing(true);
    setStatusMessage(null);

    const isEarly = isFutureDate;
    const notes = isEarly
      ? `Early arrival gate admission. Token ${request.token} admitted ahead of scheduled date (${bookingDay}) for physical procurement.`
      : `Procurement intake started at Counter #1. Token ${request.token} admitted for physical intake.`;

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'qr_verified',
      notes,
    });

    setAdvancing(false);
    if (ok) {
      setQrVerifiedSuccess(true);
      setQrVerificationStatus('verified');
      setStatusMessage({
        type: 'success',
        text: isEarly
          ? `Early arrival admitted! Token ${request.token} gate pass approved. You can now proceed to document verification.`
          : `Procurement intake started! Token ${request.token} admitted at Mandi gate. Please verify documents or proceed.`,
      });
      await loadDetails();
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Failed to start procurement. Please check your admin session.',
      });
    }
  };

  const handleCompleteQrStep = async () => {
    if (!request) return;
    if (!qrVerifiedSuccess || qrVerificationStatus !== 'verified') {
      setStatusMessage({
        type: 'error',
        text: 'Procurement process stopped: Please scan or manually surpass verification with the 6-digit PIN before saving this checkpoint.',
      });
      return;
    }

    setAdvancing(true);
    setStatusMessage(null);

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'document_verification',
      notes: `QR verified via Optical Scanner / 6-digit PIN for Token ${request.token}`,
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: 'QR Verified Checkpoint saved! Now proceed with Document Verification.',
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to save QR checkpoint.' });
    }
  };

  const handleCompleteDocumentStep = async () => {
    if (!request) return;
    if (!aadhaarVerified || !farmerIdCardVerified) {
      setStatusMessage({
        type: 'error',
        text: 'Both Aadhaar Verified and Farmer Identity Card Verified checkboxes must be checked.',
      });
      return;
    }

    setAdvancing(true);
    setStatusMessage(null);

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'weight_rate_verification',
      notes: 'Govt. Aadhaar Card & State Farmer Identity Card verified by Mandi Officer.',
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: 'Documents Verified Checkpoint saved! Now proceed to Weighbridge and Rate verification.',
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to save Document Verification checkpoint.' });
    }
  };

  const handleCompleteWeightRateStep = async () => {
    if (!request) return;
    if (!givenWeight || Number(givenWeight) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Given Weight in Quintals.' });
      return;
    }
    if (!verifiedRate || Number(verifiedRate) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid MSP Rate.' });
      return;
    }

    setAdvancing(true);
    setStatusMessage(null);

    const q = Number(givenWeight);
    const r = Number(verifiedRate);
    const gross = q * r;
    const finalVal = gross;

    const gradeLabel = 'Quality Approved (According to FAQ rules)';

    const combinedNotes = [
      weighbridgeNotes || `Weighed: ${q} Qtl (Claimed: ${request.quantityQuintals} Qtl) at MSP ₹${r}/Qtl`,
      `Quality: ${gradeLabel}`,
      qualityNotes,
    ]
      .filter(Boolean)
      .join(' | ');

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'procurement_completed',
      verifiedQuantity: q,
      verifiedRate: r,
      qualityGrade: 'approved',
      qualityDeductionPercent: 0,
      finalValue: finalVal,
      notes: combinedNotes,
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: `Weighment and Crop Quality certified (${gradeLabel})! Procurement custody completed.`,
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to record weighbridge and quality certification.' });
    }
  };

  const handleCancelProcurementForQuality = async () => {
    if (!request) return;
    setAdvancing(true);
    setStatusMessage(null);

    const reason =
      qualityCancellationReason ||
      qualityNotes ||
      'Produce does not meet Fair Average Quality (FAQ) standards. High impurities or moisture exceeding official Mandi limits.';

    const ok = await adminService.cancelProcurementDueToQuality({
      bookingId: request.id,
      reason,
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'error',
        text: 'Procurement cancelled due to unapproved crop quality. Status updated to Failed and notification delivered to the farmer.',
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to cancel procurement. Please try again.' });
    }
  };

  const handleAdvanceToPayment = async () => {
    if (!request) return;
    setAdvancing(true);
    setStatusMessage(null);

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'payment_processing',
      notes: 'Procurement complete. Payment scheduled for Direct Benefit Transfer.',
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'info',
        text: 'Moved to Payment Processing. Payment is currently Pending.',
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to initiate payment processing.' });
    }
  };

  // Payment Option A: Mark Pending (Leaves process incomplete until paid)
  const handlePaymentPendingOnly = async () => {
    if (!request) return;
    setAdvancing(true);
    setStatusMessage(null);

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'payment_processing',
      notes: paymentNotes || 'Payment marked pending in DBT queue. Requires banking authorization.',
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'info',
        text: 'Payment status is PENDING. The procurement process is NOT completed yet. Admin can complete payment whenever disbursed.',
      });
      await loadDetails();
    }
  };

  // Payment Option B: Disburse & Complete Payment (Full Process Completed)
  const handleDisburseAndCompletePayment = async () => {
    if (!request) return;
    setAdvancing(true);
    setStatusMessage(null);

    const ref = paymentUtr.trim() || `DBT-${assignedState.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-8)}`;
    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: 'payment_completed',
      paymentReference: ref,
      notes: `DBT Payment disbursed. Reference (UTR): ${ref}. Rate credited to farmer account.`,
    });

    setAdvancing(false);
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: 'Full Procurement Process Completed! Payment credited to farmer account and notification delivered.',
      });
      await loadDetails();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to complete payment disbursement.' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
        Loading procurement request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Request Not Found or Cross-State Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This procurement booking does not exist or belongs to a procurement yard outside of {assignedState || 'Bihar'}.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => loadDetails()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs"
          >
            Retry Loading
          </button>
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests Directory
          </Link>
        </div>
      </div>
    );
  }

  // Calculated financial values
  const currentQuantity = Number(givenWeight) || request.quantityQuintals;
  const currentRate = Number(verifiedRate) || request.ratePerQuintal || 2425;
  const totalCalculatedPayout = currentQuantity * currentRate;

  const handleDownloadReceiptPdf = () => {
    if (!request) return;
    downloadProcurementReceiptPdf({
      request,
      verificationRecords,
      paymentUtr,
      paymentNotes,
      verifiedQuantity: Number(givenWeight) || request.quantityQuintals,
      verifiedRate: Number(verifiedRate) || request.ratePerQuintal,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/requests')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Back to requests"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-700 text-lg sm:text-xl">
                {request.token}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                {request.cropName} ({request.quantityQuintals} Qtl)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isProcurementFailed
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                    : request.workflowStatus === 'payment_completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : isProcurementStarted
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isProcurementFailed
                  ? 'FAILED (QUALITY NOT APPROVED)'
                  : request.workflowStatus === 'payment_completed'
                  ? 'FULL PROCESS COMPLETED'
                  : isProcurementStarted
                  ? `IN PROGRESS (STEP ${currentStepIndex + 1})`
                  : 'READY TO START'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Farmer: <strong className="text-slate-700">{request.farmerName}</strong> • Mandi: {request.centreName} ({request.centreState})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['procurement_completed', 'payment_processing', 'payment_completed'].includes(request.workflowStatus) && (
            <button
              type="button"
              onClick={handleDownloadReceiptPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 transition shadow-xs cursor-pointer"
              title="Download official APMC procurement & weighment receipt PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Receipt (PDF)</span>
            </button>
          )}
          {request.workflowStatus !== 'payment_completed' && (
            <button
              type="button"
              onClick={() => {
                const tmrw = new Date();
                tmrw.setDate(tmrw.getDate() + 1);
                setNewDateInput(tmrw.toISOString().split('T')[0]);
                setRescheduleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition"
              title="Hold procurement for absent farmer and assign new slot"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Farmer Absent? Hold & Reschedule</span>
            </button>
          )}
          <button
            onClick={loadDetails}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Checkpoints</span>
          </button>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>Payments Option</span>
          </Link>
        </div>
      </div>

      {/* Future-Date Procurement Policy Warning Banner */}
      {isFutureDate && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <span>Present-Day Procurement Restriction Enforced</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-200 text-amber-900">
                Scheduled for {bookingDay}
              </span>
            </div>
            <p className="text-amber-800">
              As per State Mandi Regulations, administrators can <strong>only conduct procurement on the present day</strong>.
              Advance procurement for upcoming dates ({bookingDay}) is restricted until the day of the appointment.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold hover:opacity-75 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Checkpoint Resumption Notice */}
      {isProcurementStarted && request.workflowStatus !== 'payment_completed' && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Checkpoint System Active:</strong> Procurement is safely recorded at{' '}
              <strong className="underline">Step {currentStepIndex + 1}: {workflowSteps[currentStepIndex]?.label}</strong>.
              If previously interrupted, all prior checkpoints remain certified and intact.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-800 uppercase tracking-wider">
            Checkpoint Resumed
          </span>
        </div>
      )}

      {/* 8-Step Checkpoint Stepper Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Procurement Verification Lifecycle</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each step represents a certified checkpoint. Process resumes from the last completed checkpoint.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Active Checkpoint:
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isProcurementFailed
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isProcurementFailed ? 'Failed (Quality Not Approved)' : workflowSteps[currentStepIndex]?.label}
            </span>
          </div>
        </div>

        {/* Horizontal Step Indicator (Interactive) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {workflowSteps.map((step, idx) => {
            const isFailedStep = isProcurementFailed && idx === 3;
            const isCompleted = !isProcurementFailed && (idx < currentStepIndex || normalizedStatus === 'payment_completed');
            const isCurrent = !isProcurementFailed && (idx === currentStepIndex && normalizedStatus !== 'payment_completed');
            const isSelected = effectiveStepIndex === idx;
            const Icon = step.icon;

            return (
              <button
                key={step.status}
                type="button"
                onClick={() => setActiveViewStep(idx)}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition cursor-pointer text-left w-full ${
                  isFailedStep
                    ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-xs ring-2 ring-rose-500/20'
                    : isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-600/30'
                    : isCurrent
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'border-slate-200 bg-emerald-50/30 text-slate-800 hover:bg-emerald-50/50'
                    : 'border-slate-100 bg-white text-slate-400 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mb-1.5 ${
                    isFailedStep
                      ? 'bg-rose-600 text-white font-bold'
                      : isSelected || isCurrent
                      ? 'bg-emerald-600 text-white font-bold'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isFailedStep ? (
                    <XCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[11px] font-semibold leading-tight">
                  {isFailedStep ? '4. Quality Not Approved' : step.label}
                </span>
                <span className="text-[9px] mt-1 uppercase font-bold tracking-wider">
                  {isFailedStep ? (
                    <span className="text-rose-700 font-bold">Failed</span>
                  ) : isCompleted ? (
                    'Completed'
                  ) : isCurrent ? (
                    'Active Now'
                  ) : (
                    'Pending'
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* OFFICER VERIFICATION ACTION PANEL (Dedicated UI per active step) */}
        {/* ----------------------------------------------------------------- */}
        <div className="pt-5 border-t border-slate-100 bg-slate-50/70 -mx-6 -mb-6 p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                Step-by-Step Gate Protocol
              </div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Officer Verification Action: {workflowSteps[effectiveStepIndex]?.label}</span>
                {activeViewStep !== null && activeViewStep !== currentStepIndex && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Previewing Step {effectiveStepIndex + 1}
                  </span>
                )}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {activeViewStep !== null && activeViewStep !== currentStepIndex && (
                <button
                  type="button"
                  onClick={() => setActiveViewStep(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Return to Active Checkpoint #{currentStepIndex + 1}
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium">
                Checkpoint #{effectiveStepIndex + 1} of {workflowSteps.length}
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* FAILED STATE: PROCUREMENT CANCELLED (QUALITY NOT APPROVED)     */}
          {/* ============================================================== */}
          {isProcurementFailed && (
            <div className="bg-white p-6 rounded-2xl border-2 border-rose-300 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">Procurement Cancelled — Quality Not Approved</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase">
                        Status: Failed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      This procurement transaction has been cancelled because the produce failed mandatory Fair Average Quality (FAQ) standards.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/requests"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Requests</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Farmer & Token:</span>
                  <span className="text-sm font-bold text-slate-900">{request.farmerName}</span>
                  <span className="font-mono text-slate-600 block mt-0.5">Token: {request.token}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Produce Inspected:</span>
                  <span className="text-sm font-bold text-slate-900">{request.cropName}</span>
                  <span className="text-slate-600 block mt-0.5">{request.quantityQuintals} Quintals (Claimed)</span>
                </div>
                <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
                  <span className="text-rose-800 font-semibold block">Failure & Rejection Reason:</span>
                  <span className="text-xs font-bold text-rose-900 block mt-0.5">
                    {verificationRecords.find((v) => v.status === 'rejected')?.notes || request.notes || 'Produce did not meet Fair Average Quality (FAQ) standards.'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Farmer Notification Status</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  An immediate alert message has been delivered to farmer <strong>{request.farmerName}</strong>'s dashboard informing them that the procurement was cancelled due to unapproved crop quality. Their status is marked as <strong>Failed</strong> and payment processing is halted.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: INITIAL STATE -> START PROCUREMENT BUTTON             */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex === 0 || normalizedStatus === 'booking') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isFutureDate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        Physical Gate Arrival & Procurement Intake
                      </h5>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        Ready for Intake
                      </span>
                      {isFutureDate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Early Arrival ({bookingDay})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Farmer <strong>{request.farmerName}</strong> is presenting produce at <strong>{request.centreName}</strong> ({request.centreState}).
                      {isFutureDate
                        ? ` Scheduled slot date is ${bookingDay}, but the farmer has arrived at Mandi. Officer can admit and start procurement immediately.`
                        : ' Click "Start Procurement" to admit the farmer to physical procurement intake and open checkpoint verifications.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    Token: {request.token}
                  </span>
                </div>
              </div>

              {/* Informative summary pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Commodity</span>
                  <strong className="text-slate-900">{request.cropName}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Claimed Qty</span>
                  <strong className="text-slate-900">{request.quantityQuintals} Quintals</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">MSP Rate</span>
                  <strong className="text-slate-900">₹{request.ratePerQuintal}/Qtl</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Farmer PIN</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Confidential (Farmer Only)</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={advancing}
                  onClick={handleStartProcurement}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{advancing ? 'Starting Intake...' : 'Start Physical Procurement Intake'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    setNewDateInput(tmrw.toISOString().split('T')[0]);
                    setRescheduleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 shadow-xs transition cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4 text-amber-700" />
                  <span>Farmer Absent? Hold & Reschedule</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: QR VERIFICATION                                       */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex === 1 || normalizedStatus === 'qr_verified') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Physical Gate QR Verification
                  </h5>
                  <p className="text-xs text-slate-500">
                    Scan the farmer's booking pass QR code using the gate camera or upload a pass image.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Scanner Active</span>
                  </span>
                </div>
              </div>

              {/* QR Scanner Area */}
              <div className="space-y-4">
                <div className="relative max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!cameraActive && (
                    <div className="p-6 text-center text-slate-300 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Optical Gate Scanner</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Open camera or upload photo of the farmer's QR pass
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-xs transition inline-flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Open Gate Camera</span>
                        </button>
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700 cursor-pointer transition">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>Upload Image</span>
                          <input type="file" accept="image/*" onChange={handleQrFileUpload} className="hidden" />
                        </label>
                      </div>
                      {cameraError && (
                        <p className="text-[11px] text-red-400 mt-2">{cameraError}</p>
                      )}
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative overflow-hidden shadow-2xl">
                        {/* Animated Laser Scanning Line */}
                        <motion.div
                          animate={{ y: [0, 210, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                          className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                        />
                        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                      <span className="mt-3 px-3 py-1 rounded-full bg-black/75 text-emerald-300 text-[11px] font-medium tracking-wide flex items-center gap-1.5 backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Align Farmer QR Pass inside frame
                      </span>
                    </div>
                  )}
                </div>

                {/* Verification Results Animated Banners (Visible ONLY when scanned) */}
                <AnimatePresence mode="wait">
                  {qrVerificationStatus === 'not_verified' && (
                    <motion.div
                      key="not_verified_banner"
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        x: [0, -8, 8, -6, 6, -3, 3, 0],
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.45 }}
                      className="p-4 bg-red-50/90 border-2 border-red-500 rounded-xl space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-red-900 font-bold text-sm">
                          <div className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
                            <XCircle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <span className="uppercase tracking-wide font-extrabold text-red-900">
                              NOT VERIFIED — INVALID / WRONG QR CODE
                            </span>
                            <p className="text-[11px] font-normal text-red-700">
                              The scanned code does not belong to this booking slot.
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-xs">
                          NOT VERIFIED
                        </span>
                      </div>

                      <div className="p-3 bg-red-100/80 rounded-lg text-xs font-bold text-red-950 flex items-start gap-2 border border-red-300/80">
                        <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                        <span>PROCUREMENT PROCESS STOPPED: Access is locked until the farmer's correct QR code is scanned.</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setQrVerificationStatus('idle');
                            setScannedQrCode(null);
                            startCamera();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Scan Again with Camera</span>
                        </button>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-300 text-red-800 text-xs font-semibold hover:bg-red-50 cursor-pointer shadow-xs transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Another QR Photo</span>
                          <input type="file" accept="image/*" onChange={handleQrFileUpload} className="hidden" />
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {qrVerificationStatus === 'verified' && (
                    <motion.div
                      key="verified_banner"
                      initial={{ opacity: 0, scale: 0.94, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                      className="p-4 bg-emerald-50/90 border-2 border-emerald-500 rounded-xl space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-sm">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="uppercase tracking-wide font-extrabold text-emerald-950">
                              VERIFIED — MATCH CONFIRMED
                            </span>
                            <p className="text-[11px] font-normal text-emerald-700">
                              Physical gate arrival authenticated for Token <strong className="font-mono text-emerald-900">{request.token}</strong>.
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                          VERIFIED ✓
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-emerald-800 pt-1">
                        <span>Gate checkpoint cleared. Click below to proceed to Document Verification.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setQrVerificationStatus('idle');
                            setScannedQrCode(null);
                            startCamera();
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Re-scan QR
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Camera controls when active */}
                {cameraActive && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload QR Image</span>
                      <input type="file" accept="image/*" onChange={handleQrFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Admin Manual Override / Surpass Section */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Admin Access: Surpass QR Verification Manually</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                    Officer Bypass Access
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Fair Verification Mandate: For procurement integrity, the farmer's 6-digit PIN and Opaque QR ID are kept confidential to the farmer. If the QR pass is unreadable or camera is unavailable, ask the farmer to speak or present their <strong>6-digit verification PIN</strong> from their booking pass or SMS.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="relative flex-1 min-w-[220px]">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleManualQrSurpass();
                        }
                      }}
                      placeholder="Enter farmer's 6-digit PIN, Token, or scanned QR"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleManualQrSurpass()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Verify Code</span>
                  </button>
                </div>
              </div>

              {/* Checkpoint Advance Button & Absent Farmer Action */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      qrVerifiedSuccess && qrVerificationStatus === 'verified'
                        ? 'bg-emerald-500'
                        : qrVerificationStatus === 'not_verified'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {qrVerifiedSuccess && qrVerificationStatus === 'verified'
                      ? 'Gate Pass Verified ✓ (Ready to Proceed)'
                      : qrVerificationStatus === 'not_verified'
                      ? 'Procurement Stopped: Invalid QR Code ✗'
                      : 'Awaiting QR Scan or Farmer PIN Entry'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tmrw = new Date();
                      tmrw.setDate(tmrw.getDate() + 1);
                      setNewDateInput(tmrw.toISOString().split('T')[0]);
                      setRescheduleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition cursor-pointer"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-700" />
                    <span>Farmer Absent? Hold</span>
                  </button>

                  <button
                    type="button"
                    disabled={advancing || !qrVerifiedSuccess || qrVerificationStatus !== 'verified'}
                    onClick={handleCompleteQrStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{advancing ? 'Saving Checkpoint...' : 'Confirm QR & Save Checkpoint'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: DOCUMENT VERIFICATION                                 */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex === 2 || normalizedStatus === 'document_verification') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Mandatory Document Verification
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check both physical government documents presented by <strong>{request.farmerName}</strong>.
                    Both documents must be checked to complete this checkpoint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarVerified(true);
                    setFarmerIdCardVerified(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verify Both Documents</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aadhaar Checkbox */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition ${
                    aadhaarVerified
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={aadhaarVerified}
                    onChange={(e) => setAadhaarVerified(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>Aadhaar Verified</span>
                      {aadhaarVerified && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Physical UIDAI Aadhaar Card inspected. Farmer identity and photo match state records.
                    </p>
                  </div>
                </label>

                {/* Farmer Identity Card Checkbox */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition ${
                    farmerIdCardVerified
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={farmerIdCardVerified}
                    onChange={(e) => setFarmerIdCardVerified(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>Farmer Identity Card Verified</span>
                      {farmerIdCardVerified && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      State Farmer Registry / Kisan Passbook verified. Land ownership / crop eligibility certified.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checkpoint Advance Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {aadhaarVerified && farmerIdCardVerified ? (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Both documents verified and certified. Ready to advance.
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Both checkboxes are required to complete document verification.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={advancing || !aadhaarVerified || !farmerIdCardVerified}
                  onClick={handleCompleteDocumentStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{advancing ? 'Saving Checkpoint...' : 'Complete Document Verification & Save Checkpoint'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: WEIGHT & RATE VERIFICATION                            */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex === 3 || normalizedStatus === 'weight_rate_verification') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Weighbridge Measurement & Rate Certification
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect electronic scale gross-minus-tare reading. Compare Claimed Weight vs Given Weight.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Claimed Weight (Read-only reference) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Claimed Weight (Slot Booking)
                  </span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {request.quantityQuintals}{' '}
                    <span className="text-xs font-normal text-slate-500">Quintals</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Stated by farmer in slot request</p>
                </div>

                {/* Given Weight (Actual Measured Input) */}
                <div className="p-4 rounded-xl bg-white border-2 border-emerald-500 shadow-xs">
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Given Weight (Measured Scale) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={givenWeight}
                      onChange={(e) => setGivenWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={String(request.quantityQuintals)}
                      className="w-full text-xl font-bold text-slate-900 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-600">Qtl</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1.5">
                    Gross weight minus truck tare weight
                  </p>
                </div>

                {/* Active State MSP Rate */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    MSP Rate for {request.centreState} *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900">₹</span>
                    <input
                      type="number"
                      value={verifiedRate}
                      onChange={(e) => setVerifiedRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xl font-bold text-slate-900 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-600">/Qtl</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Official State MSP Benchmark</p>
                </div>
              </div>

              {/* Crop Quality Assessment inside Step 4 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Crop Quality Verification (FAQ Standards) *
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Mandatory Mandi Inspection
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Quality Approved (According to FAQ rules) */}
                  <div
                    onClick={() => setQualityStatus('approved')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      qualityStatus === 'approved'
                        ? 'border-emerald-600 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Quality Approved (According to FAQ rules)</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Compliant
                        </span>
                      </div>
                      <h6 className="text-xs font-bold text-slate-900 mt-1">FAQ Compliant Grain Batch</h6>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Produce complies with all Fair Average Quality (FAQ) standards: clean, optimal moisture (≤ 12%), unblemished grains. Eligible for procurement at full MSP rate.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-emerald-200/60 text-xs font-semibold text-emerald-900 flex justify-between items-center">
                      <span>Action on Selection:</span>
                      <strong className="text-emerald-700 flex items-center gap-1 font-bold">
                        Process Continues <ChevronRight className="w-3.5 h-3.5" />
                      </strong>
                    </div>
                  </div>

                  {/* Option 2: Quality is not approved */}
                  <div
                    onClick={() => setQualityStatus('not_approved')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      qualityStatus === 'not_approved'
                        ? 'border-rose-600 bg-rose-50/90 shadow-xs ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Quality is not approved</span>
                        </span>
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          Non-Compliant
                        </span>
                      </div>
                      <h6 className="text-xs font-bold text-slate-900 mt-1">Fails Mandi FAQ Standards</h6>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Produce fails Fair Average Quality (FAQ) guidelines due to excess moisture (&gt; 12%), foreign matter, or damaged grains. Batch is disqualified from procurement.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-rose-200/60 text-xs font-semibold text-rose-900 flex justify-between items-center">
                      <span>Action on Selection:</span>
                      <strong className="text-rose-700 flex items-center gap-1 font-bold">
                        Cancel Procurement (Status: Failed)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional View: When Quality Approved */}
              {qualityStatus === 'approved' && (
                <>
                  {(() => {
                    const q = Number(givenWeight || request.verifiedQuantity || request.quantityQuintals);
                    const r = Number(verifiedRate || request.verifiedRate || request.ratePerQuintal);
                    const gross = q * r;

                    return (
                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-200">
                          <span className="font-bold text-emerald-900 uppercase tracking-wider">
                            Certified Payout Summary ({q} Quintals @ ₹{r}/Qtl)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                            Quality Approved (FAQ Rules)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block text-[11px]">Given Weight:</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              {q} Quintals
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block text-[11px]">Verified MSP Rate:</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              ₹{r}/Qtl
                            </span>
                          </div>
                          <div className="p-2.5 bg-emerald-100/70 rounded-lg border border-emerald-300 col-span-2 sm:col-span-1">
                            <span className="text-emerald-800 font-semibold block text-[11px]">Final Payable to Farmer:</span>
                            <span className="text-base font-bold text-emerald-900 font-mono">
                              ₹{gross.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Weighbridge Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weighbridge Slip Number / Moisture Reading / Quality Inspector Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={weighbridgeNotes}
                      onChange={(e) => setWeighbridgeNotes(e.target.value)}
                      placeholder="e.g. Weighbridge Slip #WB-8491, Moisture 11.2%, Fair Average Quality certified"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Checkpoint Advance Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={advancing || !givenWeight || Number(givenWeight) <= 0}
                      onClick={handleCompleteWeightRateStep}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{advancing ? 'Certifying Procurement...' : 'Quality Approved — Continue & Complete Procurement'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Conditional View: When Quality Not Approved */}
              {qualityStatus === 'not_approved' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Quality Not Approved: Disqualification & Cancellation Protocol</span>
                  </div>
                  <p className="text-rose-700 leading-relaxed">
                    Under APMC & Mandi Fair Average Quality (FAQ) guidelines, crops failing physical inspection cannot be procured under the government MSP scheme. Confirming cancellation marks this transaction as <strong>Failed</strong>, halts custody intake, updates the farmer dashboard immediately, and dispatches a cancellation message to the farmer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-1">
                      Reason for Quality Rejection / Remarks for Farmer *
                    </label>
                    <input
                      type="text"
                      value={qualityCancellationReason}
                      onChange={(e) => setQualityCancellationReason(e.target.value)}
                      placeholder="e.g. Produce does not meet Fair Average Quality (FAQ) standards. High moisture (15.2%) exceeding limit."
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={advancing}
                      onClick={handleCancelProcurementForQuality}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition disabled:opacity-40 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{advancing ? 'Cancelling Procurement...' : 'Cancel Procurement (Status: Failed)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: PROCUREMENT DONE RECEIPT                               */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex === 4 || (normalizedStatus === 'procurement_completed' && (activeViewStep === null || activeViewStep === 4))) && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Grain Custody Procurement Certified</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Checkpoint 5 Verified: Procurement Done
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Certified Given Weight:</span>
                  <span className="text-base font-bold text-slate-900">{request.verifiedQuantity || request.quantityQuintals} Quintals</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Certified MSP Rate:</span>
                  <span className="text-base font-bold text-slate-900">₹{request.verifiedRate || request.ratePerQuintal}/Quintal</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Quality Assessment:</span>
                  <span className="text-base font-bold text-slate-900 capitalize">
                    {request.qualityGrade ? request.qualityGrade.replace('_', ' ') : 'Good (0% ded.)'}
                    {request.qualityDeductionPercent ? ` (-${request.qualityDeductionPercent}%)` : ''}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block font-semibold">Total Payable to Farmer:</span>
                  <span className="text-base font-bold text-emerald-900 font-mono">
                    ₹{(request.finalValue || request.estimatedValue).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                The grain has been certified with quality deductions, weighed at the bridge, and taken into physical Mandi custody.
                Proceed to Payment Processing to disburse funds to <strong>{request.farmerName}</strong>.
              </p>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReceiptPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition shadow-xs cursor-pointer"
                  title="Download procurement & weighment receipt for the farmer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download Procurement Receipt (PDF)</span>
                </button>

                <button
                  type="button"
                  disabled={advancing}
                  onClick={handleAdvanceToPayment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition cursor-pointer"
                >
                  <span>Proceed to Payment Processing</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 6 & 7: PAYMENT PROCESSING & SETTLEMENT                    */}
          {/* ============================================================== */}
          {!isProcurementFailed && (effectiveStepIndex >= 5 || normalizedStatus === 'payment_processing' || normalizedStatus === 'payment_completed') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Direct Benefit Transfer (DBT) Payment Settlement
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amount Payable: <strong className="font-mono text-slate-900 text-sm">₹{(request.finalValue || request.estimatedValue).toLocaleString('en-IN')}</strong> to farmer <strong>{request.farmerName}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      request.workflowStatus === 'payment_completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {request.workflowStatus === 'payment_completed' ? 'PAYMENT COMPLETED' : 'PAYMENT PENDING'}
                  </span>
                </div>
              </div>

              {request.workflowStatus === 'payment_completed' ? (
                /* Already Completed State */
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Full Procurement Process Completed Successfully</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Payment of <strong>₹{(request.finalValue || request.estimatedValue).toLocaleString('en-IN')}</strong> at MSP rate <strong>₹{request.verifiedRate || request.ratePerQuintal}/Qtl</strong> has been credited to farmer {request.farmerName}'s bank account via Direct Benefit Transfer (DBT).
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <Link
                      to="/admin/payments"
                      className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 underline hover:text-emerald-950 transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>View in Payments Ledger</span>
                    </Link>

                    <span className="text-emerald-300 hidden sm:inline">•</span>

                    <button
                      type="button"
                      onClick={handleDownloadReceiptPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                      title="Download official APMC Procurement & Weighment Receipt (PDF)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Procurement Receipt (PDF)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment is in processing / pending state -> Two choices */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Current Status: Payment Pending (Process Incomplete)</span>
                    </div>
                    <p>
                      If payment is pending, the procurement process is NOT completed yet. The farmer has been notified
                      that payment is queued. The process completes when you or the admin disburses the payment below
                      or in the Payments option.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank Transaction Ref / UTR Number *
                      </label>
                      <input
                        type="text"
                        value={paymentUtr}
                        onChange={(e) => setPaymentUtr(e.target.value)}
                        placeholder="e.g. UTR-SBI-2026-984128"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        DBT Processing Notes
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. PFMS Batch #4102 / Direct Bank Credit"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={advancing}
                        onClick={handlePaymentPendingOnly}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Keep as Payment Pending (Incomplete)
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadReceiptPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-100/70 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition cursor-pointer"
                        title="Download provisional procurement receipt showing Payment Pending status"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-800" />
                        <span>Download Receipt (Payment Pending PDF)</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={advancing}
                      onClick={handleDisburseAndCompletePayment}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{advancing ? 'Completing Payment & Procurement...' : 'Complete Payment & Procurement'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking & Farmer Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Farmer Particulars */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Farmer Identity Particulars
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Farmer Name:</span>
              <span className="font-semibold text-slate-900">{request.farmerName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mobile Contact:</span>
              <span className="font-mono text-slate-800">{request.farmerMobile || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Origin District:</span>
              <span className="font-semibold text-slate-900">{request.farmerDistrict}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Security & Fair Verification:</span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Protected 6-Digit PIN & Encrypted QR
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mandi & Yard Allocation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Centre & Yard Allocation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mandi Centre:</span>
              <span className="font-semibold text-slate-900">{request.centreName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Centre State:</span>
              <span className="font-semibold text-slate-800">{request.centreState}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Slot Assigned Window:</span>
              <span className="font-semibold text-emerald-700">
                {request.assignedDate || request.preferredDate} • {request.assignedStartTime?.slice(0, 5) || '09:00'} - {request.assignedEndTime?.slice(0, 5) || '17:00'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Active State MSP Rate:</span>
              <span className="font-bold text-slate-900">₹{request.ratePerQuintal}/Quintal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoint Audit Trail Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Auditable Checkpoint History ({verificationRecords.length} checkpoints recorded)
        </h3>

        {verificationRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            No checkpoints recorded yet. Click "Start Procurement" to begin the verification lifecycle.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Verification Checkpoint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes / Seal Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationRecords.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {v.verifiedAt ? new Date(v.verifiedAt).toLocaleString() : new Date(v.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 capitalize">
                      {v.verificationType}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hold & Reschedule Modal for Absent Farmers */}
      <AnimatePresence>
        {rescheduleModalOpen && (
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
                      Token: <strong className="font-mono text-slate-700">{request.token}</strong> • {request.farmerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleHoldAndReschedule} className="p-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  The farmer is absent from the Mandi counter. Putting this procurement on <strong>HOLD</strong> frees the intake counter so the admin can proceed to the next farmer in sequence. The farmer will automatically receive a notification and SMS with the newly assigned date & time.
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
                    placeholder="e.g. Farmer absent at gate during call, rescheduled to tomorrow"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRescheduling}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>{isRescheduling ? 'Holding & Notifying...' : 'Hold & Notify Farmer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
