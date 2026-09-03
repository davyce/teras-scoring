/**
 * EnterpriseProfile.tsx — Profil Entreprise
 * 100% API réelle · zéro mock · authFetch statique
 */

import React, { useState, useEffect } from 'react';
import {
  Building2, Mail, Phone, MapPin, Globe,
  Briefcase, Edit3, Save, X, Loader2, CheckCircle,
  AlertCircle
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import LocationPickerMap from '../../components/shared/LocationPickerMap';

interface ProfileData {
  company_name: string;
  legal_form: string;
  tax_id: string;
  rccm: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  location_source: string;
  location_updated_at: string | null;
  website: string;
  sector: string;
  employees_count: number;
  description: string;
  teras_score: number;
  kyc_status: string;
}

const LEGAL_FORMS = ['SARL', 'SA', 'SNC', 'SASU', 'EI', 'SCS', 'Autre'];
const SECTORS = [
  'Commerce & Distribution', 'Agriculture', 'Transport & Logistique',
  'BTP & Immobilier', 'Services & Conseil', 'Industrie & Manufacture',
  'Santé', 'Éducation', 'Technologie', 'Autre',
];

const BANDS: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  B: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  C: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  E: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const getBand = (s: number) =>
  s >= 900 ? 'A' : s >= 750 ? 'B' : s >= 600 ? 'C' : s >= 400 ? 'D' : 'E';

const formatLocationDate = (value?: string | null) => {
  if (!value) return 'Position non encore enregistrée';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Position enregistrée';

  return `Dernière mise à jour : ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};

const EnterpriseProfile: React.FC = () => {
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [form,    setForm]      = useState<Partial<ProfileData>>({});

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/scoring/enterprise/profile/');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setProfile(data);
      setForm(data);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/scoring/enterprise/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated = await res.json();
      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Échec de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
    </div>
  );

  /* ── Error ── */
  if (error && !profile) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <p className="text-white font-semibold">Impossible de charger le profil</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={fetchProfile}
          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all">
          Réessayer
        </button>
      </div>
    </div>
  );

  if (!profile) return null;

  const band  = getBand(profile.teras_score);
  const pct   = (profile.teras_score / 1000) * 100;
  const R     = 40;
  const circ  = 2 * Math.PI * R;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
              TERAS Entreprise
            </p>
            <h1 className="text-3xl font-black text-white">Profil entreprise</h1>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Sauvegardé
              </span>
            )}
            {error && (
              <span className="text-rose-400 text-xs">{error}</span>
            )}

            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setForm(profile); setError(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-all">
                  <X className="w-4 h-4" /> Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
                    : <><Save className="w-4 h-4" /> Sauvegarder</>}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all">
                <Edit3 className="w-4 h-4" /> Modifier
              </button>
            )}
          </div>
        </div>

        {/* ── Hero card ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start gap-6 flex-wrap">

            {/* Logo entreprise */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-10 h-10 text-white" />
            </div>

            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-2xl font-black text-white">
                  {profile.company_name || '—'}
                </h2>
                <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${
                  profile.kyc_status === 'approved'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : profile.kyc_status === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  KYC {profile.kyc_status === 'approved' ? '✓ Vérifié'
                     : profile.kyc_status === 'pending'  ? '⏳ En attente'
                     : '✗ Refusé'}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {profile.legal_form || '—'} · {profile.sector || '—'}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {profile.city || '—'}, {profile.country || '—'}
              </p>
            </div>

            {/* Jauge score */}
            <div className="text-center shrink-0">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="48" cy="48" r={R} fill="none" stroke="#06b6d4" strokeWidth="8"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct / 100)}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{profile.teras_score}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${BANDS[band]}`}>
                    {band}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Score TERAS</p>
            </div>

          </div>
        </div>

        {/* ── Grille infos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Infos légales */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" /> Informations légales
            </h3>

            {/* Raison sociale */}
            <Row label="Raison sociale" editing={editing}>
              {editing
                ? <Input value={form.company_name || ''} onChange={v => set('company_name', v)} />
                : <Val>{profile.company_name}</Val>}
            </Row>

            {/* Forme juridique */}
            <Row label="Forme juridique" editing={editing}>
              {editing
                ? <Select value={form.legal_form || ''} onChange={v => set('legal_form', v)} options={LEGAL_FORMS} />
                : <Val>{profile.legal_form}</Val>}
            </Row>

            {/* NIF */}
            <Row label="N° Fiscal / NIF" editing={editing}>
              {editing
                ? <Input value={form.tax_id || ''} onChange={v => set('tax_id', v)} />
                : <Val>{profile.tax_id}</Val>}
            </Row>

            {/* RCCM */}
            <Row label="RCCM" editing={editing}>
              {editing
                ? <Input value={form.rccm || ''} onChange={v => set('rccm', v)} />
                : <Val>{profile.rccm}</Val>}
            </Row>

            {/* Effectif */}
            <Row label="Effectif" editing={editing}>
              {editing
                ? <Input type="number" value={String(form.employees_count ?? '')} onChange={v => set('employees_count', Number(v))} />
                : <Val>{profile.employees_count} employé(s)</Val>}
            </Row>

            {/* Secteur */}
            <Row label="Secteur d'activité" editing={editing}>
              {editing
                ? <Select value={form.sector || ''} onChange={v => set('sector', v)} options={SECTORS} />
                : <Val>{profile.sector}</Val>}
            </Row>
          </div>

          {/* Coordonnées */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" /> Coordonnées
            </h3>

            <Row label="Email" editing={editing} icon={<Mail className="w-3 h-3" />}>
              {editing
                ? <Input type="email" value={form.email || ''} onChange={v => set('email', v)} />
                : <Val>{profile.email}</Val>}
            </Row>

            <Row label="Téléphone" editing={editing} icon={<Phone className="w-3 h-3" />}>
              {editing
                ? <Input value={form.phone || ''} onChange={v => set('phone', v)} />
                : <Val>{profile.phone}</Val>}
            </Row>

            <Row label="Adresse" editing={editing} icon={<MapPin className="w-3 h-3" />}>
              {editing
                ? <Input value={form.address || ''} onChange={v => set('address', v)} />
                : <Val>{profile.address}</Val>}
            </Row>

            <Row label="Ville" editing={editing} icon={<MapPin className="w-3 h-3" />}>
              {editing
                ? <Input value={form.city || ''} onChange={v => set('city', v)} />
                : <Val>{profile.city}</Val>}
            </Row>

            <Row label="Pays" editing={editing} icon={<Globe className="w-3 h-3" />}>
              {editing
                ? <Input value={form.country || ''} onChange={v => set('country', v)} />
                : <Val>{profile.country}</Val>}
            </Row>

            <Row label="Site web" editing={editing} icon={<Globe className="w-3 h-3" />}>
              {editing
                ? <Input value={form.website || ''} onChange={v => set('website', v)} />
                : <Val>{profile.website}</Val>}
            </Row>

            <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Adresse et position GPS</p>
                  <p className="text-xs text-slate-400">
                    Localisez votre entreprise pour remplir automatiquement la ville et l&apos;adresse.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700/50 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                  {formatLocationDate(form.location_updated_at ?? profile.location_updated_at)}
                </span>
              </div>

              <LocationPickerMap
                editing={editing}
                value={{
                  latitude: form.latitude ?? profile.latitude ?? null,
                  longitude: form.longitude ?? profile.longitude ?? null,
                }}
                locationSource={form.location_source || profile.location_source}
                resolvedAddress={form.address || profile.address}
                resolvedCity={form.city || profile.city}
                onChange={({ latitude, longitude, location_source, resolved_address, resolved_city }) =>
                  setForm((current) => ({
                    ...current,
                    latitude,
                    longitude,
                    location_source,
                    location_updated_at: new Date().toISOString(),
                    address: resolved_address || current.address || profile.address,
                    city: resolved_city || current.city || profile.city,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" /> Description de l'activité
          </h3>
          {editing
            ? <textarea
                value={form.description || ''}
                onChange={e => set('description', e.target.value)}
                rows={4}
                placeholder="Décrivez l'activité de votre entreprise..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500 transition-all" />
            : <p className="text-sm text-slate-300 leading-relaxed">
                {profile.description || <span className="text-slate-500 italic">Aucune description renseignée.</span>}
              </p>
          }
        </div>

      </div>
    </div>
  );
};

/* ── Sous-composants légers ── */
const Row = ({
  label, editing, icon, children
}: {
  label: string; editing: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) => (
  <div>
    <label className="flex items-center gap-1 text-xs text-slate-500 mb-1">
      {icon}{label}
    </label>
    {children}
  </div>
);

const Val = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-white">{children || <span className="text-slate-500 italic">—</span>}</p>
);

const Input = ({
  value, onChange, type = 'text', placeholder
}: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
  />
);

const Select = ({
  value, onChange, options
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
  >
    <option value="">Sélectionner...</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default EnterpriseProfile;
