import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// AdminUserEdit.tsx - Page de modification utilisateur TERAS
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { authFetch } from '../../utils/authFetch';
const USER_TYPES = [
    { value: 'individual', label: 'Individu' },
    { value: 'enterprise', label: 'Entreprise' },
    { value: 'government', label: 'Gouvernement' },
    { value: 'bank', label: 'Banque' },
    { value: 'admin', label: 'Administrateur' },
];
const KYC_STATUSES = [
    { value: 'not_started', label: 'Non commencé' },
    { value: 'pending', label: 'En attente' },
    { value: 'submitted', label: 'Soumis' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'rejected', label: 'Rejeté' },
];
const REGIONS = ['Brazzaville', 'Pointe-Noire', 'Kinshasa', 'Lubumbashi', 'Douala', 'Libreville', 'Bangui', 'Ndjamena', 'Malabo', 'Yaoundé'];
function Field({ label, icon: Icon, children, hint }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [Icon && _jsx(Icon, { className: "w-4 h-4 text-sky-400" }), label] }) }), children, hint && _jsx("p", { className: "text-xs text-slate-500 mt-1", children: hint })] }));
}
const inputClass = "w-full px-4 py-2.5 rounded-xl text-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-sky-500/40";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' };
export default function AdminUserEdit() {
    const { id: userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        phone: '',
        region: '',
        user_type: 'individual',
        kyc_status: 'not_started',
        is_active: true,
        is_staff: false,
        address: '',
        country: 'CG',
    });
    useEffect(() => {
        if (userId)
            loadUser();
    }, [userId]);
    const loadUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const r = await adminApi.getUserDetail(parseInt(userId));
            if (r.data) {
                const u = r.data;
                setForm({
                    first_name: u.first_name || '',
                    last_name: u.last_name || '',
                    email: u.email || '',
                    username: u.username || '',
                    phone: u.phone || '',
                    region: u.region || '',
                    user_type: u.user_type || 'individual',
                    kyc_status: u.kyc_status || 'not_started',
                    is_active: u.is_active ?? true,
                    is_staff: u.is_staff ?? false,
                    address: u.address || '',
                    country: u.country || 'CG',
                });
            }
            else {
                setError(r.error || 'Utilisateur introuvable');
            }
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };
    const handleSave = async () => {
        if (!userId)
            return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await authFetch(`/api/scoring/admin/users/${userId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
                setTimeout(() => navigate(`/admin/users/${userId}`), 1500);
            }
            else {
                setError(data.error || data.detail || 'Erreur lors de la sauvegarde');
            }
        }
        catch (e) {
            setError(e.message || 'Erreur réseau');
        }
        finally {
            setSaving(false);
        }
    };
    const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-96", style: { background: '#0b1220' }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Chargement du profil..." })] }) }));
    return (_jsxs("div", { className: "min-h-screen p-6", style: { background: '#0b1220' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsxs("button", { onClick: () => navigate(`/admin/users/${userId}`), className: "text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " Retour au profil"] }), _jsx("span", { className: "text-slate-600", children: "/" }), _jsx("span", { className: "text-slate-300", children: "Modifier" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => navigate(`/admin/users/${userId}`), className: "px-4 py-2 rounded-xl text-slate-400 text-sm border border-slate-700 hover:border-slate-500 transition-all", children: "Annuler" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50", style: { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }, children: [saving ? _jsx(Loader, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), saving ? 'Sauvegarde...' : 'Sauvegarder'] })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Modifier l'utilisateur" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: form.email })] }), error && (_jsxs("div", { className: "flex items-center gap-3 p-4 rounded-xl mb-6 text-red-300 text-sm", style: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }, children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0" }), " ", error] })), success && (_jsxs("div", { className: "flex items-center gap-3 p-4 rounded-xl mb-6 text-emerald-300 text-sm", style: { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }, children: [_jsx(CheckCircle, { className: "w-4 h-4 flex-shrink-0" }), " Modifications sauvegard\u00E9es ! Redirection en cours..."] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsxs("div", { className: "rounded-2xl p-6", style: cardStyle, children: [_jsxs("h2", { className: "text-white font-semibold mb-5 flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-sky-400" }), " Informations personnelles"] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Field, { label: "Pr\u00E9nom", children: _jsx("input", { type: "text", value: form.first_name, onChange: e => handleChange('first_name', e.target.value), placeholder: "Pr\u00E9nom", className: inputClass, style: inputStyle }) }), _jsx(Field, { label: "Nom de famille", children: _jsx("input", { type: "text", value: form.last_name, onChange: e => handleChange('last_name', e.target.value), placeholder: "Nom", className: inputClass, style: inputStyle }) }), _jsx(Field, { label: "Nom d'utilisateur", icon: User, children: _jsx("input", { type: "text", value: form.username, onChange: e => handleChange('username', e.target.value), placeholder: "username", className: inputClass, style: inputStyle }) }), _jsx(Field, { label: "Email", icon: Mail, hint: "Identifiant de connexion", children: _jsx("input", { type: "email", value: form.email, onChange: e => handleChange('email', e.target.value), placeholder: "email@exemple.com", className: inputClass, style: inputStyle }) }), _jsx(Field, { label: "T\u00E9l\u00E9phone", icon: Phone, children: _jsx("input", { type: "tel", value: form.phone, onChange: e => handleChange('phone', e.target.value), placeholder: "+242 06 XXX XXXX", className: inputClass, style: inputStyle }) }), _jsx(Field, { label: "Pays", children: _jsx("select", { value: form.country, onChange: e => handleChange('country', e.target.value), className: inputClass, style: inputStyle, children: [['CG', 'Congo'], ['CM', 'Cameroun'], ['GA', 'Gabon'], ['CF', 'Centrafrique'], ['TD', 'Tchad'], ['GQ', 'Guinée Éq.'], ['CD', 'RD Congo']].map(([v, l]) => (_jsx("option", { value: v, style: { background: '#1e293b' }, children: l }, v))) }) })] }), _jsx("div", { className: "mt-4", children: _jsx(Field, { label: "Adresse", icon: MapPin, children: _jsx("input", { type: "text", value: form.address, onChange: e => handleChange('address', e.target.value), placeholder: "Adresse compl\u00E8te", className: inputClass, style: inputStyle }) }) }), _jsx("div", { className: "mt-4", children: _jsx(Field, { label: "R\u00E9gion / Ville", children: _jsxs("select", { value: form.region, onChange: e => handleChange('region', e.target.value), className: inputClass, style: inputStyle, children: [_jsx("option", { value: "", style: { background: '#1e293b' }, children: "S\u00E9lectionner une r\u00E9gion" }), REGIONS.map(r => _jsx("option", { value: r, style: { background: '#1e293b' }, children: r }, r))] }) }) })] }) }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-2xl p-5", style: cardStyle, children: [_jsxs("h2", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-sky-400" }), " Compte & Acc\u00E8s"] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Type d'utilisateur", children: _jsx("select", { value: form.user_type, onChange: e => handleChange('user_type', e.target.value), className: inputClass, style: inputStyle, children: USER_TYPES.map(t => _jsx("option", { value: t.value, style: { background: '#1e293b' }, children: t.label }, t.value)) }) }), _jsx(Field, { label: "Statut KYC", children: _jsx("select", { value: form.kyc_status, onChange: e => handleChange('kyc_status', e.target.value), className: inputClass, style: inputStyle, children: KYC_STATUSES.map(s => _jsx("option", { value: s.value, style: { background: '#1e293b' }, children: s.label }, s.value)) }) }), _jsx("div", { className: "space-y-3 pt-2", style: { borderTop: '1px solid rgba(255,255,255,0.06)' }, children: [
                                                    { field: 'is_active', label: 'Compte actif', desc: 'L\'utilisateur peut se connecter', color: '#34d399' },
                                                    { field: 'is_staff', label: 'Staff / Admin', desc: 'Accès à l\'interface d\'admin', color: '#a78bfa' },
                                                ].map(({ field, label, desc, color }) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-200", children: label }), _jsx("p", { className: "text-xs text-slate-500", children: desc })] }), _jsx("button", { onClick: () => handleChange(field, !form[field]), className: "relative w-11 h-6 rounded-full transition-all flex-shrink-0", style: { background: form[field] ? `${color}40` : 'rgba(255,255,255,0.1)' }, children: _jsx("span", { className: "absolute top-1 left-1 w-4 h-4 rounded-full transition-all", style: { background: form[field] ? color : '#64748b', transform: form[field] ? 'translateX(20px)' : 'none' } }) })] }, field))) })] })] }), _jsxs("div", { className: "rounded-2xl p-5", style: { background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }, children: [_jsx("p", { className: "text-sky-300 text-xs font-medium mb-1", children: "\uD83D\uDCA1 Information" }), _jsx("p", { className: "text-slate-400 text-xs", children: "Les modifications sont appliqu\u00E9es imm\u00E9diatement. Le score TERAS est recalcul\u00E9 automatiquement \u00E0 la prochaine connexion de l'utilisateur." })] })] })] }), _jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [_jsx("button", { onClick: () => navigate(`/admin/users/${userId}`), className: "px-5 py-2.5 rounded-xl text-slate-400 text-sm border border-slate-700 hover:border-slate-500 transition-all", children: "Annuler" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50", style: { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }, children: [saving ? _jsx(Loader, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'] })] })] }));
}
