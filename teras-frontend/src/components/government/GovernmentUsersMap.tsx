import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { AlertCircle, Building2, Globe2, LocateFixed, MapPin, Shield, Users } from 'lucide-react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { GovernmentMapMarker, GovernmentUsersMapData } from '../../services/governmentApi';
import { governmentApi } from '../../services/governmentApi';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const CEMAC_BOUNDS = L.latLngBounds(
  [-6.5, 7.5],
  [15.5, 31.5]
);

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

const LeafletMapContainer = MapContainer as any;
const LeafletTileLayer = TileLayer as any;
const LeafletMarker = Marker as any;
const LeafletCircleMarker = CircleMarker as any;
const LeafletPopup = Popup as any;

function FitToMarkers({ markers }: { markers: GovernmentMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (!markers.length) {
      map.fitBounds(CEMAC_BOUNDS, { padding: [24, 24] });
      return;
    }

    const bounds = L.latLngBounds(markers.map((item) => [item.latitude, item.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.22), { padding: [28, 28], maxZoom: 11 });
  }, [map, markers]);

  return null;
}

function formatUserType(type?: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    individual: 'Particulier',
    enterprise: 'Entreprise',
    bank: 'Banque',
    government: 'Gouvernement',
  };
  return labels[type || ''] || type || 'Utilisateur';
}

function formatSource(source?: string) {
  const labels: Record<string, string> = {
    'browser-geolocation': 'Géolocalisation navigateur',
    'map-click': 'Choisi sur la carte',
    'country-capital-anchor': 'Agrégation au niveau pays',
  };
  return labels[source || ''] || 'Position enregistrée';
}

function formatRisk(risk?: string | null) {
  const labels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
  };
  return labels[risk || ''] || 'N/A';
}

function aggregateRadius(marker: GovernmentMapMarker) {
  const total = marker.total_users || 0;
  if (total >= 25) return 18;
  if (total >= 10) return 14;
  if (total >= 5) return 12;
  return 10;
}

export default function GovernmentUsersMap() {
  const [data, setData] = useState<GovernmentUsersMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } else {
        setData(response.data || null);
      }
      setLoading(false);
    };

    load();
  }, [country, userType, status, source]);

  const detailedMarkers = useMemo(
    () => (data?.markers || []).filter((marker) => marker.marker_type === 'user'),
    [data]
  );
  const aggregateMarkers = useMemo(
    () => (data?.markers || []).filter((marker) => marker.marker_type === 'country'),
    [data]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Globe2 className="h-5 w-5 text-sky-400" />
              Carte CEMAC des utilisateurs géolocalisés
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Détail précis pour {data?.viewer_country_name || 'la zone CEMAC'} et vue agrégée pour les autres pays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              <LocateFixed className="h-3.5 w-3.5" />
              {data?.summary.detailed_users || 0} détails
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
              <Building2 className="h-3.5 w-3.5" />
              {data?.summary.aggregated_markers || 0} agrégats
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300">
              <Users className="h-3.5 w-3.5" />
              {data?.summary.total_geolocated || 0} géolocalisés
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="all">Tous les pays CEMAC</option>
            {CEMAC_COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={userType}
            onChange={(event) => setUserType(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="all">Tous les types</option>
            <option value="individual">Particulier</option>
            <option value="enterprise">Entreprise</option>
            <option value="bank">Banque</option>
            <option value="government">Gouvernement</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="all">Toutes les sources GPS</option>
            <option value="browser-geolocation">Me localiser</option>
            <option value="map-click">Choisi sur la carte</option>
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Détail autorisé
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pays agrégé
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            {data?.access_mode === 'cemac_full_detail'
              ? 'Compte global : détail complet CEMAC'
              : `Compte national : détail ${data?.viewer_country_name || ''}, agrégé pour le reste`}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 px-6 py-16 text-center text-slate-400">
          Chargement de la carte gouvernementale…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50">
          <LeafletMapContainer center={[1.5, 15.5]} zoom={5} className="h-[560px] w-full" scrollWheelZoom>
            <LeafletTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToMarkers markers={data?.markers || []} />

            {aggregateMarkers.map((item) => (
              <LeafletCircleMarker
                key={item.id}
                center={[item.latitude, item.longitude]}
                radius={aggregateRadius(item)}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.35, weight: 2 }}
              >
                <LeafletPopup>
                  <div className="min-w-[220px] space-y-2 text-slate-900">
                    <div>
                      <p className="text-sm font-semibold">{item.country_name}</p>
                      <p className="text-xs text-slate-600">{item.city || 'Capitale'} · vue agrégée</p>
                    </div>
                    <div className="grid gap-1 text-xs">
                      <p><span className="font-medium">Utilisateurs :</span> {item.total_users || 0}</p>
                      <p><span className="font-medium">Actifs :</span> {item.active_users || 0}</p>
                      <p><span className="font-medium">Score moyen :</span> {item.avg_score ?? 'N/A'}</p>
                      <p><span className="font-medium">Source :</span> {formatSource(item.location_source)}</p>
                    </div>
                    {item.type_breakdown && item.type_breakdown.length > 0 && (
                      <div className="border-t border-slate-200 pt-2 text-xs">
                        <p className="mb-1 font-medium">Répartition</p>
                        <div className="space-y-1">
                          {item.type_breakdown.map((entry) => (
                            <div key={`${item.id}-${entry.user_type}`} className="flex items-center justify-between">
                              <span>{formatUserType(entry.user_type)}</span>
                              <span className="font-semibold">{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-600">{item.message}</p>
                  </div>
                </LeafletPopup>
              </LeafletCircleMarker>
            ))}

            {detailedMarkers.map((item) => (
              <LeafletMarker key={item.id} position={[item.latitude, item.longitude]} icon={marker}>
                <LeafletPopup>
                  <div className="min-w-[220px] space-y-2 text-slate-900">
                    <div>
                      <p className="text-sm font-semibold">{item.full_name || 'Utilisateur TERAS'}</p>
                      <p className="text-xs text-slate-600">{formatUserType(item.user_type)} · {item.country_name}</p>
                    </div>
                    <div className="grid gap-1 text-xs">
                      <p><span className="font-medium">Ville :</span> {item.city || 'Non précisée'}</p>
                      <p><span className="font-medium">Adresse :</span> {item.address || 'Non précisée'}</p>
                      <p><span className="font-medium">Statut :</span> {item.is_active ? 'Actif' : 'Inactif'}</p>
                      <p><span className="font-medium">Score :</span> {item.score ?? 'N/A'}</p>
                      <p><span className="font-medium">Risque :</span> {formatRisk(item.risk_level)}</p>
                      <p><span className="font-medium">Source :</span> {formatSource(item.location_source)}</p>
                    </div>
                  </div>
                </LeafletPopup>
              </LeafletMarker>
            ))}
          </LeafletMapContainer>
        </div>
      )}
    </div>
  );
}
