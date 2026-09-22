/**
 * SmartProcure - District Master Data Service
 * Provides authoritative administrative district records for:
 * 1. Bihar (BR) - 38 districts
 * 2. Rajasthan (RJ) - 41 districts (as updated post-Dec 2024 Cabinet review)
 * 3. Uttar Pradesh (UP) - 75 districts
 * 4. West Bengal (WB) - 23 districts
 * Total: 177 administrative districts.
 *
 * Interfaces with `public.districts` in Supabase with zero-failure local fallback.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { District } from '../types';

export interface RawDistrictRow {
  id: string;
  state: string;
  state_code: string;
  district_name: string;
  district_code: string | null;
  active: boolean;
  created_at?: string;
}

export const STATE_CODE_MAP: Record<string, string> = {
  BR: 'Bihar',
  Bihar: 'Bihar',
  RJ: 'Rajasthan',
  Rajasthan: 'Rajasthan',
  UP: 'Uttar Pradesh',
  'Uttar Pradesh': 'Uttar Pradesh',
  WB: 'West Bengal',
  'West Bengal': 'West Bengal',
  PB: 'Punjab',
  Punjab: 'Punjab',
  HR: 'Haryana',
  Haryana: 'Haryana',
  MH: 'Maharashtra',
  Maharashtra: 'Maharashtra',
  MP: 'Madhya Pradesh',
  'Madhya Pradesh': 'Madhya Pradesh',
};

export const STATE_TO_CODE_MAP: Record<string, string> = {
  Bihar: 'BR',
  BR: 'BR',
  Rajasthan: 'RJ',
  RJ: 'RJ',
  'Uttar Pradesh': 'UP',
  UP: 'UP',
  'West Bengal': 'WB',
  WB: 'WB',
  Punjab: 'PB',
  PB: 'PB',
  Haryana: 'HR',
  HR: 'HR',
  Maharashtra: 'MH',
  MH: 'MH',
  'Madhya Pradesh': 'MP',
  MP: 'MP',
};

/**
 * 177 Authoritative Government Districts Master Catalog
 * (Bihar: 38, Rajasthan: 41, Uttar Pradesh: 75, West Bengal: 23)
 */
export const AUTHORITATIVE_177_DISTRICTS: District[] = [
  // --- BIHAR (38 Districts) ---
  { state: 'Bihar', stateCode: 'BR', districtName: 'Araria', districtCode: 'BR-AR', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Arwal', districtCode: 'BR-AW', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Aurangabad', districtCode: 'BR-AU', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Banka', districtCode: 'BR-BA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Begusarai', districtCode: 'BR-BE', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Bhagalpur', districtCode: 'BR-BG', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Bhojpur', districtCode: 'BR-BJ', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Buxar', districtCode: 'BR-BU', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Darbhanga', districtCode: 'BR-DA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'East Champaran', districtCode: 'BR-EC', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Gaya', districtCode: 'BR-GA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Gopalganj', districtCode: 'BR-GO', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Jamui', districtCode: 'BR-JA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Jehanabad', districtCode: 'BR-JE', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Kaimur', districtCode: 'BR-KM', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Katihar', districtCode: 'BR-KT', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Khagaria', districtCode: 'BR-KH', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Kishanganj', districtCode: 'BR-KI', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Lakhisarai', districtCode: 'BR-LA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Madhepura', districtCode: 'BR-MP', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Madhubani', districtCode: 'BR-MB', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Munger', districtCode: 'BR-MG', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Muzaffarpur', districtCode: 'BR-MZ', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Nalanda', districtCode: 'BR-NL', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Nawada', districtCode: 'BR-NW', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Patna', districtCode: 'BR-PA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Purnia', districtCode: 'BR-PU', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Rohtas', districtCode: 'BR-RO', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Saharsa', districtCode: 'BR-SH', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Samastipur', districtCode: 'BR-SM', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Saran', districtCode: 'BR-SR', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Sheikhpura', districtCode: 'BR-SK', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Sheohar', districtCode: 'BR-SO', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Sitamarhi', districtCode: 'BR-ST', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Siwan', districtCode: 'BR-SW', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Supaul', districtCode: 'BR-SP', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'Vaishali', districtCode: 'BR-VA', active: true },
  { state: 'Bihar', stateCode: 'BR', districtName: 'West Champaran', districtCode: 'BR-WC', active: true },

  // --- RAJASTHAN (41 Districts) ---
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Ajmer', districtCode: 'RJ-AJ', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Alwar', districtCode: 'RJ-AL', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Balotra', districtCode: 'RJ-BL', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Banswara', districtCode: 'RJ-BW', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Baran', districtCode: 'RJ-BN', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Barmer', districtCode: 'RJ-BM', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Beawar', districtCode: 'RJ-BE', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Bharatpur', districtCode: 'RJ-BP', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Bhilwara', districtCode: 'RJ-BW', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Bikaner', districtCode: 'RJ-BK', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Bundi', districtCode: 'RJ-BD', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Chittorgarh', districtCode: 'RJ-CR', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Churu', districtCode: 'RJ-CU', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Dausa', districtCode: 'RJ-DA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Deeg', districtCode: 'RJ-DG', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Dholpur', districtCode: 'RJ-DH', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Didwana-Kuchaman', districtCode: 'RJ-DK', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Dungarpur', districtCode: 'RJ-DU', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Hanumangarh', districtCode: 'RJ-HA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jaipur', districtCode: 'RJ-JP', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jaisalmer', districtCode: 'RJ-JS', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jalore', districtCode: 'RJ-JL', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jhalawar', districtCode: 'RJ-JW', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jhunjhunu', districtCode: 'RJ-JJ', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Jodhpur', districtCode: 'RJ-JD', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Karauli', districtCode: 'RJ-KA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Khairthal-Tijara', districtCode: 'RJ-KT', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Kota', districtCode: 'RJ-KO', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Kotputli-Behror', districtCode: 'RJ-KB', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Nagaur', districtCode: 'RJ-NA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Pali', districtCode: 'RJ-PA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Phalodi', districtCode: 'RJ-PH', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Pratapgarh', districtCode: 'RJ-PR', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Rajsamand', districtCode: 'RJ-RA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Salumber', districtCode: 'RJ-SA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Sawai Madhopur', districtCode: 'RJ-SM', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Sikar', districtCode: 'RJ-SK', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Sirohi', districtCode: 'RJ-SR', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Sri Ganganagar', districtCode: 'RJ-GA', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Tonk', districtCode: 'RJ-TO', active: true },
  { state: 'Rajasthan', stateCode: 'RJ', districtName: 'Udaipur', districtCode: 'RJ-UD', active: true },

  // --- UTTAR PRADESH (75 Districts) ---
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Agra', districtCode: 'UP-AG', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Aligarh', districtCode: 'UP-AL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Ambedkar Nagar', districtCode: 'UP-AN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Amethi', districtCode: 'UP-AM', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Amroha', districtCode: 'UP-AR', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Auraiya', districtCode: 'UP-AU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Ayodhya', districtCode: 'UP-AY', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Azamgarh', districtCode: 'UP-AZ', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Baghpat', districtCode: 'UP-BG', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Bahraich', districtCode: 'UP-BH', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Ballia', districtCode: 'UP-BL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Balrampur', districtCode: 'UP-BP', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Banda', districtCode: 'UP-BN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Barabanki', districtCode: 'UP-BB', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Bareilly', districtCode: 'UP-BR', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Basti', districtCode: 'UP-BS', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Bhadohi', districtCode: 'UP-BD', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Bijnor', districtCode: 'UP-BI', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Budaun', districtCode: 'UP-BU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Bulandshahr', districtCode: 'UP-BL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Chandauli', districtCode: 'UP-CD', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Chitrakoot', districtCode: 'UP-CK', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Deoria', districtCode: 'UP-DE', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Etah', districtCode: 'UP-ET', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Etawah', districtCode: 'UP-EW', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Farrukhabad', districtCode: 'UP-FR', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Fatehpur', districtCode: 'UP-FT', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Firozabad', districtCode: 'UP-FI', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Gautam Buddha Nagar', districtCode: 'UP-GB', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Ghaziabad', districtCode: 'UP-GZ', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Ghazipur', districtCode: 'UP-GP', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Gonda', districtCode: 'UP-GN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Gorakhpur', districtCode: 'UP-GR', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Hamirpur', districtCode: 'UP-HM', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Hapur', districtCode: 'UP-HP', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Hardoi', districtCode: 'UP-HD', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Hathras', districtCode: 'UP-HT', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Jalaun', districtCode: 'UP-JL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Jaunpur', districtCode: 'UP-JU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Jhansi', districtCode: 'UP-JH', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kannauj', districtCode: 'UP-KJ', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kanpur Dehat', districtCode: 'UP-KD', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kanpur Nagar', districtCode: 'UP-KN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kasganj', districtCode: 'UP-KG', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kaushambi', districtCode: 'UP-KS', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kheri', districtCode: 'UP-KH', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Kushinagar', districtCode: 'UP-KU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Lalitpur', districtCode: 'UP-LA', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Lucknow', districtCode: 'UP-LU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Maharajganj', districtCode: 'UP-MG', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Mahoba', districtCode: 'UP-MH', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Mainpuri', districtCode: 'UP-MN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Mathura', districtCode: 'UP-MT', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Mau', districtCode: 'UP-MU', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Meerut', districtCode: 'UP-ME', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Mirzapur', districtCode: 'UP-MZ', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Moradabad', districtCode: 'UP-MO', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Muzaffarnagar', districtCode: 'UP-MF', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Pilibhit', districtCode: 'UP-PI', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Pratapgarh', districtCode: 'UP-PR', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Prayagraj', districtCode: 'UP-AL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Raebareli', districtCode: 'UP-RB', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Rampur', districtCode: 'UP-RA', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Saharanpur', districtCode: 'UP-SA', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Sambhal', districtCode: 'UP-SB', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Sant Kabir Nagar', districtCode: 'UP-SK', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Shahjahanpur', districtCode: 'UP-SJ', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Shamli', districtCode: 'UP-SH', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Shravasti', districtCode: 'UP-SV', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Siddharthnagar', districtCode: 'UP-SN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Sitapur', districtCode: 'UP-SI', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Sonbhadra', districtCode: 'UP-SO', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Sultanpur', districtCode: 'UP-SL', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Unnao', districtCode: 'UP-UN', active: true },
  { state: 'Uttar Pradesh', stateCode: 'UP', districtName: 'Varanasi', districtCode: 'UP-VA', active: true },

  // --- WEST BENGAL (23 Districts) ---
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Alipurduar', districtCode: 'WB-AD', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Bankura', districtCode: 'WB-BN', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Birbhum', districtCode: 'WB-BI', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Cooch Behar', districtCode: 'WB-CB', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Dakshin Dinajpur', districtCode: 'WB-DD', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Darjeeling', districtCode: 'WB-DA', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Hooghly', districtCode: 'WB-HG', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Howrah', districtCode: 'WB-HR', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Jalpaiguri', districtCode: 'WB-JA', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Jhargram', districtCode: 'WB-JH', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Kalimpong', districtCode: 'WB-KP', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Kolkata', districtCode: 'WB-KO', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Malda', districtCode: 'WB-MA', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Murshidabad', districtCode: 'WB-MU', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Nadia', districtCode: 'WB-NA', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'North 24 Parganas', districtCode: 'WB-NP', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Paschim Bardhaman', districtCode: 'WB-PB', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Paschim Medinipur', districtCode: 'WB-PM', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Purba Bardhaman', districtCode: 'WB-PU', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Purba Medinipur', districtCode: 'WB-ED', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Purulia', districtCode: 'WB-PR', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'South 24 Parganas', districtCode: 'WB-SP', active: true },
  { state: 'West Bengal', stateCode: 'WB', districtName: 'Uttar Dinajpur', districtCode: 'WB-UD', active: true },

  // --- PUNJAB ---
  { state: 'Punjab', stateCode: 'PB', districtName: 'Amritsar', districtCode: 'PB-AM', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Barnala', districtCode: 'PB-BN', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Bathinda', districtCode: 'PB-BA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Faridkot', districtCode: 'PB-FR', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Fatehgarh Sahib', districtCode: 'PB-FT', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Fazilka', districtCode: 'PB-FZ', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Firozpur', districtCode: 'PB-FI', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Gurdaspur', districtCode: 'PB-GU', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Hoshiarpur', districtCode: 'PB-HO', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Jalandhar', districtCode: 'PB-JA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Kapurthala', districtCode: 'PB-KA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Ludhiana', districtCode: 'PB-LU', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Malerkotla', districtCode: 'PB-ML', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Mansa', districtCode: 'PB-MA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Moga', districtCode: 'PB-MO', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Muktsar', districtCode: 'PB-MU', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Pathankot', districtCode: 'PB-PA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Patiala', districtCode: 'PB-PT', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Rupnagar', districtCode: 'PB-RU', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'SAS Nagar (Mohali)', districtCode: 'PB-SA', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'SBS Nagar (Nawanshahr)', districtCode: 'PB-SB', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Sangrur', districtCode: 'PB-SN', active: true },
  { state: 'Punjab', stateCode: 'PB', districtName: 'Tarn Taran', districtCode: 'PB-TT', active: true },

  // --- HARYANA ---
  { state: 'Haryana', stateCode: 'HR', districtName: 'Ambala', districtCode: 'HR-AM', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Bhiwani', districtCode: 'HR-BH', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Charkhi Dadri', districtCode: 'HR-CD', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Faridabad', districtCode: 'HR-FR', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Fatehabad', districtCode: 'HR-FT', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Gurugram', districtCode: 'HR-GU', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Hisar', districtCode: 'HR-HI', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Jhajjar', districtCode: 'HR-JH', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Jind', districtCode: 'HR-JI', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Kaithal', districtCode: 'HR-KT', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Karnal', districtCode: 'HR-KR', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Kurukshetra', districtCode: 'HR-KU', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Mahendragarh', districtCode: 'HR-MH', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Nuh', districtCode: 'HR-NU', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Palwal', districtCode: 'HR-PL', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Panchkula', districtCode: 'HR-PK', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Panipat', districtCode: 'HR-PP', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Rewari', districtCode: 'HR-RE', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Rohtak', districtCode: 'HR-RO', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Sirsa', districtCode: 'HR-SI', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Sonipat', districtCode: 'HR-SO', active: true },
  { state: 'Haryana', stateCode: 'HR', districtName: 'Yamunanagar', districtCode: 'HR-YN', active: true },

  // --- MAHARASHTRA ---
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Ahmednagar', districtCode: 'MH-AH', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Akola', districtCode: 'MH-AK', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Amravati', districtCode: 'MH-AM', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Chhatrapati Sambhaji Nagar', districtCode: 'MH-CS', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Jalgaon', districtCode: 'MH-JL', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Kolhapur', districtCode: 'MH-KO', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Latur', districtCode: 'MH-LA', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Nagpur', districtCode: 'MH-NG', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Nanded', districtCode: 'MH-ND', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Nashik', districtCode: 'MH-NS', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Pune', districtCode: 'MH-PU', active: true },
  { state: 'Maharashtra', stateCode: 'MH', districtName: 'Solapur', districtCode: 'MH-SO', active: true },
];

export const districtService = {
  /**
   * Resolve state code to canonical full name
   */
  resolveStateName(stateOrCode: string): string {
    return STATE_CODE_MAP[stateOrCode] || stateOrCode;
  },

  /**
   * Resolve state name to 2-letter state code
   */
  resolveStateCode(stateOrCode: string): string {
    return STATE_TO_CODE_MAP[stateOrCode] || stateOrCode.toUpperCase();
  },

  /**
   * Fetches all active districts for a specific state or state_code
   * from public.districts in Supabase, with automatic fallback to the
   * authoritative master dataset if table is not yet seeded.
   */
  async getDistrictsByState(stateOrCode: string): Promise<District[]> {
    if (!stateOrCode || stateOrCode.toLowerCase() === 'all' || stateOrCode.toLowerCase() === 'all states') {
      return AUTHORITATIVE_177_DISTRICTS.map((d) => ({
        ...d,
        id: d.id || d.districtCode || `${d.stateCode}-${d.districtName.replace(/\s+/g, '_')}`,
      })).sort((a, b) => a.districtName.localeCompare(b.districtName));
    }

    const fullStateName = this.resolveStateName(stateOrCode);
    const code = this.resolveStateCode(stateOrCode);

    if (isSupabaseConfigured() && supabase) {
      try {
        let { data, error } = await supabase
          .from('districts')
          .select('id, state, state_code, district_name, district_code, active')
          .eq('state', fullStateName)
          .eq('active', true)
          .order('district_name', { ascending: true });

        if ((!data || data.length === 0) && !error) {
          const res = await supabase
            .from('districts')
            .select('id, state, state_code, district_name, district_code, active')
            .eq('state_code', code)
            .eq('active', true)
            .order('district_name', { ascending: true });
          data = res.data;
          error = res.error;
        }

        if (!error && data && data.length > 0) {
          return (data as RawDistrictRow[]).map((d) => ({
            id: d.id,
            state: d.state,
            stateCode: d.state_code,
            districtName: d.district_name,
            districtCode: d.district_code || undefined,
            active: d.active,
          }));
        }
      } catch (err) {
        console.warn('Could not query public.districts from Supabase, using authoritative fallback:', err);
      }
    }

    // Fallback to Authoritative 177 list
    return AUTHORITATIVE_177_DISTRICTS
      .filter(
        (d) =>
          d.state.toLowerCase() === fullStateName.toLowerCase() ||
          d.stateCode.toLowerCase() === code.toLowerCase()
      )
      .map((d) => ({
        ...d,
        id: d.id || d.districtCode || `${d.stateCode}-${d.districtName.replace(/\s+/g, '_')}`,
      }))
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  },

  /**
   * Fetch all 177 districts across all states
   */
  async getAllDistricts(): Promise<District[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('id, state, state_code, district_name, district_code, active')
          .eq('active', true)
          .order('district_name', { ascending: true });

        if (!error && data && data.length > 0) {
          return (data as RawDistrictRow[]).map((d) => ({
            id: d.id,
            state: d.state,
            stateCode: d.state_code,
            districtName: d.district_name,
            districtCode: d.district_code || undefined,
            active: d.active,
          }));
        }
      } catch (err) {
        console.warn('Could not load districts from Supabase:', err);
      }
    }

    return AUTHORITATIVE_177_DISTRICTS
      .map((d) => ({
        ...d,
        id: d.id || d.districtCode || `${d.stateCode}-${d.districtName.replace(/\s+/g, '_')}`,
      }))
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  },
};
