/**
 * SmartProcure - Administrator Domain Types
 * Enforces state boundary, queue operations, workflow verification, and operational monitoring.
 */

import {
  BookingStatus,
  CentreOperatingStatus,
  ProcurementWorkflowStatus,
  QueueEventType,
  VerificationStatus,
  PaymentStatus,
  NotificationType
} from './database';

export interface StateAdminDetails {
  id: string;
  authUserId: string;
  state: string;
  stateCode: string;
  adminName: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewStats {
  totalRequests: number;
  todayRequests: number;
  pendingVerification: number;
  inProgress: number;
  completed: number;
  totalCentres: number;
  activeQueueCount: number;
}

export interface AdminCentreItem {
  id: string;
  code: string;
  name: string;
  state: string;
  district: string;
  address: string;
  operatingStatus: CentreOperatingStatus;
  verified: boolean;
  openingTime: string;
  lunchStart: string;
  lunchEnd: string;
  closingTime: string;
  capacityPerDayQuintals: number;
  contactNumber: string | null;
  todayQueueCount: number;
}

export interface AdminRequestItem {
  id: string;
  requestId?: string | null;
  bookingId?: string;
  token: string;
  verificationCode?: string;
  qrIdentifier: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerDistrict: string;
  centreId: string;
  centreName: string;
  centreDistrict: string;
  centreState: string;
  cropId: string;
  cropName: string;
  quantityQuintals: number;
  preferredDate: string;
  preferredTimeSlot: string;
  assignedDate: string | null;
  assignedStartTime: string | null;
  assignedEndTime: string | null;
  bookingStatus: BookingStatus;
  workflowStatus: ProcurementWorkflowStatus;
  ratePerQuintal: number;
  estimatedValue: number;
  finalValue: number | null;
  qualityGrade?: 'good' | 'bad' | 'very_bad' | 'approved' | 'not_approved' | null;
  qualityDeductionPercent?: number;
  createdAt: string;
  paymentStatus?: PaymentStatus | null;
  paymentAmount?: number | null;
  paymentReference?: string | null;
}

export interface VerificationRecordItem {
  id: string;
  procurementRequestId: string;
  verificationType: 'QR verification' | 'document verification' | 'weight verification' | 'rate verification' | 'crop quality check';
  status: VerificationStatus;
  verifiedBy: string | null;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AdminPaymentItem {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  token: string;
  cropName: string;
  centreName?: string;
  quantityQuintals: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCropPriceItem {
  id: string;
  cropId: string;
  cropName: string;
  hindiName: string | null;
  state: string;
  rate: number;
  unit: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  active: boolean;
  createdAt: string;
}

export interface AdminNotificationItem {
  id: string;
  farmerId: string;
  farmerName?: string;
  bookingId: string | null;
  token?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
