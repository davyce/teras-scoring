import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { AlertCircle, Building2, Globe2, LocateFixed, Shield, Users } from 'lucide-react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { governmentApi } from '../../services/governmentApi';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const CEMAC_BOUNDS = L.latLngBounds([-6.5, 7.5], [15.5, 31.5]);
const CEMAC_COUNTRIES = [
    { code: 'CG', label: 'Congo Brazzaville' },
    { code: 'CM', label: 'Cameroun' },
    { code: 'GA', label: 'Gabon' },
    { code: 'CF', label: 'Centrafrique' },
    { code: 'TD', label: 'Tchad' },
    { code: 'GQ', label: 'Guinée Équatoriale' },
    { code: 'CD', label: 'RD Congo' },
];
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
const LeafletCircleMarker = CircleMarker;
const LeafletPopup = Popup;
function FitToMarkers({ markers }) {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        if (!markers.length) {
            map.fitBounds(CEMAC_BOUNDS, { padding: [24, 24] });
            return;
        }
        const bounds = L.latLngBounds(markers.map((item) => [item.latitude, item.longitude]));
        map.fitBounds(bounds.pad(0.22), { padding: [28, 28], maxZoom: 11 });
    }, [map, markers]);
    return null;
}
function formatUserType(type) {
    const labels = {
        admin: 'Admin',
        individual: 'Particulier',
        enterprise: 'Entreprise',
        bank: 'Banque',
        government: 'Gouvernement',
    };
    return labels[type || ''] || type || 'Utilisateur';
}
function formatSource(source) {
    const labels = {
        'browser-geolocation': 'Géolocalisation navigateur',
        'map-click': 'Choisi sur la carte',
        'country-capital-anchor': 'Agrégation au niveau pays',
    };
    return labels[source || ''] || 'Position enregistrée';
}
function formatRisk(risk) {
    const labels = {
        low: 'Faible',
        medium: 'Moyen',
        high: 'Élevé',
    };
    return labels[risk || ''] || 'N/A';
}
function aggregateRadius(marker) {
    const total = marker.total_users || 0;
    if (total >= 25)
        return 18;
    if (total >= 10)
        return 14;
    if (total >= 5)
        return 12;
    return 10;
}
export default function GovernmentUsersMap() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [country, setCountry] = useState('all');
    const [userType, setUserType] = useState('all');
    const [status, setStatus] = useState('all');
    const [source, setSource] = useState('all');
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            const response = await governmentApi.getUsersMap({
                country: country !== 'all' ? country : undefined,
                type: userType !== 'all' ? userType : undefined,
                status: status !== 'all' ? status : undefined,
                source: source !== 'all' ? source : undefined,
            });
            if (response.error) {
                setError(response.error);
                setData(null);
            }
            else {
                setData(response.data || null);
            }
            setLoading(false);
        };
        load();
    }, [country, userType, status, source]);
    const detailedMarkers = useMemo(() => (data?.markers || []).filter((marker) => marker.marker_type === 'user'), [data]);
    const aggregateMarkers = useMemo(() => (data?.markers || []).filter((marker) => marker.marker_type === 'country'), [data]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [_jsx(Globe2, { className: "h-5 w-5 text-sky-400" }), "Carte CEMAC des utilisateurs g\u00E9olocalis\u00E9s"] }), _jsxs("p", { className: "mt-1 text-sm text-slate-400", children: ["D\u00E9tail pr\u00E9cis pour ", data?.viewer_country_name || 'la zone CEMAC', " et vue agr\u00E9g\u00E9e pour les autres pays."] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: [_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300", children: [_jsx(LocateFixed, { className: "h-3.5 w-3.5" }), data?.summary.detailed_users || 0, " d\u00E9tails"] }), _jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300", children: [_jsx(Building2, { className: "h-3.5 w-3.5" }), data?.summary.aggregated_markers || 0, " agr\u00E9gats"] }), _jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300", children: [_jsx(Users, { className: "h-3.5 w-3.5" }), data?.summary.total_geolocated || 0, " g\u00E9olocalis\u00E9s"] })] })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4", children: [_jsxs("select", { value: country, onChange: (event) => setCountry(event.target.value), className: "rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500", children: [_jsx("option", { value: "all", children: "Tous les pays CEMAC" }), CEMAC_COUNTRIES.map((item) => (_jsx("option", { value: item.code, children: item.label }, item.code)))] }), _jsxs("select", { value: userType, onChange: (event) => setUserType(event.target.value), className: "rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500", children: [_jsx("option", { value: "all", children: "Tous les types" }), _jsx("option", { value: "individual", children: "Particulier" }), _jsx("option", { value: "enterprise", children: "Entreprise" }), _jsx("option", { value: "bank", children: "Banque" }), _jsx("option", { value: "government", children: "Gouvernement" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsxs("select", { value: source, onChange: (event) => setSource(event.target.value), className: "rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500", children: [_jsx("option", { value: "all", children: "Toutes les sources GPS" }), _jsx("option", { value: "browser-geolocation", children: "Me localiser" }), _jsx("option", { value: "map-click", children: "Choisi sur la carte" })] }), _jsxs("select", { value: status, onChange: (event) => setStatus(event.target.value), className: "rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500", children: [_jsx("option", { value: "all", children: "Tous les statuts" }), _jsx("option", { value: "active", children: "Actifs" }), _jsx("option", { value: "inactive", children: "Inactifs" })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2 text-xs text-slate-400", children: [_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-400" }), "D\u00E9tail autoris\u00E9"] }), _jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-400" }), "Pays agr\u00E9g\u00E9"] }), _jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1", children: [_jsx(Shield, { className: "h-3.5 w-3.5 text-sky-400" }), data?.access_mode === 'cemac_full_detail'
                                        ? 'Compte global : détail complet CEMAC'
                                        : `Compte national : détail ${data?.viewer_country_name || ''}, agrégé pour le reste`] })] })] }), error && (_jsxs("div", { className: "flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200", children: [_jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsx("span", { children: error })] })), loading ? (_jsx("div", { className: "rounded-2xl border border-slate-800/50 bg-slate-900/50 px-6 py-16 text-center text-slate-400", children: "Chargement de la carte gouvernementale\u2026" })) : (_jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50", children: _jsxs(LeafletMapContainer, { center: [1.5, 15.5], zoom: 5, className: "h-[560px] w-full", scrollWheelZoom: true, children: [_jsx(LeafletTileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(FitToMarkers, { markers: data?.markers || [] }), aggregateMarkers.map((item) => (_jsx(LeafletCircleMarker, { center: [item.latitude, item.longitude], radius: aggregateRadius(item), pathOptions: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.35, weight: 2 }, children: _jsx(LeafletPopup, { children: _jsxs("div", { className: "min-w-[220px] space-y-2 text-slate-900", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: item.country_name }), _jsxs("p", { className: "text-xs text-slate-600", children: [item.city || 'Capitale', " \u00B7 vue agr\u00E9g\u00E9e"] })] }), _jsxs("div", { className: "grid gap-1 text-xs", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Utilisateurs :" }), " ", item.total_users || 0] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Actifs :" }), " ", item.active_users || 0] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Score moyen :" }), " ", item.avg_score ?? 'N/A'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Source :" }), " ", formatSource(item.location_source)] })] }), item.type_breakdown && item.type_breakdown.length > 0 && (_jsxs("div", { className: "border-t border-slate-200 pt-2 text-xs", children: [_jsx("p", { className: "mb-1 font-medium", children: "R\u00E9partition" }), _jsx("div", { className: "space-y-1", children: item.type_breakdown.map((entry) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: formatUserType(entry.user_type) }), _jsx("span", { className: "font-semibold", children: entry.count })] }, `${item.id}-${entry.user_type}`))) })] })), _jsx("p", { className: "text-xs text-slate-600", children: item.message })] }) }) }, item.id))), detailedMarkers.map((item) => (_jsx(LeafletMarker, { position: [item.latitude, item.longitude], icon: marker, children: _jsx(LeafletPopup, { children: _jsxs("div", { className: "min-w-[220px] space-y-2 text-slate-900", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: item.full_name || 'Utilisateur TERAS' }), _jsxs("p", { className: "text-xs text-slate-600", children: [formatUserType(item.user_type), " \u00B7 ", item.country_name] })] }), _jsxs("div", { className: "grid gap-1 text-xs", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Ville :" }), " ", item.city || 'Non précisée'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Adresse :" }), " ", item.address || 'Non précisée'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Statut :" }), " ", item.is_active ? 'Actif' : 'Inactif'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Score :" }), " ", item.score ?? 'N/A'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Risque :" }), " ", formatRisk(item.risk_level)] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Source :" }), " ", formatSource(item.location_source)] })] })] }) }) }, item.id)))] }) }))] }));
}
