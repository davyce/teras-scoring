import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Page Profil Utilisateur TERAS - Version Améliorée
 * ✅ Design sophistiqué avec animations
 * ✅ Banques du Congo-Brazzaville
 * ✅ Connexion backend complète
 * @module pages/user/UserProfile
 */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import LocationPickerMap from "../../components/shared/LocationPickerMap";
import { User, Mail, MapPin, Save, Loader2, CheckCircle, AlertCircle, Award, TrendingUp, Activity, Calendar, Edit3, X, Phone, Building2, Shield, Lock, Eye, EyeOff, CreditCard, Landmark, FileText, ChevronDown, Sparkles, BadgeCheck, Clock, Camera, } from "lucide-react";
// ============================================
// DONNÉES : BANQUES DU CONGO-BRAZZAVILLE
// ============================================
const BANQUES_CONGO = [
    { id: "uba", name: "United Bank for Africa (UBA)", logo: "🏦" },
    { id: "lcb", name: "La Congolaise de Banque (LCB)", logo: "🏛️" },
    { id: "bgfi", name: "BGFI Bank Congo", logo: "💎" },
    { id: "ecobank", name: "Ecobank Congo", logo: "🌍" },
    { id: "bsca", name: "BSCA (Banque Sino-Congolaise pour l'Afrique)", logo: "🏢" },
    { id: "credit_congo", name: "Crédit du Congo", logo: "💳" },
    { id: "societe_generale", name: "Société Générale Congo", logo: "🔴" },
    { id: "bci", name: "BCI (Banque Commerciale Internationale)", logo: "🌐" },
    { id: "mucodec", name: "MUCODEC (Mutuelles Congolaises d'Épargne et de Crédit)", logo: "🤝" },
    { id: "postbank", name: "Postbank Congo", logo: "📮" },
    { id: "autre", name: "Autre établissement", logo: "🏪" },
];
// Régions du Congo-Brazzaville
const REGIONS_CONGO = [
    "Brazzaville",
    "Pointe-Noire",
    "Bouenza",
    "Cuvette",
    "Cuvette-Ouest",
    "Kouilou",
    "Lékoumou",
    "Likouala",
    "Niari",
    "Plateaux",
    "Pool",
    "Sangha",
];
// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function UserProfile() {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [message, setMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        country: 'Congo-Brazzaville',
        region: '',
        latitude: null,
        longitude: null,
        location_source: '',
        bank: '',
        bank_account: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    useEffect(() => {
        loadProfile();
    }, []);
    // ============================================
    // FONCTIONS API
    // ============================================
    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/api/scoring/user/profile/');
            if (!response.ok) {
                throw new Error('Erreur de chargement');
            }
            const data = await response.json();
            setProfileData(data);
            setFormData({
                first_name: data.user.first_name || '',
                last_name: data.user.last_name || '',
                phone: data.user.phone_number || data.user.phone || '',
                address: data.user.address || '',
                city: data.user.city || '',
                country: data.user.country || 'Congo-Brazzaville',
                region: data.user.region || '',
                latitude: data.user.latitude ?? null,
                longitude: data.user.longitude ?? null,
                location_source: data.user.location_source || '',
                bank: data.user.bank || '',
                bank_account: data.user.bank_account || '',
            });
        }
        catch (err) {
            console.error("Erreur chargement profil:", err);
            setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            const response = await authFetch('/api/scoring/user/profile/', {
                method: 'PUT',
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur de sauvegarde');
            }
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            setEditing(false);
            // Recharger le profil
            await loadProfile();
            setTimeout(() => setMessage(null), 4000);
        }
        catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' });
        }
        finally {
            setSaving(false);
        }
    };
    const handleChangePassword = async () => {
        try {
            if (passwordData.new_password !== passwordData.confirm_password) {
                setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
                return;
            }
            if (passwordData.new_password.length < 8) {
                setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
                return;
            }
            setSaving(true);
            setMessage(null);
            const response = await authFetch('/api/users/change-password/', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du changement de mot de passe');
            }
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setMessage(null), 4000);
        }
        catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
        finally {
            setSaving(false);
        }
    };
    // ============================================
    // HELPERS
    // ============================================
    const getLevelConfig = (level) => {
        const configs = {
            'Diamant': { color: '#a5b4fc', bg: 'from-indigo-500/20 to-purple-500/20', icon: '💎' },
            'diamant': { color: '#a5b4fc', bg: 'from-indigo-500/20 to-purple-500/20', icon: '💎' },
            'Or': { color: '#fbbf24', bg: 'from-yellow-500/20 to-amber-500/20', icon: '🥇' },
            'or': { color: '#fbbf24', bg: 'from-yellow-500/20 to-amber-500/20', icon: '🥇' },
            'Argent': { color: '#9ca3af', bg: 'from-gray-400/20 to-slate-500/20', icon: '🥈' },
            'argent': { color: '#9ca3af', bg: 'from-gray-400/20 to-slate-500/20', icon: '🥈' },
            'Bronze': { color: '#cd7f32', bg: 'from-orange-500/20 to-amber-600/20', icon: '🥉' },
            'bronze': { color: '#cd7f32', bg: 'from-orange-500/20 to-amber-600/20', icon: '🥉' },
            'Débutant': { color: '#64748b', bg: 'from-slate-500/20 to-gray-600/20', icon: '🌱' },
            'debutant': { color: '#64748b', bg: 'from-slate-500/20 to-gray-600/20', icon: '🌱' },
        };
        return configs[level] || configs['Débutant'];
    };
    const getKycConfig = (status) => {
        const configs = {
            'verified': {
                color: 'text-green-400',
                bg: 'bg-green-500/20 border-green-500/50',
                label: 'Vérifié',
                icon: _jsx(BadgeCheck, { className: "w-4 h-4" })
            },
            'pending': {
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/20 border-yellow-500/50',
                label: 'En attente',
                icon: _jsx(Clock, { className: "w-4 h-4" })
            },
            'rejected': {
                color: 'text-red-400',
                bg: 'bg-red-500/20 border-red-500/50',
                label: 'Rejeté',
                icon: _jsx(AlertCircle, { className: "w-4 h-4" })
            },
        };
        return configs[status] || configs['pending'];
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };
    const formatLocationSource = (source) => {
        const labels = {
            'browser-geolocation': 'Géolocalisation navigateur',
            'map-click': 'Choix manuel sur la carte',
        };
        return labels[source || ''] || 'Non défini';
    };
    // ============================================
    // LOADING STATE
    // ============================================
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-20 h-20 border-4 border-sky-500/30 rounded-full animate-pulse" }), _jsx(Loader2, { className: "w-10 h-10 text-sky-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" })] }), _jsx("p", { className: "text-slate-400 mt-4", children: "Chargement du profil..." })] }) }));
    }
    if (!profileData) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-white mb-2", children: "Erreur de chargement" }), _jsx("p", { className: "text-slate-400 mb-6", children: "Impossible de charger votre profil" }), _jsxs("button", { onClick: loadProfile, className: "px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition flex items-center gap-2 mx-auto", children: [_jsx(Loader2, { className: "w-4 h-4" }), "R\u00E9essayer"] })] }) }));
    }
    const levelConfig = getLevelConfig(profileData.score.level);
    const kycConfig = getKycConfig(profileData.user.kyc_status);
    // ============================================
    // RENDER
    // ============================================
    return (_jsx("div", { className: "min-h-screen bg-[#0b1220] text-white", children: _jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: `absolute inset-0 bg-gradient-to-r ${levelConfig.bg} rounded-3xl blur-3xl opacity-30` }), _jsx("div", { className: "relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center gap-6", children: [_jsxs("div", { className: "relative group", children: [_jsxs("div", { className: "w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-2xl", style: {
                                                    background: `linear-gradient(135deg, ${levelConfig.color}40, ${levelConfig.color}20)`,
                                                    border: `2px solid ${levelConfig.color}50`
                                                }, children: [profileData.user.first_name?.[0]?.toUpperCase() || 'U', profileData.user.last_name?.[0]?.toUpperCase() || ''] }), _jsx("button", { className: "absolute bottom-0 right-0 w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Camera, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "absolute -top-2 -right-2 text-2xl", title: profileData.score.level, children: levelConfig.icon })] }), _jsxs("div", { className: "flex-1 text-center md:text-left", children: [_jsxs("h1", { className: "text-3xl font-bold text-white mb-1", children: [profileData.user.first_name, " ", profileData.user.last_name] }), _jsxs("p", { className: "text-slate-400 flex items-center justify-center md:justify-start gap-2", children: [_jsx(Mail, { className: "w-4 h-4" }), profileData.user.email] }), _jsxs("div", { className: "flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3", children: [_jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border ${kycConfig.bg} ${kycConfig.color}`, children: [kycConfig.icon, "KYC ", kycConfig.label] }), _jsxs("span", { className: "text-sm text-slate-400 flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), "Membre depuis ", formatDate(profileData.user.date_joined)] })] })] }), _jsxs("div", { className: `bg-gradient-to-br ${levelConfig.bg} rounded-2xl p-6 border border-white/10 min-w-[200px]`, children: [_jsx("p", { className: "text-sm text-slate-300 mb-1", children: "Score TERAS" }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("span", { className: "text-5xl font-bold", style: { color: levelConfig.color }, children: profileData.score.score }), _jsx("span", { className: "text-slate-400", children: "/1000" })] }), _jsxs("div", { className: "mt-2 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1", style: { backgroundColor: `${levelConfig.color}20`, color: levelConfig.color }, children: [_jsx(Award, { className: "w-4 h-4" }), "Niveau ", profileData.score.level] })] })] }) })] }), message && (_jsxs("div", { className: `p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${message.type === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'}`, children: [message.type === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0" })), _jsx("span", { children: message.text }), _jsx("button", { onClick: () => setMessage(null), className: "ml-auto hover:opacity-70", children: _jsx(X, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(StatCard, { icon: Activity, label: "Transactions", value: profileData.stats.total_transactions, color: "#0ea5e9", trend: "+12%" }), _jsx(StatCard, { icon: TrendingUp, label: "Revenus", value: `${(profileData.stats.total_income / 1000).toFixed(0)}k`, suffix: "FCFA", color: "#22c55e", trend: "+8%" }), _jsx(StatCard, { icon: CreditCard, label: "Actifs", value: profileData.stats.total_assets, color: "#f59e0b" }), _jsx(StatCard, { icon: FileText, label: "Documents", value: profileData.stats.documents_count || 0, color: "#8b5cf6" })] }), _jsxs("div", { className: "flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50", children: [_jsx(TabButton, { active: activeTab === 'info', onClick: () => setActiveTab('info'), icon: User, label: "Informations" }), _jsx(TabButton, { active: activeTab === 'bank', onClick: () => setActiveTab('bank'), icon: Landmark, label: "Banque" }), _jsx(TabButton, { active: activeTab === 'security', onClick: () => setActiveTab('security'), icon: Shield, label: "S\u00E9curit\u00E9" })] }), activeTab === 'info' && (_jsxs("div", { className: "bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5 text-sky-400" }), "Informations personnelles"] }), !editing ? (_jsxs("button", { onClick: () => setEditing(true), className: "flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition", children: [_jsx(Edit3, { className: "w-4 h-4" }), "Modifier"] })) : (_jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => {
                                                setEditing(false);
                                                loadProfile(); // Reset form
                                            }, className: "flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition", children: [_jsx(X, { className: "w-4 h-4" }), "Annuler"] }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50", children: [saving ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Save, { className: "w-4 h-4" })), "Sauvegarder"] })] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(FormField, { label: "Pr\u00E9nom", icon: User, value: formData.first_name, onChange: (value) => setFormData({ ...formData, first_name: value }), editing: editing, placeholder: "Votre pr\u00E9nom" }), _jsx(FormField, { label: "Nom", icon: User, value: formData.last_name, onChange: (value) => setFormData({ ...formData, last_name: value }), editing: editing, placeholder: "Votre nom" }), _jsx(FormField, { label: "Email", icon: Mail, value: profileData.user.email, editing: false, disabled: true }), _jsx(FormField, { label: "T\u00E9l\u00E9phone", icon: Phone, value: formData.phone, onChange: (value) => setFormData({ ...formData, phone: value }), editing: editing, placeholder: "+242 06 XXX XX XX" }), _jsx(FormField, { label: "Pays", icon: MapPin, value: formData.country, editing: false, disabled: true }), _jsx(SelectField, { label: "R\u00E9gion", icon: MapPin, value: formData.region, onChange: (value) => setFormData({ ...formData, region: value }), editing: editing, options: REGIONS_CONGO.map(r => ({ value: r, label: r })), placeholder: "S\u00E9lectionnez votre r\u00E9gion" }), _jsx(FormField, { label: "Ville", icon: Building2, value: formData.city, onChange: (value) => setFormData({ ...formData, city: value }), editing: editing, placeholder: "Ex: Brazzaville" }), _jsx("div", { className: "md:col-span-2", children: _jsx(FormField, { label: "Adresse", icon: MapPin, value: formData.address, onChange: (value) => setFormData({ ...formData, address: value }), editing: editing, placeholder: "Quartier, avenue, point de rep\u00E8re\u2026" }) }), _jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: "text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2", children: [_jsx(Award, { className: "w-4 h-4 text-sky-400" }), "Type de compte"] }), _jsxs("div", { className: "px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center gap-3", children: [_jsx("span", { className: "px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-sm font-medium capitalize", children: profileData.user.user_type }), _jsxs("span", { className: "text-slate-400 text-sm", children: ["Compte cr\u00E9\u00E9 le ", formatDate(profileData.user.date_joined)] })] })] })] }), _jsxs("div", { className: "mt-8 space-y-4 border-t border-slate-700/50 pt-6", children: [_jsxs("div", { className: "flex flex-col gap-2 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(MapPin, { className: "w-5 h-5 text-sky-400" }), "Adresse et position GPS"] }), _jsx("p", { className: "text-sm text-slate-400", children: "Pour les zones o\u00F9 l'adresse \u00E9crite est difficile \u00E0 saisir, vous pouvez enregistrer votre position exacte sur la carte." })] }), _jsxs("div", { className: "rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-xs text-slate-400", children: ["Derni\u00E8re mise \u00E0 jour: ", formatDate(profileData.user.location_updated_at || undefined)] })] }), _jsx(LocationPickerMap, { editing: editing, value: {
                                        latitude: formData.latitude,
                                        longitude: formData.longitude,
                                    }, resolvedAddress: formData.address, resolvedCity: formData.city, locationSource: formData.location_source || profileData.user.location_source, onChange: ({ latitude, longitude, location_source, resolved_address, resolved_city }) => setFormData((prev) => ({
                                        ...prev,
                                        latitude,
                                        longitude,
                                        location_source,
                                        address: resolved_address || prev.address,
                                        city: resolved_city || prev.city,
                                    })) }), _jsxs("div", { className: "rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3", children: [_jsx("p", { className: "text-xs font-medium text-slate-400", children: "Source de position" }), _jsx("p", { className: "mt-1 text-sm text-white", children: formatLocationSource(formData.location_source || profileData.user.location_source) })] })] })] })), activeTab === 'bank' && (_jsxs("div", { className: "bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(Landmark, { className: "w-5 h-5 text-green-400" }), "Informations bancaires"] }), !editing ? (_jsxs("button", { onClick: () => setEditing(true), className: "flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition", children: [_jsx(Edit3, { className: "w-4 h-4" }), "Modifier"] })) : (_jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => {
                                                setEditing(false);
                                                loadProfile();
                                            }, className: "flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition", children: [_jsx(X, { className: "w-4 h-4" }), "Annuler"] }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), "Sauvegarder"] })] }))] }), _jsxs("div", { className: "bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 mb-6 flex items-start gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sky-400 font-medium", children: "Pourquoi ajouter votre banque ?" }), _jsx("p", { className: "text-slate-300 text-sm mt-1", children: "Connecter votre compte bancaire permet d'am\u00E9liorer votre score TERAS en validant vos transactions et revenus. Vos donn\u00E9es restent confidentielles et s\u00E9curis\u00E9es." })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: "text-sm font-medium text-slate-300 mb-3 block flex items-center gap-2", children: [_jsx(Building2, { className: "w-4 h-4 text-green-400" }), "Votre banque principale"] }), editing ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: BANQUES_CONGO.map((banque) => (_jsx("button", { onClick: () => setFormData({ ...formData, bank: banque.id }), className: `p-4 rounded-xl border-2 transition-all text-left ${formData.bank === banque.id
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: banque.logo }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: `font-medium truncate ${formData.bank === banque.id ? 'text-green-400' : 'text-white'}`, children: banque.name }) }), formData.bank === banque.id && (_jsx(CheckCircle, { className: "w-5 h-5 text-green-400 flex-shrink-0" }))] }) }, banque.id))) })) : (_jsx("div", { className: "px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl", children: formData.bank ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: BANQUES_CONGO.find(b => b.id === formData.bank)?.logo || '🏦' }), _jsx("span", { className: "text-white font-medium", children: BANQUES_CONGO.find(b => b.id === formData.bank)?.name || formData.bank })] })) : (_jsx("span", { className: "text-slate-400", children: "Aucune banque s\u00E9lectionn\u00E9e" })) }))] }), _jsx("div", { className: "md:col-span-2", children: _jsx(FormField, { label: "Num\u00E9ro de compte / IBAN", icon: CreditCard, value: formData.bank_account, onChange: (value) => setFormData({ ...formData, bank_account: value }), editing: editing, placeholder: "Ex: CG XX XXXX XXXX XXXX XXXX" }) })] }), _jsxs("div", { className: "mt-8 pt-6 border-t border-slate-700/50", children: [_jsxs("h3", { className: "text-lg font-medium text-white mb-4 flex items-center gap-2", children: [_jsx(BadgeCheck, { className: "w-5 h-5 text-sky-400" }), "Banques partenaires TERAS"] }), _jsx("div", { className: "flex flex-wrap gap-3", children: ['uba', 'bgfi', 'ecobank', 'lcb'].map((bankId) => {
                                        const bank = BANQUES_CONGO.find(b => b.id === bankId);
                                        return bank ? (_jsxs("div", { className: "px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center gap-2", children: [_jsx("span", { children: bank.logo }), _jsx("span", { className: "text-sm text-slate-300", children: bank.name.split(' ')[0] }), _jsx(BadgeCheck, { className: "w-4 h-4 text-sky-400" })] }, bankId)) : null;
                                    }) })] })] })), activeTab === 'security' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-6 flex items-center gap-2", children: [_jsx(BadgeCheck, { className: "w-5 h-5 text-sky-400" }), "V\u00E9rification d'identit\u00E9 (KYC)"] }), _jsxs("div", { className: `p-4 rounded-xl border ${kycConfig.bg} flex items-center justify-between`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center ${kycConfig.bg}`, children: kycConfig.icon }), _jsxs("div", { children: [_jsxs("p", { className: `font-semibold ${kycConfig.color}`, children: ["Statut : ", kycConfig.label] }), _jsx("p", { className: "text-sm text-slate-400", children: profileData.user.kyc_status === 'verified'
                                                                ? 'Votre identité a été vérifiée avec succès'
                                                                : 'Veuillez soumettre vos documents pour vérification' })] })] }), profileData.user.kyc_status !== 'verified' && (_jsx("button", { className: "px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition", children: "V\u00E9rifier" }))] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-6 flex items-center gap-2", children: [_jsx(Lock, { className: "w-5 h-5 text-red-400" }), "Changer le mot de passe"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 max-w-md", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-300 mb-2 block", children: "Mot de passe actuel" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? 'text' : 'password', value: passwordData.current_password, onChange: (e) => setPasswordData({ ...passwordData, current_password: e.target.value }), className: "w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 pr-12", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white", children: showPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-300 mb-2 block", children: "Nouveau mot de passe" }), _jsx("input", { type: showPassword ? 'text' : 'password', value: passwordData.new_password, onChange: (e) => setPasswordData({ ...passwordData, new_password: e.target.value }), className: "w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500", placeholder: "Minimum 8 caract\u00E8res" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-300 mb-2 block", children: "Confirmer le mot de passe" }), _jsx("input", { type: showPassword ? 'text' : 'password', value: passwordData.confirm_password, onChange: (e) => setPasswordData({ ...passwordData, confirm_password: e.target.value }), className: "w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500", placeholder: "R\u00E9p\u00E9tez le mot de passe" })] }), _jsxs("button", { onClick: handleChangePassword, disabled: saving || !passwordData.current_password || !passwordData.new_password, className: "mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed", children: [saving ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Lock, { className: "w-4 h-4" }), "Changer le mot de passe"] })] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-4 flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-purple-400" }), "S\u00E9curit\u00E9 du compte"] }), _jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "p-4 bg-slate-900/50 rounded-xl flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: "Authentification \u00E0 deux facteurs" }), _jsx("p", { className: "text-sm text-slate-400", children: "Protection suppl\u00E9mentaire pour votre compte" })] })] }), _jsx("button", { className: "px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition", children: "Activer" })] }) })] })] }))] }) }));
}
function TabButton({ active, onClick, icon: Icon, label }) {
    return (_jsxs("button", { onClick: onClick, className: `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${active
            ? 'bg-sky-500 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: label })] }));
}
function FormField({ label, icon: Icon, value, onChange, editing, disabled, placeholder, type = 'text' }) {
    return (_jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2", children: [_jsx(Icon, { className: "w-4 h-4 text-slate-400" }), label] }), _jsx("input", { type: type, value: value, onChange: (e) => onChange?.(e.target.value), disabled: disabled || !editing, placeholder: placeholder, className: `w-full px-4 py-3 rounded-lg border transition ${disabled || !editing
                    ? 'bg-slate-900/30 border-slate-700/50 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900/50 border-slate-700 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500'}` })] }));
}
function SelectField({ label, icon: Icon, value, onChange, editing, options, placeholder }) {
    return (_jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2", children: [_jsx(Icon, { className: "w-4 h-4 text-slate-400" }), label] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: value, onChange: (e) => onChange(e.target.value), disabled: !editing, className: `w-full px-4 py-3 rounded-lg border appearance-none transition ${!editing
                            ? 'bg-slate-900/30 border-slate-700/50 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900/50 border-slate-700 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500'}`, children: [_jsx("option", { value: "", children: placeholder || 'Sélectionner...' }), options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }), _jsx(ChevronDown, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" })] })] }));
}
function StatCard({ icon: Icon, label, value, suffix, color, trend }) {
    return (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-lg flex items-center justify-center", style: { backgroundColor: `${color}20` }, children: _jsx(Icon, { className: "w-5 h-5", style: { color } }) }), trend && (_jsx("span", { className: "text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full", children: trend }))] }), _jsx("div", { className: "text-sm text-slate-400 mb-1", children: label }), _jsxs("div", { className: "text-2xl font-bold text-white", children: [value, suffix && _jsx("span", { className: "text-sm text-slate-400 ml-1", children: suffix })] })] }));
}
