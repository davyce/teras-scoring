import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Loader2, Lock, Mail, MapPin, Phone, Save, Shield, User, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import { useAuth } from '../../stores/auth';
const EMPTY_PROFILE = {
    id: 0,
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    user_type: 'admin',
    is_active: true,
    kyc_status: 'approved',
    country: '',
    region: '',
    phone_number: '',
    address: '',
    city: '',
    date_joined: '',
};
const EMPTY_PASSWORDS = {
    old_password: '',
    new_password: '',
    confirm_password: '',
};
const ROLE_LABELS = {
    admin: 'Administrateur',
    bank: 'Banque',
    enterprise: 'Entreprise',
    government: 'Gouvernement',
    individual: 'Individu',
};
const KYC_LABELS = {
    not_started: 'Non commencé',
    pending: 'En attente',
    incomplete: 'Incomplet',
    under_review: 'En cours de vérification',
    approved: 'Approuvé',
    rejected: 'Rejeté',
};
function normalizeProfile(payload) {
    return {
        id: payload?.id ?? 0,
        username: payload?.username ?? '',
        email: payload?.email ?? '',
        first_name: payload?.first_name ?? '',
        last_name: payload?.last_name ?? '',
        user_type: (payload?.user_type ?? 'admin'),
        is_active: payload?.is_active ?? true,
        kyc_status: payload?.kyc_status ?? 'approved',
        country: payload?.country ?? '',
        region: payload?.region ?? '',
        phone_number: payload?.phone_number ?? payload?.phone ?? '',
        address: payload?.address ?? '',
        city: payload?.city ?? '',
        date_joined: payload?.date_joined ?? '',
    };
}
export default function AdminProfile() {
    const { user: authUser, setUser } = useAuth();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const fullName = useMemo(() => {
        const name = `${profile.first_name} ${profile.last_name}`.trim();
        return name || profile.username || 'Administrateur';
    }, [profile.first_name, profile.last_name, profile.username]);
    useEffect(() => {
        loadProfile();
    }, []);
    async function loadProfile() {
        try {
            setLoading(true);
            setMessage(null);
            const response = await authFetch('/api/auth/me/');
            if (!response.ok) {
                throw new Error('Impossible de charger le profil administrateur.');
            }
            const data = await response.json();
            setProfile(normalizeProfile(data));
        }
        catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Impossible de charger le profil.' });
        }
        finally {
            setLoading(false);
        }
    }
    function updateField(field, value) {
        setProfile((current) => ({ ...current, [field]: value }));
    }
    async function handleSave() {
        try {
            setSaving(true);
            setMessage(null);
            const response = await authFetch('/api/auth/me/', {
                method: 'PATCH',
                body: JSON.stringify({
                    email: profile.email.trim(),
                    first_name: profile.first_name.trim(),
                    last_name: profile.last_name.trim(),
                    country: profile.country.trim(),
                    region: profile.region.trim(),
                    phone: profile.phone_number.trim(),
                    address: profile.address.trim(),
                    city: profile.city.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'La mise à jour du profil a échoué.');
            }
            const normalized = normalizeProfile(data?.user ?? data);
            setProfile(normalized);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profil administrateur mis à jour.' });
            const mergedUser = {
                ...(authUser ?? {}),
                id: normalized.id,
                username: normalized.username,
                email: normalized.email,
                first_name: normalized.first_name,
                last_name: normalized.last_name,
                user_type: normalized.user_type,
                account_type: authUser?.account_type || normalized.user_type,
                is_active: normalized.is_active,
                is_verified: authUser?.is_verified ?? true,
                kyc_status: normalized.kyc_status,
                created_at: authUser?.created_at || normalized.date_joined || new Date().toISOString(),
            };
            setUser(mergedUser);
            localStorage.setItem('teras_user', JSON.stringify(mergedUser));
        }
        catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Erreur lors de la sauvegarde.' });
        }
        finally {
            setSaving(false);
        }
    }
    async function handlePasswordChange() {
        if (!passwords.old_password || !passwords.new_password || !passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Complète tous les champs du mot de passe.' });
            return;
        }
        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }
        if (passwords.new_password.length < 8) {
            setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
            return;
        }
        try {
            setPasswordLoading(true);
            setMessage(null);
            const response = await authFetch('/api/auth/change-password/', {
                method: 'POST',
                body: JSON.stringify({
                    old_password: passwords.old_password,
                    new_password: passwords.new_password,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible de changer le mot de passe.');
            }
            setPasswords(EMPTY_PASSWORDS);
            setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
        }
        catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Erreur lors du changement de mot de passe.' });
        }
        finally {
            setPasswordLoading(false);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-blue-500" }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Mon Profil" }), _jsx("p", { className: "mt-1 text-gray-600 dark:text-gray-400", children: "G\u00E8re tes informations administrateur et la s\u00E9curit\u00E9 de ton acc\u00E8s." })] }), message && (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border p-4 ${message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'}`, children: [message.type === 'success' ? (_jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 flex-shrink-0" })), _jsx("span", { className: "text-sm font-medium", children: message.text })] })), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[2fr_1fr]", children: [_jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [_jsxs("div", { className: "mb-8 flex flex-col gap-6 md:flex-row md:items-center", children: [_jsx("div", { className: "flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white", children: (profile.username || fullName).charAt(0).toUpperCase() }), _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: fullName }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: ["@", profile.username || 'admin'] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: [_jsx(Shield, { className: "h-4 w-4" }), ROLE_LABELS[profile.user_type]] }), _jsx("span", { className: `rounded-full px-3 py-1 text-sm font-medium ${profile.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`, children: profile.is_active ? 'Compte actif' : 'Compte inactif' })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsx(Field, { label: "Nom d'utilisateur", icon: User, value: profile.username, disabled: true, helper: "G\u00E9r\u00E9 par le syst\u00E8me" }), _jsx(Field, { label: "Email", icon: Mail, value: profile.email, disabled: !isEditing, onChange: (value) => updateField('email', value) }), _jsx(Field, { label: "Pr\u00E9nom", value: profile.first_name, disabled: !isEditing, onChange: (value) => updateField('first_name', value) }), _jsx(Field, { label: "Nom", value: profile.last_name, disabled: !isEditing, onChange: (value) => updateField('last_name', value) }), _jsx(Field, { label: "T\u00E9l\u00E9phone", icon: Phone, value: profile.phone_number, disabled: !isEditing, onChange: (value) => updateField('phone_number', value) }), _jsx(Field, { label: "Pays", value: profile.country, disabled: !isEditing, onChange: (value) => updateField('country', value) }), _jsx(Field, { label: "R\u00E9gion", icon: MapPin, value: profile.region, disabled: !isEditing, onChange: (value) => updateField('region', value) }), _jsx(Field, { label: "Ville", value: profile.city, disabled: !isEditing, onChange: (value) => updateField('city', value) })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Adresse" }), _jsx("textarea", { value: profile.address, disabled: !isEditing, onChange: (event) => updateField('address', event.target.value), rows: 3, className: "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white" })] }), _jsx("div", { className: "mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-700", children: isEditing ? (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: handleSave, disabled: saving, className: "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), saving ? 'Sauvegarde...' : 'Enregistrer'] }), _jsx("button", { onClick: () => {
                                                setIsEditing(false);
                                                loadProfile();
                                            }, disabled: saving, className: "rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700", children: "Annuler" })] })) : (_jsx("button", { onClick: () => setIsEditing(true), className: "rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700", children: "Modifier le profil" })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900 dark:text-white", children: "R\u00E9sum\u00E9 du compte" }), _jsxs("div", { className: "space-y-4 text-sm", children: [_jsx(InfoRow, { label: "R\u00F4le", value: ROLE_LABELS[profile.user_type] }), _jsx(InfoRow, { label: "KYC", value: KYC_LABELS[profile.kyc_status] || profile.kyc_status || 'Approuvé' }), _jsx(InfoRow, { label: "Membre depuis", value: profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                }) : 'Non renseigné', icon: Calendar })] })] }), _jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [_jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx(Lock, { className: "h-5 w-5 text-blue-600 dark:text-blue-400" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "S\u00E9curit\u00E9" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Mot de passe actuel", type: "password", value: passwords.old_password, onChange: (value) => setPasswords((current) => ({ ...current, old_password: value })) }), _jsx(Field, { label: "Nouveau mot de passe", type: "password", value: passwords.new_password, onChange: (value) => setPasswords((current) => ({ ...current, new_password: value })) }), _jsx(Field, { label: "Confirmer le nouveau mot de passe", type: "password", value: passwords.confirm_password, onChange: (value) => setPasswords((current) => ({ ...current, confirm_password: value })) }), _jsxs("button", { onClick: handlePasswordChange, disabled: passwordLoading, className: "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700", children: [passwordLoading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Lock, { className: "h-4 w-4" }), passwordLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'] })] })] })] })] })] }));
}
function Field({ label, value, onChange, disabled = false, type = 'text', icon: Icon, helper, }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: label }), _jsxs("div", { className: "relative", children: [Icon ? _jsx(Icon, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }) : null, _jsx("input", { type: type, value: value, onChange: (event) => onChange?.(event.target.value), disabled: disabled, className: `w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${Icon ? 'pl-10' : ''}` })] }), helper ? _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: helper }) : null] }));
}
function InfoRow({ label, value, icon: Icon, }) {
    return (_jsxs("div", { className: "flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50", children: [Icon ? _jsx(Icon, { className: "mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" }) : null, _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: label }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: value })] })] }));
}
