import TeamManagement from '../../components/shared/TeamManagement';
// GovernmentSettings.tsx - VERSION DARK MODE AMÉLIORÉE
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, Server, Bell, MapPin } from 'lucide-react';
import { governmentApi, Settings } from '../../services/governmentApi';

export default function GovernmentSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await governmentApi.getSettings();
      if (response.data) setSettings(response.data);
      else setError(response.error || 'Erreur');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await governmentApi.updateSettings(settings);
      
      if (response.data) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-300 mb-4 text-center">{error}</p>
          <button onClick={loadSettings} className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
            TERAS Gouvernement
          </p>
          <h1 className="text-3xl font-bold text-slate-50">Configuration Système</h1>
          <p className="text-slate-400 mt-1">Paramètres TERAS</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-500/20"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 bg-emerald-900/20 border border-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 font-medium">Configuration enregistrée avec succès</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-rose-900/20 border border-rose-800 rounded-xl p-4 flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-rose-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Système */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <h2 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            Système
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Version</label>
              <input
                type="text"
                value={settings.system.version}
                disabled
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Environnement</label>
              <input
                type="text"
                value={settings.system.environment}
                disabled
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Mode Maintenance</label>
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.system.maintenance_mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      system: { ...settings.system, maintenance_mode: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm font-medium text-slate-50">
                  {settings.system.maintenance_mode ? 'Activé' : 'Désactivé'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <h2 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            Scoring
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Profil Actif</label>
              <select
                value={settings.scoring.active_profile}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    scoring: { ...settings.scoring, active_profile: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="basic">Basic</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Région</label>
              <input
                type="text"
                value={settings.scoring.region}
                disabled
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Pays</label>
              <input
                type="text"
                value={settings.scoring.country}
                disabled
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <h2 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alertes
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={settings.alerts.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alerts: { ...settings.alerts, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm font-medium text-slate-50">Activer les alertes</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={settings.alerts.email_notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alerts: { ...settings.alerts, email_notifications: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-slate-600 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm font-medium text-slate-50">Notifications par email</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Seuil Score Faible
                </label>
                <input
                  type="number"
                  value={settings.alerts.threshold_low_score}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alerts: { ...settings.alerts, threshold_low_score: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Seuil Risque Élevé
                </label>
                <input
                  type="number"
                  value={settings.alerts.threshold_high_risk}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alerts: { ...settings.alerts, threshold_high_risk: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

  {/* ── Gestion équipe gouvernement ──────────────────────────────────── */}
  <div className="mt-8">
    <TeamManagement interface="government" title="Gestion de l'Équipe Gouvernementale"/>
  </div>
    </div>
  );
}
