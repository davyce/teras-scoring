import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import TeamManagement from '../../components/shared/TeamManagement';
// GovernmentSettings.tsx - VERSION DARK MODE AMÉLIORÉE
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Server, Bell, MapPin } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';
export default function GovernmentSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await governmentApi.getSettings();
            if (response.data)
                setSettings(response.data);
            else
                setError(response.error || 'Erreur');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!settings)
            return;
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            const response = await governmentApi.updateSettings(settings);
            if (response.data) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
            else {
                setError(response.error || 'Erreur lors de la sauvegarde');
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-slate-950", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement des param\u00E8tres..." })] }) }));
    }
    if (error && !settings) {
        return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6", children: _jsxs("div", { className: "bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md mx-auto", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-500 mx-auto mb-4" }), _jsx("p", { className: "text-rose-300 mb-4 text-center", children: error }), _jsx("button", { onClick: loadSettings, className: "w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors", children: "R\u00E9essayer" })] }) }));
    }
    if (!settings)
        return null;
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-50 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2", children: "TERAS Gouvernement" }), _jsx("h1", { className: "text-3xl font-bold text-slate-50", children: "Configuration Syst\u00E8me" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Param\u00E8tres TERAS" })] }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-500/20", children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), "Enregistrer"] })) })] }), success && (_jsxs("div", { className: "mb-6 bg-emerald-900/20 border border-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-emerald-400" }), _jsx("p", { className: "text-emerald-400 font-medium", children: "Configuration enregistr\u00E9e avec succ\u00E8s" })] })), error && (_jsxs("div", { className: "mb-6 bg-rose-900/20 border border-rose-800 rounded-xl p-4 flex items-center gap-3 animate-shake", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-rose-400" }), _jsx("p", { className: "text-rose-400", children: error })] })), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors", children: [_jsxs("h2", { className: "text-lg font-bold text-slate-50 mb-4 flex items-center gap-2", children: [_jsx(Server, { className: "w-5 h-5 text-sky-400" }), "Syst\u00E8me"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Version" }), _jsx("input", { type: "text", value: settings.system.version, disabled: true, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Environnement" }), _jsx("input", { type: "text", value: settings.system.environment, disabled: true, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Mode Maintenance" }), _jsxs("label", { className: "flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors", children: [_jsx("input", { type: "checkbox", checked: settings.system.maintenance_mode, onChange: (e) => setSettings({
                                                            ...settings,
                                                            system: { ...settings.system, maintenance_mode: e.target.checked },
                                                        }), className: "w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900" }), _jsx("span", { className: "text-sm font-medium text-slate-50", children: settings.system.maintenance_mode ? 'Activé' : 'Désactivé' })] })] })] })] }), _jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors", children: [_jsxs("h2", { className: "text-lg font-bold text-slate-50 mb-4 flex items-center gap-2", children: [_jsx(MapPin, { className: "w-5 h-5 text-purple-400" }), "Scoring"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Profil Actif" }), _jsxs("select", { value: settings.scoring.active_profile, onChange: (e) => setSettings({
                                                    ...settings,
                                                    scoring: { ...settings.scoring, active_profile: e.target.value },
                                                }), className: "w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all", children: [_jsx("option", { value: "basic", children: "Basic" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "R\u00E9gion" }), _jsx("input", { type: "text", value: settings.scoring.region, disabled: true, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Pays" }), _jsx("input", { type: "text", value: settings.scoring.country, disabled: true, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed" })] })] })] }), _jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors", children: [_jsxs("h2", { className: "text-lg font-bold text-slate-50 mb-4 flex items-center gap-2", children: [_jsx(Bell, { className: "w-5 h-5 text-amber-400" }), "Alertes"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors", children: [_jsx("input", { type: "checkbox", checked: settings.alerts.enabled, onChange: (e) => setSettings({
                                                    ...settings,
                                                    alerts: { ...settings.alerts, enabled: e.target.checked },
                                                }), className: "w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900" }), _jsx("span", { className: "text-sm font-medium text-slate-50", children: "Activer les alertes" })] }), _jsxs("label", { className: "flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors", children: [_jsx("input", { type: "checkbox", checked: settings.alerts.email_notifications, onChange: (e) => setSettings({
                                                    ...settings,
                                                    alerts: { ...settings.alerts, email_notifications: e.target.checked },
                                                }), className: "w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900" }), _jsx("span", { className: "text-sm font-medium text-slate-50", children: "Notifications par email" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Seuil Score Faible" }), _jsx("input", { type: "number", value: settings.alerts.threshold_low_score, onChange: (e) => setSettings({
                                                            ...settings,
                                                            alerts: { ...settings.alerts, threshold_low_score: parseInt(e.target.value) },
                                                        }), className: "w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Seuil Risque \u00C9lev\u00E9" }), _jsx("input", { type: "number", value: settings.alerts.threshold_high_risk, onChange: (e) => setSettings({
                                                            ...settings,
                                                            alerts: { ...settings.alerts, threshold_high_risk: parseInt(e.target.value) },
                                                        }), className: "w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" })] })] })] })] })] }), _jsx("div", { className: "mt-8", children: _jsx(TeamManagement, { interface: "government", title: "Gestion de l'\u00C9quipe Gouvernementale" }) })] }));
}
