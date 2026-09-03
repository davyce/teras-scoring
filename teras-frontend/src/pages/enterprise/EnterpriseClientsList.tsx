// src/pages/enterprise/EnterpriseClientsList.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, Plus, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import enterpriseApi, { EnterpriseClient } from "../../services/enterpriseApi";
import { useDebounce } from "../../hooks/useDebounce";

// ── Helpers visuels ───────────────────────────────────────────────────────────
const riskBadge = (risk: string) => {
  if (risk === 'low')    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (risk === 'medium') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
};
const riskLabel = (risk: string) => ({ low: 'Faible', medium: 'Moyen', high: 'Élevé' }[risk] || risk);
const RISK_ORDER: Record<string, number> = { low: 1, medium: 2, high: 3 };

const bandColor = (score: number) =>
  score >= 750 ? 'text-emerald-400' : score >= 600 ? 'text-sky-400' : score >= 400 ? 'text-amber-400' : 'text-rose-400';

// ── Types tri ─────────────────────────────────────────────────────────────────
type SortField = 'name' | 'client_type' | 'teras_score' | 'risk_level' | 'status';
type SortDir   = 'asc' | 'desc';

// ── Icône de tri ──────────────────────────────────────────────────────────────
const SortIcon: React.FC<{ field: SortField; sortField: SortField | null; sortDir: SortDir }> = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />;
  return sortDir === 'asc'
    ? <ChevronUp   className="w-3.5 h-3.5 text-cyan-400" />
    : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />;
};

// ── Header de colonne cliquable ────────────────────────────────────────────────
const SortableTh: React.FC<{
  field: SortField;
  label: string;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}> = ({ field, label, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`px-5 py-3 cursor-pointer select-none group ${className}`}
    onClick={() => onSort(field)}>
    <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition">
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  </th>
);

// ── Comparateur ───────────────────────────────────────────────────────────────
const compareClients = (a: EnterpriseClient, b: EnterpriseClient, field: SortField, dir: SortDir): number => {
  let result = 0;
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      break;
    case 'client_type':
      result = (a.client_type_display || a.client_type || '').localeCompare(
                b.client_type_display || b.client_type || '', 'fr', { sensitivity: 'base' });
      break;
    case 'teras_score':
      result = (a.teras_score || 0) - (b.teras_score || 0);
      break;
    case 'risk_level':
      result = (RISK_ORDER[a.risk_level] || 0) - (RISK_ORDER[b.risk_level] || 0);
      break;
    case 'status':
      result = (a.status || '').localeCompare(b.status || '', 'fr', { sensitivity: 'base' });
      break;
  }
  return dir === 'asc' ? result : -result;
};

// ── Skeleton rows ─────────────────────────────────────────────────────────────
const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-t border-slate-800/60 animate-pulse">
        <td className="px-5 py-4">
          <div className="h-4 bg-slate-800 rounded w-36 mb-1.5" />
          <div className="h-3 bg-slate-800/50 rounded w-20" />
        </td>
        <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
        <td className="px-5 py-4"><div className="h-5 bg-slate-800 rounded w-14" /></td>
        <td className="px-5 py-4"><div className="h-5 bg-slate-800 rounded-full w-16" /></td>
        <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-12" /></td>
        <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-800 rounded w-12 ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ── Export CSV ────────────────────────────────────────────────────────────────
const exportCSV = (clients: EnterpriseClient[]) => {
  const headers = ['Nom', 'KYC ID', 'Type', 'Score TERAS', 'Risque', 'Statut'];
  const rows = clients.map(cl => [
    cl.name,
    cl.kyc_id || String(cl.id),
    cl.client_type_display || cl.client_type || '',
    cl.teras_score ?? '',
    riskLabel(cl.risk_level),
    cl.status_display || cl.status || '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Composant principal ───────────────────────────────────────────────────────
const EnterpriseClientsList: React.FC = () => {
  const [clients, setClients] = useState<EnterpriseClient[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState<string | null>(null);
  const [search, setSearch]    = useState('');
  const [sortField, setSortField] = useState<SortField | null>('teras_score');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(25);

  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await enterpriseApi.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filteredClients = useMemo(() => {
    const filtered = clients.filter(c =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (c.kyc_id || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => compareClients(a, b, sortField, sortDir));
  }, [clients, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const displayedClients = filteredClients.slice((safePage - 1) * pageSize, safePage * pageSize);

  const thProps = { sortField, sortDir, onSort: handleSort };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">TERAS Entreprise</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Portefeuille clients</h1>
            <p className="text-sm text-slate-400 mt-1">
              {filteredClients.length}/{clients.length} client{clients.length > 1 ? 's' : ''} analysé{clients.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
            {!loading && clients.length > 0 && (
              <button
                onClick={() => exportCSV(displayedClients)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 rounded-xl text-sm transition-all">
                <Download className="w-3.5 h-3.5" /> Exporter CSV
              </button>
            )}
            <Link to="/enterprise/new-case" className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Nouveau client
            </Link>
          </div>
        </header>

        {/* Recherche */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou KYC ID..."
          className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-600"
        />

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Table */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr className="text-left">
                  <SortableTh field="name"        label="Client"       {...thProps} />
                  <SortableTh field="client_type" label="Type"         {...thProps} />
                  <SortableTh field="teras_score" label="Score TERAS"  {...thProps} />
                  <SortableTh field="risk_level"  label="Risque"       {...thProps} />
                  <SortableTh field="status"      label="Statut"       {...thProps} />
                  <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : displayedClients.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">
                    {debouncedSearch ? 'Aucun résultat pour cette recherche.' : 'Aucun client enregistré.'}
                  </td></tr>
                ) : displayedClients.map((cl) => (
                  <tr key={cl.id} className="border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-100">{cl.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{cl.kyc_id || `#${cl.id}`}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{cl.client_type_display || cl.client_type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-base ${bandColor(cl.teras_score || 0)}`}>{cl.teras_score || '—'}</span>
                      <span className="text-slate-600 text-xs ml-1">/1000</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-medium ${riskBadge(cl.risk_level)}`}>
                        {riskLabel(cl.risk_level)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs ${cl.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {cl.status === 'active' ? '● Actif' : '○ ' + (cl.status_display || cl.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/enterprise/clients/${cl.id}`} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pied de table — pagination */}
          {!loading && filteredClients.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Infos + reset */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-500">
                  {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                  {debouncedSearch && ` · filtrés`}
                  {sortField && ` · triés par ${sortField === 'teras_score' ? 'score' : sortField === 'risk_level' ? 'risque' : sortField === 'client_type' ? 'type' : sortField} (${sortDir === 'asc' ? '↑' : '↓'})`}
                </span>
                {(sortField || debouncedSearch) && (
                  <button
                    onClick={() => { setSearch(''); setSortField('teras_score'); setSortDir('desc'); setPage(1); }}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition">
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Contrôles pagination */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Par page :</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-600">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs transition">
                    ‹
                  </button>
                  <span className="px-2.5 py-1 text-xs text-slate-400">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs transition">
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EnterpriseClientsList;
