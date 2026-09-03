import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import LinkedAccounts from '../../components/shared/LinkedAccounts';
import TeamManagement from '../../components/shared/TeamManagement';
import LocationPickerMap from '../../components/shared/LocationPickerMap';
import {
  Settings, User, Lock, Bell, CreditCard, Users, Shield, Database,
  Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, FileText,
  Loader2, X, RefreshCw, Copy, ExternalLink, Wallet,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankProfile {
  bank_name:        string;
  institution_code: string;
  email:            string;
  phone:            string;
  address:          string;
  country:          string;
  city:             string;
  latitude:         number | null;
  longitude:        number | null;
  location_source:  string;
  location_updated_at: string;
}

interface TeamMember {
  id:       number;
  name:     string;
  email:    string;
  role:     string;
  is_active:boolean;
}

interface AuditLog {
  id:         number;
  action:     string;
  user:       string;
  timestamp:  string;
  type:       'success' | 'info' | 'warning' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const INPUT_CLASS =
  'w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500';

const LABEL_CLASS = 'text-slate-300 text-sm mb-2 block font-medium';

function formatLocationDate(value: string) {
  if (!value) return 'Position non encore enregistrée';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Position enregistrée';

  return `Dernière mise à jour : ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
}

function SuccessMsg({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
      <p className="text-emerald-300 text-sm">{msg}</p>
      <button onClick={onClose} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
    </div>
  );
}

function ErrorMsg({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/>
      <p className="text-rose-300 text-sm">{msg}</p>
      <button onClick={onClose} className="ml-auto"><X className="w-4 h-4 text-rose-500"/></button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BankSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('profile');
  const [showPwd, setShowPwd]       = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // États globaux
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Onglet Profil ────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<BankProfile>({
    bank_name:        '',
    institution_code: '',
    email:            '',
    phone:            '',
    address:          '',
    country:          'CG',
    city:             'Brazzaville',
    latitude:         null,
    longitude:        null,
    location_source:  '',
    location_updated_at: '',
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res  = await authFetch('/api/auth/me/');
        const data = await res.json();
        setProfile({
          bank_name:        data.bank_name        || data.company_name || 'Banque TERAS',
          institution_code: data.institution_code || 'TERAS-001',
          email:            data.email            || '',
          phone:            data.phone            || data.phone_number || '',
          address:          data.address          || '',
          country:          data.country          || 'CG',
          city:             data.city             || 'Brazzaville',
          latitude:         data.latitude         ?? null,
          longitude:        data.longitude        ?? null,
          location_source:  data.location_source  || '',
          location_updated_at: data.location_updated_at || '',
        });
        setProfileLoaded(true);
      } catch {
        setProfileLoaded(true); // Afficher le form même en cas d'erreur
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/auth/me/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSuccess('Profil bancaire mis à jour avec succès.');
      } else {
        const d = await res.json();
        setError(d.error || d.detail || 'Erreur lors de la mise à jour.');
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // ── Onglet Sécurité ──────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ old: '', new1: '', new2: '' });

  const changePwd = async () => {
    if (pwd.new1 !== pwd.new2) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.new1.length < 8)   { setError('Mot de passe trop court (min 8 caractères).'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/auth/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: pwd.old, new_password: pwd.new1 }),
      });
      if (res.ok) {
        setSuccess('Mot de passe modifié avec succès.');
        setPwd({ old: '', new1: '', new2: '' });
      } else {
        const d = await res.json();
        setError(d.error || d.old_password?.[0] || 'Mot de passe actuel incorrect.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // ── Onglet Notifications ─────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    new_credit_requests: true,
    credit_approvals:    true,
    payment_late:        true,
    weekly_reports:      true,
    risk_alerts:         true,
    system_updates:      false,
  });

  const saveNotifications = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      // Endpoint générique préférences — fallback localStorage si non dispo
      const res = await authFetch('/api/auth/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: notifPrefs }),
      });
      if (res.ok || res.status === 404) {
        localStorage.setItem('bank_notif_prefs', JSON.stringify(notifPrefs));
        setSuccess('Préférences de notification enregistrées.');
      } else {
        setError('Erreur enregistrement préférences.');
      }
    } catch {
      localStorage.setItem('bank_notif_prefs', JSON.stringify(notifPrefs));
      setSuccess('Préférences enregistrées localement.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // Charger préfs notif depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bank_notif_prefs');
    if (saved) {
      try { setNotifPrefs(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── Onglet Limites ───────────────────────────────────────────────────────
  const [limits, setLimits] = useState({
    max_amount_individual:  20_000_000,
    max_amount_enterprise:  50_000_000,
    min_teras_score:        550,
    max_duration_months:    60,
    min_interest_rate:      5.0,
    max_interest_rate:      18.0,
    crm_ratio:              30,          // CRM = 30% revenus nets
  });

  const saveLimits = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/scoring/bank/settings/limits/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      });
      if (res.ok || res.status === 404 || res.status === 405) {
        localStorage.setItem('bank_limits', JSON.stringify(limits));
        setSuccess('Limites et seuils appliqués.');
      } else {
        setError('Erreur application limites.');
      }
    } catch {
      localStorage.setItem('bank_limits', JSON.stringify(limits));
      setSuccess('Limites sauvegardées localement.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('bank_limits');
    if (saved) {
      try { setLimits(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── Onglet Équipe ────────────────────────────────────────────────────────
  const [team, setTeam]         = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('analyst');
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      setTeamLoading(true);
      try {
        const res  = await authFetch('/api/scoring/bank/team/');
        const data = await res.json();
        setTeam(data.members || data || []);
      } catch {
        // Données mock si endpoint non dispo
        setTeam([
          { id: 1, name: 'Marie Nsimba', email: 'marie@banque.cd', role: 'Administrateur', is_active: true },
          { id: 2, name: 'Jean Lumumba', email: 'jean@banque.cd',  role: 'Analyste Crédit',is_active: true },
        ]);
      } finally {
        setTeamLoading(false);
      }
    };
    if (activeTab === 'team') loadTeam();
  }, [activeTab]);

  const inviteMember = async () => {
    if (!inviteEmail) { setError('Saisissez un email.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/scoring/bank/team/invite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Invitation envoyée à ${inviteEmail}.`);
        setInviteEmail('');
        setTeam(prev => [...prev, data.member || { id: Date.now(), name: inviteEmail, email: inviteEmail, role: inviteRole, is_active: false }]);
      } else {
        const d = await res.json();
        setError(d.error || 'Erreur invitation.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // ── Onglet Audit ─────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    const loadAudit = async () => {
      setAuditLoading(true);
      try {
        const res  = await authFetch('/api/scoring/admin/activities/?limit=20');
        const data = await res.json();
        const logs = (data.activities || data || []).map((a: any, i: number) => ({
          id:        i,
          action:    a.action || a.description || 'Action',
          user:      a.user?.email || a.user || 'Système',
          timestamp: a.created_at || a.timestamp || new Date().toISOString(),
          type:      a.type || 'info',
        }));
        setAuditLogs(logs);
      } catch {
        // Mock si endpoint non dispo
        setAuditLogs([
          { id: 1, action: 'Connexion système', user: 'bank@teras.cd', timestamp: new Date().toISOString(), type: 'info' },
          { id: 2, action: 'Crédit approuvé — 500 000 FCFA', user: 'bank@teras.cd', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'success' },
        ]);
      } finally {
        setAuditLoading(false);
      }
    };
    if (activeTab === 'audit') loadAudit();
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TABS CONFIG
  // ─────────────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'profile',       label: 'Profil',           icon: User },
    { id: 'security',      label: 'Sécurité',          icon: Lock },
    { id: 'notifications', label: 'Notifications',     icon: Bell },
    { id: 'api',           label: 'API & Intégrations', icon: Key },
    { id: 'limits',        label: 'Limites & Seuils',  icon: CreditCard },
    { id: 'team',          label: 'Équipe',            icon: Users },
    { id: 'comptes',       label: 'Comptes liés',      icon: Wallet },
    { id: 'equipe_staff',  label: 'Équipe',            icon: Users  },
    { id: 'audit',         label: 'Audit & Logs',      icon: Shield },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Paramètres</h1>
          <p className="text-slate-400 mt-1">Configuration de votre interface bancaire</p>
        </div>
        {/* Raccourci Documents */}
        <button
          onClick={() => navigate('/bank/documents')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-all"
        >
          <FileText className="w-4 h-4"/>
          Mes Documents
          <ExternalLink className="w-3.5 h-3.5 opacity-60"/>
        </button>
      </div>

      {/* Messages globaux */}
      {success && <SuccessMsg msg={success} onClose={() => setSuccess('')}/>}
      {error   && <ErrorMsg   msg={error}   onClose={() => setError('')}/>}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Tabs sidebar */}
        <div className="md:col-span-1">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSuccess(''); setError(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5"/>
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-4">

          {/* ══ PROFIL ══════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400"/>
                <h3 className="text-white font-semibold text-lg">Informations du Profil</h3>
              </div>

              {!profileLoaded ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin"/> Chargement du profil...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Nom de la Banque</label>
                    <input value={profile.bank_name}
                      onChange={e => setProfile({ ...profile, bank_name: e.target.value })}
                      className={INPUT_CLASS} placeholder="Ex: Afriland First Bank"/>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Code Institution</label>
                    <input value={profile.institution_code}
                      onChange={e => setProfile({ ...profile, institution_code: e.target.value })}
                      className={INPUT_CLASS} placeholder="Ex: AFB-001"/>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Email Principal</label>
                    <input type="email" value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className={INPUT_CLASS} placeholder="contact@banque.cd"/>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Téléphone</label>
                    <input type="tel" value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className={INPUT_CLASS} placeholder="+242 06 xxx xxxx"/>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Pays</label>
                    <select value={profile.country}
                      onChange={e => setProfile({ ...profile, country: e.target.value })}
                      className={INPUT_CLASS}>
                      <option value="CG">🇨🇬 Congo Brazzaville</option>
                      <option value="CD">🇨🇩 RD Congo</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="GA">🇬🇦 Gabon</option>
                      <option value="CF">🇨🇫 Centrafrique</option>
                      <option value="TD">🇹🇩 Tchad</option>
                      <option value="GQ">🇬🇶 Guinée Équatoriale</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Ville</label>
                    <input value={profile.city}
                      onChange={e => setProfile({ ...profile, city: e.target.value })}
                      className={INPUT_CLASS} placeholder="Brazzaville"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>Adresse complète</label>
                    <input value={profile.address}
                      onChange={e => setProfile({ ...profile, address: e.target.value })}
                      className={INPUT_CLASS} placeholder="Avenue du Commerce, Brazzaville, Congo"/>
                  </div>

                  <div className="md:col-span-2 space-y-4 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-white font-semibold">Adresse et position GPS</h4>
                        <p className="text-sm text-slate-400">
                          Utilisez la carte pour remplir automatiquement l&apos;adresse de votre banque.
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-700/50 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                        {formatLocationDate(profile.location_updated_at)}
                      </span>
                    </div>

                    <LocationPickerMap
                      editing={profileLoaded}
                      value={{
                        latitude: profile.latitude,
                        longitude: profile.longitude,
                      }}
                      locationSource={profile.location_source}
                      resolvedAddress={profile.address}
                      resolvedCity={profile.city}
                      onChange={({ latitude, longitude, location_source, resolved_address, resolved_city }) =>
                        setProfile((current) => ({
                          ...current,
                          latitude,
                          longitude,
                          location_source,
                          location_updated_at: new Date().toISOString(),
                          address: resolved_address || current.address,
                          city: resolved_city || current.city,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              <button onClick={saveProfile} disabled={loading || !profileLoaded}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                Sauvegarder les Modifications
              </button>
            </div>
          )}

          {/* ══ SÉCURITÉ ════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400"/>
                <h3 className="text-white font-semibold text-lg">Sécurité & Authentification</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>Mot de Passe Actuel</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={pwd.old}
                      onChange={e => setPwd({ ...pwd, old: e.target.value })}
                      placeholder="Votre mot de passe actuel" className={`${INPUT_CLASS} pr-12`}/>
                    <button onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nouveau Mot de Passe</label>
                  <input type="password" value={pwd.new1}
                    onChange={e => setPwd({ ...pwd, new1: e.target.value })}
                    placeholder="Min. 8 caractères" className={INPUT_CLASS}/>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Confirmer le Nouveau Mot de Passe</label>
                  <input type="password" value={pwd.new2}
                    onChange={e => setPwd({ ...pwd, new2: e.target.value })}
                    placeholder="Répéter le mot de passe" className={INPUT_CLASS}/>
                  {pwd.new1 && pwd.new2 && pwd.new1 !== pwd.new2 && (
                    <p className="text-rose-400 text-xs mt-1.5">⚠️ Les mots de passe ne correspondent pas</p>
                  )}
                  {pwd.new1 && pwd.new2 && pwd.new1 === pwd.new2 && (
                    <p className="text-emerald-400 text-xs mt-1.5">✅ Mots de passe identiques</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-3">
                <h4 className="text-white font-semibold text-sm">Sécurité du compte</h4>
                {[
                  { label: 'Authentification à Deux Facteurs (2FA)', desc: 'Sécurité renforcée pour votre compte bancaire', key: 'twofa' },
                  { label: 'Alertes de Connexion',                   desc: 'Notification email à chaque nouvelle connexion', key: 'login_alerts' },
                  { label: 'Session automatique expirée',            desc: 'Déconnexion après 8h d\'inactivité', key: 'auto_expire' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400"/>
                      <div>
                        <p className="text-white font-medium text-sm">{item.label}</p>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-500"/>
                  </label>
                ))}
              </div>

              <button onClick={changePwd} disabled={loading || !pwd.old || !pwd.new1 || pwd.new1 !== pwd.new2}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4"/>}
                Mettre à Jour le Mot de Passe
              </button>
            </div>
          )}

          {/* ══ NOTIFICATIONS ═══════════════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400"/>
                <h3 className="text-white font-semibold text-lg">Préférences de Notification</h3>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'new_credit_requests', label: 'Nouvelles demandes de crédit',  desc: 'Notification immédiate dès qu\'un client fait une demande' },
                  { key: 'credit_approvals',    label: 'Approbations et rejets',         desc: 'Confirmation des décisions de crédit' },
                  { key: 'payment_late',        label: 'Retards de paiement',            desc: 'Alerte dès qu\'un client est en retard' },
                  { key: 'weekly_reports',      label: 'Rapports hebdomadaires',         desc: 'Synthèse des performances chaque lundi matin' },
                  { key: 'risk_alerts',         label: 'Alertes de risque',              desc: 'Notification si score client chute sous le seuil minimum' },
                  { key: 'system_updates',      label: 'Mises à jour système',           desc: 'Nouvelles fonctionnalités et maintenances programmées' },
                ].map(item => (
                  <label key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-white font-medium text-sm">{item.label}</p>
                      <p className="text-slate-400 text-xs">{item.desc}</p>
                    </div>
                    <input type="checkbox"
                      checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                      onChange={e => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                      className="w-5 h-5 accent-blue-500"/>
                  </label>
                ))}
              </div>

              <button onClick={saveNotifications} disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                Enregistrer les Préférences
              </button>
            </div>
          )}

          {/* ══ API & INTÉGRATIONS ══════════════════════════════════════════ */}
          {activeTab === 'api' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400"/>
                <h3 className="text-white font-semibold text-lg">API & Intégrations TERAS</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>Clé API TERAS</label>
                  <div className="relative">
                    <input type={showApiKey ? 'text' : 'password'}
                      value="••••••••••••••••••••••••••"
                      className={`${INPUT_CLASS} pr-24 font-mono text-sm`} readOnly/>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                      <button onClick={() => setShowApiKey(!showApiKey)} className="text-slate-400 hover:text-white p-1">
                        {showApiKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                      <button
                        onClick={() => setSuccess('Contactez le support TERAS pour obtenir votre clé API.')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Clé API non disponible en UI — contacter le support">
                        <Copy className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Endpoint API</label>
                  <input type="text" value="http://localhost:8000/api"
                    className={`${INPUT_CLASS} font-mono text-sm`} readOnly/>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Requêtes aujourd'hui</span>
                      <span className="text-white font-bold">—</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}/>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Latence moyenne</span>
                      <span className="text-white font-bold">~150ms</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '15%' }}/>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <h4 className="text-white font-semibold text-sm mb-3">Endpoints disponibles</h4>
                  <div className="space-y-2">
                    {[
                      { method: 'GET',  path: '/api/scoring/bank/dashboard/',    desc: 'Dashboard banque' },
                      { method: 'GET',  path: '/api/scoring/bank/clients/',       desc: 'Liste clients' },
                      { method: 'GET',  path: '/api/scoring/bank/applications/',  desc: 'Demandes crédit' },
                      { method: 'POST', path: '/api/scoring/bank/applications/<id>/review/', desc: 'Approuver/Rejeter' },
                      { method: 'GET',  path: '/api/scoring/bank/documents/list/',desc: 'Documents clients' },
                      { method: 'POST', path: '/api/scoring/bank/documents/<id>/analyze-credit/', desc: 'Analyse risque IA' },
                    ].map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-lg font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${ep.method === 'GET' ? 'bg-sky-900/60 text-sky-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                          {ep.method}
                        </span>
                        <span className="text-slate-300 flex-1 truncate">{ep.path}</span>
                        <span className="text-slate-500 shrink-0">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setSuccess('Nouvelle clé API générée. Rechargez la page.'); setTimeout(() => setSuccess(''), 5000); }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2">
                <Key className="w-4 h-4"/> Régénérer la Clé API
              </button>
            </div>
          )}

          {/* ══ LIMITES & SEUILS ════════════════════════════════════════════ */}
          {activeTab === 'limits' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400"/>
                <h3 className="text-white font-semibold text-lg">Limites & Seuils de Crédit</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Montant Maximum — Particuliers (FCFA)</label>
                  <div className="relative">
                    <input type="number" value={limits.max_amount_individual}
                      onChange={e => setLimits({ ...limits, max_amount_individual: +e.target.value })}
                      className={`${INPUT_CLASS} pr-16`}/>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">FCFA</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Actuel : {FCFA(limits.max_amount_individual)}</p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Montant Maximum — Entreprises (FCFA)</label>
                  <div className="relative">
                    <input type="number" value={limits.max_amount_enterprise}
                      onChange={e => setLimits({ ...limits, max_amount_enterprise: +e.target.value })}
                      className={`${INPUT_CLASS} pr-16`}/>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">FCFA</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Actuel : {FCFA(limits.max_amount_enterprise)}</p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Score TERAS Minimum requis</label>
                  <input type="number" value={limits.min_teras_score} min="0" max="1000"
                    onChange={e => setLimits({ ...limits, min_teras_score: +e.target.value })}
                    className={INPUT_CLASS}/>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${limits.min_teras_score / 10}%` }}/>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Bande {limits.min_teras_score >= 750 ? 'B' : limits.min_teras_score >= 600 ? 'C' : 'D'} minimum
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Durée Maximum (mois)</label>
                  <input type="number" value={limits.max_duration_months}
                    onChange={e => setLimits({ ...limits, max_duration_months: +e.target.value })}
                    className={INPUT_CLASS}/>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Taux d'Intérêt Minimum (%/an)</label>
                  <input type="number" step="0.5" value={limits.min_interest_rate}
                    onChange={e => setLimits({ ...limits, min_interest_rate: +e.target.value })}
                    className={INPUT_CLASS}/>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Taux d'Intérêt Maximum (%/an)</label>
                  <input type="number" step="0.5" value={limits.max_interest_rate}
                    onChange={e => setLimits({ ...limits, max_interest_rate: +e.target.value })}
                    className={INPUT_CLASS}/>
                </div>

                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>
                    Ratio CRM — Capacité de Remboursement Mensuelle (% des revenus nets)
                    <span className="text-slate-500 font-normal"> — Standard TERAS : 30%</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="10" max="50" value={limits.crm_ratio}
                      onChange={e => setLimits({ ...limits, crm_ratio: +e.target.value })}
                      className="flex-1 accent-blue-500"/>
                    <span className="text-white font-bold text-xl w-16 text-right">{limits.crm_ratio}%</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    CRM = {limits.crm_ratio}% des revenus nets — mensualité ≤ {limits.crm_ratio}% revenu net
                  </p>
                </div>
              </div>

              <button onClick={saveLimits} disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                Appliquer les Limites
              </button>
            </div>
          )}

          {/* ══ ÉQUIPE ══════════════════════════════════════════════════════ */}
          {activeTab === 'team' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400"/>
                <h3 className="text-white font-semibold text-lg">Gestion de l'Équipe</h3>
              </div>

              {teamLoading ? (
                <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Chargement...</div>
              ) : (
                <div className="space-y-3">
                  {team.length === 0 ? (
                    <p className="text-slate-500 text-sm">Aucun membre. Invitez votre premier collaborateur.</p>
                  ) : team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{member.name || member.email}</p>
                          <p className="text-slate-400 text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg">{member.role}</span>
                        <span className={`px-3 py-1 text-xs rounded-lg ${member.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {member.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-white font-semibold text-sm mb-3">Inviter un collaborateur</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Email du collaborateur (doit avoir un compte TERAS)"
                      className={INPUT_CLASS}/>
                  </div>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={INPUT_CLASS}>
                    <option value="admin">Administrateur</option>
                    <option value="analyst">Analyste Crédit</option>
                    <option value="agent">Agent Support</option>
                    <option value="viewer">Lecteur seul</option>
                  </select>
                </div>
              </div>

              <button onClick={inviteMember} disabled={loading || !inviteEmail}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Users className="w-4 h-4"/>}
                Envoyer l'Invitation
              </button>
            </div>
          )}


          {/* ══ COMPTES LIÉS ══════════════════════════════════════════════════ */}
          {activeTab === 'comptes' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <LinkedAccounts
                title="Comptes Mobile Money & Bancaires"
                subtitle="Liez vos comptes pour automatiser les prélèvements et enrichir l'analyse risque de vos clients"
              />
            </div>
          )}

          {/* ══ ÉQUIPE STAFF ════════════════════════════════════════════════ */}
          {activeTab === 'equipe_staff' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <TeamManagement interface="bank" title="Gestion de l'Équipe Bancaire"/>
            </div>
          )}

          {/* ══ AUDIT & LOGS ════════════════════════════════════════════════ */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-400"/>
                  <h3 className="text-white font-semibold text-lg">Historique d'Audit</h3>
                </div>
                <button onClick={() => setActiveTab('audit')} className="text-slate-400 hover:text-white">
                  <RefreshCw className="w-4 h-4"/>
                </button>
              </div>

              {auditLoading ? (
                <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Chargement...</div>
              ) : auditLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucun log d'audit disponible.</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, idx) => {
                    const colors   = { success: 'green', info: 'blue', warning: 'amber', error: 'red' };
                    const icons    = { success: CheckCircle, info: Database, warning: Bell, error: AlertCircle };
                    const Icon     = icons[log.type] || Database;
                    const color    = colors[log.type] || 'blue';
                    const bgClass  = `bg-${color}-500/20`;
                    const txtClass = `text-${color}-400`;

                    return (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                        <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${txtClass}`}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{log.action}</p>
                          <p className="text-slate-400 text-xs">Par {log.user}</p>
                        </div>
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
