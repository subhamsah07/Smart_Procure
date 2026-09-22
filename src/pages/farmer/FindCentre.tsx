import * as React from 'react';
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Navigation,
  RefreshCw,
  AlertCircle,
  Loader2,
  Building,
  CheckCircle2,
  Map as MapIcon,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { centreService } from '../../services/centreService';
import { districtService } from '../../services/districtService';
import { IndianState, ProcurementCentre, District } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ProcurementMap } from '../../components/common/ProcurementMap';

// Prioritize the four primary administrative states with full district coverage
const ADMIN_STATES: IndianState[] = [
  'Bihar',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Maharashtra',
  'Gujarat',
  'Odisha',
  'Telangana',
];

export const FindCentre: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // State & District Filters
  const [selectedState, setSelectedState] = React.useState<IndianState>(
    (profile?.state as IndianState) || 'Bihar'
  );
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>(profile?.district || 'all');
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState<boolean>(false);

  // Selected centre highlighting on map & list
  const [selectedCentreId, setSelectedCentreId] = React.useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = React.useState<'split' | 'grid'>('split');

  // Geolocation
  const [farmerCoords, setFarmerCoords] = React.useState<{ lat: number; lon: number } | null>(null);
  const [geoStatus, setGeoStatus] = React.useState<'idle' | 'requesting' | 'acquired' | 'denied'>('idle');
  const [geoError, setGeoError] = React.useState<string | null>(null);

  // Centres data state
  const [centres, setCentres] = React.useState<ProcurementCentre[]>([]);
  const [isLoadingCentres, setIsLoadingCentres] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // 1. Load districts whenever selectedState changes
  React.useEffect(() => {
    let active = true;
    setIsLoadingDistricts(true);

    async function loadDistricts() {
      try {
        const list = await districtService.getDistrictsByState(selectedState);
        if (active) {
          setDistricts(list);
          // If previous selected district is not in new state, reset to 'all'
          if (selectedDistrict !== 'all' && !list.some((d) => d.districtName.toLowerCase() === selectedDistrict.toLowerCase())) {
            setSelectedDistrict('all');
          }
        }
      } catch (err) {
        console.warn('Failed to load districts for state:', err);
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    loadDistricts();

    return () => {
      active = false;
    };
  }, [selectedState]);

  // 2. Load procurement centres from public.procurement_centres
  const loadCentres = React.useCallback(async () => {
    setIsLoadingCentres(true);
    setFetchError(null);
    try {
      const results = await centreService.getCentres({
        state: selectedState,
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        farmerCoords: farmerCoords || undefined,
      });
      setCentres(results);
      if (results.length > 0 && !selectedCentreId) {
        setSelectedCentreId(results[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load procurement centres:', err);
      setFetchError('Unable to load procurement centres from database. Please retry.');
    } finally {
      setIsLoadingCentres(false);
    }
  }, [selectedState, selectedDistrict, farmerCoords, selectedCentreId]);

  React.useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  // Geolocation handling
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('requesting');
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFarmerCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGeoStatus('acquired');
      },
      (error) => {
        console.warn('Geolocation access denied or unavailable:', error);
        setGeoStatus('denied');
        setGeoError('Location permission was denied. You can filter by State and District below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleResetFilters = () => {
    setSelectedState((profile?.state as IndianState) || 'Bihar');
    setSelectedDistrict('all');
    setFarmerCoords(null);
    setGeoStatus('idle');
    setGeoError(null);
    setSelectedCentreId(undefined);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('findCentre.title', 'Procurement Centre Discovery')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('findCentre.subtitle', 'Discover authorized APMC foodgrain mandis in your district with certified intake capacities and verified status.')}
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('findCentre.mapAndList', 'Map & List')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-slate-600 dark:text-neutral-300" />
              <span>{t('findCentre.cardsGrid', 'Cards Grid')}</span>
            </button>
          </div>

          {/* GPS Button */}
          <Button
            type="button"
            variant={geoStatus === 'acquired' ? 'secondary' : 'outline'}
            size="md"
            onClick={handleRequestLocation}
            disabled={geoStatus === 'requesting'}
            className="gap-2 shadow-xs bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:dark:bg-neutral-700 text-xs sm:text-sm"
          >
            {geoStatus === 'requesting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>{t('findCentre.locatingGps', 'Locating GPS...')}</span>
              </>
            ) : geoStatus === 'acquired' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('findCentre.gpsActive', 'GPS Active')}</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('findCentre.centresNearMe', 'Centres Near Me')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* GEOLOCATION FEEDBACK BANNER */}
      {geoError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>{geoError}</div>
        </div>
      )}

      {/* FILTER BAR: STATE & DISTRICT (FROM DISTRICTS MASTER TABLE) */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* State Selection */}
        <div className="flex-1 sm:max-w-xs space-y-1">
          <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-300 uppercase tracking-wider block">
            {t('findCentre.stateJurisdiction', 'State Jurisdiction')}
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as IndianState)}
            className="w-full h-10 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {ADMIN_STATES.map((st) => (
              <option key={st} value={st} className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* District Selection from Master Database */}
        <div className="flex-1 sm:max-w-xs space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-300 uppercase tracking-wider block">
              {t('findCentre.district', 'District')}
            </label>
            {isLoadingDistricts && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> {t('findCentre.loadingDistricts', 'Loading districts...')}
              </span>
            )}
          </div>
          <select
            id="find-centre-district-select"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={isLoadingDistricts}
            className="w-full h-10 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 dark:disabled:bg-neutral-900"
          >
            <option key="all" value="all" className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
              {t('findCentre.allDistrictsIn', { state: selectedState, count: districts.length, defaultValue: `All Districts in ${selectedState} (${districts.length})` })}
            </option>
            {districts.map((d) => (
              <option key={d.id || d.districtCode || d.districtName} value={d.districtName} className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                {d.districtName}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:self-end pt-1 sm:pt-0 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            className="text-xs text-slate-600 dark:text-neutral-300 hover:dark:bg-neutral-800 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('dashboard.reset', 'Reset')}</span>
          </Button>
        </div>
      </div>

      {/* OPERATING HOURS NOTICE */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <Clock className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          {t('findCentre.operatingNotice', 'Standard Mandi Operating Hours: Intake gates operate between 09:00 AM – 06:00 PM. Weighbridge systems observe daily lunch recess between 02:00 PM – 03:00 PM.')}
        </div>
      </div>

      {/* GOOGLE MAPS VISUALIZATION OF PROCUREMENT CENTRES */}
      {viewMode === 'split' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 px-1">
            <span className="font-semibold text-slate-700 dark:text-neutral-200">
              {t('findCentre.mapTitle', 'Procurement Centre Map')} ({centres.length} {t('findCentre.verifiedMandis', 'Verified Mandis')})
            </span>
            <span className="text-[11px] text-slate-400 dark:text-neutral-400">
              {t('findCentre.mapHint', 'Select any pin or card to inspect details')}
            </span>
          </div>
          <ProcurementMap
            centres={centres}
            selectedCentreId={selectedCentreId}
            onSelectCentre={(c) => setSelectedCentreId(c.id)}
            farmerCoords={farmerCoords}
            className="h-80 w-full shadow-xs"
          />
        </div>
      )}

      {/* LOADING CENTRES */}
      {isLoadingCentres && (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-600 font-medium">
            {t('findCentre.loadingCentres', 'Loading verified procurement centres from database...')}
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {!isLoadingCentres && fetchError && (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('findCentre.loadErrorTitle', 'Failed to Load Centres')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{fetchError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadCentres} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>{t('dashboard.retry', 'Try Again')}</span>
          </Button>
        </div>
      )}

      {/* MANDATED EMPTY STATE WHEN DISTRICT HAS NO REGISTERED CENTRES */}
      {!isLoadingCentres && !fetchError && centres.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-400">
            <Building className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedDistrict !== 'all' ? selectedDistrict : selectedState}
            </h3>
            <p className="text-sm font-medium text-slate-700 dark:text-neutral-300 mt-1.5">
              {t('findCentre.noCentresInDistrict', 'No verified procurement centre is currently registered in this district.')}
            </p>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {t('findCentre.noCentresAdvice', { state: selectedState, defaultValue: `Procurement centres are registered by State Agricultural Marketing Boards. You may view all verified centres in ${selectedState} or select an adjacent district.` })}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDistrict('all')}
              className="text-xs"
            >
              {t('findCentre.viewAllCentresInState', { state: selectedState, defaultValue: `View All Centres in ${selectedState}` })}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-slate-600"
            >
              {t('findCentre.resetFilters', 'Reset Filters')}
            </Button>
          </div>
        </div>
      )}

      {/* CENTRES CARDS LIST */}
      {!isLoadingCentres && !fetchError && centres.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres.map((centre) => {
            const isOpen = centre.status === 'OPEN';
            const isBusy = centre.status === 'BUSY';
            const isSelected = centre.id === selectedCentreId;

            return (
              <Card
                key={centre.id}
                onClick={() => setSelectedCentreId(centre.id)}
                className={`flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {centre.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {centre.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-700" />
                          {t('findCentre.verifiedApmc', 'Verified APMC')}
                        </span>
                      )}
                      <Badge variant={isOpen ? 'success' : isBusy ? 'warning' : 'neutral'}>
                        {centre.status === 'OPEN' && t('findCentre.statusOpen', 'Open')}
                        {centre.status === 'BUSY' && t('findCentre.statusBusy', 'Busy')}
                        {centre.status === 'LUNCH_BREAK' && t('findCentre.statusLunchBreak', 'Lunch Recess')}
                        {centre.status === 'CLOSED' && t('findCentre.statusClosed', 'Closed')}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                    {centre.name}
                  </CardTitle>

                  <CardDescription className="flex items-start gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {centre.address}, {centre.district}, {centre.state} - {centre.pincode}
                    </span>
                  </CardDescription>

                  {/* Distance Indicator */}
                  {centre.distanceKm !== undefined ? (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      <Navigation className="h-3 w-3 text-blue-600" />
                      <span>{centre.distanceKm} {t('findCentre.kmAway', 'km away from your location')}</span>
                    </div>
                  ) : (
                    <span className="mt-2 text-[11px] text-slate-400 block italic">
                      {t('findCentre.distanceGps', 'Distance calculation available with GPS')}
                    </span>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Operating Hours & Certified Capacity */}
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800/90 rounded-lg text-xs space-y-2 border border-slate-100 dark:border-neutral-700/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-neutral-400">{t('findCentre.operatingHours', 'Operating Hours')}:</span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {centre.operatingHours.openTime} – {centre.operatingHours.closeTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200 dark:border-neutral-700">
                      <span className="text-slate-500 dark:text-neutral-400">{t('findCentre.dailyIntakeCapacity', 'Daily Intake Capacity')}:</span>
                      <span className="font-bold text-slate-900 dark:text-neutral-100">
                        {centre.capacityPerDayQuintals.toLocaleString()} Quintals
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {centre.contactNumber}
                    </span>
                    <Link to={`/dashboard/book?centreId=${centre.id}`}>
                      <Button variant="primary" size="sm" className="text-xs shadow-xs">
                        {t('findCentre.bookSlot', 'Book Slot')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
