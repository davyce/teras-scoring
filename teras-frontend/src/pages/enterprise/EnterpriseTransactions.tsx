/**
 * EnterpriseTransactions.tsx
 * Connecté à /api/scoring/enterprise/transactions/
 * Zéro mock — affiche [] si l'API ne retourne rien
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpRight, ArrowDownLeft, Download, Search,
  DollarSign, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import enterpriseApi, { Transaction } from '../../services/enterpriseApi';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#f97316', '#22c55e'];

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style:'currency', currency:'XAF', minimumFractionDigits:0 }).format(n);

export default function EnterpriseTransactions() {
  const initialStartDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const initialEndDate = new Date().toISOString().split('T')[0];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filterType, setFilterType]     = useState<'all'|'credit'|'debit'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [dateRange, setDateRange] = useState({
    start: initialStartDate,
    end: initialEndDate,
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await enterpriseApi.getTransactions({
        start_date: dateRange.start,
        end_date:   dateRange.end,
        type:       filterType !== 'all' ? filterType : undefined,
        category:   filterCategory !== 'all' ? filterCategory : undefined,
      });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les transactions.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end, filterType, filterCategory]);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(t =>
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableCategories = Array.from(
    new Set(
      transactions
        .map(t => t.category)
        .filter((category): category is string => Boolean(category))
    )
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  const totalCredit = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit  = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const netFlow = totalCredit - totalDebit;

  const chartBuckets = filtered.reduce<Record<string, { credit: number; debit: number }>>((acc, txn) => {
    const dateKey = (txn.date || '').split('T')[0];
    if (!dateKey) return acc;
    if (!acc[dateKey]) acc[dateKey] = { credit: 0, debit: 0 };
    if (txn.type === 'credit') acc[dateKey].credit += txn.amount;
    else acc[dateKey].debit += txn.amount;
    return acc;
  }, {});

  const chartData = Object.entries(chartBuckets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      credit: values.credit,
      debit: values.debit,
    }));

  const categoryData = Array.from(
    filtered.reduce<Map<string, number>>((acc, txn) => {
      const key = txn.category || 'Autre';
      acc.set(key, (acc.get(key) || 0) + txn.amount);
      return acc;
    }, new Map())
  )
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const handleExport = async () => {
    if (filtered.length === 0) {
      alert('Aucune transaction à exporter pour les filtres actuels.');
      return;
    }

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '').replace(/"/g, '""');
      return `"${text}"`;
    };

    const headers = ['date', 'type', 'categorie', 'description', 'montant_xaf', 'solde_xaf', 'reference', 'statut'];
    const rows = filtered.map(t => [
      t.date ? new Date(t.date).toISOString() : '',
      t.type,
      t.category,
      t.description,
      t.amount,
      t.balance ?? '',
      t.reference ?? '',
      t.status ?? '',
    ]);
    const csv = [headers.join(';'), ...rows.map(row => row.map(escapeCsv).join(';'))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_entreprise_${dateRange.start}_${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">TERAS Entreprise</p>
            <h1 className="text-3xl font-black text-white">Transactions</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-all">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-all text-sm">
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button onClick={load} className="ml-auto text-xs underline">Réessayer</button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Entrées',  val:totalCredit, Icon:ArrowDownLeft, color:'text-emerald-400' },
            { label:'Sorties',  val:totalDebit,  Icon:ArrowUpRight,  color:'text-rose-400'    },
            { label:'Flux Net', val:netFlow,      Icon:DollarSign,    color:netFlow>=0?'text-cyan-400':'text-amber-400' },
          ].map(({ label, val, Icon, color }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-xl font-black ${color}`}>{fmt(val)}</p>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-4">Évolution sur la période</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="date" stroke="#475569" tick={{fontSize:10}}/>
                  <YAxis stroke="#475569" tick={{fontSize:10}}/>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
                  <Line type="monotone" dataKey="credit" stroke="#10b981" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="debit"  stroke="#ef4444" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            {categoryData.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-white mb-4">Répartition catégories</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={e => e.name}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Filtres */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"/>
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">Tous les types</option>
            <option value="credit">Entrées</option>
            <option value="debit">Sorties</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">Toutes catégories</option>
            {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={dateRange.start}
              onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
              className="flex-1 px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"/>
            <input type="date" value={dateRange.end}
              onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
              className="flex-1 px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"/>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin"/>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80">
                <tr>
                  {['Date','Type','Catégorie','Description','Montant','Solde','Statut'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      {transactions.length === 0 ? 'Aucune transaction enregistrée pour cette période.' : 'Aucun résultat pour ces filtres.'}
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-slate-200">{new Date(t.date).toLocaleDateString('fr-FR')}</div>
                      <div className="text-xs text-slate-500">{t.reference}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${t.type==='credit'?'text-emerald-400':'text-rose-400'}`}>
                        {t.type==='credit' ? <ArrowDownLeft className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                        {t.type==='credit' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">{t.category}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{t.description}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      <span className={t.type==='credit'?'text-emerald-400':'text-rose-400'}>
                        {t.type==='credit'?'+':'-'}{fmt(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300">{fmt(t.balance ?? 0)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.status==='completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status==='pending'   ? 'bg-amber-500/20 text-amber-400'    :
                                                  'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.status==='completed'?'Complété':t.status==='pending'?'En attente':'Échoué'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500 text-center">
              {filtered.length} transaction(s)
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
