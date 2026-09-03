// teras-frontend/src/pages/enterprise/EnterpriseEmployees.tsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  Users, Plus, Search, RefreshCw, CheckCircle, AlertCircle,
  Edit2, Trash2, X, Save, Link, TrendingUp, User,
  Phone, Mail, Calendar, DollarSign, Briefcase, Shield,
  Eye, EyeOff, ChevronDown,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: string | number) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n/1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const SCORE_COLOR = (s?: number | null) => !s ? 'text-slate-500' : s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : 'text-red-400';
const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  active:     {label:'Actif',      color:'text-emerald-400', bg:'bg-emerald-500/10'},
  inactive:   {label:'Inactif',    color:'text-slate-400',   bg:'bg-slate-700/50'  },
  on_leave:   {label:'En congé',   color:'text-amber-400',   bg:'bg-amber-500/10'  },
  terminated: {label:'Licencié',   color:'text-red-400',     bg:'bg-red-500/10'    },
};

const DEPARTMENTS = ['Direction', 'Finance', 'Commercial', 'Production', 'Logistique', 'RH', 'IT', 'Juridique', 'Marketing', 'Autre'];

// ── Modal Employé ─────────────────────────────────────────────────────────────
function EmployeeModal({ emp, onClose, onSave }: { emp?: any; onClose: () => void; onSave: () => void }) {
  const isEdit = !!emp?.id;
  const [form, setForm] = useState({
    first_name:  emp?.first_name  || '',
    last_name:   emp?.last_name   || '',
    email:       emp?.email       || '',
    phone:       emp?.phone       || '',
    niu:         emp?.niu         || '',
    position:    emp?.position    || '',
    department:  emp?.department  || '',
    salary:      emp?.salary      || '',
    hire_date:   emp?.hire_date   || '',
    status:      emp?.status      || 'active',
    teras_email: emp?.teras_email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setError('Prénom, nom et email sont obligatoires'); return;
    }
    setSaving(true); setError('');
    try {
      const url    = isEdit
        ? `/api/scoring/enterprise/employees/${emp.id}/`
        : '/api/scoring/enterprise/employees/create/';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      onSave(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div>
      <label className="text-slate-300 text-xs font-medium mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-slate-500 text-xs mt-0.5">{hint}</p>}
    </div>
  );
  const Input = (field: string, type = 'text', placeholder = '') => (
    <input type={type} value={(form as any)[field]} onChange={set(field)} placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" />
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-[#0d1829] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1829]">
          <h3 className="text-white font-bold">{isEdit ? 'Modifier l\'employé' : 'Ajouter un employé'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Identité */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Informations personnelles</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom *">{Input('first_name', 'text', 'Prénom')}</Field>
              <Field label="Nom *">{Input('last_name', 'text', 'Nom de famille')}</Field>
            </div>
            <Field label="Email *">{Input('email', 'email', 'email@exemple.cg')}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone">{Input('phone', 'tel', '+242 06 XXX XXXX')}</Field>
              <Field label="NIU" hint="Numéro d'Identification Universel">{Input('niu', 'text', 'CG-NIU-...')}</Field>
            </div>
          </div>

          {/* Poste */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Informations professionnelles</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Poste / Fonction">{Input('position', 'text', 'Ex: Directeur commercial')}</Field>
              <Field label="Département">
                <select value={form.department} onChange={set('department')}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500">
                  <option value="">Sélectionner</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Salaire mensuel (FCFA)">{Input('salary', 'number', 'Ex: 350000')}</Field>
              <Field label="Date d'embauche">{Input('hire_date', 'date')}</Field>
            </div>
            <Field label="Statut">
              <select value={form.status} onChange={set('status')}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500">
                {Object.entries(STATUS_CFG).map(([v,c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Liaison TERAS */}
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-sky-400"/>
              <p className="text-sky-400 font-medium text-sm">Lier à un compte TERAS individuel</p>
            </div>
            <Field label="Email du compte TERAS de l'employé" hint="Si l'employé a un compte TERAS, renseignez son email pour afficher son score">
              {Input('teras_email', 'email', 'email.employe@teras.cg')}
            </Field>
          </div>

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">Annuler</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin"/>Sauvegarde…</> : <><Save className="w-4 h-4"/>{isEdit?'Mettre à jour':'Ajouter l\'employé'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function EnterpriseEmployees() {
  const [employees, setEmps]   = useState<any[]>([]);
  const [stats, setStats]      = useState<any>({});
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal]      = useState<'add'|{type:'edit';emp:any}|null>(null);
  const [deleting, setDeleting] = useState<number|null>(null);
  const [actionMsg, setActionMsg] = useState<{text:string;ok:boolean}|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/scoring/enterprise/employees/');
      const data = await res.json();
      setEmps(data.employees || []);
      setStats(data.stats || {});
    } catch { setEmps([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet employé ?')) return;
    setDeleting(id);
    try {
      await authFetch(`/api/scoring/enterprise/employees/${id}/`, { method: 'DELETE' });
      setActionMsg({ text: 'Employé supprimé.', ok: true });
      load();
    } catch { setActionMsg({ text: 'Erreur lors de la suppression.', ok: false }); }
    finally { setDeleting(null); }
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.position||'').toLowerCase().includes(q);
    const matchDept   = !filterDept   || e.department === filterDept;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      {modal === 'add' && <EmployeeModal onClose={() => setModal(null)} onSave={load}/>}
      {modal && typeof modal === 'object' && modal.type === 'edit' && <EmployeeModal emp={modal.emp} onClose={() => setModal(null)} onSave={load}/>}

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Employés</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez votre personnel et suivez leur score TERAS</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/> Ajouter un employé
          </button>
        </div>
      </div>

      {/* Message action */}
      {actionMsg && (
        <div className={`rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok?'bg-emerald-500/10 border-emerald-500/30 text-emerald-300':'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {actionMsg.text}<button onClick={()=>setActionMsg(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total employés',   val:stats.total||0,      color:'blue',    icon:Users        },
          { label:'Actifs',           val:stats.active||0,     color:'emerald', icon:CheckCircle  },
          { label:'Liés à TERAS',     val:stats.with_teras||0, color:'sky',     icon:Link         },
          { label:'Score TERAS moyen',val:stats.avg_score||'—',color:'purple',  icon:TrendingUp   },
        ].map(({label,val,color,icon:Icon})=>(
          <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-400`}/>
            </div>
            <p className="text-2xl font-bold text-white">{val}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm"/>
        </div>
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous départements</option>
          {departments.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          {Object.entries(STATUS_CFG).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-400"/> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center">
          <Users className="w-14 h-14 text-slate-600 mx-auto mb-4"/>
          <h3 className="text-white font-semibold text-lg mb-2">
            {employees.length === 0 ? 'Aucun employé' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {employees.length === 0 ? 'Commencez par ajouter vos employés.' : 'Modifiez votre recherche.'}
          </p>
          {employees.length === 0 && (
            <button onClick={()=>setModal('add')} className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4"/> Ajouter un employé
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Employé','Département','Poste','Score TERAS','Date embauche','Statut','Actions'].map(h=>(
                    <th key={h} className={`p-4 text-slate-400 font-medium ${h==='Employé'?'text-left':'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp=>{
                  const st=STATUS_CFG[emp.status]||STATUS_CFG.active;
                  return(
                    <tr key={emp.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{emp.first_name} {emp.last_name}</p>
                            <p className="text-slate-500 text-xs">{emp.email}</p>
                            {emp.teras_email && (
                              <p className="text-sky-400 text-xs flex items-center gap-1 mt-0.5">
                                <Link className="w-3 h-3"/>TERAS lié
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className="text-slate-300 text-sm">{emp.department||'—'}</span></td>
                      <td className="p-4 text-center"><span className="text-slate-300 text-sm">{emp.position||'—'}</span></td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-lg ${SCORE_COLOR(emp.teras_score)}`}>{emp.teras_score??'—'}</span>
                          {!emp.teras_user_id&&<span className="text-slate-600 text-xs">Non lié</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className="text-slate-400 text-xs">{fmtDate(emp.hire_date)}</span></td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={()=>setModal({type:'edit',emp})}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors">
                            <Edit2 className="w-4 h-4"/>
                          </button>
                          <button onClick={()=>handleDelete(emp.id)} disabled={deleting===emp.id}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                            {deleting===emp.id?<RefreshCw className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
