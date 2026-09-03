import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Globe,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import { useTheme } from '../../stores/theme';

interface AdminSettingsData {
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

const EMPTY_SETTINGS: AdminSettingsData = {
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
  const [settings, setSettings] = useState<AdminSettingsData>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Impossible de charger les paramètres.' });
    } finally {
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  }

  function updateSetting<K extends keyof AdminSettingsData>(field: K, value: AdminSettingsData[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Préférences d’administration, notifications et comportement de l’interface.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Recharger
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section
            icon={Bell}
            title="Notifications"
            description="Choisis les alertes utiles pour le pilotage quotidien."
          >
            <ToggleRow
              label="Alertes de score"
              description="Prévenir lorsqu’un score TERAS évolue ou est recalculé."
              checked={settings.notifications_score}
              onChange={(checked) => updateSetting('notifications_score', checked)}
            />
            <ToggleRow
              label="Recommandations"
              description="Suivre les recommandations générées pour dossiers et utilisateurs."
              checked={settings.notifications_recommendations}
              onChange={(checked) => updateSetting('notifications_recommendations', checked)}
            />
            <ToggleRow
              label="Documents"
              description="Être notifié lorsqu’un document manque ou change d’état."
              checked={settings.notifications_documents}
              onChange={(checked) => updateSetting('notifications_documents', checked)}
            />
          </Section>

          <Section
            icon={Shield}
            title="Sécurité et confidentialité"
            description="Paramètres persos de sécurité pour l’administrateur connecté."
          >
            <ToggleRow
              label="Authentification à deux facteurs"
              description="Active l’option dans les préférences si ton flux de connexion le supporte."
              checked={settings.two_factor_auth}
              onChange={(checked) => updateSetting('two_factor_auth', checked)}
            />
            <ToggleRow
              label="Partage de données anonymisé"
              description="Autorise l’usage agrégé de certaines données pour améliorer TERAS."
              checked={settings.data_sharing}
              onChange={(checked) => updateSetting('data_sharing', checked)}
            />
          </Section>

          <Section
            icon={Globe}
            title="Langue et devise"
            description="Préférences d’affichage utilisées dans l’espace admin."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Langue"
                value={settings.language}
                onChange={(value) => updateSetting('language', value as AdminSettingsData['language'])}
                options={[
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <SelectField
                label="Devise"
                value={settings.currency}
                onChange={(value) => updateSetting('currency', value as AdminSettingsData['currency'])}
                options={[
                  { value: 'XAF', label: 'FCFA (XAF)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'USD', label: 'USD ($)' },
                ]}
              />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section
            icon={Palette}
            title="Apparence"
            description="Le thème est sauvegardé côté paramètres et appliqué à l’interface."
          >
            <SelectField
              label="Thème"
              value={settings.theme}
              onChange={(value) => updateSetting('theme', value as AdminSettingsData['theme'])}
              options={[
                { value: 'dark', label: 'Sombre' },
                { value: 'light', label: 'Clair' },
                { value: 'auto', label: 'Automatique' },
              ]}
            />

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-white">État courant</p>
              <p className="mt-1">
                Le thème actif dans cette session est <strong>{isDarkMode ? 'sombre' : 'clair'}</strong>.
              </p>
            </div>
          </Section>

          <Section
            icon={Settings}
            title="Métadonnées"
            description="Suivi simple de la dernière mise à jour des préférences."
          >
            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700/50">
              <p className="text-gray-500 dark:text-gray-400">Dernière sauvegarde</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {settings.updated_at
                  ? new Date(settings.updated_at).toLocaleString('fr-FR')
                  : 'Pas encore enregistrée'}
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function applyTheme(theme: AdminSettingsData['theme'], setTheme: (isDark: boolean) => void) {
  if (theme === 'auto') {
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    setTheme(prefersDark);
    return;
  }
  setTheme(theme === 'dark');
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
