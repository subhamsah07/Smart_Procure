/**
 * SmartProcure - Application Constants & Configurations
 */

import { Crop, IndianState, OperatingHours, ProcurementWorkflowStatus } from '../types';

/**
 * Default Centre Operating Hours
 * 09:00 AM - 02:00 PM (First Shift)
 * 02:00 PM - 03:00 PM (Scheduled Lunch Break)
 * 03:00 PM - 06:00 PM (Second Shift)
 */
export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  openTime: '09:00',
  closeTime: '18:00',
  lunchStartTime: '14:00',
  lunchEndTime: '15:00',
};

/**
 * Initial Government MSP / Configured Crop Rates (INR per quintal)
 */
export const INITIAL_CROPS: Crop[] = [
  {
    id: 'crop-wheat',
    name: 'Wheat',
    hindiName: 'गेहूं (Kanak)',
    configuredRatePerQuintal: 2275, // Govt MSP for Wheat
    unit: 'Quintal',
    season: 'Rabi',
    description: 'High-grade milling wheat conforming to Fair Average Quality (FAQ) standards.',
    isActive: true,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-paddy',
    name: 'Paddy',
    hindiName: 'धान (Paddy Common)',
    configuredRatePerQuintal: 2300, // Govt MSP for Paddy (Common)
    unit: 'Quintal',
    season: 'Kharif',
    description: 'A-grade paddy grain with moisture content under 17%.',
    isActive: true,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-maize',
    name: 'Maize',
    hindiName: 'मक्का (Makka)',
    configuredRatePerQuintal: 2090, // Govt MSP for Maize
    unit: 'Quintal',
    season: 'Kharif',
    description: 'Dry yellow maize cob kernel meeting food and feed procurement specs.',
    isActive: true,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-rice',
    name: 'Rice',
    hindiName: 'चावल (Chawal)',
    configuredRatePerQuintal: 3100, // Configured mill-grade rice
    unit: 'Quintal',
    season: 'Kharif',
    description: 'Processed white milled parboiled rice FAQ benchmark.',
    isActive: true,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-mustard',
    name: 'Mustard',
    hindiName: 'सरसों (Sarson)',
    configuredRatePerQuintal: 5650, // Govt MSP for Rapeseed & Mustard
    unit: 'Quintal',
    season: 'Rabi',
    description: 'High oil-yield black/brown mustard seeds with minimum 8% FAQ purity.',
    isActive: true,
    lastUpdatedAt: new Date().toISOString(),
  },
];

export interface WorkflowStepDefinition {
  status: ProcurementWorkflowStatus;
  stepNumber: number;
  label: string;
  hindiLabel: string;
  description: string;
  stageBadgeColor: string;
}

export const PROCUREMENT_WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  {
    stepNumber: 1,
    status: 'BOOKED',
    label: 'Slot Booked',
    hindiLabel: 'स्लॉट बुक हुआ',
    description: 'Unique token issued. Waiting for arrival at designated centre.',
    stageBadgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    stepNumber: 2,
    status: 'QR_VERIFIED',
    label: 'QR Verified',
    hindiLabel: 'क्यूआर सत्यापित',
    description: 'Security check-in completed. Gate entry recorded.',
    stageBadgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    stepNumber: 3,
    status: 'DOCS_VERIFIED',
    label: 'Documents Verified',
    hindiLabel: 'दस्तावेज़ सत्यापित',
    description: 'Land record, Aadhaar and bank details validated by field officer.',
    stageBadgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    stepNumber: 4,
    status: 'WEIGHT_VERIFIED',
    label: 'Weight & Rate Verified',
    hindiLabel: 'वजन एवं दर सत्यापन',
    description: 'Electronic weighbridge gross and tare measurement recorded.',
    stageBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    stepNumber: 5,
    status: 'PROCUREMENT_COMPLETED',
    label: 'Procurement Completed',
    hindiLabel: 'खरीद संपन्न',
    description: 'Grain unloaded to central warehouse. J-Form/receipt generated.',
    stageBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    stepNumber: 6,
    status: 'PAYMENT_PROCESSING',
    label: 'Payment Processing',
    hindiLabel: 'भुगतान प्रक्रियाधीन',
    description: 'Treasury payment batch prepared for Direct Benefit Transfer (DBT).',
    stageBadgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    stepNumber: 7,
    status: 'PAYMENT_COMPLETED',
    label: 'Payment Completed',
    hindiLabel: 'भुगतान पूर्ण',
    description: 'Funds successfully credited directly to farmer registered bank account.',
    stageBadgeColor: 'bg-green-100 text-green-900 border-green-300',
  },
];

export const STATES_AND_DISTRICTS: Record<IndianState, string[]> = {
  Punjab: ['Ludhiana', 'Amritsar', 'Patiala', 'Jalandhar', 'Bathinda', 'Sangrur', 'Firozpur', 'Hoshiarpur'],
  Haryana: ['Karnal', 'Kurukshetra', 'Ambala', 'Hisar', 'Sirsa', 'Rohtak', 'Panipat', 'Fatehabad'],
  'Uttar Pradesh': ['Varanasi', 'Lucknow', 'Kanpur', 'Agra', 'Meerut', 'Prayagraj', 'Gorakhpur', 'Aligarh'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Ujjain', 'Jabalpur', 'Gwalior', 'Sagar', 'Dewas', 'Hoshangabad'],
  Rajasthan: ['Jaipur', 'Kota', 'Alwar', 'Sri Ganganagar', 'Hanumangarh', 'Bikaner', 'Bharatpur'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Rohtas', 'Begusarai'],
  Maharashtra: ['Nashik', 'Pune', 'Nagpur', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati'],
  Gujarat: ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Junagadh', 'Mehsana', 'Bhavnagar'],
  Odisha: ['Bargarh', 'Sambalpur', 'Cuttack', 'Balasore', 'Ganjam', 'Kalahandi', 'Bhadrak'],
  Telangana: ['Nalgonda', 'Nizamabad', 'Karimnagar', 'Warangal', 'Khammam', 'Medak', 'Suryapet'],
  'West Bengal': ['Kolkata', 'Howrah', 'Hooghly', 'Purba Bardhaman', 'Paschim Bardhaman', 'Nadia', 'Murshidabad', 'North 24 Parganas'],
};
