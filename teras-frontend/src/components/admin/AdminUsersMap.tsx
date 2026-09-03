import { useEffect } from 'react';
import L from 'leaflet';
import { AlertCircle, MapPin } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { AdminMapUser } from '../../services/adminApi';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

type AdminUsersMapProps = {
  users: AdminMapUser[];
};

const CEMAC_CENTER: [number, number] = [1.5, 15.5];
const CEMAC_BOUNDS = L.latLngBounds(
  [-5.5, 8.0],
  [15.0, 31.5]
);

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

const LeafletMapContainer = MapContainer as any;
const LeafletTileLayer = TileLayer as any;
const LeafletMarker = Marker as any;
const LeafletPopup = Popup as any;

function formatUserType(type?: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    individual: 'Particulier',
    enterprise: 'Entreprise',
    government: 'Gouvernement',
    bank: 'Banque',
  };

  return labels[type || ''] || type || 'Utilisateur';
}

function formatLocationSource(source?: string) {
  const labels: Record<string, string> = {
    'browser-geolocation': 'Géolocalisation navigateur',
    'map-click': 'Choisi sur la carte',
  };

  return labels[source || ''] || 'Position enregistrée';
}

function FitToUsers({ users }: { users: AdminMapUser[] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    if (!users.length) {
      map.fitBounds(CEMAC_BOUNDS, { padding: [24, 24] });
      return;
    }

    const bounds = L.latLngBounds(
      users.map((user) => [user.latitude, user.longitude] as [number, number])
    );

    map.fitBounds(bounds.pad(0.2), {
      padding: [32, 32],
      maxZoom: 12,
    });
  }, [map, users]);

  return null;
}

export default function AdminUsersMap({ users }: AdminUsersMapProps) {
  if (!users.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-500" />
        <h3 className="text-lg font-semibold text-white">Aucun utilisateur géolocalisé</h3>
        <p className="mt-2 text-sm text-slate-400">
          Les utilisateurs qui utilisent le bouton <span className="font-medium text-sky-300">Me localiser</span> ou
          choisissent leur position sur la carte apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40">
      <div className="flex flex-col gap-2 border-b border-slate-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Carte CEMAC des utilisateurs</h3>
          <p className="text-sm text-slate-400">
            Vue temps réel des comptes qui ont enregistré une position GPS lors de l’inscription ou depuis leur profil.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
          <MapPin className="h-4 w-4" />
          {users.length} géolocalisé{users.length > 1 ? 's' : ''}
        </div>
      </div>

      <LeafletMapContainer center={CEMAC_CENTER} zoom={5} className="h-[560px] w-full" scrollWheelZoom>
        <LeafletTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToUsers users={users} />
        {users.map((user) => (
          <LeafletMarker key={user.id} position={[user.latitude, user.longitude]} icon={defaultMarker}>
            <LeafletPopup>
              <div className="min-w-[220px] space-y-2 text-slate-900">
                <div>
                  <p className="text-sm font-semibold">{user.full_name || user.username}</p>
                  <p className="text-xs text-slate-600">{user.email}</p>
                </div>
                <div className="grid gap-1 text-xs">
                  <p><span className="font-medium">Type :</span> {formatUserType(user.user_type)}</p>
                  <p><span className="font-medium">Ville :</span> {user.city || 'Non précisée'}</p>
                  <p><span className="font-medium">Adresse :</span> {user.address || 'Non précisée'}</p>
                  <p><span className="font-medium">Région :</span> {user.region || 'Non précisée'}</p>
                  <p><span className="font-medium">Statut :</span> {user.is_active ? 'Actif' : 'Suspendu'}</p>
                  <p><span className="font-medium">KYC :</span> {user.kyc_status || 'pending'}</p>
                  <p><span className="font-medium">Score :</span> {user.score ?? 'N/A'}</p>
                  <p><span className="font-medium">Source :</span> {formatLocationSource(user.location_source)}</p>
                </div>
              </div>
            </LeafletPopup>
          </LeafletMarker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}
