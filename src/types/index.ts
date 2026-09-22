/**
 * SmartProcure - Core Domain Types and Architecture Definitions
 * Digital Agricultural Procurement & Queue Intelligence Platform
 */

export type IndianState = 
  | 'Punjab'
  | 'Haryana'
  | 'Uttar Pradesh'
  | 'Madhya Pradesh'
  | 'Rajasthan'
  | 'Bihar'
  | 'West Bengal'
  | 'Maharashtra'
  | 'Gujarat'
  | 'Odisha'
  | 'Telangana';

export interface District {
  id?: string;
  state: string;
  stateCode: string; // 'BR' | 'RJ' | 'UP' | 'WB'
  districtName: string;
  districtCode?: string;
  active: boolean;
}

export interface BankAccountDetails {
  accountNumber: string;
  confirmAccountNumber?: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
}

export interface FarmerProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  state: IndianState;
  district: string;
  bankAccount: BankAccountDetails;
  isEmailVerified: boolean;
  profileImageUrl?: string | null;
  preferredLanguage?: string;
  notificationPreferences?: {
    sms?: boolean;
    whatsapp?: boolean;
    voice?: boolean;
    delay_alerts?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type CropName = 'Wheat' | 'Paddy' | 'Maize' | 'Rice' | 'Mustard';

export interface Crop {
  id: string;
  name: CropName;
  hindiName: string;
  configuredRatePerQuintal: number; // in INR
  unit: 'Quintal' | 'Metric Ton';
  season: 'Kharif' | 'Rabi' | 'Zaid';
  description?: string;
  isActive: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt: string;
}

export interface StateCropPrice {
  id: string;
  cropId: string;
  cropName: CropName;
  hindiName?: string;
  state: IndianState;
  ratePerQuintal: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  active: boolean;
}

export type CentreStatus = 'OPEN' | 'BUSY' | 'LUNCH_BREAK' | 'CLOSED';

export interface OperatingHours {
  openTime: string;      // e.g. "09:00"
  closeTime: string;     // e.g. "18:00"
  lunchStartTime: string;// e.g. "14:00"
  lunchEndTime: string;  // e.g. "15:00"
}

export interface ProcurementCentre {
  id: string;
  code: string;          // e.g. "PC-PB-LDH-01"
  name: string;
  state: IndianState;
  district: string;
  address: string;
  pincode: string;
  operatingHours: OperatingHours;
  status: CentreStatus;
  capacityPerDayQuintals: number;
  currentQueueLength?: number | null; // Nullable when queue tracking is not yet connected
  averageProcessingTimeMinutes?: number | null; // Nullable when velocity tracking is not yet connected
  latitude: number;
  longitude: number;
  contactNumber: string;
  verified?: boolean;
  distanceKm?: number; // Calculated dynamically from farmer geolocation
}

/**
 * The official 7-step procurement lifecycle
 */
export type ProcurementWorkflowStatus = 
  | 'BOOKED'
  | 'QR_VERIFIED'
  | 'DOCS_VERIFIED'
  | 'WEIGHT_VERIFIED'
  | 'CROP_QUALITY_CHECK'
  | 'PROCUREMENT_COMPLETED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'booking'
  | 'qr_verified'
  | 'document_verification'
  | 'weight_rate_verification'
  | 'crop_quality_check'
  | 'procurement_completed'
  | 'payment_processing'
  | 'payment_completed';

export interface ProcurementSlot {
  slotId: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  allocatedCapacity: number;
  usedCapacity: number;
}

export interface ProcurementBooking {
  id: string;
  token: string;                     // Random 6-char identifier, e.g. "SP7K4Q" (never sequential)
  verificationCode?: string;         // 6-digit numeric PIN linked to token and QR code, e.g. "481920"
  opaqueQrIdentifier: string;        // Opaque cryptographic hash/UUID for secure verification (no sensitive farmer data exposed)
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerState: IndianState;
  farmerDistrict: string;
  centreId: string;
  centreName: string;
  cropId: string;
  cropName: CropName;
  quantityQuintals: number;
  ratePerQuintal: number;
  estimatedValue: number;            // quantity * rate (clearly labeled as estimated)
  bookingDate: string;               // YYYY-MM-DD
  preferredTimeSlot: string;         // e.g. "Morning (09:00 - 12:00)"
  assignedSlotTime: string;          // System assigned time e.g. "09:00 AM – 10:00 AM"
  assignedDate?: string;             // System assigned date e.g. "2026-09-08"
  assignedStartTime?: string;        // System assigned slot start e.g. "09:00:00"
  assignedEndTime?: string;          // System assigned slot end e.g. "10:00:00"
  slotStartTime?: string;            // Aliased slot start time
  slotEndTime?: string;              // Aliased slot end time
  checkedInAt?: string;              // ISO timestamp of gate check-in
  queueStatus?: string;              // Current queue status
  workflowStatus: ProcurementWorkflowStatus;
  bookingStatus?: string;
  
  // Queue Intelligence attributes
  queuePosition: number;             // Position in live queue (1 = currently being attended or next)
  estimatedWaitMinutes: number;      // Dynamically updated based on centre velocity
  estimatedArrivalTime: string;      // Expected arrival time for the farmer
  delayMinutes: number;              // Current system delay
  delayReason?: string;
  isLunchBreakCrossed: boolean;      // Whether ETA calculation factored in 14:00-15:00 pause
  
  // Actual verified metrics (filled during workflow stages)
  verifiedGrossWeight?: number;
  verifiedTareWeight?: number;
  verifiedNetWeightQuintals?: number;
  finalProcurementAmount?: number;
  paymentReferenceId?: string;
  paymentTimestamp?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface QueueLiveState {
  centreId: string;
  centreName: string;
  centreStatus: CentreStatus;
  activeProcessingToken: string | null;
  totalWaitingInQueue: number;
  currentAverageProcessingMinutes: number;
  lastUpdated: string;
  operationalAlert?: string;
}

export type AdminRole = 'STATE_ADMIN' | 'CENTRE_OFFICER' | 'WEIGHT_INSPECTOR';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  authorizedState: IndianState;
  assignedCentreId?: string;
}

export interface SystemNotification {
  id: string;
  recipientId: string;
  bookingId?: string;
  title: string;
  message: string;
  type: 'ETA_UPDATE' | 'DELAY_ALERT' | 'STATUS_CHANGE' | 'PAYMENT_CREDIT' | 'GENERAL_ADVISORY';
  isRead: boolean;
  createdAt: string;
}

export type {
  Database,
  CentreOperatingStatus,
  TimeSlotPreference,
  BookingStatus,
  QueueEventType,
  VerificationType,
  VerificationStatus,
  PaymentStatus,
  NotificationType,
} from './database';
