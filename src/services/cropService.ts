/**
 * Crop Service - Manages crop catalog and state-specific MSP pricing.
 * Interfaces with 'crops' and 'crop_prices' PostgreSQL tables in Supabase.
 */

import { Crop, CropName, IndianState, StateCropPrice } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type { StateCropPrice };

// Standard 5 foundational crops under government procurement
const BASE_CROPS: Crop[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Wheat',
    hindiName: 'गेहूं (Kanak)',
    configuredRatePerQuintal: 2425,
    unit: 'Quintal',
    season: 'Rabi',
    description: 'High-grade milling wheat conforming to Fair Average Quality (FAQ) standards.',
    isActive: true,
    lastUpdatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    name: 'Paddy',
    hindiName: 'धान (Paddy Common)',
    configuredRatePerQuintal: 2300,
    unit: 'Quintal',
    season: 'Kharif',
    description: 'A-grade paddy grain with certified moisture content under 17%.',
    isActive: true,
    lastUpdatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    name: 'Maize',
    hindiName: 'मक्का (Makka)',
    configuredRatePerQuintal: 2090,
    unit: 'Quintal',
    season: 'Kharif',
    description: 'Dry yellow cob kernels meeting food and feed procurement specifications.',
    isActive: true,
    lastUpdatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    name: 'Rice',
    hindiName: 'चावल (Milled FAQ)',
    configuredRatePerQuintal: 3100,
    unit: 'Quintal',
    season: 'Kharif',
    description: 'Processed white milled parboiled foodgrain meeting national reserve benchmarks.',
    isActive: true,
    lastUpdatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    name: 'Mustard',
    hindiName: 'सरसों (Sarson)',
    configuredRatePerQuintal: 5650,
    unit: 'Quintal',
    season: 'Rabi',
    description: 'High oil-yield black/brown mustard seeds with minimum 8% FAQ purity.',
    isActive: true,
    lastUpdatedAt: '2026-01-01T00:00:00Z',
  },
];

// State-specific active MSP benchmarks for each Indian State (per quintal in INR)
export const STATE_MSP_BENCHMARKS: Record<IndianState, Record<CropName, number>> = {
  Punjab: { Wheat: 2425, Paddy: 2300, Maize: 2090, Rice: 3100, Mustard: 5650 },
  Haryana: { Wheat: 2425, Paddy: 2300, Maize: 2090, Rice: 3100, Mustard: 5650 },
  'Uttar Pradesh': { Wheat: 2400, Paddy: 2280, Maize: 2060, Rice: 3050, Mustard: 5600 },
  'Madhya Pradesh': { Wheat: 2450, Paddy: 2290, Maize: 2080, Rice: 3080, Mustard: 5620 },
  Rajasthan: { Wheat: 2435, Paddy: 2270, Maize: 2070, Rice: 3060, Mustard: 5680 },
  Bihar: { Wheat: 2350, Paddy: 2250, Maize: 2050, Rice: 3020, Mustard: 5580 },
  Maharashtra: { Wheat: 2380, Paddy: 2290, Maize: 2100, Rice: 3120, Mustard: 5600 },
  Gujarat: { Wheat: 2410, Paddy: 2280, Maize: 2080, Rice: 3090, Mustard: 5640 },
  Odisha: { Wheat: 2320, Paddy: 2300, Maize: 2050, Rice: 3040, Mustard: 5550 },
  Telangana: { Wheat: 2340, Paddy: 2320, Maize: 2090, Rice: 3110, Mustard: 5570 },
  'West Bengal': { Wheat: 2350, Paddy: 2310, Maize: 2060, Rice: 3120, Mustard: 5590 },
};

class CropService {
  private priceCache: Map<string, number> = new Map();

  /**
   * Synchronously returns the admin-configured MSP price or official benchmark for a crop in a state.
   */
  getCropPriceSync(cropName: string, state: IndianState): number {
    const cacheKey = `${state.toLowerCase()}::${cropName.toLowerCase()}`;
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey)!;
    }

    if (typeof window !== 'undefined') {
      try {
        const storageKey = `smartprocure_custom_rates_${state.toLowerCase()}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (stored[cropName.toLowerCase()] != null) {
          const r = Number(stored[cropName.toLowerCase()]);
          this.priceCache.set(cacheKey, r);
          return r;
        }
      } catch {}
    }

    const stateRates = STATE_MSP_BENCHMARKS[state] || STATE_MSP_BENCHMARKS['Punjab'];
    const r = (stateRates as any)[cropName] ?? 2425;
    this.priceCache.set(cacheKey, r);
    return r;
  }

  /**
   * Notifies local runtime and farmer components of real-time price changes.
   */
  notifyPriceUpdated(cropName: string, state: string, newPrice: number) {
    const cacheKey = `${state.toLowerCase()}::${cropName.toLowerCase()}`;
    this.priceCache.set(cacheKey, newPrice);

    if (typeof window !== 'undefined') {
      try {
        const storageKey = `smartprocure_custom_rates_${state.toLowerCase()}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        existing[cropName.toLowerCase()] = newPrice;
        localStorage.setItem(storageKey, JSON.stringify(existing));
      } catch (e) {
        console.warn('Failed to persist price to localStorage:', e);
      }

      window.dispatchEvent(
        new CustomEvent('smartprocure_price_updated', {
          detail: { cropName, state, newPrice },
        })
      );
    }
  }

  /**
   * Fetches the official crops supported under government procurement.
   * Pulls from 'crops' PostgreSQL table in Supabase, falling back to BASE_CROPS.
   */
  async getCrops(state?: IndianState): Promise<Crop[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('crops')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            name: c.name as CropName,
            hindiName: c.hindi_name || '',
            configuredRatePerQuintal: this.getCropPriceSync(c.name, state || 'Punjab'),
            unit: (c.standard_unit as any) || 'Quintal',
            season: (c.season as any) || 'Rabi',
            description: c.category ? `${c.category} crop for ${c.season || 'national'} procurement.` : undefined,
            isActive: c.is_active,
            lastUpdatedAt: c.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Supabase crop query caught error, using base crops:', err);
      }
    }
    // Reliable fallback with state-specific rates so crop selection is never blank
    return BASE_CROPS.map((c) => ({
      ...c,
      configuredRatePerQuintal: this.getCropPriceSync(c.name, state || 'Punjab'),
    }));
  }

  /**
   * Fetches state-specific MSP price for a specific crop and state from Supabase 'crop_prices' table.
   * State Admin configured rates take precedence.
   */
  async getCropPriceByState(cropName: CropName, state: IndianState): Promise<number> {
    const cacheKey = `${state.toLowerCase()}::${cropName.toLowerCase()}`;
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey)!;
    }

    // Check localStorage custom rates
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `smartprocure_custom_rates_${state.toLowerCase()}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (stored[cropName.toLowerCase()] != null) {
          const r = Number(stored[cropName.toLowerCase()]);
          this.priceCache.set(cacheKey, r);
          return r;
        }
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        // Query crop_prices joined with crops
        const { data, error } = await supabase
          .from('crop_prices')
          .select('rate, crops!inner(name)')
          .eq('crops.name', cropName)
          .eq('state', state)
          .eq('active', true)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.rate) {
          const r = Number(data.rate);
          this.priceCache.set(cacheKey, r);
          return r;
        }
      } catch (err) {
        console.warn(`Supabase price lookup failed for ${cropName} in ${state}:`, err);
      }
    }

    // Fallback to active state-specific MSP benchmark matrix
    const stateRates = STATE_MSP_BENCHMARKS[state] || STATE_MSP_BENCHMARKS['Punjab'];
    const r = stateRates[cropName] ?? 2425;
    this.priceCache.set(cacheKey, r);
    return r;
  }

  /**
   * Returns all active prices for a given state from Supabase 'crop_prices'.
   */
  async getActivePricesForState(state: IndianState): Promise<StateCropPrice[]> {
    let result: StateCropPrice[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('crop_prices')
          .select('id, crop_id, rate, unit, effective_from, active, crops!inner(name, hindi_name)')
          .eq('state', state)
          .eq('active', true);

        if (!error && data && data.length > 0) {
          result = data.map((row: any) => ({
            id: row.id,
            cropId: row.crop_id,
            cropName: row.crops?.name as CropName,
            hindiName: row.crops?.hindi_name,
            state,
            ratePerQuintal: Number(row.rate),
            unit: row.unit || 'Quintal',
            effectiveFrom: row.effective_from,
            active: row.active,
          }));
        }
      } catch (err) {
        console.warn(`Supabase price list query failed for state ${state}:`, err);
      }
    }

    if (result.length === 0) {
      // Fallback: Generate state prices from state benchmark rates
      const stateRates = STATE_MSP_BENCHMARKS[state] || STATE_MSP_BENCHMARKS['Punjab'];
      result = BASE_CROPS.map((c) => ({
        id: `price-${c.name.toLowerCase()}-${state.toLowerCase().replace(/\s+/g, '-')}`,
        cropId: c.id,
        cropName: c.name,
        hindiName: c.hindiName,
        state,
        ratePerQuintal: stateRates[c.name] ?? c.configuredRatePerQuintal,
        unit: c.unit,
        effectiveFrom: '2026-01-01',
        active: true,
      }));
    }

    // Apply any local cached overrides
    let storedRates: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `smartprocure_custom_rates_${state.toLowerCase()}`;
        storedRates = JSON.parse(localStorage.getItem(storageKey) || '{}');
      } catch {}
    }

    return result.map((p) => {
      const cacheKey = `${state.toLowerCase()}::${p.cropName.toLowerCase()}`;
      if (this.priceCache.has(cacheKey)) {
        return { ...p, ratePerQuintal: this.priceCache.get(cacheKey)! };
      }
      if (storedRates[p.cropName.toLowerCase()] != null) {
        const r = Number(storedRates[p.cropName.toLowerCase()]);
        this.priceCache.set(cacheKey, r);
        return { ...p, ratePerQuintal: r };
      }
      return p;
    });
  }

  /**
   * PART 8 — Admin Price Control Preparation.
   * Prepares the service layer for future State Administrator dashboard:
   * State Admin -> Select Crop -> Set State Price -> Save -> Farmer sees updated active price.
   */
  async setCropPriceForState(params: {
    cropId: string;
    state: IndianState;
    rate: number;
    effectiveFrom?: string;
    adminId?: string;
  }): Promise<StateCropPrice> {
    const effectiveFrom = params.effectiveFrom || new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured()) {
      try {
        // 1. Deactivate older prices for this crop in this state
        await supabase
          .from('crop_prices')
          .update({ active: false })
          .eq('crop_id', params.cropId)
          .eq('state', params.state);

        // 2. Insert new active state price
        const { data, error } = await supabase
          .from('crop_prices')
          .insert({
            crop_id: params.cropId,
            state: params.state,
            rate: params.rate,
            unit: 'Quintal',
            effective_from: effectiveFrom,
            active: true,
            created_by_admin: params.adminId || null,
          })
          .select('id, crop_id, state, rate, unit, effective_from, active, crops(name, hindi_name)')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            cropId: data.crop_id,
            cropName: (data.crops as any)?.name || 'Wheat',
            hindiName: (data.crops as any)?.hindi_name,
            state: data.state as IndianState,
            ratePerQuintal: Number(data.rate),
            unit: data.unit,
            effectiveFrom: data.effective_from,
            active: data.active,
          };
        }
      } catch (err) {
        console.warn('Supabase setCropPriceForState caught error:', err);
      }
    }

    return {
      id: `price-${params.cropId}-${params.state}-${Date.now()}`,
      cropId: params.cropId,
      cropName: 'Wheat',
      state: params.state,
      ratePerQuintal: params.rate,
      unit: 'Quintal',
      effectiveFrom,
      active: true,
    };
  }
}

export const cropService = new CropService();
