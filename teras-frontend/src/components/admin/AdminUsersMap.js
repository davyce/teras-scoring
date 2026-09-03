import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import L from 'leaflet';
import { AlertCircle, MapPin } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const CEMAC_CENTER = [1.5, 15.5];
const CEMAC_BOUNDS = L.latLngBounds([-5.5, 8.0], [15.0, 31.5]);
const defaultMarker = new L.Icon({
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
const LeafletPopup = Popup;
function formatUserType(type) {
    const labels = {
        admin: 'Admin',
        individual: 'Particulier',
        enterprise: 'Entreprise',
        government: 'Gouvernement',
        bank: 'Banque',
    };
    return labels[type || ''] || type || 'Utilisateur';
}
function formatLocationSource(source) {
    const labels = {
        'browser-geolocation': 'Géolocalisation navigateur',
        'map-click': 'Choisi sur la carte',
    };
    return labels[source || ''] || 'Position enregistrée';
}
function FitToUsers({ users }) {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        if (!users.length) {
            map.fitBounds(CEMAC_BOUNDS, { padding: [24, 24] });
            return;
        }
        const bounds = L.latLngBounds(users.map((user) => [user.latitude, user.longitude]));
        map.fitBounds(bounds.pad(0.2), {
            padding: [32, 32],
            maxZoom: 12,
        });
    }, [map, users]);
    return null;
}
export default function AdminUsersMap({ users }) {
    if (!users.length) {
        return (_jsxs("div", { className: "rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center", children: [_jsx(AlertCircle, { className: "mx-auto mb-3 h-10 w-10 text-slate-500" }), _jsx("h3", { className: "text-lg font-semibold text-white", children: "Aucun utilisateur g\u00E9olocalis\u00E9" }), _jsxs("p", { className: "mt-2 text-sm text-slate-400", children: ["Les utilisateurs qui utilisent le bouton ", _jsx("span", { className: "font-medium text-sky-300", children: "Me localiser" }), " ou choisissent leur position sur la carte appara\u00EEtront ici."] })] }));
    }
    return (_jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40", children: [_jsxs("div", { className: "flex flex-col gap-2 border-b border-slate-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-white", children: "Carte CEMAC des utilisateurs" }), _jsx("p", { className: "text-sm text-slate-400", children: "Vue temps r\u00E9el des comptes qui ont enregistr\u00E9 une position GPS lors de l\u2019inscription ou depuis leur profil." })] }), _jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-200", children: [_jsx(MapPin, { className: "h-4 w-4" }), users.length, " g\u00E9olocalis\u00E9", users.length > 1 ? 's' : ''] })] }), _jsxs(LeafletMapContainer, { center: CEMAC_CENTER, zoom: 5, className: "h-[560px] w-full", scrollWheelZoom: true, children: [_jsx(LeafletTileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(FitToUsers, { users: users }), users.map((user) => (_jsx(LeafletMarker, { position: [user.latitude, user.longitude], icon: defaultMarker, children: _jsx(LeafletPopup, { children: _jsxs("div", { className: "min-w-[220px] space-y-2 text-slate-900", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: user.full_name || user.username }), _jsx("p", { className: "text-xs text-slate-600", children: user.email })] }), _jsxs("div", { className: "grid gap-1 text-xs", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Type :" }), " ", formatUserType(user.user_type)] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Ville :" }), " ", user.city || 'Non précisée'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Adresse :" }), " ", user.address || 'Non précisée'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "R\u00E9gion :" }), " ", user.region || 'Non précisée'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Statut :" }), " ", user.is_active ? 'Actif' : 'Suspendu'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "KYC :" }), " ", user.kyc_status || 'pending'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Score :" }), " ", user.score ?? 'N/A'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Source :" }), " ", formatLocationSource(user.location_source)] })] })] }) }) }, user.id)))] })] }));
}
