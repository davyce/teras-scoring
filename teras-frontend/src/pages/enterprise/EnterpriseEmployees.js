import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/pages/enterprise/EnterpriseEmployees.tsx
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { Users, Plus, Search, RefreshCw, CheckCircle, AlertCircle, Edit2, Trash2, X, Save, Link, TrendingUp, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (!n || isNaN(n))
        return '—';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const SCORE_COLOR = (s) => !s ? 'text-slate-500' : s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : 'text-red-400';
const STATUS_CFG = {
    active: { label: 'Actif', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    inactive: { label: 'Inactif', color: 'text-slate-400', bg: 'bg-slate-700/50' },
    on_leave: { label: 'En congé', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    terminated: { label: 'Licencié', color: 'text-red-400', bg: 'bg-red-500/10' },
};
const DEPARTMENTS = ['Direction', 'Finance', 'Commercial', 'Production', 'Logistique', 'RH', 'IT', 'Juridique', 'Marketing', 'Autre'];
// ── Modal Employé ─────────────────────────────────────────────────────────────
function EmployeeModal({ emp, onClose, onSave }) {
    const isEdit = !!emp?.id;
    const [form, setForm] = useState({
        first_name: emp?.first_name || '',
        last_name: emp?.last_name || '',
        email: emp?.email || '',
        phone: emp?.phone || '',
        niu: emp?.niu || '',
        position: emp?.position || '',
        department: emp?.department || '',
        salary: emp?.salary || '',
        hire_date: emp?.hire_date || '',
        status: emp?.status || 'active',
        teras_email: emp?.teras_email || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
    const handleSave = async () => {
        if (!form.first_name || !form.last_name || !form.email) {
            setError('Prénom, nom et email sont obligatoires');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const url = isEdit
                ? `/api/scoring/enterprise/employees/${emp.id}/`
                : '/api/scoring/enterprise/employees/create/';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Erreur');
            onSave();
            onClose();
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSaving(false);
        }
    };
    const Field = ({ label, children, hint }) => (_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: label }), children, hint && _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: hint })] }));
    const Input = (field, type = 'text', placeholder = '') => (_jsx("input", { type: type, value: form[field], onChange: set(field), placeholder: placeholder, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-[#0d1829] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1829]", children: [_jsx("h3", { className: "text-white font-bold", children: isEdit ? 'Modifier l\'employé' : 'Ajouter un employé' }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4 space-y-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wide", children: "Informations personnelles" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Pr\u00E9nom *", children: Input('first_name', 'text', 'Prénom') }), _jsx(Field, { label: "Nom *", children: Input('last_name', 'text', 'Nom de famille') })] }), _jsx(Field, { label: "Email *", children: Input('email', 'email', 'email@exemple.cg') }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "T\u00E9l\u00E9phone", children: Input('phone', 'tel', '+242 06 XXX XXXX') }), _jsx(Field, { label: "NIU", hint: "Num\u00E9ro d'Identification Universel", children: Input('niu', 'text', 'CG-NIU-...') })] })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4 space-y-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wide", children: "Informations professionnelles" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Poste / Fonction", children: Input('position', 'text', 'Ex: Directeur commercial') }), _jsx(Field, { label: "D\u00E9partement", children: _jsxs("select", { value: form.department, onChange: set('department'), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), DEPARTMENTS.map(d => _jsx("option", { value: d, children: d }, d))] }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Salaire mensuel (FCFA)", children: Input('salary', 'number', 'Ex: 350000') }), _jsx(Field, { label: "Date d'embauche", children: Input('hire_date', 'date') })] }), _jsx(Field, { label: "Statut", children: _jsx("select", { value: form.status, onChange: set('status'), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: Object.entries(STATUS_CFG).map(([v, c]) => _jsx("option", { value: v, children: c.label }, v)) }) })] }), _jsxs("div", { className: "bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Link, { className: "w-4 h-4 text-sky-400" }), _jsx("p", { className: "text-sky-400 font-medium text-sm", children: "Lier \u00E0 un compte TERAS individuel" })] }), _jsx(Field, { label: "Email du compte TERAS de l'employ\u00E9", hint: "Si l'employ\u00E9 a un compte TERAS, renseignez son email pour afficher son score", children: Input('teras_email', 'email', 'email.employe@teras.cg') })] }), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3 pt-1", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: saving ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Sauvegarde\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), isEdit ? 'Mettre à jour' : 'Ajouter l\'employé'] }) })] })] })] }) }));
}
// ── Composant principal ───────────────────────────────────────────────────────
export default function EnterpriseEmployees() {
    const [employees, setEmps] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const load = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/scoring/enterprise/employees/');
            const data = await res.json();
            setEmps(data.employees || []);
            setStats(data.stats || {});
        }
        catch {
            setEmps([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const handleDelete = async (id) => {
        if (!confirm('Supprimer cet employé ?'))
            return;
        setDeleting(id);
        try {
            await authFetch(`/api/scoring/enterprise/employees/${id}/`, { method: 'DELETE' });
            setActionMsg({ text: 'Employé supprimé.', ok: true });
            load();
        }
        catch {
            setActionMsg({ text: 'Erreur lors de la suppression.', ok: false });
        }
        finally {
            setDeleting(null);
        }
    };
    const filtered = employees.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.position || '').toLowerCase().includes(q);
        const matchDept = !filterDept || e.department === filterDept;
        const matchStatus = !filterStatus || e.status === filterStatus;
        return matchSearch && matchDept && matchStatus;
    });
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [modal === 'add' && _jsx(EmployeeModal, { onClose: () => setModal(null), onSave: load }), modal && typeof modal === 'object' && modal.type === 'edit' && _jsx(EmployeeModal, { emp: modal.emp, onClose: () => setModal(null), onSave: load }), _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Gestion des Employ\u00E9s" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "G\u00E9rez votre personnel et suivez leur score TERAS" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: load, className: "p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) }), _jsxs("button", { onClick: () => setModal('add'), className: "flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Ajouter un employ\u00E9"] })] })] }), actionMsg && (_jsxs("div", { className: `rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`, children: [actionMsg.text, _jsx("button", { onClick: () => setActionMsg(null), className: "ml-auto text-slate-400 hover:text-white", children: "\u2715" })] })), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { label: 'Total employés', val: stats.total || 0, color: 'blue', icon: Users },
                    { label: 'Actifs', val: stats.active || 0, color: 'emerald', icon: CheckCircle },
                    { label: 'Liés à TERAS', val: stats.with_teras || 0, color: 'sky', icon: Link },
                    { label: 'Score TERAS moyen', val: stats.avg_score || '—', color: 'purple', icon: TrendingUp },
                ].map(({ label, val, color, icon: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: val }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: label })] }, label))) }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsxs("div", { className: "relative flex-1 min-w-48", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher un employ\u00E9\u2026", className: "w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm" })] }), _jsxs("select", { value: filterDept, onChange: e => setFilterDept(e.target.value), className: "px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none", children: [_jsx("option", { value: "", children: "Tous d\u00E9partements" }), departments.map(d => _jsx("option", { value: d, children: d }, d))] }), _jsxs("select", { value: filterStatus, onChange: e => setFilterStatus(e.target.value), className: "px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none", children: [_jsx("option", { value: "", children: "Tous statuts" }), Object.entries(STATUS_CFG).map(([v, c]) => _jsx("option", { value: v, children: c.label }, v))] })] }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-sky-400" }), " Chargement\u2026"] })) : filtered.length === 0 ? (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center", children: [_jsx(Users, { className: "w-14 h-14 text-slate-600 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-semibold text-lg mb-2", children: employees.length === 0 ? 'Aucun employé' : 'Aucun résultat' }), _jsx("p", { className: "text-slate-400 text-sm mb-4", children: employees.length === 0 ? 'Commencez par ajouter vos employés.' : 'Modifiez votre recherche.' }), employees.length === 0 && (_jsxs("button", { onClick: () => setModal('add'), className: "px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto", children: [_jsx(Plus, { className: "w-4 h-4" }), " Ajouter un employ\u00E9"] }))] })) : (_jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Employé', 'Département', 'Poste', 'Score TERAS', 'Date embauche', 'Statut', 'Actions'].map(h => (_jsx("th", { className: `p-4 text-slate-400 font-medium ${h === 'Employé' ? 'text-left' : 'text-center'}`, children: h }, h))) }) }), _jsx("tbody", { children: filtered.map(emp => {
                                    const st = STATUS_CFG[emp.status] || STATUS_CFG.active;
                                    return (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0", children: [emp.first_name[0], emp.last_name[0]] }), _jsxs("div", { children: [_jsxs("p", { className: "text-white font-medium", children: [emp.first_name, " ", emp.last_name] }), _jsx("p", { className: "text-slate-500 text-xs", children: emp.email }), emp.teras_email && (_jsxs("p", { className: "text-sky-400 text-xs flex items-center gap-1 mt-0.5", children: [_jsx(Link, { className: "w-3 h-3" }), "TERAS li\u00E9"] }))] })] }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: "text-slate-300 text-sm", children: emp.department || '—' }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: "text-slate-300 text-sm", children: emp.position || '—' }) }), _jsx("td", { className: "p-4 text-center", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("span", { className: `font-bold text-lg ${SCORE_COLOR(emp.teras_score)}`, children: emp.teras_score ?? '—' }), !emp.teras_user_id && _jsx("span", { className: "text-slate-600 text-xs", children: "Non li\u00E9" })] }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: "text-slate-400 text-xs", children: fmtDate(emp.hire_date) }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: `px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`, children: st.label }) }), _jsx("td", { className: "p-4 text-center", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setModal({ type: 'edit', emp }), className: "p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(emp.id), disabled: deleting === emp.id, className: "p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors", children: deleting === emp.id ? _jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, emp.id));
                                }) })] }) }) }))] }));
}
