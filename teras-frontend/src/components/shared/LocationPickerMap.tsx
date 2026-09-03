import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { AlertCircle, Crosshair, LocateFixed, MapPin } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type LocationSelection = Coordinates & {
  location_source: string;
  resolved_address?: string;
  resolved_city?: string;
};

type LocationPickerMapProps = {
  editing: boolean;
  value: Coordinates;
  locationSource?: string;
  resolvedAddress?: string;
  resolvedCity?: string;
  onChange: (next: LocationSelection) => void;
};

const DEFAULT_CENTER: [number, number] = [1.5, 15.5];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 15;

const marker = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const LeafletMapContainer = MapContainer as any;
const LeafletTileLayer = TileLayer as any;
const LeafletMarker = Marker as any;

function MapViewport({ center, hasSelection }: { center: [number, number]; hasSelection: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.setView(center, hasSelection ? FOCUSED_ZOOM : DEFAULT_ZOOM, { animate: true });
  }, [map, center, hasSelection]);

  return null;
}

function ClickToPick({
  editing,
  onSelect,
}: {
  editing: boolean;
  onSelect: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!editing) return;
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function formatCoordinate(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'Non défini';
  return value.toFixed(6);
}

function formatLocationSource(source?: string) {
  const labels: Record<string, string> = {
    'browser-geolocation': 'Géolocalisation navigateur',
    'map-click': 'Sélection manuelle sur la carte',
  };

  return labels[source || ''] || 'Non défini';
}

function extractResolvedCity(address: Record<string, string>) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state_district ||
    address.state ||
    ''
  );
}

function buildResolvedAddress(result: { display_name?: string; address?: Record<string, string> }) {
  const address = result.address || {};
  const city = extractResolvedCity(address);
  const parts = [
    [address.house_number, address.road || address.pedestrian || address.footway || address.path || address.residential]
      .filter(Boolean)
      .join(' ')
      .trim(),
    address.neighbourhood || address.suburb || address.quarter || address.city_district || address.hamlet || '',
    city,
    address.postcode || '',
  ].filter(Boolean);

  const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
  if (uniqueParts.length > 0) {
    return {
      resolved_address: uniqueParts.join(', '),
      resolved_city: city,
    };
  }

  const fallback = (result.display_name || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(', ');

  return {
    resolved_address: fallback,
    resolved_city: city,
  };
}

export default function LocationPickerMap({
  editing,
  value,
  locationSource,
  resolvedAddress,
  resolvedCity,
  onChange,
}: LocationPickerMapProps) {
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSelection = value.latitude !== null && value.longitude !== null;
  const center = useMemo<[number, number]>(() => {
    if (hasSelection) {
      return [value.latitude as number, value.longitude as number];
    }
    return DEFAULT_CENTER;
  }, [hasSelection, value.latitude, value.longitude]);

  const reverseGeocode = async (latitude: number, longitude: number, location_source: string) => {
    setResolvingAddress(true);

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: latitude.toString(),
        lon: longitude.toString(),
        zoom: '18',
        addressdetails: '1',
        layer: 'address',
        'accept-language': navigator.language || 'fr',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Impossible de récupérer l'adresse.");
      }

      const result = await response.json();
      const { resolved_address, resolved_city } = buildResolvedAddress(result);

      onChange({
        latitude,
        longitude,
        location_source,
        resolved_address,
        resolved_city,
      });
      setError(null);
    } catch {
      setError("Position enregistrée, mais l'adresse n'a pas pu être récupérée automatiquement. Vous pouvez la compléter manuellement.");
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleManualPick = (latitude: number, longitude: number) => {
    setError(null);
    onChange({
      latitude,
      longitude,
      location_source: 'map-click',
    });
    void reverseGeocode(latitude, longitude, 'map-click');
  };

  const handleLocate = () => {
    if (!editing || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_source: 'browser-geolocation',
        });
        void reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
          'browser-geolocation'
        );
      },
      (geoError) => {
        setLocating(false);
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? "Autorisation refusée. Vous pouvez cliquer sur la carte pour choisir votre position."
            : "Impossible de récupérer votre position. Vous pouvez cliquer sur la carte pour la définir manuellement.";
        setError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Position GPS sur carte réelle</p>
          <p className="text-xs text-slate-400">
            Utilisez le bouton de géolocalisation ou cliquez sur la carte pour placer votre position.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLocate}
          disabled={!editing || locating}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locating ? <Crosshair className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {locating ? 'Localisation…' : 'Me localiser'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40">
        <LeafletMapContainer
          center={center}
          zoom={hasSelection ? FOCUSED_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom={editing}
          className="h-[340px] w-full"
        >
          <LeafletTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={center} hasSelection={hasSelection} />
          <ClickToPick editing={editing} onSelect={handleManualPick} />
          {hasSelection && (
            <LeafletMarker position={[value.latitude as number, value.longitude as number]} icon={marker} />
          )}
        </LeafletMapContainer>
      </div>

      {resolvingAddress && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          Recherche de l'adresse exacte en cours…
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-slate-400">Adresse détectée</p>
          <p className="text-sm text-white">{resolvedAddress || 'Aucune adresse détectée pour le moment'}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-slate-400">Ville / localité</p>
          <p className="text-sm text-white">{resolvedCity || 'Non définie'}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-slate-400">Source</p>
          <p className="flex items-center gap-2 text-sm text-white">
            <MapPin className="h-4 w-4 text-sky-400" />
            {formatLocationSource(locationSource)}
          </p>
        </div>
      </div>
    </div>
  );
}
