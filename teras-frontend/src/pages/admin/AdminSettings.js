import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, Globe, Loader2, Palette, RefreshCw, Save, Settings, Shield, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import { useTheme } from '../../stores/theme';
const EMPTY_SETTINGS = {
    id: 0,
    notifications_score: true,
    notifications_recommendations: true,
    notifications_documents: true,
    two_factor_auth: false,
    data_sharing: false,
    theme: 'dark',
    language: 'fr',
    currency: 'XAF',
    updated_at: '',
};
export default function AdminSettings() {
    const { isDarkMode, setTheme } = useTheme();
    const [settings, setSettings] = useState(EMPTY_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        loadSettings();
    }, []);
    useEffect(() => {
        applyTheme(settings.theme, setTheme);
    }, [settings.theme, setTheme]);
    async function loadSettings() {
        try {
            setLoading(true);
            setMessage(null);
            const response = await authFetch('/api/users/settings/');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible de charger les paramètres.');
            }
            setSettings({ ...EMPTY_SETTINGS, ...(data?.settings || {}) });
        }
        catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Impossible de charger les paramètres.' });
        }
        finally {
            setLoading(false);
        }
    }
    async function handleSave() {
        try {
            setSaving(true);
            setMessage(null);
            const response = await authFetch('/api/users/settings/', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible de sauvegarder les paramètres.');
            }
            setSettings({ ...EMPTY_SETTINGS, ...(data?.settings || settings) });
            setMessage({ type: 'success', text: 'Paramètres administrateur sauvegardés.' });
        }
        catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Erreur lors de la sauvegarde.' });
        }
        finally {
            setSaving(false);
        }
    }
    function updateSetting(field, value) {
        setSettings((current) => ({ ...current, [field]: value }));
    }
    if (loading) {
        return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-blue-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Param\u00E8tres" }), _jsx("p", { className: "mt-1 text-gray-600 dark:text-gray-400", children: "Pr\u00E9f\u00E9rences d\u2019administration, notifications et comportement de l\u2019interface." })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("button", { onClick: loadSettings, disabled: loading, className: "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Recharger"] }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), saving ? 'Sauvegarde...' : 'Sauvegarder'] })] })] }), message && (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border p-4 ${message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'}`, children: [message.type === 'success' ? (_jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 flex-shrink-0" })), _jsx("span", { className: "text-sm font-medium", children: message.text })] })), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[2fr_1fr]", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Section, { icon: Bell, title: "Notifications", description: "Choisis les alertes utiles pour le pilotage quotidien.", children: [_jsx(ToggleRow, { label: "Alertes de score", description: "Pr\u00E9venir lorsqu\u2019un score TERAS \u00E9volue ou est recalcul\u00E9.", checked: settings.notifications_score, onChange: (checked) => updateSetting('notifications_score', checked) }), _jsx(ToggleRow, { label: "Recommandations", description: "Suivre les recommandations g\u00E9n\u00E9r\u00E9es pour dossiers et utilisateurs.", checked: settings.notifications_recommendations, onChange: (checked) => updateSetting('notifications_recommendations', checked) }), _jsx(ToggleRow, { label: "Documents", description: "\u00CAtre notifi\u00E9 lorsqu\u2019un document manque ou change d\u2019\u00E9tat.", checked: settings.notifications_documents, onChange: (checked) => updateSetting('notifications_documents', checked) })] }), _jsxs(Section, { icon: Shield, title: "S\u00E9curit\u00E9 et confidentialit\u00E9", description: "Param\u00E8tres persos de s\u00E9curit\u00E9 pour l\u2019administrateur connect\u00E9.", children: [_jsx(ToggleRow, { label: "Authentification \u00E0 deux facteurs", description: "Active l\u2019option dans les pr\u00E9f\u00E9rences si ton flux de connexion le supporte.", checked: settings.two_factor_auth, onChange: (checked) => updateSetting('two_factor_auth', checked) }), _jsx(ToggleRow, { label: "Partage de donn\u00E9es anonymis\u00E9", description: "Autorise l\u2019usage agr\u00E9g\u00E9 de certaines donn\u00E9es pour am\u00E9liorer TERAS.", checked: settings.data_sharing, onChange: (checked) => updateSetting('data_sharing', checked) })] }), _jsx(Section, { icon: Globe, title: "Langue et devise", description: "Pr\u00E9f\u00E9rences d\u2019affichage utilis\u00E9es dans l\u2019espace admin.", children: _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(SelectField, { label: "Langue", value: settings.language, onChange: (value) => updateSetting('language', value), options: [
                                                { value: 'fr', label: 'Français' },
                                                { value: 'en', label: 'English' },
                                            ] }), _jsx(SelectField, { label: "Devise", value: settings.currency, onChange: (value) => updateSetting('currency', value), options: [
                                                { value: 'XAF', label: 'FCFA (XAF)' },
                                                { value: 'EUR', label: 'EUR (€)' },
                                                { value: 'USD', label: 'USD ($)' },
                                            ] })] }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Section, { icon: Palette, title: "Apparence", description: "Le th\u00E8me est sauvegard\u00E9 c\u00F4t\u00E9 param\u00E8tres et appliqu\u00E9 \u00E0 l\u2019interface.", children: [_jsx(SelectField, { label: "Th\u00E8me", value: settings.theme, onChange: (value) => updateSetting('theme', value), options: [
                                            { value: 'dark', label: 'Sombre' },
                                            { value: 'light', label: 'Clair' },
                                            { value: 'auto', label: 'Automatique' },
                                        ] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "\u00C9tat courant" }), _jsxs("p", { className: "mt-1", children: ["Le th\u00E8me actif dans cette session est ", _jsx("strong", { children: isDarkMode ? 'sombre' : 'clair' }), "."] })] })] }), _jsx(Section, { icon: Settings, title: "M\u00E9tadonn\u00E9es", description: "Suivi simple de la derni\u00E8re mise \u00E0 jour des pr\u00E9f\u00E9rences.", children: _jsxs("div", { className: "rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700/50", children: [_jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Derni\u00E8re sauvegarde" }), _jsx("p", { className: "mt-1 font-medium text-gray-900 dark:text-white", children: settings.updated_at
                                                ? new Date(settings.updated_at).toLocaleString('fr-FR')
                                                : 'Pas encore enregistrée' })] }) })] })] })] }));
}
function applyTheme(theme, setTheme) {
    if (theme === 'auto') {
        const prefersDark = typeof window !== 'undefined'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : false;
        setTheme(prefersDark);
        return;
    }
    setTheme(theme === 'dark');
}
function Section({ icon: Icon, title, description, children, }) {
    return (_jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [_jsxs("div", { className: "mb-5 flex items-start gap-3", children: [_jsx("div", { className: "rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300", children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: title }), _jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: description })] })] }), _jsx("div", { className: "space-y-4", children: children })] }));
}
function ToggleRow({ label, description, checked, onChange, }) {
    return (_jsxs("div", { className: "flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: label }), _jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: description })] }), _jsx("button", { onClick: () => onChange(!checked), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}` }) })] }));
}
function SelectField({ label, value, onChange, options, }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: label }), _jsx("select", { value: value, onChange: (event) => onChange(event.target.value), className: "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white", children: options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }));
}
