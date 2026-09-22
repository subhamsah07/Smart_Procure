/**
 * Centre Service - Discovers procurement centres, capacities, and operational status.
 * Interfaces with PostgreSQL 'procurement_centres' table in Supabase.
 */

import { IndianState, ProcurementCentre } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ALL_PROCUREMENT_CENTRES, getDistrictCoordinates } from '../data/centres';
import { isValidUuid } from '../lib/utils';

/**
 * Standard Haversine formula to compute great-circle distance between two geographic points.
 * Distance returned in kilometers, rounded to 1 decimal place.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Authoritative procurement centres with comprehensive 30-40 real centres per state
export const DEFAULT_CENTRES: ProcurementCentre[] = ALL_PROCUREMENT_CENTRES;

function mapDbCentreToUi(dbRow: any, farmerCoords?: { lat: number; lon: number }): ProcurementCentre {
  const lat = Number(dbRow.latitude);
  const lon = Number(dbRow.longitude);
  const effectiveCoords = farmerCoords || getDistrictCoordinates(dbRow.state, dbRow.district);
  let distanceKm: number | undefined = undefined;
  if (effectiveCoords && !isNaN(lat) && !isNaN(lon)) {
    distanceKm = calculateDistanceKm(effectiveCoords.lat, effectiveCoords.lon, lat, lon);
  }

  return {
    id: dbRow.id,
    code: dbRow.code,
    name: dbRow.name,
    state: dbRow.state as IndianState,
    district: dbRow.district,
    address: dbRow.address,
    pincode: dbRow.pincode || '141001',
    operatingHours: {
      openTime: (dbRow.opening_time || '09:00:00').substring(0, 5),
      closeTime: (dbRow.closing_time || '18:00:00').substring(0, 5),
      lunchStartTime: (dbRow.lunch_start || '14:00:00').substring(0, 5),
      lunchEndTime: (dbRow.lunch_end || '15:00:00').substring(0, 5),
    },
    status: (dbRow.operating_status === 'MAINTENANCE' ? 'CLOSED' : dbRow.operating_status) || 'OPEN',
    capacityPerDayQuintals: Number(dbRow.capacity_per_day_quintals) || 3000,
    // Clear neutral state: queue information placeholder, not fake live numbers
    currentQueueLength: dbRow.current_queue_length !== undefined ? dbRow.current_queue_length : null,
    averageProcessingTimeMinutes: dbRow.average_processing_time !== undefined ? dbRow.average_processing_time : null,
    latitude: lat,
    longitude: lon,
    contactNumber: dbRow.contact_number || '+91 1800 180 1551',
    verified: dbRow.verified !== undefined ? Boolean(dbRow.verified) : true,
    distanceKm,
  };
}

class CentreService {
  /**
   * Retrieves procurement centres filtered by state, district, and optional coordinates.
   */
  async getCentres(filters?: {
    state?: string;
    district?: string;
    farmerCoords?: { lat: number; lon: number };
  }): Promise<ProcurementCentre[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('procurement_centres').select('*');
        if (filters?.state) {
          query = query.eq('state', filters.state);
        }
        if (filters?.district && filters.district !== 'all') {
          query = query.ilike('district', `%${filters.district}%`);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Supabase centre lookup error:', error);
          return [];
        }

        if (data && data.length > 0) {
          const mapped = data.map((row) => mapDbCentreToUi(row, filters?.farmerCoords));
          return this.recommendCentres(mapped);
        }
      } catch (err) {
        console.warn('Supabase centre lookup caught error:', err);
      }
    }

    // Comprehensive fallback using DEFAULT_CENTRES when database is unconfigured or offline
    let filtered = [...DEFAULT_CENTRES];
    if (filters?.state) {
      const targetState = filters.state.toLowerCase();
      filtered = filtered.filter((c) => c.state.toLowerCase() === targetState);
    }
    if (filters?.district && filters.district !== 'all') {
      const targetDistrict = filters.district.toLowerCase();
      filtered = filtered.filter((c) => c.district.toLowerCase().includes(targetDistrict));
    }
    const effectiveCoords = filters?.farmerCoords || getDistrictCoordinates(filters?.state, filters?.district);
    if (effectiveCoords) {
      filtered = filtered.map((c) => ({
        ...c,
        distanceKm: calculateDistanceKm(
          effectiveCoords.lat,
          effectiveCoords.lon,
          c.latitude,
          c.longitude
        ),
      }));
    }
    return this.recommendCentres(filtered);
  }

  /**
   * Discovers centres within a specific state.
   */
  async getCentresByState(state: string, farmerCoords?: { lat: number; lon: number }): Promise<ProcurementCentre[]> {
    return this.getCentres({ state, farmerCoords });
  }

  /**
   * Discovers centres within a specific district.
   */
  async getCentresByDistrict(state: string, district: string, farmerCoords?: { lat: number; lon: number }): Promise<ProcurementCentre[]> {
    return this.getCentres({ state, district, farmerCoords });
  }

  /**
   * Finds nearby centres based on farmer coordinates and maximum radius.
   */
  async getNearbyCentres(lat: number, lon: number, radiusKm = 100): Promise<ProcurementCentre[]> {
    const all = await this.getCentres({ farmerCoords: { lat, lon } });
    const nearby = all.filter((c) => c.distanceKm !== undefined && c.distanceKm <= radiusKm);
    return nearby;
  }

  /**
   * Discovers a specific centre by primary key ID from public.procurement_centres.
   */
  async getCentreById(id: string): Promise<ProcurementCentre | null> {
    if (!id) return null;
    if (isSupabaseConfigured() && isValidUuid(id)) {
      try {
        const { data, error } = await supabase
          .from('procurement_centres')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return mapDbCentreToUi(data);
        }
      } catch (err) {
        console.warn(`Supabase getCentreById failed for ID ${id}:`, err);
      }
    }

    // Fallback: match by ID or Code from DEFAULT_CENTRES
    const match = DEFAULT_CENTRES.find((c) => c.id === id || c.code === id);
    return match || null;
  }

  /**
   * PART 7 — Recommendation Structure:
   * Considers currently available database criteria:
   * 1. Operating status: 'OPEN' ranked first, then 'BUSY', then 'LUNCH_BREAK', then 'CLOSED'
   * 2. Verified status: Government-verified APMC yards prioritized
   * 3. Distance: Ascending order when coordinates are available
   * 4. Capacity: Higher daily intake capacity
   */
  recommendCentres(centres: ProcurementCentre[]): ProcurementCentre[] {
    const statusWeight: Record<string, number> = {
      OPEN: 0,
      BUSY: 1,
      LUNCH_BREAK: 2,
      CLOSED: 3,
    };

    return [...centres].sort((a, b) => {
      // 1. Operating status
      const statusDiff = (statusWeight[a.status] ?? 4) - (statusWeight[b.status] ?? 4);
      if (statusDiff !== 0) return statusDiff;

      // 2. Verified status
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;

      // 3. Distance (if computed)
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }

      // 4. Capacity per day
      return b.capacityPerDayQuintals - a.capacityPerDayQuintals;
    });
  }
}

export const centreService = new CentreService();
