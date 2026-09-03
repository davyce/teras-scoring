import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import { useAuth } from '../../stores/auth';

type UserType = 'individual' | 'enterprise' | 'government' | 'admin' | 'bank';

interface AdminProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  is_active: boolean;
  kyc_status: string;
  country: string;
  region: string;
  phone_number: string;
  address: string;
  city: string;
  date_joined: string;
}

interface PasswordForm {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const EMPTY_PROFILE: AdminProfileData = {
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

const EMPTY_PASSWORDS: PasswordForm = {
  old_password: '',
  new_password: '',
  confirm_password: '',
};

const ROLE_LABELS: Record<UserType, string> = {
  admin: 'Administrateur',
  bank: 'Banque',
  enterprise: 'Entreprise',
  government: 'Gouvernement',
  individual: 'Individu',
};

const KYC_LABELS: Record<string, string> = {
  not_started: 'Non commencé',
  pending: 'En attente',
  incomplete: 'Incomplet',
  under_review: 'En cours de vérification',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

function normalizeProfile(payload: any): AdminProfileData {
  return {
    id: payload?.id ?? 0,
    username: payload?.username ?? '',
    email: payload?.email ?? '',
    first_name: payload?.first_name ?? '',
    last_name: payload?.last_name ?? '',
    user_type: (payload?.user_type ?? 'admin') as UserType,
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
  const [profile, setProfile] = useState<AdminProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwords, setPasswords] = useState<PasswordForm>(EMPTY_PASSWORDS);
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Impossible de charger le profil.' });
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof AdminProfileData>(field: K, value: AdminProfileData[K]) {
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
        account_type: (authUser as any)?.account_type || normalized.user_type,
        is_active: normalized.is_active,
        is_verified: (authUser as any)?.is_verified ?? true,
        kyc_status: normalized.kyc_status,
        created_at: (authUser as any)?.created_at || normalized.date_joined || new Date().toISOString(),
      } as any;

      setUser(mergedUser);
      localStorage.setItem('teras_user', JSON.stringify(mergedUser));
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors de la sauvegarde.' });
    } finally {
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Gère tes informations administrateur et la sécurité de ton accès.
        </p>
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
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
              {(profile.username || fullName).charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h2>
              <p className="text-gray-600 dark:text-gray-400">@{profile.username || 'admin'}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Shield className="h-4 w-4" />
                  {ROLE_LABELS[profile.user_type]}
                </span>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  profile.is_active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {profile.is_active ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Nom d'utilisateur"
              icon={User}
              value={profile.username}
              disabled
              helper="Géré par le système"
            />
            <Field
              label="Email"
              icon={Mail}
              value={profile.email}
              disabled={!isEditing}
              onChange={(value) => updateField('email', value)}
            />
            <Field
              label="Prénom"
              value={profile.first_name}
              disabled={!isEditing}
              onChange={(value) => updateField('first_name', value)}
            />
            <Field
              label="Nom"
              value={profile.last_name}
              disabled={!isEditing}
              onChange={(value) => updateField('last_name', value)}
            />
            <Field
              label="Téléphone"
              icon={Phone}
              value={profile.phone_number}
              disabled={!isEditing}
              onChange={(value) => updateField('phone_number', value)}
            />
            <Field
              label="Pays"
              value={profile.country}
              disabled={!isEditing}
              onChange={(value) => updateField('country', value)}
            />
            <Field
              label="Région"
              icon={MapPin}
              value={profile.region}
              disabled={!isEditing}
              onChange={(value) => updateField('region', value)}
            />
            <Field
              label="Ville"
              value={profile.city}
              disabled={!isEditing}
              onChange={(value) => updateField('city', value)}
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
            <textarea
              value={profile.address}
              disabled={!isEditing}
              onChange={(event) => updateField('address', event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
              >
                Modifier le profil
              </button>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Résumé du compte</h3>
            <div className="space-y-4 text-sm">
              <InfoRow label="Rôle" value={ROLE_LABELS[profile.user_type]} />
              <InfoRow label="KYC" value={KYC_LABELS[profile.kyc_status] || profile.kyc_status || 'Approuvé'} />
              <InfoRow
                label="Membre depuis"
                value={profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) : 'Non renseigné'}
                icon={Calendar}
              />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sécurité</h3>
            </div>

            <div className="space-y-4">
              <Field
                label="Mot de passe actuel"
                type="password"
                value={passwords.old_password}
                onChange={(value) => setPasswords((current) => ({ ...current, old_password: value }))}
              />
              <Field
                label="Nouveau mot de passe"
                type="password"
                value={passwords.new_password}
                onChange={(value) => setPasswords((current) => ({ ...current, new_password: value }))}
              />
              <Field
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={passwords.confirm_password}
                onChange={(value) => setPasswords((current) => ({ ...current, confirm_password: value }))}
              />

              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {passwordLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  icon: Icon,
  helper,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: string;
  icon?: any;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
            Icon ? 'pl-10' : ''
          }`}
        />
      </div>
      {helper ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p> : null}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" /> : null}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
