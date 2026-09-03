import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import LinkedAccounts from '../../components/shared/LinkedAccounts';
import TeamManagement from '../../components/shared/TeamManagement';
import { Settings, Users, Bell, Shield, Save, CheckCircle, AlertCircle, X, Crown, BarChart3, Eye, Wallet, } from 'lucide-react';
const ROLES = {
    admin: { label: 'Admin', desc: 'Accès complet', color: 'text-purple-400', icon: Crown },
    manager: { label: 'Manager', desc: 'Gestion employés et rapports', color: 'text-blue-400', icon: Users },
    analyst: { label: 'Analyst', desc: 'Consultation données et rapports', color: 'text-emerald-400', icon: BarChart3 },
    viewer: { label: 'Viewer', desc: 'Consultation uniquement', color: 'text-slate-400', icon: Eye },
};
const TABS = [
    { id: 'profile', label: 'Profil', icon: Settings },
    { id: 'comptes', label: 'Comptes liés', icon: Wallet },
    { id: 'equipe', label: 'Équipe', icon: Users },
    { id: 'roles', label: 'Rôles', icon: Shield },
    { id: 'notifs', label: 'Notifications', icon: Bell },
];
export default function EnterpriseSettings() {
    const [tab, setTab] = useState('profile');
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        authFetch('/api/auth/me/').then(r => r.json()).then(d => {
            setProfile(d);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    const saveProfile = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await authFetch('/api/auth/me/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            if (res.ok) {
                setSuccess('Profil mis à jour avec succès.');
                setTimeout(() => setSuccess(''), 4000);
            }
            else
                setError('Erreur lors de la mise à jour.');
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Param\u00E8tres" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Configuration de votre interface entreprise" })] }), success && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400" }), _jsx("p", { className: "text-emerald-300 text-sm", children: success }), _jsx("button", { onClick: () => setSuccess(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), _jsxs("div", { className: "grid md:grid-cols-4 gap-6", children: [_jsx("div", { className: "md:col-span-1", children: _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-2", children: TABS.map(t => {
                                const Icon = t.icon;
                                return (_jsxs("button", { onClick: () => setTab(t.id), className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tab === t.id
                                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`, children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: t.label })] }, t.id));
                            }) }) }), _jsxs("div", { className: "md:col-span-3 space-y-4", children: [tab === 'profile' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4", children: [_jsxs("h3", { className: "text-white font-semibold text-lg flex items-center gap-2", children: [_jsx(Settings, { className: "w-5 h-5 text-violet-400" }), " Profil Entreprise"] }), loading ? (_jsx("p", { className: "text-slate-400", children: "Chargement..." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid md:grid-cols-2 gap-4", children: [
                                                    { key: 'company_name', label: 'Nom de l\'entreprise' },
                                                    { key: 'email', label: 'Email' },
                                                    { key: 'first_name', label: 'Prénom responsable' },
                                                    { key: 'last_name', label: 'Nom responsable' },
                                                ].map(f => (_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: f.label }), _jsx("input", { value: profile[f.key] || '', onChange: e => setProfile({ ...profile, [f.key]: e.target.value }), className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500" })] }, f.key))) }), _jsxs("button", { onClick: saveProfile, disabled: saving, className: "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition", children: [_jsx(Save, { className: "w-4 h-4" }), saving ? 'Enregistrement...' : 'Sauvegarder'] })] }))] })), tab === 'comptes' && (_jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: _jsx(LinkedAccounts, { title: "Comptes Mobile Money & Bancaires", subtitle: "Liez vos comptes pour automatiser les paiements et enrichir votre score TERAS entreprise" }) })), tab === 'equipe' && (_jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: _jsx(TeamManagement, { interface: "enterprise", title: "Gestion de l'\u00C9quipe" }) })), tab === 'roles' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4", children: [_jsx("h3", { className: "text-white font-semibold text-lg", children: "R\u00F4les et permissions" }), Object.entries(ROLES).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (_jsxs("div", { className: "p-4 bg-slate-800/30 rounded-xl flex items-start gap-3", children: [_jsx(Icon, { className: `w-5 h-5 ${cfg.color} shrink-0 mt-0.5` }), _jsxs("div", { children: [_jsx("p", { className: `font-semibold text-sm ${cfg.color}`, children: cfg.label }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: cfg.desc })] })] }, key));
                                    })] })), tab === 'notifs' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-3", children: [_jsx("h3", { className: "text-white font-semibold text-lg", children: "Pr\u00E9f\u00E9rences de notification" }), [
                                        'Nouvelles demandes de crédit',
                                        'Rapports générés',
                                        'Alertes de risque',
                                        'Mises à jour équipe',
                                    ].map(n => (_jsxs("label", { className: "flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition", children: [_jsx("span", { className: "text-white text-sm", children: n }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "w-5 h-5 accent-violet-500" })] }, n)))] }))] })] })] }));
}
