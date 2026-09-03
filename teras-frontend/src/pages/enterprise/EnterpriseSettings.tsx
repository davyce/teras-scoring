import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import LinkedAccounts from '../../components/shared/LinkedAccounts';
import TeamManagement from '../../components/shared/TeamManagement';
import {
  Settings, Users, Bell, Shield, Save, CheckCircle,
  AlertCircle, X, Crown, BarChart3, Eye, Wallet,
} from 'lucide-react';

const ROLES = {
  admin:   { label: 'Admin',   desc: 'Accès complet',                     color: 'text-purple-400', icon: Crown    },
  manager: { label: 'Manager', desc: 'Gestion employés et rapports',       color: 'text-blue-400',   icon: Users    },
  analyst: { label: 'Analyst', desc: 'Consultation données et rapports',   color: 'text-emerald-400',icon: BarChart3},
  viewer:  { label: 'Viewer',  desc: 'Consultation uniquement',            color: 'text-slate-400',  icon: Eye      },
};

const TABS = [
  { id: 'profile',  label: 'Profil',          icon: Settings },
  { id: 'comptes',  label: 'Comptes liés',     icon: Wallet   },
  { id: 'equipe',   label: 'Équipe',           icon: Users    },
  { id: 'roles',    label: 'Rôles',            icon: Shield   },
  { id: 'notifs',   label: 'Notifications',    icon: Bell     },
];

export default function EnterpriseSettings() {
  const [tab, setTab]         = useState('profile');
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    authFetch('/api/auth/me/').then(r => r.json()).then(d => {
      setProfile(d);
      setLoading(false);
    }).catch(() => {
      setError('Impossible de charger le profil. Vérifiez votre connexion.');
      setLoading(false);
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/auth/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSuccess('Profil mis à jour avec succès.');
        setTimeout(() => setSuccess(''), 4000);
      } else setError('Erreur lors de la mise à jour.');
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Configuration de votre interface entreprise</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400"/><p className="text-emerald-300 text-sm">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-400"/><p className="text-rose-300 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-rose-500"/></button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="md:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-2">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    tab === t.id
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}>
                  <Icon className="w-5 h-5"/>
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-4">

          {/* ── PROFIL ── */}
          {tab === 'profile' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-400"/> Profil Entreprise
              </h3>
              {loading ? (
                <p className="text-slate-400">Chargement...</p>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'company_name', label: 'Nom de l\'entreprise' },
                      { key: 'email',        label: 'Email'                },
                      { key: 'first_name',   label: 'Prénom responsable'   },
                      { key: 'last_name',    label: 'Nom responsable'      },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-slate-300 text-sm mb-1.5 block">{f.label}</label>
                        <input value={profile[f.key] || ''}
                          onChange={e => setProfile({...profile, [f.key]: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500"/>
                      </div>
                    ))}
                  </div>
                  <button onClick={saveProfile} disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition">
                    <Save className="w-4 h-4"/>
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── COMPTES LIÉS ── */}
          {tab === 'comptes' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <LinkedAccounts
                title="Comptes Mobile Money & Bancaires"
                subtitle="Liez vos comptes pour automatiser les paiements et enrichir votre score TERAS entreprise"/>
            </div>
          )}

          {/* ── ÉQUIPE ── */}
          {tab === 'equipe' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <TeamManagement interface="enterprise" title="Gestion de l'Équipe"/>
            </div>
          )}

          {/* ── RÔLES ── */}
          {tab === 'roles' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold text-lg">Rôles et permissions</h3>
              {Object.entries(ROLES).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="p-4 bg-slate-800/30 rounded-xl flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${cfg.color} shrink-0 mt-0.5`}/>
                    <div>
                      <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{cfg.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifs' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-3">
              <h3 className="text-white font-semibold text-lg">Préférences de notification</h3>
              {[
                'Nouvelles demandes de crédit',
                'Rapports générés',
                'Alertes de risque',
                'Mises à jour équipe',
              ].map(n => (
                <label key={n} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition">
                  <span className="text-white text-sm">{n}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-violet-500"/>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
