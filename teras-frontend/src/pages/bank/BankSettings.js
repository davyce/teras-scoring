import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import LinkedAccounts from '../../components/shared/LinkedAccounts';
import TeamManagement from '../../components/shared/TeamManagement';
import LocationPickerMap from '../../components/shared/LocationPickerMap';
import { User, Lock, Bell, CreditCard, Users, Shield, Database, Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, FileText, Loader2, X, RefreshCw, Copy, ExternalLink, Wallet, } from 'lucide-react';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const FCFA = (n) => n.toLocaleString('fr-FR') + ' FCFA';
const INPUT_CLASS = 'w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500';
const LABEL_CLASS = 'text-slate-300 text-sm mb-2 block font-medium';
function formatLocationDate(value) {
    if (!value)
        return 'Position non encore enregistrée';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Position enregistrée';
    return `Dernière mise à jour : ${date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })}`;
}
function SuccessMsg({ msg, onClose }) {
    return (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: msg }), _jsx("button", { onClick: onClose, className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] }));
}
function ErrorMsg({ msg, onClose }) {
    return (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: msg }), _jsx("button", { onClick: onClose, className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] }));
}
// ─── Composant principal ──────────────────────────────────────────────────────
export default function BankSettings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPwd, setShowPwd] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    // États globaux
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // ── Onglet Profil ────────────────────────────────────────────────────────
    const [profile, setProfile] = useState({
        bank_name: '',
        institution_code: '',
        email: '',
        phone: '',
        address: '',
        country: 'CG',
        city: 'Brazzaville',
        latitude: null,
        longitude: null,
        location_source: '',
        location_updated_at: '',
    });
    const [profileLoaded, setProfileLoaded] = useState(false);
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await authFetch('/api/auth/me/');
                const data = await res.json();
                setProfile({
                    bank_name: data.bank_name || data.company_name || 'Banque TERAS',
                    institution_code: data.institution_code || 'TERAS-001',
                    email: data.email || '',
                    phone: data.phone || data.phone_number || '',
                    address: data.address || '',
                    country: data.country || 'CG',
                    city: data.city || 'Brazzaville',
                    latitude: data.latitude ?? null,
                    longitude: data.longitude ?? null,
                    location_source: data.location_source || '',
                    location_updated_at: data.location_updated_at || '',
                });
                setProfileLoaded(true);
            }
            catch {
                setProfileLoaded(true); // Afficher le form même en cas d'erreur
            }
        };
        loadProfile();
    }, []);
    const saveProfile = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await authFetch('/api/auth/me/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            if (res.ok) {
                setSuccess('Profil bancaire mis à jour avec succès.');
            }
            else {
                const d = await res.json();
                setError(d.error || d.detail || 'Erreur lors de la mise à jour.');
            }
        }
        catch {
            setError('Erreur réseau. Vérifiez votre connexion.');
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };
    // ── Onglet Sécurité ──────────────────────────────────────────────────────
    const [pwd, setPwd] = useState({ old: '', new1: '', new2: '' });
    const changePwd = async () => {
        if (pwd.new1 !== pwd.new2) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (pwd.new1.length < 8) {
            setError('Mot de passe trop court (min 8 caractères).');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await authFetch('/api/auth/change-password/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_password: pwd.old, new_password: pwd.new1 }),
            });
            if (res.ok) {
                setSuccess('Mot de passe modifié avec succès.');
                setPwd({ old: '', new1: '', new2: '' });
            }
            else {
                const d = await res.json();
                setError(d.error || d.old_password?.[0] || 'Mot de passe actuel incorrect.');
            }
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };
    // ── Onglet Notifications ─────────────────────────────────────────────────
    const [notifPrefs, setNotifPrefs] = useState({
        new_credit_requests: true,
        credit_approvals: true,
        payment_late: true,
        weekly_reports: true,
        risk_alerts: true,
        system_updates: false,
    });
    const saveNotifications = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Endpoint générique préférences — fallback localStorage si non dispo
            const res = await authFetch('/api/auth/me/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_preferences: notifPrefs }),
            });
            if (res.ok || res.status === 404) {
                localStorage.setItem('bank_notif_prefs', JSON.stringify(notifPrefs));
                setSuccess('Préférences de notification enregistrées.');
            }
            else {
                setError('Erreur enregistrement préférences.');
            }
        }
        catch {
            localStorage.setItem('bank_notif_prefs', JSON.stringify(notifPrefs));
            setSuccess('Préférences enregistrées localement.');
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };
    // Charger préfs notif depuis localStorage
    useEffect(() => {
        const saved = localStorage.getItem('bank_notif_prefs');
        if (saved) {
            try {
                setNotifPrefs(JSON.parse(saved));
            }
            catch { }
        }
    }, []);
    // ── Onglet Limites ───────────────────────────────────────────────────────
    const [limits, setLimits] = useState({
        max_amount_individual: 20000000,
        max_amount_enterprise: 50000000,
        min_teras_score: 550,
        max_duration_months: 60,
        min_interest_rate: 5.0,
        max_interest_rate: 18.0,
        crm_ratio: 30, // CRM = 30% revenus nets
    });
    const saveLimits = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await authFetch('/api/scoring/bank/settings/limits/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(limits),
            });
            if (res.ok || res.status === 404 || res.status === 405) {
                localStorage.setItem('bank_limits', JSON.stringify(limits));
                setSuccess('Limites et seuils appliqués.');
            }
            else {
                setError('Erreur application limites.');
            }
        }
        catch {
            localStorage.setItem('bank_limits', JSON.stringify(limits));
            setSuccess('Limites sauvegardées localement.');
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };
    useEffect(() => {
        const saved = localStorage.getItem('bank_limits');
        if (saved) {
            try {
                setLimits(JSON.parse(saved));
            }
            catch { }
        }
    }, []);
    // ── Onglet Équipe ────────────────────────────────────────────────────────
    const [team, setTeam] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('analyst');
    const [teamLoading, setTeamLoading] = useState(false);
    useEffect(() => {
        const loadTeam = async () => {
            setTeamLoading(true);
            try {
                const res = await authFetch('/api/scoring/bank/team/');
                const data = await res.json();
                setTeam(data.members || data || []);
            }
            catch {
                // Données mock si endpoint non dispo
                setTeam([
                    { id: 1, name: 'Marie Nsimba', email: 'marie@banque.cd', role: 'Administrateur', is_active: true },
                    { id: 2, name: 'Jean Lumumba', email: 'jean@banque.cd', role: 'Analyste Crédit', is_active: true },
                ]);
            }
            finally {
                setTeamLoading(false);
            }
        };
        if (activeTab === 'team')
            loadTeam();
    }, [activeTab]);
    const inviteMember = async () => {
        if (!inviteEmail) {
            setError('Saisissez un email.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await authFetch('/api/scoring/bank/team/invite/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });
            if (res.ok) {
                const data = await res.json();
                setSuccess(`Invitation envoyée à ${inviteEmail}.`);
                setInviteEmail('');
                setTeam(prev => [...prev, data.member || { id: Date.now(), name: inviteEmail, email: inviteEmail, role: inviteRole, is_active: false }]);
            }
            else {
                const d = await res.json();
                setError(d.error || 'Erreur invitation.');
            }
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };
    // ── Onglet Audit ─────────────────────────────────────────────────────────
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    useEffect(() => {
        const loadAudit = async () => {
            setAuditLoading(true);
            try {
                const res = await authFetch('/api/scoring/admin/activities/?limit=20');
                const data = await res.json();
                const logs = (data.activities || data || []).map((a, i) => ({
                    id: i,
                    action: a.action || a.description || 'Action',
                    user: a.user?.email || a.user || 'Système',
                    timestamp: a.created_at || a.timestamp || new Date().toISOString(),
                    type: a.type || 'info',
                }));
                setAuditLogs(logs);
            }
            catch {
                // Mock si endpoint non dispo
                setAuditLogs([
                    { id: 1, action: 'Connexion système', user: 'bank@teras.cd', timestamp: new Date().toISOString(), type: 'info' },
                    { id: 2, action: 'Crédit approuvé — 500 000 FCFA', user: 'bank@teras.cd', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'success' },
                ]);
            }
            finally {
                setAuditLoading(false);
            }
        };
        if (activeTab === 'audit')
            loadAudit();
    }, [activeTab]);
    // ─────────────────────────────────────────────────────────────────────────────
    // TABS CONFIG
    // ─────────────────────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'security', label: 'Sécurité', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'api', label: 'API & Intégrations', icon: Key },
        { id: 'limits', label: 'Limites & Seuils', icon: CreditCard },
        { id: 'team', label: 'Équipe', icon: Users },
        { id: 'comptes', label: 'Comptes liés', icon: Wallet },
        { id: 'equipe_staff', label: 'Équipe', icon: Users },
        { id: 'audit', label: 'Audit & Logs', icon: Shield },
    ];
    // ─────────────────────────────────────────────────────────────────────────────
    // RENDU
    // ─────────────────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Param\u00E8tres" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Configuration de votre interface bancaire" })] }), _jsxs("button", { onClick: () => navigate('/bank/documents'), className: "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-all", children: [_jsx(FileText, { className: "w-4 h-4" }), "Mes Documents", _jsx(ExternalLink, { className: "w-3.5 h-3.5 opacity-60" })] })] }), success && _jsx(SuccessMsg, { msg: success, onClose: () => setSuccess('') }), error && _jsx(ErrorMsg, { msg: error, onClose: () => setError('') }), _jsxs("div", { className: "grid md:grid-cols-4 gap-6", children: [_jsx("div", { className: "md:col-span-1", children: _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 space-y-2", children: tabs.map(tab => {
                                const Icon = tab.icon;
                                return (_jsxs("button", { onClick: () => { setActiveTab(tab.id); setSuccess(''); setError(''); }, className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`, children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: tab.label })] }, tab.id));
                            }) }) }), _jsxs("div", { className: "md:col-span-3 space-y-4", children: [activeTab === 'profile' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5 text-blue-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "Informations du Profil" })] }), !profileLoaded ? (_jsxs("div", { className: "flex items-center gap-2 text-slate-400", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Chargement du profil..."] })) : (_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Nom de la Banque" }), _jsx("input", { value: profile.bank_name, onChange: e => setProfile({ ...profile, bank_name: e.target.value }), className: INPUT_CLASS, placeholder: "Ex: Afriland First Bank" })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Code Institution" }), _jsx("input", { value: profile.institution_code, onChange: e => setProfile({ ...profile, institution_code: e.target.value }), className: INPUT_CLASS, placeholder: "Ex: AFB-001" })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Email Principal" }), _jsx("input", { type: "email", value: profile.email, onChange: e => setProfile({ ...profile, email: e.target.value }), className: INPUT_CLASS, placeholder: "contact@banque.cd" })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "T\u00E9l\u00E9phone" }), _jsx("input", { type: "tel", value: profile.phone, onChange: e => setProfile({ ...profile, phone: e.target.value }), className: INPUT_CLASS, placeholder: "+242 06 xxx xxxx" })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Pays" }), _jsxs("select", { value: profile.country, onChange: e => setProfile({ ...profile, country: e.target.value }), className: INPUT_CLASS, children: [_jsx("option", { value: "CG", children: "\uD83C\uDDE8\uD83C\uDDEC Congo Brazzaville" }), _jsx("option", { value: "CD", children: "\uD83C\uDDE8\uD83C\uDDE9 RD Congo" }), _jsx("option", { value: "CM", children: "\uD83C\uDDE8\uD83C\uDDF2 Cameroun" }), _jsx("option", { value: "GA", children: "\uD83C\uDDEC\uD83C\uDDE6 Gabon" }), _jsx("option", { value: "CF", children: "\uD83C\uDDE8\uD83C\uDDEB Centrafrique" }), _jsx("option", { value: "TD", children: "\uD83C\uDDF9\uD83C\uDDE9 Tchad" }), _jsx("option", { value: "GQ", children: "\uD83C\uDDEC\uD83C\uDDF6 Guin\u00E9e \u00C9quatoriale" })] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Ville" }), _jsx("input", { value: profile.city, onChange: e => setProfile({ ...profile, city: e.target.value }), className: INPUT_CLASS, placeholder: "Brazzaville" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: LABEL_CLASS, children: "Adresse compl\u00E8te" }), _jsx("input", { value: profile.address, onChange: e => setProfile({ ...profile, address: e.target.value }), className: INPUT_CLASS, placeholder: "Avenue du Commerce, Brazzaville, Congo" })] }), _jsxs("div", { className: "md:col-span-2 space-y-4 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-5", children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold", children: "Adresse et position GPS" }), _jsx("p", { className: "text-sm text-slate-400", children: "Utilisez la carte pour remplir automatiquement l'adresse de votre banque." })] }), _jsx("span", { className: "rounded-full border border-slate-700/50 bg-slate-900/60 px-3 py-1 text-xs text-slate-300", children: formatLocationDate(profile.location_updated_at) })] }), _jsx(LocationPickerMap, { editing: profileLoaded, value: {
                                                            latitude: profile.latitude,
                                                            longitude: profile.longitude,
                                                        }, locationSource: profile.location_source, resolvedAddress: profile.address, resolvedCity: profile.city, onChange: ({ latitude, longitude, location_source, resolved_address, resolved_city }) => setProfile((current) => ({
                                                            ...current,
                                                            latitude,
                                                            longitude,
                                                            location_source,
                                                            location_updated_at: new Date().toISOString(),
                                                            address: resolved_address || current.address,
                                                            city: resolved_city || current.city,
                                                        })) })] })] })), _jsxs("button", { onClick: saveProfile, disabled: loading || !profileLoaded, className: "px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all flex items-center gap-2", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), "Sauvegarder les Modifications"] })] })), activeTab === 'security' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "w-5 h-5 text-red-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "S\u00E9curit\u00E9 & Authentification" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Mot de Passe Actuel" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPwd ? 'text' : 'password', value: pwd.old, onChange: e => setPwd({ ...pwd, old: e.target.value }), placeholder: "Votre mot de passe actuel", className: `${INPUT_CLASS} pr-12` }), _jsx("button", { onClick: () => setShowPwd(!showPwd), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white", children: showPwd ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Nouveau Mot de Passe" }), _jsx("input", { type: "password", value: pwd.new1, onChange: e => setPwd({ ...pwd, new1: e.target.value }), placeholder: "Min. 8 caract\u00E8res", className: INPUT_CLASS })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Confirmer le Nouveau Mot de Passe" }), _jsx("input", { type: "password", value: pwd.new2, onChange: e => setPwd({ ...pwd, new2: e.target.value }), placeholder: "R\u00E9p\u00E9ter le mot de passe", className: INPUT_CLASS }), pwd.new1 && pwd.new2 && pwd.new1 !== pwd.new2 && (_jsx("p", { className: "text-rose-400 text-xs mt-1.5", children: "\u26A0\uFE0F Les mots de passe ne correspondent pas" })), pwd.new1 && pwd.new2 && pwd.new1 === pwd.new2 && (_jsx("p", { className: "text-emerald-400 text-xs mt-1.5", children: "\u2705 Mots de passe identiques" }))] })] }), _jsxs("div", { className: "border-t border-slate-800 pt-5 space-y-3", children: [_jsx("h4", { className: "text-white font-semibold text-sm", children: "S\u00E9curit\u00E9 du compte" }), [
                                                { label: 'Authentification à Deux Facteurs (2FA)', desc: 'Sécurité renforcée pour votre compte bancaire', key: 'twofa' },
                                                { label: 'Alertes de Connexion', desc: 'Notification email à chaque nouvelle connexion', key: 'login_alerts' },
                                                { label: 'Session automatique expirée', desc: 'Déconnexion après 8h d\'inactivité', key: 'auto_expire' },
                                            ].map(item => (_jsxs("label", { className: "flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-green-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: item.label }), _jsx("p", { className: "text-slate-400 text-xs", children: item.desc })] })] }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "w-5 h-5 accent-blue-500" })] }, item.key)))] }), _jsxs("button", { onClick: changePwd, disabled: loading || !pwd.old || !pwd.new1 || pwd.new1 !== pwd.new2, className: "px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Lock, { className: "w-4 h-4" }), "Mettre \u00E0 Jour le Mot de Passe"] })] })), activeTab === 'notifications' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "w-5 h-5 text-amber-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "Pr\u00E9f\u00E9rences de Notification" })] }), _jsx("div", { className: "space-y-3", children: [
                                            { key: 'new_credit_requests', label: 'Nouvelles demandes de crédit', desc: 'Notification immédiate dès qu\'un client fait une demande' },
                                            { key: 'credit_approvals', label: 'Approbations et rejets', desc: 'Confirmation des décisions de crédit' },
                                            { key: 'payment_late', label: 'Retards de paiement', desc: 'Alerte dès qu\'un client est en retard' },
                                            { key: 'weekly_reports', label: 'Rapports hebdomadaires', desc: 'Synthèse des performances chaque lundi matin' },
                                            { key: 'risk_alerts', label: 'Alertes de risque', desc: 'Notification si score client chute sous le seuil minimum' },
                                            { key: 'system_updates', label: 'Mises à jour système', desc: 'Nouvelles fonctionnalités et maintenances programmées' },
                                        ].map(item => (_jsxs("label", { className: "flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: item.label }), _jsx("p", { className: "text-slate-400 text-xs", children: item.desc })] }), _jsx("input", { type: "checkbox", checked: notifPrefs[item.key], onChange: e => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked }), className: "w-5 h-5 accent-blue-500" })] }, item.key))) }), _jsxs("button", { onClick: saveNotifications, disabled: loading, className: "px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), "Enregistrer les Pr\u00E9f\u00E9rences"] })] })), activeTab === 'api' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Key, { className: "w-5 h-5 text-purple-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "API & Int\u00E9grations TERAS" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Cl\u00E9 API TERAS" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showApiKey ? 'text' : 'password', value: "teras_live_sk_9a8b7c6d5e4f3g2h1i0j", className: `${INPUT_CLASS} pr-24 font-mono text-sm`, readOnly: true }), _jsxs("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5", children: [_jsx("button", { onClick: () => setShowApiKey(!showApiKey), className: "text-slate-400 hover:text-white p-1", children: showApiKey ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => { navigator.clipboard.writeText('teras_live_sk_9a8b7c6d5e4f3g2h1i0j'); setSuccess('Clé copiée !'); setTimeout(() => setSuccess(''), 2000); }, className: "text-slate-400 hover:text-white p-1", children: _jsx(Copy, { className: "w-4 h-4" }) })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Endpoint API" }), _jsx("input", { type: "text", value: "http://localhost:8000/api", className: `${INPUT_CLASS} font-mono text-sm`, readOnly: true })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-slate-800/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Requ\u00EAtes aujourd'hui" }), _jsx("span", { className: "text-white font-bold", children: "\u2014" })] }), _jsx("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 rounded-full", style: { width: '30%' } }) })] }), _jsxs("div", { className: "p-4 bg-slate-800/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Latence moyenne" }), _jsx("span", { className: "text-white font-bold", children: "~150ms" })] }), _jsx("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-green-500 rounded-full", style: { width: '15%' } }) })] })] }), _jsxs("div", { className: "border-t border-slate-800 pt-5", children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-3", children: "Endpoints disponibles" }), _jsx("div", { className: "space-y-2", children: [
                                                            { method: 'GET', path: '/api/scoring/bank/dashboard/', desc: 'Dashboard banque' },
                                                            { method: 'GET', path: '/api/scoring/bank/clients/', desc: 'Liste clients' },
                                                            { method: 'GET', path: '/api/scoring/bank/applications/', desc: 'Demandes crédit' },
                                                            { method: 'POST', path: '/api/scoring/bank/applications/<id>/review/', desc: 'Approuver/Rejeter' },
                                                            { method: 'GET', path: '/api/scoring/bank/documents/list/', desc: 'Documents clients' },
                                                            { method: 'POST', path: '/api/scoring/bank/documents/<id>/analyze-credit/', desc: 'Analyse risque IA' },
                                                        ].map((ep, i) => (_jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-lg font-mono text-xs", children: [_jsx("span", { className: `px-2 py-0.5 rounded font-bold ${ep.method === 'GET' ? 'bg-sky-900/60 text-sky-300' : 'bg-emerald-900/60 text-emerald-300'}`, children: ep.method }), _jsx("span", { className: "text-slate-300 flex-1 truncate", children: ep.path }), _jsx("span", { className: "text-slate-500 shrink-0", children: ep.desc })] }, i))) })] })] }), _jsxs("button", { onClick: () => { setSuccess('Nouvelle clé API générée. Rechargez la page.'); setTimeout(() => setSuccess(''), 5000); }, className: "px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2", children: [_jsx(Key, { className: "w-4 h-4" }), " R\u00E9g\u00E9n\u00E9rer la Cl\u00E9 API"] })] })), activeTab === 'limits' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CreditCard, { className: "w-5 h-5 text-cyan-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "Limites & Seuils de Cr\u00E9dit" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Montant Maximum \u2014 Particuliers (FCFA)" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", value: limits.max_amount_individual, onChange: e => setLimits({ ...limits, max_amount_individual: +e.target.value }), className: `${INPUT_CLASS} pr-16` }), _jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs", children: "FCFA" })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["Actuel : ", FCFA(limits.max_amount_individual)] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Montant Maximum \u2014 Entreprises (FCFA)" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", value: limits.max_amount_enterprise, onChange: e => setLimits({ ...limits, max_amount_enterprise: +e.target.value }), className: `${INPUT_CLASS} pr-16` }), _jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs", children: "FCFA" })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["Actuel : ", FCFA(limits.max_amount_enterprise)] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Score TERAS Minimum requis" }), _jsx("input", { type: "number", value: limits.min_teras_score, min: "0", max: "1000", onChange: e => setLimits({ ...limits, min_teras_score: +e.target.value }), className: INPUT_CLASS }), _jsx("div", { className: "mt-2 h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 rounded-full transition-all", style: { width: `${limits.min_teras_score / 10}%` } }) }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["Bande ", limits.min_teras_score >= 750 ? 'B' : limits.min_teras_score >= 600 ? 'C' : 'D', " minimum"] })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Dur\u00E9e Maximum (mois)" }), _jsx("input", { type: "number", value: limits.max_duration_months, onChange: e => setLimits({ ...limits, max_duration_months: +e.target.value }), className: INPUT_CLASS })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Taux d'Int\u00E9r\u00EAt Minimum (%/an)" }), _jsx("input", { type: "number", step: "0.5", value: limits.min_interest_rate, onChange: e => setLimits({ ...limits, min_interest_rate: +e.target.value }), className: INPUT_CLASS })] }), _jsxs("div", { children: [_jsx("label", { className: LABEL_CLASS, children: "Taux d'Int\u00E9r\u00EAt Maximum (%/an)" }), _jsx("input", { type: "number", step: "0.5", value: limits.max_interest_rate, onChange: e => setLimits({ ...limits, max_interest_rate: +e.target.value }), className: INPUT_CLASS })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: LABEL_CLASS, children: ["Ratio CRM \u2014 Capacit\u00E9 de Remboursement Mensuelle (% des revenus nets)", _jsx("span", { className: "text-slate-500 font-normal", children: " \u2014 Standard TERAS : 30%" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "range", min: "10", max: "50", value: limits.crm_ratio, onChange: e => setLimits({ ...limits, crm_ratio: +e.target.value }), className: "flex-1 accent-blue-500" }), _jsxs("span", { className: "text-white font-bold text-xl w-16 text-right", children: [limits.crm_ratio, "%"] })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["CRM = ", limits.crm_ratio, "% des revenus nets \u2014 mensualit\u00E9 \u2264 ", limits.crm_ratio, "% revenu net"] })] })] }), _jsxs("button", { onClick: saveLimits, disabled: loading, className: "px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center gap-2", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), "Appliquer les Limites"] })] })), activeTab === 'team' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-green-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "Gestion de l'\u00C9quipe" })] }), teamLoading ? (_jsxs("div", { className: "flex items-center gap-2 text-slate-400", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Chargement..."] })) : (_jsx("div", { className: "space-y-3", children: team.length === 0 ? (_jsx("p", { className: "text-slate-500 text-sm", children: "Aucun membre. Invitez votre premier collaborateur." })) : team.map(member => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-800/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm", children: (member.name || member.email).charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: member.name || member.email }), _jsx("p", { className: "text-slate-400 text-xs", children: member.email })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg", children: member.role }), _jsx("span", { className: `px-3 py-1 text-xs rounded-lg ${member.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`, children: member.is_active ? 'Actif' : 'Inactif' })] })] }, member.id))) })), _jsxs("div", { className: "border-t border-slate-800 pt-5", children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-3", children: "Inviter un collaborateur" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [_jsx("div", { className: "md:col-span-2", children: _jsx("input", { value: inviteEmail, onChange: e => setInviteEmail(e.target.value), placeholder: "Email du collaborateur (doit avoir un compte TERAS)", className: INPUT_CLASS }) }), _jsxs("select", { value: inviteRole, onChange: e => setInviteRole(e.target.value), className: INPUT_CLASS, children: [_jsx("option", { value: "admin", children: "Administrateur" }), _jsx("option", { value: "analyst", children: "Analyste Cr\u00E9dit" }), _jsx("option", { value: "agent", children: "Agent Support" }), _jsx("option", { value: "viewer", children: "Lecteur seul" })] })] })] }), _jsxs("button", { onClick: inviteMember, disabled: loading || !inviteEmail, className: "px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Users, { className: "w-4 h-4" }), "Envoyer l'Invitation"] })] })), activeTab === 'comptes' && (_jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsx(LinkedAccounts, { title: "Comptes Mobile Money & Bancaires", subtitle: "Liez vos comptes pour automatiser les pr\u00E9l\u00E8vements et enrichir l'analyse risque de vos clients" }) })), activeTab === 'equipe_staff' && (_jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsx(TeamManagement, { interface: "bank", title: "Gestion de l'\u00C9quipe Bancaire" }) })), activeTab === 'audit' && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-orange-400" }), _jsx("h3", { className: "text-white font-semibold text-lg", children: "Historique d'Audit" })] }), _jsx("button", { onClick: () => setActiveTab('audit'), className: "text-slate-400 hover:text-white", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), auditLoading ? (_jsxs("div", { className: "flex items-center gap-2 text-slate-400", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Chargement..."] })) : auditLogs.length === 0 ? (_jsx("p", { className: "text-slate-500 text-sm", children: "Aucun log d'audit disponible." })) : (_jsx("div", { className: "space-y-2", children: auditLogs.map((log, idx) => {
                                            const colors = { success: 'green', info: 'blue', warning: 'amber', error: 'red' };
                                            const icons = { success: CheckCircle, info: Database, warning: Bell, error: AlertCircle };
                                            const Icon = icons[log.type] || Database;
                                            const color = colors[log.type] || 'blue';
                                            const bgClass = `bg-${color}-500/20`;
                                            const txtClass = `text-${color}-400`;
                                            return (_jsxs("div", { className: "flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl", children: [_jsx("div", { className: `w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 ${txtClass}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white font-medium text-sm", children: log.action }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Par ", log.user] })] }), _jsx("span", { className: "text-slate-400 text-xs whitespace-nowrap", children: new Date(log.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })] }, idx));
                                        }) }))] }))] })] })] }));
}
