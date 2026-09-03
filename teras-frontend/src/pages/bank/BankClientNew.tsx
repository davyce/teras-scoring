import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase,
  DollarSign, CheckCircle, AlertCircle, RefreshCw,
  CreditCard, Copy, Shield, Eye, EyeOff,
} from 'lucide-react';

// ── Villes Congo Brazzaville ──────────────────────────────────────────────────
const VILLES_CG = [
  'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso',
  'Owando', 'Impfondo', 'Madingou', 'Sibiti', 'Kinkala', 'Djambala',
  'Mossaka', 'Ewo', 'Makoua', 'Boundji', 'Autre',
];

// ── Professions courantes Congo ───────────────────────────────────────────────
const PROFESSIONS = [
  'Fonctionnaire / Agent de l\'État',
  'Employé secteur privé',
  'Commerçant(e)',
  'Vendeur(se) au marché',
  'Chauffeur / Transport',
  'Agriculteur / Éleveur',
  'Artisan / Menuisier / Soudeur',
  'Enseignant(e)',
  'Infirmier(e) / Aide-soignant(e)',
  'Médecin / Professionnel santé',
  'Agent immobilier',
  'Entrepreneur / Chef d\'entreprise',
  'Pêcheur',
  'Sans emploi',
  'Autre',
];

interface FormData {
  first_name:     string;
  last_name:      string;
  date_of_birth:  string;
  niu:            string;
  email:          string;
  phone:          string;
  address:        string;
  city:           string;
  country:        string;
  occupation:     string;
  monthly_income: string;
}

const EMPTY: FormData = {
  first_name:     '',
  last_name:      '',
  date_of_birth:  '',
  niu:            '',
  email:          '',
  phone:          '+242 ',
  address:        '',
  city:           'Brazzaville',
  country:        'CG',
  occupation:     '',
  monthly_income: '',
};

export default function BankClientNew() {
  const navigate = useNavigate();
  const [form, setForm]     = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [showPass, setShowPass] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.first_name.trim())    errs.first_name    = 'Prénom requis';
    if (!form.last_name.trim())     errs.last_name     = 'Nom requis';
    if (!form.date_of_birth)        errs.date_of_birth = 'Date de naissance requise';
    if (!form.niu.trim())           errs.niu           = 'NIU requis';
    if (!form.email.includes('@'))  errs.email         = 'Email invalide';
    if (form.phone.length < 8)      errs.phone         = 'Téléphone invalide';
    if (!form.address.trim())       errs.address       = 'Adresse requise';
    if (!form.city)                 errs.city          = 'Ville requise';
    if (!form.occupation)           errs.occupation    = 'Profession requise';
    if (!form.monthly_income || isNaN(Number(form.monthly_income)))
                                    errs.monthly_income = 'Revenu invalide';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/scoring/bank/clients/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        // Afficher les erreurs de validation Django
        const msgs: Partial<FormData> = {};
        Object.entries(data).forEach(([k, v]) => {
          msgs[k as keyof FormData] = Array.isArray(v) ? (v as string[]).join(', ') : String(v);
        });
        setErrors(msgs);
        return;
      }
      setCreated(data);
    } catch (e: any) {
      setErrors({ email: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Succès — afficher les identifiants ──────────────────────────────────
  if (created) {
    const acct = created.teras_account || {};
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-2">Client créé avec succès !</h2>
          <p className="text-slate-400 text-sm">
            {created.first_name} {created.last_name} a été ajouté au portefeuille bancaire.
          </p>
        </div>

        {/* Score & CRM */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Score TERAS</p>
            <p className="text-white font-bold text-2xl">{created.teras_score ?? '—'}</p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">CRM (30% revenus)</p>
            <p className="text-sky-400 font-bold text-2xl">
              {created.crm_limit
                ? `${Number(created.crm_limit).toLocaleString('fr-FR')} FCFA`
                : '—'}
            </p>
          </div>
        </div>

        {/* Identifiants TERAS */}
        {acct.email && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Identifiants TERAS Générés Automatiquement</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Remettez ces identifiants au client. Il pourra les modifier après sa première connexion.
            </p>
            <div className="space-y-3">
              <CredentialRow label="Email de connexion" value={acct.email} />
              <CredentialRow label="Mot de passe initial" value={acct.password} secret showPass={showPass} onToggle={() => setShowPass(p => !p)} />
            </div>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Le client doit changer son mot de passe dès la première connexion sur l'application TERAS.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/bank/clients/${created.id}`)}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            Voir la fiche client
          </button>
          <button
            onClick={() => { setForm(EMPTY); setCreated(null); setErrors({}); }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            Créer un autre client
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/bank/clients')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouveau Client</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Créer un profil client particulier — Congo Brazzaville
          </p>
        </div>
      </div>

      {/* ── Informations personnelles ──────────────────────────────────── */}
      <Section icon={<User className="w-5 h-5 text-blue-400" />} title="Informations Personnelles">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Prénom *" error={errors.first_name}>
            <input value={form.first_name} onChange={set('first_name')}
              placeholder="Prénom du client"
              className={Input(errors.first_name)} />
          </Field>
          <Field label="Nom *" error={errors.last_name}>
            <input value={form.last_name} onChange={set('last_name')}
              placeholder="Nom de famille"
              className={Input(errors.last_name)} />
          </Field>
          <Field label="Date de naissance *" error={errors.date_of_birth}>
            <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
              className={Input(errors.date_of_birth)} />
          </Field>
          <Field
            label="NIU — Numéro d'Identification Universel *"
            error={errors.niu}
            hint="Document officiel délivré par l'État congolais"
          >
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.niu} onChange={set('niu')}
                placeholder="Ex : CG-NIU-1990-00123"
                className={`pl-10 ${Input(errors.niu)}`} />
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Informations de contact ────────────────────────────────────── */}
      <Section icon={<Phone className="w-5 h-5 text-green-400" />} title="Informations de Contact">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Email *" error={errors.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="email@exemple.cg"
                className={`pl-10 ${Input(errors.email)}`} />
            </div>
          </Field>
          <Field label="Téléphone *" error={errors.phone} hint="Format : +242 06 XXX XXXX">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+242 06 000 0000"
                className={`pl-10 ${Input(errors.phone)}`} />
            </div>
          </Field>
          <Field label="Adresse *" error={errors.address} className="md:col-span-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.address} onChange={set('address')}
                placeholder="Quartier, avenue, numéro… ex: Av. de l'Indépendance, Bacongo"
                className={`pl-10 ${Input(errors.address)}`} />
            </div>
          </Field>
          <Field label="Ville *" error={errors.city}>
            <select value={form.city} onChange={set('city')} className={Input(errors.city)}>
              {VILLES_CG.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Pays">
            <select value={form.country} onChange={set('country')} className={Input()}>
              <option value="CG">Congo Brazzaville (CG)</option>
              <option value="CD">RD Congo (CD)</option>
              <option value="CM">Cameroun (CM)</option>
              <option value="GA">Gabon (GA)</option>
              <option value="CF">Centrafrique (CF)</option>
              <option value="TD">Tchad (TD)</option>
              <option value="GQ">Guinée Équatoriale (GQ)</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Informations professionnelles ──────────────────────────────── */}
      <Section icon={<Briefcase className="w-5 h-5 text-purple-400" />} title="Informations Professionnelles">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Profession *" error={errors.occupation}>
            <select value={form.occupation} onChange={set('occupation')} className={Input(errors.occupation)}>
              <option value="">Sélectionner une profession</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field
            label="Revenu mensuel net (FCFA) *"
            error={errors.monthly_income}
            hint="Salaire net, CA mensuel, ou revenus informels estimés"
          >
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="number" value={form.monthly_income} onChange={set('monthly_income')}
                placeholder="Ex : 250000"
                min="0" step="5000"
                className={`pl-10 ${Input(errors.monthly_income)}`} />
            </div>
            {form.monthly_income && !isNaN(Number(form.monthly_income)) && (
              <div className="mt-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs">
                <span className="text-slate-400">CRM (30% = capacité de remboursement) : </span>
                <span className="text-sky-400 font-bold">
                  {Math.round(Number(form.monthly_income) * 0.30).toLocaleString('fr-FR')} FCFA/mois
                </span>
              </div>
            )}
          </Field>
        </div>
      </Section>

      {/* Note compte TERAS */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium text-sm">Création automatique d'un compte TERAS</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Un compte utilisateur TERAS sera généré automatiquement avec un email et un mot de passe
            basés sur le NIU. Les identifiants seront affichés après la création pour être remis au client.
          </p>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-4 pt-2">
        <button onClick={() => navigate('/bank/clients')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
          {saving
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Création en cours…</>
            : <><CheckCircle className="w-4 h-4" /> Créer le client &amp; générer le compte TERAS</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, error, hint, children, className = '' }: {
  label: string; error?: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-slate-300 text-xs font-medium mb-1.5 block">{label}</label>
      {children}
      {hint && !error && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function Input(error?: string): string {
  return `w-full px-3 py-2.5 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-colors ${
    error ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700/50 hover:border-slate-600/50'
  }`;
}

function CredentialRow({ label, value, secret = false, showPass, onToggle }: {
  label: string; value: string; secret?: boolean; showPass?: boolean; onToggle?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-white font-mono text-sm truncate">
          {secret && !showPass ? '••••••••••••' : value}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {secret && (
          <button onClick={onToggle} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button onClick={copy} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}