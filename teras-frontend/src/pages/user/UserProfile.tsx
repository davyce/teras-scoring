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
import {
  User,
  Mail,
  MapPin,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Award,
  TrendingUp,
  Activity,
  Calendar,
  Edit3,
  X,
  Phone,
  Building2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  Landmark,
  FileText,
  ChevronDown,
  Sparkles,
  BadgeCheck,
  Clock,
  Camera,
} from "lucide-react";

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
// INTERFACES
// ============================================
interface UserProfileData {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    country: string;
    region: string;
    kyc_status: string;
    phone?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    location_source?: string;
    location_updated_at?: string | null;
    bank?: string;
    bank_account?: string;
    date_joined?: string;
  };
  score: {
    score: number;
    level: string;
    breakdown?: {
      T: number;
      E: number;
      R: number;
      A: number;
      S: number;
    };
  };
  stats: {
    total_transactions: number;
    total_income: number;
    total_assets: number;
    documents_count?: number;
    recommendations_count?: number;
  };
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function UserProfile() {
  const { user: authUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'bank' | 'security'>('info');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Congo-Brazzaville',
    region: '',
    latitude: null as number | null,
    longitude: null as number | null,
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
    } catch (err: any) {
      console.error("Erreur chargement profil:", err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
    } finally {
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' });
    } finally {
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getLevelConfig = (level: string) => {
    const configs: Record<string, { color: string; bg: string; icon: string }> = {
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

  const getKycConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
      'verified': { 
        color: 'text-green-400', 
        bg: 'bg-green-500/20 border-green-500/50', 
        label: 'Vérifié',
        icon: <BadgeCheck className="w-4 h-4" />
      },
      'pending': { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20 border-yellow-500/50', 
        label: 'En attente',
        icon: <Clock className="w-4 h-4" />
      },
      'rejected': { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20 border-red-500/50', 
        label: 'Rejeté',
        icon: <AlertCircle className="w-4 h-4" />
      },
    };
    return configs[status] || configs['pending'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatLocationSource = (source?: string) => {
    const labels: Record<string, string> = {
      'browser-geolocation': 'Géolocalisation navigateur',
      'map-click': 'Choix manuel sur la carte',
    };

    return labels[source || ''] || 'Non défini';
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-sky-500/30 rounded-full animate-pulse"></div>
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 mt-4">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-400 mb-6">Impossible de charger votre profil</p>
          <button
            onClick={loadProfile}
            className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition flex items-center gap-2 mx-auto"
          >
            <Loader2 className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const levelConfig = getLevelConfig(profileData.score.level);
  const kycConfig = getKycConfig(profileData.user.kyc_status);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* ============================================ */}
        {/* HEADER AVEC AVATAR */}
        {/* ============================================ */}
        <div className="relative">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${levelConfig.bg} rounded-3xl blur-3xl opacity-30`}></div>
          
          <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div 
                  className="w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-2xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${levelConfig.color}40, ${levelConfig.color}20)`,
                    border: `2px solid ${levelConfig.color}50`
                  }}
                >
                  {profileData.user.first_name?.[0]?.toUpperCase() || 'U'}
                  {profileData.user.last_name?.[0]?.toUpperCase() || ''}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {/* Level badge */}
                <div 
                  className="absolute -top-2 -right-2 text-2xl"
                  title={profileData.score.level}
                >
                  {levelConfig.icon}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profileData.user.first_name} {profileData.user.last_name}
                </h1>
                <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  {profileData.user.email}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  {/* KYC Badge */}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border ${kycConfig.bg} ${kycConfig.color}`}>
                    {kycConfig.icon}
                    KYC {kycConfig.label}
                  </span>
                  {/* Member since */}
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Membre depuis {formatDate(profileData.user.date_joined)}
                  </span>
                </div>
              </div>

              {/* Score Card */}
              <div className={`bg-gradient-to-br ${levelConfig.bg} rounded-2xl p-6 border border-white/10 min-w-[200px]`}>
                <p className="text-sm text-slate-300 mb-1">Score TERAS</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold" style={{ color: levelConfig.color }}>
                    {profileData.score.score}
                  </span>
                  <span className="text-slate-400">/1000</span>
                </div>
                <div 
                  className="mt-2 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1"
                  style={{ backgroundColor: `${levelConfig.color}20`, color: levelConfig.color }}
                >
                  <Award className="w-4 h-4" />
                  Niveau {profileData.score.level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MESSAGE NOTIFICATION */}
        {/* ============================================ */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
              : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* STATISTIQUES */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Transactions"
            value={profileData.stats.total_transactions}
            color="#0ea5e9"
            trend="+12%"
          />
          <StatCard
            icon={TrendingUp}
            label="Revenus"
            value={`${(profileData.stats.total_income / 1000).toFixed(0)}k`}
            suffix="FCFA"
            color="#22c55e"
            trend="+8%"
          />
          <StatCard
            icon={CreditCard}
            label="Actifs"
            value={profileData.stats.total_assets}
            color="#f59e0b"
          />
          <StatCard
            icon={FileText}
            label="Documents"
            value={profileData.stats.documents_count || 0}
            color="#8b5cf6"
          />
        </div>

        {/* ============================================ */}
        {/* TABS DE NAVIGATION */}
        {/* ============================================ */}
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <TabButton 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')}
            icon={User}
            label="Informations"
          />
          <TabButton 
            active={activeTab === 'bank'} 
            onClick={() => setActiveTab('bank')}
            icon={Landmark}
            label="Banque"
          />
          <TabButton 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
            icon={Shield}
            label="Sécurité"
          />
        </div>

        {/* ============================================ */}
        {/* CONTENU DES TABS */}
        {/* ============================================ */}
        
        {/* TAB: INFORMATIONS PERSONNELLES */}
        {activeTab === 'info' && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-sky-400" />
                Informations personnelles
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadProfile(); // Reset form
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Prénom"
                icon={User}
                value={formData.first_name}
                onChange={(value) => setFormData({ ...formData, first_name: value })}
                editing={editing}
                placeholder="Votre prénom"
              />
              
              <FormField
                label="Nom"
                icon={User}
                value={formData.last_name}
                onChange={(value) => setFormData({ ...formData, last_name: value })}
                editing={editing}
                placeholder="Votre nom"
              />

              <FormField
                label="Email"
                icon={Mail}
                value={profileData.user.email}
                editing={false}
                disabled
              />

              <FormField
                label="Téléphone"
                icon={Phone}
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                editing={editing}
                placeholder="+242 06 XXX XX XX"
              />

              <FormField
                label="Pays"
                icon={MapPin}
                value={formData.country}
                editing={false}
                disabled
              />

              <SelectField
                label="Région"
                icon={MapPin}
                value={formData.region}
                onChange={(value) => setFormData({ ...formData, region: value })}
                editing={editing}
                options={REGIONS_CONGO.map(r => ({ value: r, label: r }))}
                placeholder="Sélectionnez votre région"
              />

              <FormField
                label="Ville"
                icon={Building2}
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                editing={editing}
                placeholder="Ex: Brazzaville"
              />

              <div className="md:col-span-2">
                <FormField
                  label="Adresse"
                  icon={MapPin}
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  editing={editing}
                  placeholder="Quartier, avenue, point de repère…"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  Type de compte
                </label>
                <div className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center gap-3">
                  <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-sm font-medium capitalize">
                    {profileData.user.user_type}
                  </span>
                  <span className="text-slate-400 text-sm">
                    Compte créé le {formatDate(profileData.user.date_joined)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-700/50 pt-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-400" />
                    Adresse et position GPS
                  </h3>
                  <p className="text-sm text-slate-400">
                    Pour les zones où l'adresse écrite est difficile à saisir, vous pouvez enregistrer votre position exacte sur la carte.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
                  Dernière mise à jour: {formatDate(profileData.user.location_updated_at || undefined)}
                </div>
              </div>

              <LocationPickerMap
                editing={editing}
                value={{
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                resolvedAddress={formData.address}
                resolvedCity={formData.city}
                locationSource={formData.location_source || profileData.user.location_source}
                onChange={({ latitude, longitude, location_source, resolved_address, resolved_city }) =>
                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    location_source,
                    address: resolved_address || prev.address,
                    city: resolved_city || prev.city,
                  }))
                }
              />

              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
                <p className="text-xs font-medium text-slate-400">Source de position</p>
                <p className="mt-1 text-sm text-white">{formatLocationSource(formData.location_source || profileData.user.location_source)}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INFORMATIONS BANCAIRES */}
        {activeTab === 'bank' && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-green-400" />
                Informations bancaires
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sky-400 font-medium">Pourquoi ajouter votre banque ?</p>
                <p className="text-slate-300 text-sm mt-1">
                  Connecter votre compte bancaire permet d'améliorer votre score TERAS en validant vos transactions 
                  et revenus. Vos données restent confidentielles et sécurisées.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sélection de la banque */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-300 mb-3 block flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-400" />
                  Votre banque principale
                </label>
                
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {BANQUES_CONGO.map((banque) => (
                      <button
                        key={banque.id}
                        onClick={() => setFormData({ ...formData, bank: banque.id })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.bank === banque.id
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{banque.logo}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              formData.bank === banque.id ? 'text-green-400' : 'text-white'
                            }`}>
                              {banque.name}
                            </p>
                          </div>
                          {formData.bank === banque.id && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                    {formData.bank ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {BANQUES_CONGO.find(b => b.id === formData.bank)?.logo || '🏦'}
                        </span>
                        <span className="text-white font-medium">
                          {BANQUES_CONGO.find(b => b.id === formData.bank)?.name || formData.bank}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Aucune banque sélectionnée</span>
                    )}
                  </div>
                )}
              </div>

              {/* Numéro de compte */}
              <div className="md:col-span-2">
                <FormField
                  label="Numéro de compte / IBAN"
                  icon={CreditCard}
                  value={formData.bank_account}
                  onChange={(value) => setFormData({ ...formData, bank_account: value })}
                  editing={editing}
                  placeholder="Ex: CG XX XXXX XXXX XXXX XXXX"
                />
              </div>
            </div>

            {/* Banques partenaires */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-sky-400" />
                Banques partenaires TERAS
              </h3>
              <div className="flex flex-wrap gap-3">
                {['uba', 'bgfi', 'ecobank', 'lcb'].map((bankId) => {
                  const bank = BANQUES_CONGO.find(b => b.id === bankId);
                  return bank ? (
                    <div 
                      key={bankId}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center gap-2"
                    >
                      <span>{bank.logo}</span>
                      <span className="text-sm text-slate-300">{bank.name.split(' ')[0]}</span>
                      <BadgeCheck className="w-4 h-4 text-sky-400" />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SÉCURITÉ */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Statut KYC */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-sky-400" />
                Vérification d'identité (KYC)
              </h2>
              
              <div className={`p-4 rounded-xl border ${kycConfig.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kycConfig.bg}`}>
                    {kycConfig.icon}
                  </div>
                  <div>
                    <p className={`font-semibold ${kycConfig.color}`}>
                      Statut : {kycConfig.label}
                    </p>
                    <p className="text-sm text-slate-400">
                      {profileData.user.kyc_status === 'verified' 
                        ? 'Votre identité a été vérifiée avec succès'
                        : 'Veuillez soumettre vos documents pour vérification'}
                    </p>
                  </div>
                </div>
                {profileData.user.kyc_status !== 'verified' && (
                  <button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition">
                    Vérifier
                  </button>
                )}
              </div>
            </div>

            {/* Changement de mot de passe */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Changer le mot de passe
              </h2>

              <div className="grid grid-cols-1 gap-4 max-w-md">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Nouveau mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Minimum 8 caractères"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Répétez le mot de passe"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving || !passwordData.current_password || !passwordData.new_password}
                  className="mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Changer le mot de passe
                </button>
              </div>
            </div>

            {/* Sessions actives */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Sécurité du compte
              </h2>
              
              <div className="space-y-3">
                <div className="p-4 bg-slate-900/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Authentification à deux facteurs</p>
                      <p className="text-sm text-slate-400">Protection supplémentaire pour votre compte</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition">
                    Activer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPOSANTS AUXILIAIRES
// ============================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
        active
          ? 'bg-sky-500 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface FormFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange?: (value: string) => void;
  editing?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}

function FormField({ label, icon: Icon, value, onChange, editing, disabled, placeholder, type = 'text' }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || !editing}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border transition ${
          disabled || !editing
            ? 'bg-slate-900/30 border-slate-700/50 text-slate-400 cursor-not-allowed'
            : 'bg-slate-900/50 border-slate-700 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
        }`}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function SelectField({ label, icon: Icon, value, onChange, editing, options, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!editing}
          className={`w-full px-4 py-3 rounded-lg border appearance-none transition ${
            !editing
              ? 'bg-slate-900/30 border-slate-700/50 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900/50 border-slate-700 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
          }`}
        >
          <option value="">{placeholder || 'Sélectionner...'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
  trend?: string;
}

function StatCard({ icon: Icon, label, value, suffix, color, trend }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition">
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        {suffix && <span className="text-sm text-slate-400 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
