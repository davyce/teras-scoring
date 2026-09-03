import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Building2,
  DollarSign,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';

interface BankEnterpriseApi {
  id: number;
  name?: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  sector?: string;
  email?: string;
  phone?: string;
  annual_revenue?: number | string;
  employees_count?: number;
  teras_score?: number | null;
  teras_band?: string;
  active_loans_count?: number;
  total_borrowed?: number | string;
  crm_limit?: number | string;
  status?: string;
  created_at?: string;
  join_date?: string;
}

interface EnterpriseRow {
  id: number;
  displayName: string;
  commercialName: string;
  taxId: string;
  registrationNumber: string;
  sector: string;
  email: string;
  phone: string;
  employees: number;
  revenue: number;
  score: number;
  band: string;
  status: string;
  activeLoansCount: number;
  totalBorrowed: number;
  crmLimit: number;
  createdAt: string;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function inferBand(score: number): string {
  if (score >= 900) return 'A+';
  if (score >= 800) return 'A';
  if (score >= 700) return 'B';
  if (score >= 600) return 'C';
  if (score >= 500) return 'D';
  return 'E';
}

function normalizeEnterprise(raw: BankEnterpriseApi): EnterpriseRow {
  const score = Math.max(0, Math.round(toNumber(raw.teras_score)));
  return {
    id: raw.id,
    displayName: raw.legal_name || raw.name || `Entreprise #${raw.id}`,
    commercialName: raw.name || raw.legal_name || `Entreprise #${raw.id}`,
    taxId: raw.tax_id || '—',
    registrationNumber: raw.registration_number || '—',
    sector: raw.sector || 'Non renseigne',
    email: raw.email || '—',
    phone: raw.phone || '—',
    employees: raw.employees_count || 0,
    revenue: toNumber(raw.annual_revenue),
    score,
    band: raw.teras_band || inferBand(score),
    status: raw.status || 'inactive',
    activeLoansCount: raw.active_loans_count || 0,
    totalBorrowed: toNumber(raw.total_borrowed),
    crmLimit: toNumber(raw.crm_limit),
    createdAt: raw.created_at || raw.join_date || '',
  };
}

async function readApiPayload(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    return {
      error: isHtml ? `Le serveur a renvoye une page HTML (${res.status}).` : text.slice(0, 300),
    };
  }
}

function formatCurrency(amount: number): string {
  if (!amount) return '0 FCFA';
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

function formatCompactCurrency(amount: number): string {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k`;
  return `${Math.round(amount)}`;
}

function getBandColor(band: string): string {
  const colors: Record<string, string> = {
    'A+': 'emerald',
    A: 'green',
    B: 'blue',
    C: 'amber',
    D: 'orange',
    E: 'red',
  };
  return colors[band] || 'slate';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'amber',
    suspended: 'red',
  };
  return colors[status] || 'slate';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  };
  return labels[status] || status;
}

function formatRelativeDate(dateString: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BankEnterprises() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [enterprises, setEnterprises] = React.useState<EnterpriseRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadEnterprises = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await authFetch('/api/scoring/bank/enterprises/?page_size=100');
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(payload.error || `Erreur ${res.status}`);
      const items = Array.isArray(payload) ? payload : (payload.results ?? payload.data ?? []);
      setEnterprises(items.map(normalizeEnterprise));
    } catch (e: any) {
      setError(e.message || 'Impossible de charger le portefeuille entreprises.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadEnterprises(true);
  }, []);

  const sectors = (() => {
    const values = Array.from(new Set(enterprises.map((enterprise) => enterprise.sector))).sort();
    return [{ value: 'all', label: 'Tous les secteurs' }, ...values.map((value) => ({ value, label: value }))];
  })();

  const bands = [
    { value: 'all', label: 'Toutes les bandes' },
    { value: 'A+', label: 'A+ (900-1000)' },
    { value: 'A', label: 'A (800-899)' },
    { value: 'B', label: 'B (700-799)' },
    { value: 'C', label: 'C (600-699)' },
    { value: 'D', label: 'D (500-599)' },
    { value: 'E', label: 'E (<500)' },
  ];

  const statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
  ];

  const filteredEnterprises = enterprises.filter((enterprise) => {
    const haystack = [
      enterprise.displayName,
      enterprise.commercialName,
      enterprise.taxId,
      enterprise.registrationNumber,
      enterprise.email,
      String(enterprise.id),
    ].join(' ').toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesBand = selectedBand === 'all' || enterprise.band === selectedBand;
    const matchesSector = selectedSector === 'all' || enterprise.sector === selectedSector;
    const matchesStatus = selectedStatus === 'all' || enterprise.status === selectedStatus;

    return matchesSearch && matchesBand && matchesSector && matchesStatus;
  });

  const totalEnterprises = enterprises.length;
  const activeEnterprises = enterprises.filter((enterprise) => enterprise.status === 'active').length;
  const totalRevenue = enterprises.reduce((sum, enterprise) => sum + enterprise.revenue, 0);
  const employeesTotal = enterprises.reduce((sum, enterprise) => sum + enterprise.employees, 0);
  const scoredEnterprises = enterprises.filter((enterprise) => enterprise.score > 0);
  const avgScore = scoredEnterprises.length
    ? scoredEnterprises.reduce((sum, enterprise) => sum + enterprise.score, 0) / scoredEnterprises.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Entreprises</h1>
          <p className="text-slate-400 mt-1">Portefeuille entreprises aligne sur les donnees bancaires reelles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadEnterprises(false)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => navigate('/bank/enterprises/new')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Nouvelle entreprise
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Building2 className="w-10 h-10 text-blue-400" />
            <span className="text-green-400 text-sm font-medium">{activeEnterprises}/{totalEnterprises}</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Entreprises actives</p>
          <p className="text-3xl font-bold text-white">{activeEnterprises}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">CA total observe</p>
          <p className="text-3xl font-bold text-white">{(totalRevenue / 1_000_000).toFixed(1)}M</p>
          <p className="text-slate-400 text-xs mt-1">FCFA annuel cumule</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-10 h-10 text-amber-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Score TERAS moyen</p>
          <p className="text-3xl font-bold text-white">{Math.round(avgScore)}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Effectifs cumules</p>
          <p className="text-3xl font-bold text-white">{employeesTotal}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, RCCM, NIU, email..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            >
              {bands.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            >
              {sectors.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <p className="text-slate-400 text-sm">{filteredEnterprises.length} entreprise(s) trouvee(s)</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            Chargement du portefeuille entreprises…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    <button className="flex items-center gap-2 hover:text-white transition-colors">
                      Entreprise
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Secteur</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Score TERAS</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Employes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">CA annuel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Endettement actif</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Dossier bancaire</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEnterprises.map((enterprise) => (
                  <tr
                    key={enterprise.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bank/enterprises/${enterprise.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{enterprise.displayName}</p>
                        <p className="text-slate-400 text-sm">{enterprise.commercialName}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          RCCM {enterprise.registrationNumber} • NIU {enterprise.taxId}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-lg">
                        {enterprise.sector}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-lg">{enterprise.score || '—'}</span>
                        <span
                          className={`px-2 py-1 bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400 text-xs rounded-full font-semibold`}
                        >
                          {enterprise.band}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-white">{enterprise.employees}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{formatCompactCurrency(enterprise.revenue)} FCFA</div>
                      <div className="text-slate-400 text-xs">{formatCurrency(enterprise.revenue)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {enterprise.activeLoansCount > 0 ? (
                        <div>
                          <div className="text-white font-medium">{formatCompactCurrency(enterprise.totalBorrowed)} FCFA</div>
                          <div className="text-green-400 text-xs">{enterprise.activeLoansCount} credit(s) actif(s)</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Aucun credit actif</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{formatCompactCurrency(enterprise.crmLimit)} FCFA</div>
                        <div className="text-slate-400 text-xs">
                          CRM mensuel • {getStatusLabel(enterprise.status)} • {formatRelativeDate(enterprise.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bank/enterprises/${enterprise.id}`);
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Voir les details"
                      >
                        <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnterprises.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-slate-500">
                      Aucune entreprise ne correspond aux filtres actuels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
