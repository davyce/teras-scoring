// AdminUserEdit.tsx - Page de modification utilisateur TERAS
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { authFetch } from '../../utils/authFetch';

const USER_TYPES = [
  { value: 'individual', label: 'Individu' },
  { value: 'enterprise', label: 'Entreprise' },
  { value: 'government', label: 'Gouvernement' },
  { value: 'bank', label: 'Banque' },
  { value: 'admin', label: 'Administrateur' },
];

const KYC_STATUSES = [
  { value: 'not_started', label: 'Non commencé' },
  { value: 'pending', label: 'En attente' },
  { value: 'submitted', label: 'Soumis' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
];

const REGIONS = ['Brazzaville', 'Pointe-Noire', 'Kinshasa', 'Lubumbashi', 'Douala', 'Libreville', 'Bangui', 'Ndjamena', 'Malabo', 'Yaoundé'];

function Field({ label, icon: Icon, children, hint }: { label: string; icon?: any; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-sky-400" />}
          {label}
        </div>
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 rounded-xl text-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-sky-500/40";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' };

export default function AdminUserEdit() {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    region: '',
    user_type: 'individual',
    kyc_status: 'not_started',
    is_active: true,
    is_staff: false,
    address: '',
    country: 'CG',
  });

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true); setError(null);
      const r = await adminApi.getUserDetail(parseInt(userId!));
      if (r.data) {
        const u = r.data;
        setForm({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          username: u.username || '',
          phone: u.phone || '',
          region: u.region || '',
          user_type: u.user_type || 'individual',
          kyc_status: u.kyc_status || 'not_started',
          is_active: u.is_active ?? true,
          is_staff: u.is_staff ?? false,
          address: u.address || '',
          country: u.country || 'CG',
        });
      } else {
        setError(r.error || 'Utilisateur introuvable');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true); setError(null); setSuccess(false);
    try {
      const response = await authFetch(`/api/scoring/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate(`/admin/users/${userId}`), 1500);
      } else {
        setError(data.error || data.detail || 'Erreur lors de la sauvegarde');
      }
    } catch (e: any) {
      setError(e.message || 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  if (loading) return (
    <div className="flex items-center justify-center h-96" style={{ background: '#0b1220' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Chargement du profil...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ background: '#0b1220' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate(`/admin/users/${userId}`)} className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au profil
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Modifier</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/users/${userId}`)}
            className="px-4 py-2 rounded-xl text-slate-400 text-sm border border-slate-700 hover:border-slate-500 transition-all">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Modifier l'utilisateur</h1>
        <p className="text-slate-400 text-sm mt-1">{form.email}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-red-300 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-emerald-300 text-sm" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Modifications sauvegardées ! Redirection en cours...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Identité */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" /> Informations personnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Prénom">
                <input type="text" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)}
                  placeholder="Prénom" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Nom de famille">
                <input type="text" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)}
                  placeholder="Nom" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Nom d'utilisateur" icon={User}>
                <input type="text" value={form.username} onChange={e => handleChange('username', e.target.value)}
                  placeholder="username" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Email" icon={Mail} hint="Identifiant de connexion">
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  placeholder="email@exemple.com" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Téléphone" icon={Phone}>
                <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+242 06 XXX XXXX" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Pays">
                <select value={form.country} onChange={e => handleChange('country', e.target.value)}
                  className={inputClass} style={inputStyle}>
                  {[['CG','Congo'], ['CM','Cameroun'], ['GA','Gabon'], ['CF','Centrafrique'], ['TD','Tchad'], ['GQ','Guinée Éq.'], ['CD','RD Congo']].map(([v, l]) => (
                    <option key={v} value={v} style={{ background: '#1e293b' }}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Adresse" icon={MapPin}>
                <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)}
                  placeholder="Adresse complète" className={inputClass} style={inputStyle} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Région / Ville">
                <select value={form.region} onChange={e => handleChange('region', e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="" style={{ background: '#1e293b' }}>Sélectionner une région</option>
                  {REGIONS.map(r => <option key={r} value={r} style={{ background: '#1e293b' }}>{r}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">

          {/* Compte & Permissions */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" /> Compte & Accès
            </h2>
            <div className="space-y-4">
              <Field label="Type d'utilisateur">
                <select value={form.user_type} onChange={e => handleChange('user_type', e.target.value)}
                  className={inputClass} style={inputStyle}>
                  {USER_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: '#1e293b' }}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Statut KYC">
                <select value={form.kyc_status} onChange={e => handleChange('kyc_status', e.target.value)}
                  className={inputClass} style={inputStyle}>
                  {KYC_STATUSES.map(s => <option key={s.value} value={s.value} style={{ background: '#1e293b' }}>{s.label}</option>)}
                </select>
              </Field>

              {/* Toggles */}
              <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { field: 'is_active', label: 'Compte actif', desc: 'L\'utilisateur peut se connecter', color: '#34d399' },
                  { field: 'is_staff', label: 'Staff / Admin', desc: 'Accès à l\'interface d\'admin', color: '#a78bfa' },
                ].map(({ field, label, desc, color }) => (
                  <div key={field} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <button onClick={() => handleChange(field, !(form as any)[field])}
                      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                      style={{ background: (form as any)[field] ? `${color}40` : 'rgba(255,255,255,0.1)' }}>
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full transition-all"
                        style={{ background: (form as any)[field] ? color : '#64748b', transform: (form as any)[field] ? 'translateX(20px)' : 'none' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <p className="text-sky-300 text-xs font-medium mb-1">💡 Information</p>
            <p className="text-slate-400 text-xs">Les modifications sont appliquées immédiatement. Le score TERAS est recalculé automatiquement à la prochaine connexion de l'utilisateur.</p>
          </div>
        </div>
      </div>

      {/* Footer actions (mobile) */}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={() => navigate(`/admin/users/${userId}`)}
          className="px-5 py-2.5 rounded-xl text-slate-400 text-sm border border-slate-700 hover:border-slate-500 transition-all">
          Annuler
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
}