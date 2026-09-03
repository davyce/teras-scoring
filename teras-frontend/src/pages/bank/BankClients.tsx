import { authFetch } from '../../utils/authFetch';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Eye, User, RefreshCw,
  AlertCircle, TrendingUp, CreditCard, Copy, CheckCircle,
} from 'lucide-react';

// ── Types API réels ───────────────────────────────────────────────────────────

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  niu: string;
  national_id: string;
  city: string;
  country: string;
  occupation: string;
  monthly_income: string;
  teras_score: number | null;
  teras_band: string;
  active_loans_count: number;
  total_borrowed: string;
  status: string;
  crm_limit: number;
  teras_account_email: string;
  join_date: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BAND_COLOR: Record<string, string> = {
  A: 'emerald', B: 'green', C: 'blue', D: 'amber', E: 'red',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'emerald', inactive: 'slate', suspended: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu',
};

function formatFCFA(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (!n) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function BankClients() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [filterScore, setFilterScore] = useState('all');
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<number | null>(null);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/scoring/bank/clients/?page=${page}`;
      if (search)      url += `&search=${encodeURIComponent(search)}`;
      if (filterScore === 'high')   url += '&score_min=700';
      if (filterScore === 'medium') url += '&score_min=600&score_max=699';
      if (filterScore === 'low')    url += '&score_max=599';

      const res  = await authFetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setClients(json.results ?? []);
      setTotal(json.count ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, [search, filterScore, page]);

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total,
    active:      clients.filter(c => c.status === 'active').length,
    avgScore:    clients.length
      ? Math.round(clients.filter(c => c.teras_score).reduce((s, c) => s + (c.teras_score || 0), 0) / Math.max(clients.filter(c => c.teras_score).length, 1))
      : 0,
    totalVolume: clients.reduce((s, c) => s + parseFloat(c.total_borrowed || '0'), 0),
  };

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients Particuliers</h1>
          <p className="text-slate-400 mt-1">{total} clients enregistrés</p>
        </div>
        <button
          onClick={() => navigate('/bank/clients/new')}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Nouveau Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients',  value: total,                       icon: Users,      color: 'blue'    },
          { label: 'Clients Actifs', value: stats.active,                icon: User,       color: 'emerald' },
          { label: 'Score Moyen',    value: stats.avgScore || '—',       icon: TrendingUp, color: 'amber'   },
          { label: 'Volume Total',   value: formatFCFA(stats.totalVolume), icon: CreditCard, color: 'purple'  },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 text-${s.color}-400`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom, NIU ou email…"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>
          <select
            value={filterScore}
            onChange={e => { setFilterScore(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-sm"
          >
            <option value="all">Tous les scores</option>
            <option value="high">Score élevé (≥700)</option>
            <option value="medium">Score moyen (600–699)</option>
            <option value="low">Score faible (&lt;600)</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={loadClients} className="ml-auto flex items-center gap-1 hover:text-red-100">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" /> Chargement…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Client', 'NIU', 'Contact', 'Score TERAS', 'CRM', 'Crédits', 'Compte TERAS', 'Statut', ''].map(h => (
                    <th key={h} className="text-left p-4 text-slate-400 font-medium text-sm whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(client => {
                  const band     = client.teras_band || 'E';
                  const bandCol  = BAND_COLOR[band] || 'slate';
                  const statusCol = STATUS_COLOR[client.status] || 'slate';

                  return (
                    <tr key={client.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">

                      {/* Client */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {client.first_name[0]}{client.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{client.first_name} {client.last_name}</p>
                            <p className="text-slate-500 text-xs">{client.city}, {client.country}</p>
                          </div>
                        </div>
                      </td>

                      {/* NIU */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 text-xs font-mono">{client.niu}</span>
                          <button
                            onClick={() => copyToClipboard(client.niu, client.id)}
                            className="text-slate-600 hover:text-slate-300 transition-colors"
                            title="Copier NIU"
                          >
                            {copiedId === client.id
                              ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                              : <Copy className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">{client.email}</p>
                        <p className="text-slate-500 text-xs">{client.phone}</p>
                      </td>

                      {/* Score */}
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-white font-semibold text-sm">
                            {client.teras_score ?? '—'}
                          </span>
                          {client.teras_band && (
                            <span className={`px-2 py-0.5 bg-${bandCol}-500/10 text-${bandCol}-400 text-xs rounded`}>
                              {band}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CRM */}
                      <td className="p-4">
                        <span className="text-emerald-400 text-sm font-medium">
                          {formatFCFA(client.crm_limit)}/mois
                        </span>
                      </td>

                      {/* Crédits */}
                      <td className="p-4 text-center">
                        <span className="text-white text-sm">{client.active_loans_count}</span>
                        {parseFloat(client.total_borrowed) > 0 && (
                          <p className="text-slate-500 text-xs">{formatFCFA(client.total_borrowed)}</p>
                        )}
                      </td>

                      {/* Compte TERAS */}
                      <td className="p-4">
                        {client.teras_account_email ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-slate-400 text-xs truncate max-w-[120px]">
                              {client.teras_account_email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Non créé</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 bg-${statusCol}-500/10 text-${statusCol}-400 text-xs rounded-lg`}>
                          {STATUS_LABEL[client.status] || client.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/bank/clients/${client.id}`)}
                          className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {clients.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun client trouvé</p>
                <button
                  onClick={() => navigate('/bank/clients/new')}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" /> Créer le premier client
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} — {Math.min(page * 20, total)}/{total} clients</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}