// @ts-nocheck
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Download,
  List,
  Map,
  MapPin,
  MoreVertical,
  Search,
  Shield,
  User as UserIcon,
  UserPlus,
  Users,
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import AdminUsersMap from '../../components/admin/AdminUsersMap';
import { adminApi, AdminMapUser, User } from '../../services/adminApi';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [mapUsers, setMapUsers] = useState<AdminMapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadUsers();
  }, [filterType, filterRegion, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, mapResponse] = await Promise.all([
        adminApi.getUsers({
          type: filterType !== 'all' ? filterType : undefined,
          region: filterRegion !== 'all' ? filterRegion : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }),
        adminApi.getUsersMap({
          type: filterType !== 'all' ? filterType : undefined,
          region: filterRegion !== 'all' ? filterRegion : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }),
      ]);

      setUsers(usersResponse.data?.users || []);
      setMapUsers(mapResponse.data?.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
      setMapUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearchTerm = (user: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    region?: string;
    city?: string;
    address?: string;
  }) => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return [user.username, user.email, user.first_name, user.last_name, user.full_name, user.region, user.city, user.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  };

  const exportCSV = () => {
    const list = filteredUsers;
    const headers = ['Nom', 'Email', 'Type', 'Région', 'Score', 'Risque', 'Statut'];
    const rows = list.map((u: any) => [
      `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      u.email, u.user_type, u.region || '',
      u.score || '', u.risk_level || '',
      u.is_active ? 'Actif' : 'Suspendu',
    ]);
    const csv = [headers, ...rows]
      .map((r: any[]) => r.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const matchesRiskLevel = (riskLevel?: string | null) => {
    if (filterRisk === 'all') return true;
    return riskLevel === filterRisk;
  };

  const filteredUsers = users.filter((user) => matchesSearchTerm(user) && matchesRiskLevel(user.risk_level));
  const filteredMapUsers = mapUsers.filter((user) => matchesSearchTerm(user) && matchesRiskLevel(user.risk_level));
  const visibleCount = viewMode === 'map' ? filteredMapUsers.length : filteredUsers.length;
  const uniqueRegions = [...new Set([...users, ...mapUsers].map((u) => u.region).filter(Boolean))];

  const getTypeBadge = (type: string) => {
    const styles = {
      admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      individual: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      enterprise: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      bank: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      government: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    };
    const labels = {
      admin: 'Admin',
      individual: 'Individu',
      enterprise: 'Entreprise',
      bank: 'Banque',
      government: 'Gouvernement',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles] || styles.individual}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  const getRiskBadge = (risk?: string) => {
    if (!risk) return null;
    const styles = {
      low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    const labels = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[risk as keyof typeof styles]}`}>
        {labels[risk as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-72" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-36" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full">
            <thead><tr>{Array.from({ length: 7 }).map((_, i) => <th key={i} className="px-6 py-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" /></th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-44" />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs 🇨🇬</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {visibleCount} utilisateur{visibleCount > 1 ? 's' : ''} affiché{visibleCount > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>

          {filteredUsers.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
            <UserPlus className="h-5 w-5" />
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 border-l-4 border-blue-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 border-l-4 border-sky-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Géolocalisés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mapUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 border-l-4 border-green-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter((user) => user.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 border-l-4 border-purple-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Individuels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter((user) => user.user_type === 'individual').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 border-l-4 border-orange-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Entreprises</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter((user) => user.user_type === 'enterprise').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, ville, adresse..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            />
          </div>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          >
            <option value="all">Tous les types</option>
            <option value="individual">Individuel</option>
            <option value="enterprise">Entreprise</option>
            <option value="government">Gouvernement</option>
            <option value="bank">Banque</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={filterRegion}
            onChange={(event) => setFilterRegion(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          >
            <option value="all">Toutes régions</option>
            {uniqueRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            value={filterRisk}
            onChange={(event) => setFilterRisk(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          >
            <option value="all">Tous risques</option>
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Élevé</option>
          </select>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          >
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
            <option value="all">Tous les statuts</option>
          </select>
        </div>
      </div>

      {viewMode === 'map' ? (
        <AdminUsersMap users={filteredMapUsers} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Région / Localité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Score TERAS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Risque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <span className="text-sm font-semibold text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{getTypeBadge(user.user_type)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="space-y-1">
                        {user.region && (
                          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                            <MapPin className="h-3 w-3" />
                            {user.region}
                          </div>
                        )}
                        {user.sector && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Briefcase className="h-3 w-3" />
                            {user.sector}
                          </div>
                        )}
                        {!user.sector && user.city && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">{user.city}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.score ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                              style={{ width: `${(user.score / 1000) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.score}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{getRiskBadge(user.risk_level)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.is_active ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Suspendu
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/users/${user.id}`);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
