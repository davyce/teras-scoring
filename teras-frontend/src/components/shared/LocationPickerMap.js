import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { AlertCircle, Crosshair, LocateFixed, MapPin } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DEFAULT_CENTER = [1.5, 15.5];
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
const LeafletMapContainer = MapContainer;
const LeafletTileLayer = TileLayer;
const LeafletMarker = Marker;
function MapViewport({ center, hasSelection }) {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        map.setView(center, hasSelection ? FOCUSED_ZOOM : DEFAULT_ZOOM, { animate: true });
    }, [map, center, hasSelection]);
    return null;
}
function ClickToPick({ editing, onSelect, }) {
    useMapEvents({
        click(event) {
            if (!editing)
                return;
            onSelect(event.latlng.lat, event.latlng.lng);
        },
    });
    return null;
}
function formatCoordinate(value) {
    if (value === null || Number.isNaN(value))
        return 'Non défini';
    return value.toFixed(6);
}
function formatLocationSource(source) {
    const labels = {
        'browser-geolocation': 'Géolocalisation navigateur',
        'map-click': 'Sélection manuelle sur la carte',
    };
    return labels[source || ''] || 'Non défini';
}
function extractResolvedCity(address) {
    return (address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.state_district ||
        address.state ||
        '');
}
function buildResolvedAddress(result) {
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
export default function LocationPickerMap({ editing, value, locationSource, resolvedAddress, resolvedCity, onChange, }) {
    const [locating, setLocating] = useState(false);
    const [resolvingAddress, setResolvingAddress] = useState(false);
    const [error, setError] = useState(null);
    const hasSelection = value.latitude !== null && value.longitude !== null;
    const center = useMemo(() => {
        if (hasSelection) {
            return [value.latitude, value.longitude];
        }
        return DEFAULT_CENTER;
    }, [hasSelection, value.latitude, value.longitude]);
    const reverseGeocode = async (latitude, longitude, location_source) => {
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
        }
        catch {
            setError("Position enregistrée, mais l'adresse n'a pas pu être récupérée automatiquement. Vous pouvez la compléter manuellement.");
        }
        finally {
            setResolvingAddress(false);
        }
    };
    const handleManualPick = (latitude, longitude) => {
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
        navigator.geolocation.getCurrentPosition((position) => {
            setLocating(false);
            onChange({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                location_source: 'browser-geolocation',
            });
            void reverseGeocode(position.coords.latitude, position.coords.longitude, 'browser-geolocation');
        }, (geoError) => {
            setLocating(false);
            const message = geoError.code === geoError.PERMISSION_DENIED
                ? "Autorisation refusée. Vous pouvez cliquer sur la carte pour choisir votre position."
                : "Impossible de récupérer votre position. Vous pouvez cliquer sur la carte pour la définir manuellement.";
            setError(message);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Position GPS sur carte r\u00E9elle" }), _jsx("p", { className: "text-xs text-slate-400", children: "Utilisez le bouton de g\u00E9olocalisation ou cliquez sur la carte pour placer votre position." })] }), _jsxs("button", { type: "button", onClick: handleLocate, disabled: !editing || locating, className: "inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50", children: [locating ? _jsx(Crosshair, { className: "h-4 w-4 animate-spin" }) : _jsx(LocateFixed, { className: "h-4 w-4" }), locating ? 'Localisation…' : 'Me localiser'] })] }), error && (_jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200", children: [_jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsx("span", { children: error })] })), _jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40", children: _jsxs(LeafletMapContainer, { center: center, zoom: hasSelection ? FOCUSED_ZOOM : DEFAULT_ZOOM, scrollWheelZoom: editing, className: "h-[340px] w-full", children: [_jsx(LeafletTileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(MapViewport, { center: center, hasSelection: hasSelection }), _jsx(ClickToPick, { editing: editing, onSelect: handleManualPick }), hasSelection && (_jsx(LeafletMarker, { position: [value.latitude, value.longitude], icon: marker }))] }) }), resolvingAddress && (_jsx("div", { className: "rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200", children: "Recherche de l'adresse exacte en cours\u2026" })), _jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3", children: [_jsx("p", { className: "mb-1 text-xs font-medium text-slate-400", children: "Adresse d\u00E9tect\u00E9e" }), _jsx("p", { className: "text-sm text-white", children: resolvedAddress || 'Aucune adresse détectée pour le moment' })] }), _jsxs("div", { className: "rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3", children: [_jsx("p", { className: "mb-1 text-xs font-medium text-slate-400", children: "Ville / localit\u00E9" }), _jsx("p", { className: "text-sm text-white", children: resolvedCity || 'Non définie' })] }), _jsxs("div", { className: "rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3", children: [_jsx("p", { className: "mb-1 text-xs font-medium text-slate-400", children: "Source" }), _jsxs("p", { className: "flex items-center gap-2 text-sm text-white", children: [_jsx(MapPin, { className: "h-4 w-4 text-sky-400" }), formatLocationSource(locationSource)] })] })] })] }));
}
