import LinkedAccounts from '../../components/shared/LinkedAccounts';
/**
 * Page Paramètres Utilisateur - CONNECTÉ AU BACKEND
 * @module pages/user/UserSettings
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UserSettingsData {
  id: number;
  notifications_score: boolean;
  notifications_recommendations: boolean;
  notifications_documents: boolean;
  two_factor_auth: boolean;
  data_sharing: boolean;
  theme: 'dark' | 'light' | 'auto';
  language: 'fr' | 'en';
  currency: 'XAF' | 'EUR' | 'USD';
  updated_at: string;
}

export default function UserSettings() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<UserSettingsData | null>(null);

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
    } catch (err: any) {
      console.error('Erreur chargement paramètres:', err);
      setError('Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAUVEGARDER LES PARAMÈTRES
  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await authFetch('/api/users/settings/', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) throw new Error('Erreur de sauvegarde');
      
      const data = await response.json();
      setSettings(data.settings);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  // ✅ LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
      </div>
    );
  }

  // ✅ ERROR
  if (error && !settings) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 rounded-xl p-6 border border-red-500/50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">Erreur</h2>
          <p className="text-slate-400 text-center mb-4">{error}</p>
          <button
            onClick={loadSettings}
            className="w-full px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-sky-500/20 rounded-lg">
            <Settings className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-slate-400">Personnalisez votre expérience TERAS</p>
          </div>
        </div>

        {/* Profil */}
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nom complet</label>
              <input
                type="text"
                defaultValue={`${user?.first_name || ''} ${user?.last_name || ''}`}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-3">
            <ToggleOption 
              label="Alertes de score" 
              description="Recevoir des notifications lors de changements de score"
              enabled={settings.notifications_score}
              onChange={(val) => updateSetting('notifications_score', val)}
            />
            <ToggleOption 
              label="Recommandations" 
              description="Notifications pour nouvelles recommandations"
              enabled={settings.notifications_recommendations}
              onChange={(val) => updateSetting('notifications_recommendations', val)}
            />
            <ToggleOption 
              label="Documents" 
              description="Alertes lorsque des documents sont requis"
              enabled={settings.notifications_documents}
              onChange={(val) => updateSetting('notifications_documents', val)}
            />
          </div>
        </div>

        {/* Confidentialité */}
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-semibold">Confidentialité et sécurité</h2>
          </div>
          <div className="space-y-3">
            <ToggleOption 
              label="Authentification à deux facteurs" 
              description="Sécurité renforcée pour votre compte"
              enabled={settings.two_factor_auth}
              onChange={(val) => updateSetting('two_factor_auth', val)}
            />
            <ToggleOption 
              label="Partage de données" 
              description="Autoriser le partage anonyme pour améliorer le service"
              enabled={settings.data_sharing}
              onChange={(val) => updateSetting('data_sharing', val)}
            />
          </div>
        </div>

        {/* Apparence */}
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-semibold">Apparence</h2>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Thème</label>
            <select 
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="dark">Sombre (par défaut)</option>
              <option value="light">Clair</option>
              <option value="auto">Automatique</option>
            </select>
          </div>
        </div>

        {/* Langue */}
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-semibold">Langue et région</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Langue</label>
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Devise</label>
              <select 
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="XAF">FCFA (XAF)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Bouton Sauvegarder */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Sauvegardé !
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Sauvegarder
            </>
          )}
        </button>
      </div>

  {/* ── Comptes Mobile Money ──────────────────────────────────────────── */}
  <div className="mt-8">
    <LinkedAccounts title="Mes Comptes Mobile Money"/>
  </div>
    </div>
  );
}

// Composant Toggle
interface ToggleOptionProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleOption({ label, description, enabled, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-white/5">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-slate-400 mt-1">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-sky-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
