import * as React from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { ProcurementCentre } from '../../types';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Clock, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ProcurementMapProps {
  centres: ProcurementCentre[];
  selectedCentreId?: string;
  onSelectCentre?: (centre: ProcurementCentre) => void;
  farmerCoords?: { lat: number; lon: number } | null;
  className?: string;
}

// Inner map content using hooks from @vis.gl/react-google-maps
const LiveMapContent: React.FC<{
  centres: ProcurementCentre[];
  selectedCentreId?: string;
  onSelectCentre?: (centre: ProcurementCentre) => void;
  farmerCoords?: { lat: number; lon: number } | null;
  activeCentre: ProcurementCentre | null;
  setActiveCentre: (centre: ProcurementCentre | null) => void;
}> = ({
  centres,
  selectedCentreId,
  onSelectCentre,
  farmerCoords,
  activeCentre,
  setActiveCentre,
}) => {
  const map = useMap();

  React.useEffect(() => {
    if (!map || centres.length === 0) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      if (farmerCoords) {
        bounds.extend({ lat: farmerCoords.lat, lng: farmerCoords.lon });
      }
      centres.forEach((c) => {
        bounds.extend({ lat: c.latitude, lng: c.longitude });
      });

      if (centres.length > 1 || farmerCoords) {
        map.fitBounds(bounds, 40);
      } else if (centres.length === 1) {
        map.setCenter({ lat: centres[0].latitude, lng: centres[0].longitude });
        map.setZoom(12);
      }
    } catch {
      // Bounds calculation fallback
    }
  }, [map, centres, farmerCoords]);

  return (
    <>
      {farmerCoords && (
        <AdvancedMarker
          position={{ lat: farmerCoords.lat, lng: farmerCoords.lon }}
          title="Your Farm Location"
        >
          <Pin
            background="#2563eb"
            borderColor="#ffffff"
            glyphColor="#ffffff"
            scale={1.1}
          />
        </AdvancedMarker>
      )}

      {centres.map((centre) => {
        const isSelected = centre.id === selectedCentreId;
        return (
          <AdvancedMarker
            key={centre.id}
            position={{ lat: centre.latitude, lng: centre.longitude }}
            title={centre.name}
            onClick={() => {
              setActiveCentre(centre);
              if (onSelectCentre) onSelectCentre(centre);
            }}
          >
            <Pin
              background={isSelected ? '#059669' : '#0f766e'}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={isSelected ? 1.3 : 1.0}
            />
          </AdvancedMarker>
        );
      })}

      {activeCentre && (
        <InfoWindow
          position={{ lat: activeCentre.latitude, lng: activeCentre.longitude }}
          onCloseClick={() => setActiveCentre(null)}
        >
          <div className="p-1 max-w-[260px] font-sans text-slate-900">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {activeCentre.code} • APMC Mandi
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {activeCentre.name}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {activeCentre.district}, {activeCentre.state}
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200 text-xs text-slate-600">
              <div><strong>Capacity:</strong> {activeCentre.capacityPerDayQuintals.toLocaleString()} Q / day</div>
              <div><strong>Hours:</strong> {activeCentre.operatingHours.openTime} – {activeCentre.operatingHours.closeTime}</div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const ProcurementMap: React.FC<ProcurementMapProps> = ({
  centres,
  selectedCentreId,
  onSelectCentre,
  farmerCoords,
  className = 'h-96 w-full',
}) => {
  const [activeCentre, setActiveCentre] = React.useState<ProcurementCentre | null>(null);

  const apiKey = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    ''
  ).trim();

  const isKeyAvailable = Boolean(apiKey && apiKey !== 'YOUR_KEY' && apiKey !== 'undefined');

  const defaultCenter = React.useMemo(() => {
    if (centres.length > 0) {
      return { lat: centres[0].latitude, lng: centres[0].longitude };
    }
    return { lat: 25.6, lng: 85.1 };
  }, [centres]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 ${className}`}>
      {/* Live Google Maps via @vis.gl/react-google-maps */}
      {isKeyAvailable ? (
        <div className="w-full h-full">
          <APIProvider apiKey={apiKey} libraries={['marker']}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={defaultCenter}
              defaultZoom={7}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
              <LiveMapContent
                centres={centres}
                selectedCentreId={selectedCentreId}
                onSelectCentre={onSelectCentre}
                farmerCoords={farmerCoords}
                activeCentre={activeCentre}
                setActiveCentre={setActiveCentre}
              />
            </Map>
          </APIProvider>
        </div>
      ) : (
        /* Structured Geospatial Visualization Layer (active during validation, invalid key, or offline) */
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
          {/* Subtle Coordinate Matrix Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  Procurement Centre Geospatial Layer
                </span>
                <span className="text-[11px] text-slate-300">
                  Plotting {centres.length} verified government yard{centres.length === 1 ? '' : 's'} with real GPS coordinates
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-slate-300">
              Database GPS Active
            </span>
          </div>

          {/* Notice Banner when API Key is missing */}
          {!isKeyAvailable && (
            <div className="relative z-10 my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-300">
                  Google Maps API Key Not Configured
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  All mandi coordinates and routing directions remain operational through direct navigation links below. To display live interactive Google Maps, provide a valid <code className="text-emerald-300">VITE_GOOGLE_MAPS_API_KEY</code> or mint a free{' '}
                  <a
                    href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-300 hover:text-emerald-200 font-semibold"
                  >
                    Maps Demo Key
                  </a>
                  .
                </div>
              </div>
            </div>
          )}

          {/* Middle: Interactive Mandi Pin Cards */}
          <div className="relative z-10 my-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {centres.map((centre) => {
              const isSelected = centre.id === selectedCentreId;
              return (
                <button
                  key={centre.id}
                  type="button"
                  onClick={() => {
                    setActiveCentre(centre);
                    if (onSelectCentre) onSelectCentre(centre);
                  }}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-emerald-900/70 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      {centre.code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {centre.latitude.toFixed(3)}°N, {centre.longitude.toFixed(3)}°E
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white mt-1 line-clamp-1">
                    {centre.name}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{centre.district}, {centre.state}</span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{centre.capacityPerDayQuintals.toLocaleString()} Q / day</span>
                    {centre.distanceKm !== undefined && (
                      <span className="text-emerald-400 font-semibold">{centre.distanceKm} km</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Footer Info & Navigation */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Navigation className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                Select any mandi above to trigger one-click turn-by-turn routing.
              </span>
            </div>

            {activeCentre ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeCentre.latitude},${activeCentre.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Navigate to {activeCentre.name.split(' ')[0]}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : centres.length > 0 ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${centres[0].latitude},${centres[0].longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Navigate to {centres[0].name.split(' ')[0]}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

