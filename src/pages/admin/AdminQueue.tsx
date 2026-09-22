import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminCentreItem } from '../../types/admin';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  calculateAverageProcessingTime,
  EtaCalculationResult,
} from '../../services/queueEtaService';
import { queueService } from '../../services/queueService';
import { notificationService } from '../../services/notificationService';
import { emailService } from '../../services/emailService';
import {
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Check,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  Plus,
  Search,
  Timer,
  Scale,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface CurrentlyProcessingFarmer {
  bookingId: string;
  token: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerEmail?: string;
  farmerDistrict: string;
  cropName: string;
  quantityQuintals: number;
  qrIdentifier?: string;
  startedTime: string; // ISO string
  notes?: string | null;
}

interface WaitingQueueItem {
  position: number;
  bookingId: string;
  token: string;
  farmerName: string;
  farmerMobile: string;
  farmerDistrict: string;
  cropName: string;
  quantityQuintals: number;
  checkInTime: string; // ISO string
  status: 'WAITING';
}

interface CompletedTodayItem {
  bookingId: string;
  token: string;
  farmerName: string;
  cropName: string;
  quantityQuintals: number;
  completedAt: string;
  durationMinutes: number;
}

interface TodayBookedAppointment {
  bookingId: string;
  token: string;
  farmerName: string;
  farmerMobile: string;
  cropName: string;
  quantityQuintals: number;
  assignedTimeSlot: string;
  bookingStatus: string;
}

const DELAY_REASONS = [
  'Heavy Crowd',
  'Slow Verification',
  'Equipment Issue',
  'Staff Delay',
  'Other',
] as const;

type DelayReasonType = typeof DELAY_REASONS[number];

export const AdminQueue: React.FC = () => {
  const { assignedState } = useAdminAuth();

  // Centre list & active selection
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [selectedCentreId, setSelectedCentreId] = React.useState<string>('');
  const [loadingCentres, setLoadingCentres] = React.useState<boolean>(true);

  // Queue Data State
  const [currentlyProcessing, setCurrentlyProcessing] = React.useState<CurrentlyProcessingFarmer | null>(null);
  const [waitingQueue, setWaitingQueue] = React.useState<WaitingQueueItem[]>([]);
  const [completedToday, setCompletedToday] = React.useState<CompletedTodayItem[]>([]);
  const [todayAppointments, setTodayAppointments] = React.useState<TodayBookedAppointment[]>([]);
  const [etaSummary, setEtaSummary] = React.useState<EtaCalculationResult>({
    averageProcessingMinutes: 20,
    sampleCount: 0,
    isBaseline: true,
    label: '20 mins (Baseline estimate)',
  });
  const [activeYardDelay, setActiveYardDelay] = React.useState<{
    reason: string;
    delayMinutes: number;
    notes?: string;
    timestamp: string;
  } | null>(null);

  // Operation UI State
  const [loadingQueue, setLoadingQueue] = React.useState<boolean>(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Real-time elapsed duration for currently processing farmer
  const [elapsedDurationMinutes, setElapsedDurationMinutes] = React.useState<number>(0);

  // Delay Modal State
  const [delayModalOpen, setDelayModalOpen] = React.useState<boolean>(false);
  const [selectedDelayReason, setSelectedDelayReason] = React.useState<DelayReasonType>('Heavy Crowd');
  const [selectedDelayMinutes, setSelectedDelayMinutes] = React.useState<number>(20);
  const [delayNotesInput, setDelayNotesInput] = React.useState<string>('');

  // Gate Check-in Search / Filter
  const [gateSearchQuery, setGateSearchQuery] = React.useState<string>('');
  const [showGateCheckin, setShowGateCheckin] = React.useState<boolean>(false);

  // Pause Intake state
  const [isIntakePaused, setIsIntakePaused] = React.useState<boolean>(false);
  const [pauseReason, setPauseReason] = React.useState<string>('');

  // Formatted current date string
  const todayFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const todayIsoDate = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // --------------------------------------------------------------------------
  // 1. Load Centres for Admin's Assigned State (RLS boundary enforced)
  // --------------------------------------------------------------------------
  const loadCentres = React.useCallback(async () => {
    if (!assignedState) return;
    setLoadingCentres(true);
    try {
      const data = await adminService.getCentresByState(assignedState);
      setCentres(data);
      if (data.length > 0) {
        setSelectedCentreId((prev) => {
          if (prev && data.some((c) => c.id === prev)) return prev;
          return data[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load centres for queue:', err);
      setErrorMessage('Failed to retrieve procurement centres for authorized state.');
    } finally {
      setLoadingCentres(false);
    }
  }, [assignedState]);

  React.useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  const selectedCentre = React.useMemo(() => {
    return centres.find((c) => c.id === selectedCentreId) || centres[0] || null;
  }, [centres, selectedCentreId]);

  // --------------------------------------------------------------------------
  // 2. Load REAL Queue Data from Supabase
  // --------------------------------------------------------------------------
  const loadQueueData = React.useCallback(async () => {
    if (!selectedCentreId) return;
    setLoadingQueue(true);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        const store = queueService.getStore(selectedCentreId);
        const active = store.checkedInEntries.find((e) => e.status === 'PROCESSING') || null;
        if (active) {
          setCurrentlyProcessing({
            bookingId: active.bookingId || `book-${active.token}`,
            token: active.token,
            farmerId: 'f-seed-01',
            farmerName: active.farmerNameHint || 'Gurdeep S.',
            farmerMobile: '98765-43210',
            farmerDistrict: selectedCentre?.district || 'Ludhiana',
            cropName: active.crop || 'Wheat',
            quantityQuintals: active.quantityQuintals || 30,
            startedTime: active.startedProcessingTimestamp || new Date().toISOString(),
          });
        } else {
          setCurrentlyProcessing(null);
        }

        const waiting: WaitingQueueItem[] = store.checkedInEntries
          .filter((e) => e.status === 'WAITING')
          .map((e, idx) => ({
            position: e.position || (idx + 1),
            bookingId: e.bookingId || `book-${e.token}`,
            token: e.token,
            farmerName: e.farmerNameHint || 'Farmer',
            farmerMobile: '98765-XXXXX',
            farmerDistrict: selectedCentre?.district || 'Ludhiana',
            cropName: e.crop || 'Wheat',
            quantityQuintals: e.quantityQuintals || 25,
            checkInTime: e.checkInTimestamp || new Date().toISOString(),
            status: 'WAITING' as const,
          }));
        setWaitingQueue(waiting);

        const completed: CompletedTodayItem[] = (store.completedEntries || []).map((c) => ({
          bookingId: c.bookingId || `comp-${c.token}`,
          token: c.token,
          farmerName: c.farmerNameHint || 'Farmer',
          cropName: c.crop || 'Wheat',
          quantityQuintals: c.quantityQuintals || 30,
          completedAt: c.completedAt,
          durationMinutes: c.durationMinutes || 20,
        }));
        setCompletedToday(completed);
        setIsIntakePaused(store.isPaused || false);
        setPauseReason(store.pauseReason || '');
        if (store.activeDelay?.isActive) {
          setActiveYardDelay({
            reason: store.activeDelay.reason,
            delayMinutes: store.activeDelay.delayMinutes,
            timestamp: new Date().toISOString(),
          });
        } else {
          setActiveYardDelay(null);
        }
        return;
      }

      // 1. Fetch real bookings for this centre
      const { data: bookingsData, error: bookingsErr } = await supabase
        .from('bookings')
        .select(`
          id,
          token,
          qr_identifier,
          farmer_id,
          centre_id,
          crop_id,
          quantity,
          preferred_date,
          preferred_time_preference,
          assigned_date,
          assigned_start_time,
          assigned_end_time,
          booking_status,
          created_at,
          profiles ( full_name, mobile, district, email ),
          crops ( name )
        `)
        .eq('centre_id', selectedCentreId);

      if (bookingsErr) {
        console.error('Error fetching bookings for queue:', bookingsErr);
        setErrorMessage(`Database error loading bookings: ${bookingsErr.message}`);
        return;
      }

      // 2. Fetch real queue events for this centre
      const { data: eventsData, error: eventsErr } = await supabase
        .from('queue_events')
        .select('*')
        .eq('centre_id', selectedCentreId)
        .order('event_time', { ascending: true });

      if (eventsErr) {
        console.error('Error fetching queue_events:', eventsErr);
        setErrorMessage(`Database error loading queue events: ${eventsErr.message}`);
        return;
      }

      const allBookings = bookingsData || [];
      const allEvents = eventsData || [];

      // Map events by booking_id
      const eventsByBooking = new Map<string, typeof allEvents>();
      allEvents.forEach((ev) => {
        if (!ev.booking_id) return;
        const list = eventsByBooking.get(ev.booking_id) || [];
        list.push(ev);
        eventsByBooking.set(ev.booking_id, list);
      });

      // Check active delay event for the centre today
      const delayRelatedEvents = allEvents.filter(
        (ev) => (ev.event_type === 'delayed' || ev.event_type === 'procurement_resumed') && ev.event_time.startsWith(todayIsoDate)
      );
      if (delayRelatedEvents.length > 0) {
        const latestDelay = delayRelatedEvents[delayRelatedEvents.length - 1];
        if (latestDelay.event_type === 'delayed') {
          setActiveYardDelay({
            reason: latestDelay.notes?.split(':')[0] || 'Operational Delay',
            delayMinutes: latestDelay.delay_minutes || 20,
            notes: latestDelay.notes || undefined,
            timestamp: latestDelay.event_time,
          });
        } else {
          setActiveYardDelay(null);
        }
      } else {
        setActiveYardDelay(null);
      }

      // Check active pause intake event for the centre today
      const pauseRelatedEvents = allEvents.filter(
        (ev) => (ev.event_type === 'procurement_paused' || ev.event_type === 'procurement_resumed') && ev.event_time.startsWith(todayIsoDate)
      );
      if (pauseRelatedEvents.length > 0) {
        const latestPause = pauseRelatedEvents[pauseRelatedEvents.length - 1];
        if (latestPause.event_type === 'procurement_paused') {
          setIsIntakePaused(true);
          setPauseReason(latestPause.notes || 'Intake paused by mandi operator');
        } else {
          setIsIntakePaused(false);
          setPauseReason('');
        }
      } else {
        const opState = await queueService.getOperationalQueueState(selectedCentreId);
        setIsIntakePaused(opState?.isPaused || false);
        setPauseReason(opState?.pauseReason || '');
      }

      // Collect durations of completed weighments for empirical ETA calculation
      const completedDurations: number[] = [];

      let currentActive: CurrentlyProcessingFarmer | null = null;
      const waitingList: WaitingQueueItem[] = [];
      const completedList: CompletedTodayItem[] = [];
      const notCheckedInList: TodayBookedAppointment[] = [];

      allBookings.forEach((b: any) => {
        const bookingEvents = eventsByBooking.get(b.id) || [];

        // Earliest check-in event
        const checkInEv = bookingEvents.find((e) => e.event_type === 'checked_in');

        // Processing started event
        const startEv = [...bookingEvents]
          .reverse()
          .find((e) => e.event_type === 'processing_started');

        // Processing completed event
        const completeEv = [...bookingEvents]
          .reverse()
          .find((e) => e.event_type === 'processing_completed');

        const fullName = b.profiles?.full_name || 'Farmer';
        const mobile = b.profiles?.mobile || '—';
        const district = b.profiles?.district || '';
        const cropName = b.crops?.name || 'Wheat';
        const qty = Number(b.quantity) || 0;

        // Is completed?
        if (completeEv || b.booking_status === 'completed') {
          const completedAt = completeEv?.event_time || b.created_at;
          const duration =
            completeEv?.estimated_processing_minutes ||
            (startEv
              ? Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startEv.event_time).getTime()) / 60000))
              : 20);

          if (completedAt.startsWith(todayIsoDate)) {
            completedDurations.push(duration);
            completedList.push({
              bookingId: b.id,
              token: b.token,
              farmerName: fullName,
              cropName,
              quantityQuintals: qty,
              completedAt,
              durationMinutes: duration,
            });
          }
          return;
        }

        // Is currently processing?
        // Must have processing_started event, no completion, and not completed
        if (startEv && !completeEv && b.booking_status !== 'completed') {
          // If no active processing is assigned yet, or this one is newer
          if (!currentActive || new Date(startEv.event_time) > new Date(currentActive.startedTime)) {
            currentActive = {
              bookingId: b.id,
              token: b.token,
              farmerId: b.farmer_id,
              farmerName: fullName,
              farmerMobile: mobile,
              farmerEmail: b.profiles?.email || '',
              farmerDistrict: district,
              cropName,
              quantityQuintals: qty,
              qrIdentifier: b.qr_identifier,
              startedTime: startEv.event_time,
              notes: startEv.notes,
            };
          }
          return;
        }

        // Is checked in and waiting in physical queue?
        // ONLY checked-in farmers belong to the physical queue.
        // A booking alone must NOT create a physical queue position.
        const isCheckedIn = !!checkInEv || b.booking_status === 'in_progress';
        if (isCheckedIn && b.booking_status !== 'cancelled' && b.booking_status !== 'no_show') {
          const checkInTimestamp = checkInEv?.event_time || b.created_at;
          waitingList.push({
            position: 0, // Assigned after sorting
            bookingId: b.id,
            token: b.token,
            farmerName: fullName,
            farmerMobile: mobile,
            farmerDistrict: district,
            cropName,
            quantityQuintals: qty,
            checkInTime: checkInTimestamp,
            status: 'WAITING',
          });
          return;
        }

        // A booked farmer who has not arrived / checked in yet
        if (
          (b.booking_status === 'booked' || b.booking_status === 'confirmed') &&
          (!b.assigned_date || b.assigned_date === todayIsoDate || b.preferred_date === todayIsoDate)
        ) {
          const slotDisplay = b.assigned_start_time
            ? `${b.assigned_start_time.substring(0, 5)} – ${b.assigned_end_time?.substring(0, 5) || ''}`
            : b.preferred_time_preference === 'morning'
            ? '09:00 AM – 02:00 PM'
            : b.preferred_time_preference === 'afternoon'
            ? '03:00 PM – 06:00 PM'
            : 'Scheduled Today';

          notCheckedInList.push({
            bookingId: b.id,
            token: b.token,
            farmerName: fullName,
            farmerMobile: mobile,
            cropName,
            quantityQuintals: qty,
            assignedTimeSlot: slotDisplay,
            bookingStatus: b.booking_status,
          });
        }
      });

      // Queue position must be based strictly on check-in order.
      // Token number must NEVER determine queue position.
      waitingList.sort((a, b) => {
        return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      });

      // Assign sequential 1-based positions
      const sequentialWaiting = waitingList.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      // Calculate ETA
      const etaCalc = calculateAverageProcessingTime(completedDurations);
      setEtaSummary(etaCalc);

      setCurrentlyProcessing(currentActive);
      setWaitingQueue(sequentialWaiting);
      setCompletedToday(completedList);
      setTodayAppointments(notCheckedInList);
    } catch (err: any) {
      console.error('Unhandled error in loadQueueData:', err);
      setErrorMessage(`Unexpected error: ${err.message || 'Check database connection'}`);
    } finally {
      setLoadingQueue(false);
    }
  }, [selectedCentreId, todayIsoDate]);

  React.useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // --------------------------------------------------------------------------
  // 3. Real-time Subscription (queueService + Supabase Realtime)
  // --------------------------------------------------------------------------
  React.useEffect(() => {
    if (!selectedCentreId) return;

    const unsubscribe = queueService.subscribeToCentreQueue(selectedCentreId, () => {
      loadQueueData();
    });

    let supabaseChannel: any = null;
    if (isSupabaseConfigured()) {
      supabaseChannel = supabase
        .channel(`admin_live_queue_${selectedCentreId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue_events',
            filter: `centre_id=eq.${selectedCentreId}`,
          },
          () => {
            loadQueueData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `centre_id=eq.${selectedCentreId}`,
          },
          () => {
            loadQueueData();
          }
        )
        .subscribe();
    }

    return () => {
      unsubscribe();
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [selectedCentreId, loadQueueData]);

  // --------------------------------------------------------------------------
  // 4. Live Elapsed Duration Timer for Currently Processing Farmer
  // --------------------------------------------------------------------------
  React.useEffect(() => {
    if (!currentlyProcessing?.startedTime) {
      setElapsedDurationMinutes(0);
      return;
    }

    const computeDuration = () => {
      const startMs = new Date(currentlyProcessing.startedTime).getTime();
      const diffMins = Math.max(0, Math.floor((Date.now() - startMs) / 60000));
      setElapsedDurationMinutes(diffMins);
    };

    computeDuration();
    const timer = setInterval(computeDuration, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, [currentlyProcessing]);

  // --------------------------------------------------------------------------
  // 5. Action: START PROCESSING (WAITING → PROCESSING)
  // --------------------------------------------------------------------------
  const handleStartProcessing = async (item: WaitingQueueItem) => {
    // Prevent another farmer from processing simultaneously
    if (currentlyProcessing) {
      setErrorMessage(
        `Counter #1 is already currently processing Token ${currentlyProcessing.token} (${currentlyProcessing.farmerName}). Complete current procurement first.`
      );
      return;
    }

    setActionLoading(`start-${item.bookingId}`);
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      // Advance queueService state immediately (reactive updates to all live telemetry subscribers)
      await queueService.startProcessing(item.token, selectedCentreId);

      if (isSupabaseConfigured()) {
        const { data: userAuth } = await supabase.auth.getUser();

        // 1. Insert queue_events record
        const nowIso = new Date().toISOString();
        const { error: eventErr } = await supabase.from('queue_events').insert({
          booking_id: item.bookingId,
          centre_id: selectedCentreId,
          event_type: 'processing_started',
          event_time: nowIso,
          notes: `Weighment processing started for Token ${item.token} at Counter #1`,
          created_by: userAuth.user?.id || null,
        });

        if (eventErr) {
          setErrorMessage(`Failed to record queue event: ${eventErr.message}`);
          return;
        }

        // 2. Update bookings status
        const { error: bookingErr } = await supabase
          .from('bookings')
          .update({
            booking_status: 'in_progress',
            updated_at: nowIso,
          })
          .eq('id', item.bookingId);

        if (bookingErr) {
          setErrorMessage(`Failed to update booking status: ${bookingErr.message}`);
          return;
        }

        // Sync procurement request workflow status and checkpoint
        try {
          await adminService.advanceWorkflowStatus({
            bookingId: item.bookingId,
            newStatus: 'qr_verified',
            notes: `Procurement processing started at Counter #1 from live Queue.`,
          });
        } catch (workflowErr) {
          console.warn('Could not advance workflow status from queue:', workflowErr);
        }
      }

      setSuccessBanner(`Token ${item.token} (${item.farmerName}) is now actively processing on Counter #1.`);
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Unexpected error starting processing: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------------------------
  // 6. Action: COMPLETE PROCUREMENT (PROCESSING → COMPLETED)
  // --------------------------------------------------------------------------
  const handleCompleteProcurement = async () => {
    if (!currentlyProcessing) return;

    setActionLoading('complete-procurement');
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      const token = currentlyProcessing.token;
      const nowIso = new Date().toISOString();
      const duration = Math.max(1, elapsedDurationMinutes || 15);

      // Advance queueService state immediately (moves next token to Counter #1, recalculates farmer positions & ETAs)
      await queueService.completeProcessing(token, selectedCentreId, duration);

      if (isSupabaseConfigured()) {
        // 0. Idempotency Check: Verify if booking is already marked completed
        const { data: existingBooking, error: checkErr } = await supabase
          .from('bookings')
          .select(`
            id,
            token,
            qr_identifier,
            quantity,
            booking_status,
            farmer_id,
            centre_id,
            crop_id,
            profiles ( full_name, mobile, district, email ),
            crops ( name ),
            procurement_centres ( name )
          `)
          .eq('id', currentlyProcessing.bookingId)
          .maybeSingle();

        if (checkErr) {
          setErrorMessage(`Failed to check booking status: ${checkErr.message}`);
          return;
        }

        if (existingBooking?.booking_status === 'completed') {
          setSuccessBanner(`Token ${currentlyProcessing.token} is already completed. Idempotency preserved.`);
          await loadQueueData();
          return;
        }

        const { data: userAuth } = await supabase.auth.getUser();

        // 1. Insert queue_events record
        const { error: eventErr } = await supabase.from('queue_events').insert({
          booking_id: currentlyProcessing.bookingId,
          centre_id: selectedCentreId,
          event_type: 'processing_completed',
          estimated_processing_minutes: duration,
          event_time: nowIso,
          notes: `Procurement & weighment completed for Token ${currentlyProcessing.token} in ${duration} mins`,
          created_by: userAuth.user?.id || null,
        });

        if (eventErr) {
          setErrorMessage(`Failed to complete procurement: ${eventErr.message}`);
          return;
        }

        // 2. Update bookings status in Supabase (Authoritative persistence)
        const { error: bookingErr } = await supabase
          .from('bookings')
          .update({
            booking_status: 'completed',
            updated_at: nowIso,
          })
          .eq('id', currentlyProcessing.bookingId);

        if (bookingErr) {
          setErrorMessage(`Failed to update booking status: ${bookingErr.message}`);
          return;
        }

        // Extract resolved details
        const farmerId = existingBooking?.farmer_id || currentlyProcessing.farmerId;
        const centreName =
          (existingBooking?.procurement_centres as any)?.name || selectedCentre?.name || 'Procurement Centre';
        const cropName = (existingBooking?.crops as any)?.name || currentlyProcessing.cropName || 'Crop';
        const qty = existingBooking?.quantity || currentlyProcessing.quantityQuintals || 0;
        const qrIdentifier = existingBooking?.qr_identifier || currentlyProcessing.qrIdentifier || token;
        const farmerProfile = existingBooking?.profiles as any;
        const farmerEmail = farmerProfile?.email || currentlyProcessing.farmerEmail || '';
        const farmerName = farmerProfile?.full_name || currentlyProcessing.farmerName || 'Farmer';

        // 3. Create persistent in-app notification for that farmer:
        if (farmerId) {
          try {
            const notifMessage = `Your procurement has been successfully completed.\n\nToken: ${token}\nCentre: ${centreName}\nCrop: ${cropName}\nQuantity: ${qty} Quintal`;

            await notificationService.createNotification({
              farmerId,
              bookingId: currentlyProcessing.bookingId,
              type: 'procurement',
              title: 'Procurement Completed',
              message: notifMessage,
            });
          } catch (notifErr) {
            console.warn('[AdminQueue] Failed to create in-app notification:', notifErr);
          }
        }

        // 4. Dispatch completion email (idempotent, using the same opaque QR identifier/token)
        let emailDispatched = false;
        if (farmerEmail) {
          try {
            const emailResult = await emailService.sendProcurementCompletionEmail({
              recipientEmail: farmerEmail,
              farmerName,
              token,
              centreName,
              cropName,
              quantityQuintals: qty,
              bookingId: currentlyProcessing.bookingId,
              opaqueQrIdentifier: qrIdentifier,
            });
            emailDispatched = emailResult.success;
          } catch (mailErr) {
            console.warn('[AdminQueue] Completion email dispatch error:', mailErr);
          }
        }
      }

      setSuccessBanner(
        `Procurement completed successfully for Token ${token}. Counter #1 is now clear and next vehicle is called.`
      );
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Unexpected error completing procurement: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------------------------
  // 7. Action: MARK DELAY
  // --------------------------------------------------------------------------
  const handleMarkDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit-delay');
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        setErrorMessage('Database configuration not found. Cannot log operational delay.');
        return;
      }

      const nowIso = new Date().toISOString();
      const { data: userAuth } = await supabase.auth.getUser();
      const notesCombined = delayNotesInput.trim()
        ? `${selectedDelayReason}: ${delayNotesInput.trim()}`
        : selectedDelayReason;

      const { error } = await supabase.from('queue_events').insert({
        centre_id: selectedCentreId,
        booking_id: currentlyProcessing?.bookingId || null,
        event_type: 'delayed',
        delay_minutes: selectedDelayMinutes,
        notes: notesCombined,
        event_time: nowIso,
        created_by: userAuth.user?.id || null,
      });

      if (error) {
        setErrorMessage(`Failed to record operational delay: ${error.message}`);
        return;
      }

      setDelayModalOpen(false);
      setDelayNotesInput('');
      setSuccessBanner(`Operational delay logged: ${selectedDelayReason} (+${selectedDelayMinutes} mins).`);
      queueService.markDelay({
        centreId: selectedCentreId,
        delayMinutes: selectedDelayMinutes,
        reason: selectedDelayReason,
        notes: notesCombined,
      });
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Error logging delay: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------------------------
  // 7b. Action: RESUME PROCUREMENT (Clear Operational Delay)
  // --------------------------------------------------------------------------
  const handleResumeProcurement = async () => {
    setActionLoading('resume-delay');
    setErrorMessage(null);
    try {
      if (!isSupabaseConfigured()) {
        setErrorMessage('Database configuration not found.');
        return;
      }
      const nowIso = new Date().toISOString();
      const { data: userAuth } = await supabase.auth.getUser();

      await supabase.from('queue_events').insert({
        centre_id: selectedCentreId,
        event_type: 'procurement_resumed',
        notes: 'Operational delay resolved; normal intake resumed',
        event_time: nowIso,
        created_by: userAuth.user?.id || null,
      });

      await queueService.resumeProcurement(selectedCentreId);
      setSuccessBanner('Delay resolved. Yard procurement resumed.');
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Failed to resume procurement: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------------------------
  // 7c. Action: PAUSE INTAKE & RESUME INTAKE
  // --------------------------------------------------------------------------
  const handlePauseIntake = async () => {
    setActionLoading('pause-intake');
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured()) {
        const { data: userAuth } = await supabase.auth.getUser();
        await supabase.from('queue_events').insert({
          centre_id: selectedCentreId,
          event_type: 'procurement_paused',
          notes: 'Intake paused by mandi operator',
          event_time: new Date().toISOString(),
          created_by: userAuth.user?.id || null,
        });
      }
      await queueService.pauseProcurement(selectedCentreId, 'Intake paused by mandi operator');
      setIsIntakePaused(true);
      setPauseReason('Intake paused by mandi operator');
      setSuccessBanner('Gate intake paused. Status updated in real time.');
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Failed to pause intake: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeIntake = async () => {
    setActionLoading('resume-intake');
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured()) {
        const { data: userAuth } = await supabase.auth.getUser();
        await supabase.from('queue_events').insert({
          centre_id: selectedCentreId,
          event_type: 'procurement_resumed',
          notes: 'Intake resumed by mandi operator',
          event_time: new Date().toISOString(),
          created_by: userAuth.user?.id || null,
        });
      }
      await queueService.resumeProcurement(selectedCentreId);
      setIsIntakePaused(false);
      setPauseReason('');
      setSuccessBanner('Gate intake resumed. Normal procurement operations ongoing.');
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Failed to resume intake: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------------------------
  // 8. Action: GATE CHECK-IN (BOOKING → CHECKED_IN → WAITING)
  // --------------------------------------------------------------------------
  const handleCheckInFarmer = async (appt: TodayBookedAppointment) => {
    setActionLoading(`checkin-${appt.bookingId}`);
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      if (!isSupabaseConfigured()) {
        setErrorMessage('Database configuration not found.');
        return;
      }

      const nowIso = new Date().toISOString();
      const { data: userAuth } = await supabase.auth.getUser();

      // 1. Create queue_events record for checked_in
      const { error: eventErr } = await supabase.from('queue_events').insert({
        booking_id: appt.bookingId,
        centre_id: selectedCentreId,
        event_type: 'checked_in',
        event_time: nowIso,
        notes: `Farmer checked in at Mandi gate for Token ${appt.token}`,
        created_by: userAuth.user?.id || null,
      });

      if (eventErr) {
        setErrorMessage(`Failed to check in farmer: ${eventErr.message}`);
        return;
      }

      // 2. Mark booking in progress
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({
          booking_status: 'in_progress',
          updated_at: nowIso,
        })
        .eq('id', appt.bookingId);

      if (bookingErr) {
        setErrorMessage(`Failed to update booking status: ${bookingErr.message}`);
        return;
      }

      setSuccessBanner(`Farmer ${appt.farmerName} (Token ${appt.token}) checked in and placed in Waiting Queue.`);
      await loadQueueData();
    } catch (err: any) {
      setErrorMessage(`Error checking in farmer: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered today's appointments for gate check-in
  const filteredAppointments = React.useMemo(() => {
    if (!gateSearchQuery.trim()) return todayAppointments;
    const q = gateSearchQuery.toLowerCase().trim();
    return todayAppointments.filter(
      (a) =>
        a.token.toLowerCase().includes(q) ||
        a.farmerName.toLowerCase().includes(q) ||
        a.farmerMobile.includes(q) ||
        a.cropName.toLowerCase().includes(q)
    );
  }, [todayAppointments, gateSearchQuery]);

  return (
    <div className="space-y-6">
      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Operation Notice:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUCCESS ALERT BANNER */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP HEADER: LIVE QUEUE BANNER                                         */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span>LIVE QUEUE COMMAND CENTER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">{assignedState} State Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Procurement Centre Live Queue
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {todayFormatted}
            </span>
            <span className="text-slate-300">•</span>
            <span>Counter #1 Single-Channel Processing Flow</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isIntakePaused ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleResumeIntake}
              isLoading={actionLoading === 'resume-intake'}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Intake</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseIntake}
              isLoading={actionLoading === 'pause-intake'}
              className="text-xs gap-1.5 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
            >
              <Pause className="w-3.5 h-3.5 text-rose-600" />
              <span>Pause Intake</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadQueueData}
            isLoading={loadingQueue}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingQueue ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGateCheckin(!showGateCheckin)}
            className={`text-xs gap-1.5 ${
              showGateCheckin
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gate Intake ({todayAppointments.length})</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PROCUREMENT CENTRE SELECTOR                                           */}
      {/* ===================================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Selected Procurement Centre:</span>
          </div>

          {loadingCentres ? (
            <div className="text-xs text-slate-400">Loading centres in {assignedState}...</div>
          ) : centres.length === 0 ? (
            <div className="text-xs text-rose-600 font-medium">
              No procurement centres registered for {assignedState}.
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="w-full sm:w-96 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}) — {c.operatingStatus}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Centre Details Banner */}
        {selectedCentre && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400">Yard Code: </span>
                <span className="font-mono font-bold text-slate-800">{selectedCentre.code}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="text-slate-400">Operating Hours: </span>
                <span className="font-medium text-slate-800">
                  {selectedCentre.openingTime?.substring(0, 5) || '09:00'} –{' '}
                  {selectedCentre.closingTime?.substring(0, 5) || '18:00'} (Lunch: 14:00–15:00)
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="text-slate-400">Status: </span>
                <Badge variant={selectedCentre.operatingStatus === 'OPEN' ? 'success' : 'warning'}>
                  {selectedCentre.operatingStatus}
                </Badge>
              </div>
            </div>

            {activeYardDelay && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Active Delay: {activeYardDelay.reason} (+{activeYardDelay.delayMinutes}m)
                </span>
                <button
                  type="button"
                  onClick={handleResumeProcurement}
                  disabled={actionLoading === 'resume-delay'}
                  className="ml-1.5 px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Resolve delay and resume normal intake"
                >
                  {actionLoading === 'resume-delay' ? 'Resuming...' : 'Resolve Delay'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SUMMARY METRICS CARDS (REAL SUPABASE DATA)                            */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Waiting */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Waiting</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {waitingQueue.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Checked-in at gate, in physical line</p>
          </div>
        </div>

        {/* 2. Processing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Processing</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-700 tracking-tight">
              {currentlyProcessing ? 1 : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentlyProcessing ? `Token ${currentlyProcessing.token} on weighbridge` : 'Counter #1 currently idle'}
            </p>
          </div>
        </div>

        {/* 3. Completed Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Today</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {completedToday.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Weighments verified today</p>
          </div>
        </div>

        {/* 4. Average Processing Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Processing Time</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {etaSummary.averageProcessingMinutes} <span className="text-sm font-normal text-slate-500">mins</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={etaSummary.label}>
              {etaSummary.label}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION: CURRENTLY PROCESSING                                         */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-base font-bold text-slate-900">CURRENTLY PROCESSING</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Counter #1 Electronic Weighbridge & Moisture Verification
            </p>
          </div>

          {currentlyProcessing && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ACTIVE WEIGHMENT
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {currentlyProcessing ? (
            <div className="space-y-6">
              {/* Farmer & Crop Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Procurement Token
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                      {currentlyProcessing.token}
                    </span>
                    <Badge variant="success">Counter #1</Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Farmer Particulars
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">{currentlyProcessing.farmerName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {currentlyProcessing.farmerMobile} {currentlyProcessing.farmerDistrict && `• ${currentlyProcessing.farmerDistrict}`}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Commodity & Quantity
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">{currentlyProcessing.cropName}</div>
                  <div className="text-xs text-emerald-700 font-bold mt-0.5">
                    {currentlyProcessing.quantityQuintals} Quintals ({(currentlyProcessing.quantityQuintals / 10).toFixed(1)} MT)
                  </div>
                </div>
              </div>

              {/* Started Time & Live Duration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] text-emerald-900 font-medium block">Started Time:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {new Date(currentlyProcessing.startedTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-emerald-200" />
                  <div>
                    <span className="text-[11px] text-emerald-900 font-medium block">Duration Elapsed:</span>
                    <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {elapsedDurationMinutes} mins
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDelayModalOpen(true)}
                    className="text-xs gap-1.5 border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mark Delay</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCompleteProcurement}
                    isLoading={actionLoading === 'complete-procurement'}
                    className="text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Complete Procurement</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Scale className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-slate-800">No farmer is currently being processed.</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Counter #1 electronic weighbridge is idle and ready. Select the first waiting farmer from the queue
                  below and click <span className="font-semibold text-emerald-700">Start Processing</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION: WAITING QUEUE                                                */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">WAITING QUEUE</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {waitingQueue.length} In Line
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical line order is determined strictly by gate check-in timestamp. Token does not alter position.
            </p>
          </div>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">No farmers are currently waiting in the physical queue.</p>
            <p className="text-[11px] text-slate-400">
              Farmers with bookings will appear here immediately upon gate check-in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Position</th>
                  <th className="py-3 px-4 font-semibold">Token</th>
                  <th className="py-3 px-4 font-semibold">Farmer</th>
                  <th className="py-3 px-4 font-semibold">Crop</th>
                  <th className="py-3 px-4 font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Check-in Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingQueue.map((item) => {
                  const isFirstWaiting = item.position === 1;
                  const isBusy = !!currentlyProcessing;

                  return (
                    <tr
                      key={item.bookingId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFirstWaiting ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Position */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                            isFirstWaiting
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{item.position}
                        </span>
                      </td>

                      {/* Token */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tracking-wider">
                        {item.token}
                      </td>

                      {/* Farmer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.farmerName}</div>
                        <div className="text-[11px] text-slate-500">{item.farmerMobile}</div>
                      </td>

                      {/* Crop */}
                      <td className="py-3 px-4 font-medium text-slate-800">{item.cropName}</td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.quantityQuintals} Q
                      </td>

                      {/* Check-in Time */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(item.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <Badge variant="info">WAITING</Badge>
                      </td>

                      {/* Action Button: ONLY THE FIRST WAITING FARMER GETS START PROCESSING */}
                      <td className="py-3 px-4 text-right">
                        {isFirstWaiting ? (
                          <div className="inline-flex items-center justify-end">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy || actionLoading === `start-${item.bookingId}`}
                              isLoading={actionLoading === `start-${item.bookingId}`}
                              onClick={() => handleStartProcessing(item)}
                              title={
                                isBusy
                                  ? 'Counter #1 is occupied. Complete currently processing farmer first.'
                                  : 'Start weighbridge processing'
                              }
                              className={`text-xs gap-1.5 ${
                                isBusy
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-transparent'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isBusy ? 'Counter Busy' : 'Start Processing'}</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">In Queue</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION: GATE INTAKE & CHECK-IN (OPTIONAL DRAWER / COLLAPSED BY DEFAULT)*/}
      {/* ===================================================================== */}
      {showGateCheckin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  MANDI GATE INTAKE & APPOINTMENTS ({todayAppointments.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Booked farmers scheduled for today who have not yet checked in. Gate officer clicks Check-In to enter
                them into the live physical queue.
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gateSearchQuery}
                onChange={(e) => setGateSearchQuery(e.target.value)}
                placeholder="Search token, name, mobile..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {gateSearchQuery ? 'No matching appointments found.' : 'All scheduled appointments have checked in today.'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72 divide-y divide-slate-100">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Token</th>
                    <th className="py-2.5 px-4 font-semibold">Farmer</th>
                    <th className="py-2.5 px-4 font-semibold">Crop & Qty</th>
                    <th className="py-2.5 px-4 font-semibold">Assigned Slot</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.bookingId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{appt.token}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900">{appt.farmerName}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({appt.farmerMobile})</span>
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        {appt.cropName} • {appt.quantityQuintals} Q
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {appt.assignedTimeSlot}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={actionLoading === `checkin-${appt.bookingId}`}
                          onClick={() => handleCheckInFarmer(appt)}
                          className="text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Check In at Gate</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: TODAY'S COMPLETED PROCUREMENT AUDIT TRAIL                    */}
      {/* ===================================================================== */}
      {completedToday.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Completed Weighments Today ({completedToday.length})
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto max-h-56 divide-y divide-slate-100 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-4">Token</th>
                  <th className="py-2 px-4">Farmer</th>
                  <th className="py-2 px-4">Commodity</th>
                  <th className="py-2 px-4">Quantity</th>
                  <th className="py-2 px-4">Completed At</th>
                  <th className="py-2 px-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedToday.map((c) => (
                  <tr key={c.bookingId} className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-mono font-bold text-slate-900">{c.token}</td>
                    <td className="py-2 px-4 font-medium text-slate-800">{c.farmerName}</td>
                    <td className="py-2 px-4 text-slate-600">{c.cropName}</td>
                    <td className="py-2 px-4 font-semibold text-slate-800">{c.quantityQuintals} Q</td>
                    <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-4 text-right font-medium text-purple-700">
                      {c.durationMinutes} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MARK OPERATIONAL DELAY                                         */}
      {/* ===================================================================== */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Mark Operational Delay</span>
              </div>
              <button
                onClick={() => setDelayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkDelaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Delay Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDelayReason}
                  onChange={(e) => setSelectedDelayReason(e.target.value as DelayReasonType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {DELAY_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Estimated Delay (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSelectedDelayMinutes(mins)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedDelayMinutes === mins
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={selectedDelayMinutes}
                  onChange={(e) => setSelectedDelayMinutes(Math.max(5, parseInt(e.target.value) || 15))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Operational Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={delayNotesInput}
                  onChange={(e) => setDelayNotesInput(e.target.value)}
                  placeholder="e.g. Weighbridge calibration recalibration or moisture meter re-check."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDelayModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={actionLoading === 'submit-delay'}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Record Operational Delay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
