import { ProcurementCentre } from '../../types';
import { BIHAR_CENTRES } from './bihar';
import { RAJASTHAN_CENTRES } from './rajasthan';
import { WEST_BENGAL_CENTRES } from './westBengal';
import { UTTAR_PRADESH_CENTRES } from './uttarPradesh';
import { MOCK_NEARBY_CENTRES } from '../mockData';

export const OTHER_STATE_CENTRES: ProcurementCentre[] = [
  ...MOCK_NEARBY_CENTRES,
  {
    id: 'centre-har-01',
    code: 'PC-HR-KAR-01',
    name: 'Karnal Grain Procurement Terminal',
    state: 'Haryana',
    district: 'Karnal',
    address: 'GT Road, Near National Highway Bypass, Karnal',
    pincode: '132001',
    operatingHours: { openTime: '09:00', closeTime: '18:00', lunchStartTime: '14:00', lunchEndTime: '15:00' },
    status: 'OPEN',
    capacityPerDayQuintals: 5000,
    currentQueueLength: 10,
    averageProcessingTimeMinutes: 20,
    latitude: 29.6857,
    longitude: 76.9905,
    contactNumber: '+91 184 225 6701',
    verified: true,
  },
];

export const ALL_PROCUREMENT_CENTRES: ProcurementCentre[] = [
  ...BIHAR_CENTRES,
  ...RAJASTHAN_CENTRES,
  ...WEST_BENGAL_CENTRES,
  ...UTTAR_PRADESH_CENTRES,
  ...OTHER_STATE_CENTRES,
];

/**
 * Approximate geographic reference coordinates for districts to compute real distance
 * when device GPS is waiting or disabled.
 */
export const DISTRICT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Bihar
  'bihar_patna': { lat: 25.5941, lon: 85.1376 },
  'bihar_gaya': { lat: 24.7955, lon: 85.0002 },
  'bihar_muzaffarpur': { lat: 26.1209, lon: 85.3647 },
  'bihar_bhagalpur': { lat: 25.2425, lon: 87.0189 },
  'bihar_darbhanga': { lat: 26.1542, lon: 85.8918 },
  'bihar_purnia': { lat: 25.7771, lon: 87.5089 },
  'bihar_rohtas': { lat: 24.9512, lon: 84.0298 },
  'bihar_begusarai': { lat: 25.4182, lon: 86.1272 },
  'bihar_bhojpur': { lat: 25.5562, lon: 84.6603 },
  'bihar_buxar': { lat: 25.5647, lon: 83.9777 },
  'bihar_samastipur': { lat: 25.8629, lon: 85.7811 },
  'bihar_saran': { lat: 25.7847, lon: 84.7274 },
  'bihar_vaishali': { lat: 25.6859, lon: 85.2146 },
  'bihar_east champaran': { lat: 26.6469, lon: 84.9089 },
  'bihar_west champaran': { lat: 26.8029, lon: 84.5028 },
  'bihar_nalanda': { lat: 25.1982, lon: 85.5189 },
  'bihar_siwan': { lat: 26.2243, lon: 84.3598 },
  'bihar_gopalganj': { lat: 26.4682, lon: 84.4421 },
  'bihar_katihar': { lat: 25.5539, lon: 87.5719 },
  'bihar_saharsa': { lat: 25.8835, lon: 86.6006 },
  'bihar': { lat: 25.5941, lon: 85.1376 },

  // Rajasthan
  'rajasthan_jaipur': { lat: 26.9124, lon: 75.7873 },
  'rajasthan_kota': { lat: 25.1800, lon: 75.8300 },
  'rajasthan_ganganagar': { lat: 29.9038, lon: 73.8772 },
  'rajasthan_hanumangarh': { lat: 29.5812, lon: 74.3298 },
  'rajasthan_bikaner': { lat: 28.0178, lon: 73.3119 },
  'rajasthan_jodhpur': { lat: 26.2389, lon: 73.0078 },
  'rajasthan_alwar': { lat: 27.5530, lon: 76.6346 },
  'rajasthan_bharatpur': { lat: 27.2152, lon: 77.4895 },
  'rajasthan_baran': { lat: 25.1012, lon: 76.5124 },
  'rajasthan_bundi': { lat: 25.4412, lon: 75.6415 },
  'rajasthan_jhalawar': { lat: 24.5421, lon: 76.1724 },
  'rajasthan_pali': { lat: 25.7712, lon: 73.3234 },
  'rajasthan_nagaur': { lat: 27.2012, lon: 73.7412 },
  'rajasthan_sikar': { lat: 27.6152, lon: 75.1412 },
  'rajasthan_tonk': { lat: 26.1612, lon: 75.7895 },
  'rajasthan_ajmer': { lat: 26.4189, lon: 74.6589 },
  'rajasthan_chittorgarh': { lat: 24.8895, lon: 74.6289 },
  'rajasthan_bhilwara': { lat: 25.3412, lon: 74.6321 },
  'rajasthan_udaipur': { lat: 24.5512, lon: 73.7125 },
  'rajasthan_sawai madhopur': { lat: 26.0124, lon: 76.3512 },
  'rajasthan': { lat: 26.9124, lon: 75.7873 },

  // West Bengal
  'west bengal_kolkata': { lat: 22.5726, lon: 88.3639 },
  'west bengal_howrah': { lat: 22.5958, lon: 88.3125 },
  'west bengal_hooghly': { lat: 22.8856, lon: 88.2315 },
  'west bengal_purba bardhaman': { lat: 23.2324, lon: 87.8612 },
  'west bengal_paschim bardhaman': { lat: 23.6812, lon: 86.9812 },
  'west bengal_nadia': { lat: 23.4012, lon: 88.5012 },
  'west bengal_murshidabad': { lat: 24.1012, lon: 88.2512 },
  'west bengal_north 24 parganas': { lat: 22.7212, lon: 88.4812 },
  'west bengal_south 24 parganas': { lat: 22.1912, lon: 88.2012 },
  'west bengal_malda': { lat: 25.0012, lon: 88.1412 },
  'west bengal_bankura': { lat: 23.2312, lon: 87.0712 },
  'west bengal_paschim medinipur': { lat: 22.4212, lon: 87.3212 },
  'west bengal_purba medinipur': { lat: 22.2812, lon: 87.9212 },
  'west bengal_birbhum': { lat: 23.9112, lon: 87.5312 },
  'west bengal_purulia': { lat: 23.3312, lon: 86.3612 },
  'west bengal_jalpaiguri': { lat: 26.5212, lon: 88.7212 },
  'west bengal_uttar dinajpur': { lat: 25.6212, lon: 88.1212 },
  'west bengal': { lat: 22.5726, lon: 88.3639 },

  // Uttar Pradesh
  'uttar pradesh_lucknow': { lat: 26.8467, lon: 80.9462 },
  'uttar pradesh_varanasi': { lat: 25.3176, lon: 82.9739 },
  'uttar pradesh_kanpur nagar': { lat: 26.4499, lon: 80.3319 },
  'uttar pradesh_agra': { lat: 27.1767, lon: 78.0081 },
  'uttar pradesh_meerut': { lat: 28.9845, lon: 77.7064 },
  'uttar pradesh_prayagraj': { lat: 25.4358, lon: 81.8463 },
  'uttar pradesh_gorakhpur': { lat: 26.7606, lon: 83.3732 },
  'uttar pradesh_aligarh': { lat: 27.8974, lon: 78.0880 },
  'uttar pradesh_bareilly': { lat: 28.3670, lon: 79.4304 },
  'uttar pradesh_moradabad': { lat: 28.8386, lon: 78.7733 },
  'uttar pradesh_mathura': { lat: 27.4924, lon: 77.6737 },
  'uttar pradesh_ayodhya': { lat: 26.7922, lon: 82.1998 },
  'uttar pradesh_barabanki': { lat: 26.9272, lon: 81.1824 },
  'uttar pradesh_basti': { lat: 26.8140, lon: 82.7630 },
  'uttar pradesh_jhansi': { lat: 25.4484, lon: 78.5685 },
  'uttar pradesh_banda': { lat: 25.4800, lon: 80.3400 },
  'uttar pradesh_hardoi': { lat: 27.4200, lon: 80.1300 },
  'uttar pradesh_sitapur': { lat: 27.5700, lon: 80.6800 },
  'uttar pradesh_shahjahanpur': { lat: 27.8800, lon: 79.9100 },
  'uttar pradesh_muzaffarnagar': { lat: 29.4700, lon: 77.7000 },
  'uttar pradesh_saharanpur': { lat: 29.9600, lon: 77.5500 },
  'uttar pradesh_bulandshahr': { lat: 28.4000, lon: 77.8500 },
  'uttar pradesh_etawah': { lat: 26.7800, lon: 79.0300 },
  'uttar pradesh_mainpuri': { lat: 27.2300, lon: 79.0200 },
  'uttar pradesh_deoria': { lat: 26.5000, lon: 83.7800 },
  'uttar pradesh_mirzapur': { lat: 25.1500, lon: 82.5800 },
  'uttar pradesh': { lat: 26.8467, lon: 80.9462 },

  // Punjab
  'punjab_ludhiana': { lat: 30.9010, lon: 75.8573 },
  'punjab': { lat: 30.9010, lon: 75.8573 },

  // Haryana
  'haryana_karnal': { lat: 29.6857, lon: 76.9905 },
  'haryana': { lat: 29.6857, lon: 76.9905 },
};

/**
 * Resolves location coordinates for a state and/or district.
 */
export function getDistrictCoordinates(state?: string, district?: string): { lat: number; lon: number } | null {
  if (!state) return null;
  const s = state.toLowerCase().trim();
  const d = district ? district.toLowerCase().trim() : '';

  if (d && d !== 'all') {
    const key = `${s}_${d}`;
    if (DISTRICT_COORDINATES[key]) return DISTRICT_COORDINATES[key];
  }

  if (DISTRICT_COORDINATES[s]) return DISTRICT_COORDINATES[s];
  return null;
}
