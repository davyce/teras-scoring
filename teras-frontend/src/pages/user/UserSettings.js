import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import LinkedAccounts from '../../components/shared/LinkedAccounts';
/**
 * Page Paramètres Utilisateur - CONNECTÉ AU BACKEND
 * @module pages/user/UserSettings
 */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { Settings, User, Bell, Shield, Palette, Globe, Save, Check, Loader2, AlertCircle, } from "lucide-react";
export default function UserSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(null);
    // ✅ CHARGER LES PARAMÈTRES DEPUIS L'API
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await authFetch('/api/users/settings/');
            const data = await response.json();
            setSettings(data.settings);
        }
        catch (err) {
            console.error('Erreur chargement paramètres:', err);
            setError('Impossible de charger les paramètres');
        }
        finally {
            setLoading(false);
        }
    };
    // ✅ SAUVEGARDER LES PARAMÈTRES
    const handleSave = async () => {
        if (!settings)
            return;
        try {
            setSaving(true);
            setError(null);
            const response = await authFetch('/api/users/settings/', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
            if (!response.ok)
                throw new Error('Erreur de sauvegarde');
            const data = await response.json();
            setSettings(data.settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch (err) {
            setError(err.message || 'Erreur lors de la sauvegarde');
        }
        finally {
            setSaving(false);
        }
    };
    const updateSetting = (key, value) => {
        if (!settings)
            return;
        setSettings({ ...settings, [key]: value });
    };
    // ✅ LOADING
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsx(Loader2, { className: "w-12 h-12 text-sky-500 animate-spin" }) }));
    }
    // ✅ ERROR
    if (error && !settings) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center p-4", children: _jsxs("div", { className: "max-w-md w-full bg-slate-800/50 rounded-xl p-6 border border-red-500/50", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-bold text-white text-center mb-2", children: "Erreur" }), _jsx("p", { className: "text-slate-400 text-center mb-4", children: error }), _jsx("button", { onClick: loadSettings, className: "w-full px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition", children: "R\u00E9essayer" })] }) }));
    }
    if (!settings)
        return null;
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: [_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx("div", { className: "p-2 bg-sky-500/20 rounded-lg", children: _jsx(Settings, { className: "w-6 h-6 text-sky-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Param\u00E8tres" }), _jsx("p", { className: "text-slate-400", children: "Personnalisez votre exp\u00E9rience TERAS" })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(User, { className: "w-5 h-5 text-sky-400" }), _jsx("h2", { className: "text-xl font-semibold", children: "Informations personnelles" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-2", children: "Nom complet" }), _jsx("input", { type: "text", defaultValue: `${user?.first_name || ''} ${user?.last_name || ''}`, className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-2", children: "Email" }), _jsx("input", { type: "email", defaultValue: user?.email || '', className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white" })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Bell, { className: "w-5 h-5 text-sky-400" }), _jsx("h2", { className: "text-xl font-semibold", children: "Notifications" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(ToggleOption, { label: "Alertes de score", description: "Recevoir des notifications lors de changements de score", enabled: settings.notifications_score, onChange: (val) => updateSetting('notifications_score', val) }), _jsx(ToggleOption, { label: "Recommandations", description: "Notifications pour nouvelles recommandations", enabled: settings.notifications_recommendations, onChange: (val) => updateSetting('notifications_recommendations', val) }), _jsx(ToggleOption, { label: "Documents", description: "Alertes lorsque des documents sont requis", enabled: settings.notifications_documents, onChange: (val) => updateSetting('notifications_documents', val) })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Shield, { className: "w-5 h-5 text-sky-400" }), _jsx("h2", { className: "text-xl font-semibold", children: "Confidentialit\u00E9 et s\u00E9curit\u00E9" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(ToggleOption, { label: "Authentification \u00E0 deux facteurs", description: "S\u00E9curit\u00E9 renforc\u00E9e pour votre compte", enabled: settings.two_factor_auth, onChange: (val) => updateSetting('two_factor_auth', val) }), _jsx(ToggleOption, { label: "Partage de donn\u00E9es", description: "Autoriser le partage anonyme pour am\u00E9liorer le service", enabled: settings.data_sharing, onChange: (val) => updateSetting('data_sharing', val) })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Palette, { className: "w-5 h-5 text-sky-400" }), _jsx("h2", { className: "text-xl font-semibold", children: "Apparence" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-2", children: "Th\u00E8me" }), _jsxs("select", { value: settings.theme, onChange: (e) => updateSetting('theme', e.target.value), className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white", children: [_jsx("option", { value: "dark", children: "Sombre (par d\u00E9faut)" }), _jsx("option", { value: "light", children: "Clair" }), _jsx("option", { value: "auto", children: "Automatique" })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Globe, { className: "w-5 h-5 text-sky-400" }), _jsx("h2", { className: "text-xl font-semibold", children: "Langue et r\u00E9gion" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-2", children: "Langue" }), _jsxs("select", { value: settings.language, onChange: (e) => updateSetting('language', e.target.value), className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white", children: [_jsx("option", { value: "fr", children: "Fran\u00E7ais" }), _jsx("option", { value: "en", children: "English" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-2", children: "Devise" }), _jsxs("select", { value: settings.currency, onChange: (e) => updateSetting('currency', e.target.value), className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white", children: [_jsx("option", { value: "XAF", children: "FCFA (XAF)" }), _jsx("option", { value: "EUR", children: "EUR (\u20AC)" }), _jsx("option", { value: "USD", children: "USD ($)" })] })] })] })] }), error && (_jsxs("div", { className: "bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-400" }), _jsx("span", { className: "text-red-400", children: error })] })), _jsx("button", { onClick: handleSave, disabled: saving, className: "w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50", children: saving ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), "Sauvegarde..."] })) : saved ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-5 h-5" }), "Sauvegard\u00E9 !"] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-5 h-5" }), "Sauvegarder"] })) })] }), _jsx("div", { className: "mt-8", children: _jsx(LinkedAccounts, { title: "Mes Comptes Mobile Money" }) })] }));
}
function ToggleOption({ label, description, enabled, onChange }) {
    return (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-white/5", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium text-white", children: label }), _jsx("div", { className: "text-xs text-slate-400 mt-1", children: description })] }), _jsx("button", { onClick: () => onChange(!enabled), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-slate-700'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }));
}
