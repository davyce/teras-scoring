/**
 * EnterpriseNewClientModal.tsx
 * Modal de création d'un nouveau client pour l'interface Entreprise
 */

import { useState } from 'react';
import { X, User, Building2, Phone, Mail, MapPin, CreditCard, Loader2, CheckCircle } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: any) => void;
}

const CLIENT_TYPES = [
  { value: 'individual', label: 'Particulier', icon: User },
  { value: 'enterprise', label: 'Entreprise', icon: Building2 },
];

const SECTORS = [
  'Commerce & Distribution', 'Agriculture', 'Transport & Logistique',
  'BTP & Immobilier', 'Services & Conseil', 'Industrie & Manufacture',
  'Santé', 'Éducation', 'Technologie', 'Autre',
];

export default function EnterpriseNewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    type: 'individual',
    firstName: '', lastName: '', companyName: '',
    kyc_id: '', phone: '', email: '',
    address: '', city: '', country: 'CG',
    sector: '', monthlyIncome: '', notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (form.type === 'individual') {
      if (!form.firstName.trim()) e.firstName = 'Requis';
      if (!form.lastName.trim()) e.lastName = 'Requis';
    } else {
      if (!form.companyName.trim()) e.companyName = 'Requis';
    }
    if (!form.kyc_id.trim()) e.kyc_id = 'Requis';
    if (!form.phone.trim()) e.phone = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.city.trim()) e.city = 'Requis';
    if (!form.sector) e.sector = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: remplacer par authFetch réel
      // const res = await authFetch('/api/scoring/enterprise/clients/', {
      //   method: 'POST', body: JSON.stringify(form)
      // });
      await new Promise(r => setTimeout(r, 1500));
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.({ ...form, id: Date.now(), score: 0, status: 'pending' });
        handleClose();
      }, 1500);
    } catch {
      setErrors({ submit: 'Erreur lors de la création. Réessayez.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setSuccess(false); setLoading(false);
    setForm({ type:'individual', firstName:'', lastName:'', companyName:'',
      kyc_id:'', phone:'', email:'', address:'', city:'', country:'CG',
      sector:'', monthlyIncome:'', notes:'' });
    setErrors({});
    onClose();
  };

  const Field = ({ label, k, placeholder, type = 'text' }: any) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <input type={type} value={form[k as keyof typeof form]}
        onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder-slate-500
          focus:outline-none focus:ring-1 transition-all
          ${errors[k] ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'}`}
      />
      {errors[k] && <p className="text-xs text-rose-400 mt-1">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">TERAS Entreprise</p>
            <h2 className="text-lg font-black text-white mt-0.5">Nouveau client</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {['Identité', 'Localisation', 'Confirmation'].map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step > i+1 ? 'bg-emerald-500 text-white' : step === i+1 ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span className={`text-xs transition-colors ${step === i+1 ? 'text-cyan-400' : 'text-slate-500'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Success */}
          {success && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle className="w-16 h-16 text-emerald-400" />
              <p className="text-white font-semibold text-lg">Client créé avec succès !</p>
              <p className="text-slate-400 text-sm text-center">Le scoring TERAS sera calculé dans quelques instants.</p>
            </div>
          )}

          {/* Step 1 — Identité */}
          {!success && step === 1 && (
            <>
              {/* Type selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">Type de client</label>
                <div className="flex gap-3">
                  {CLIENT_TYPES.map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => set('type', value)}
                      className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                        ${form.type === value
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'individual' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" k="firstName" placeholder="Jean" />
                  <Field label="Nom" k="lastName" placeholder="Mokoko" />
                </div>
              ) : (
                <Field label="Raison sociale" k="companyName" placeholder="SARL Mokoko & Fils" />
              )}

              <Field label="KYC ID / Numéro de pièce" k="kyc_id" placeholder="CG-2024-0001" />
              <Field label="Téléphone" k="phone" placeholder="+242 06 000 0000" />
              <Field label="Email (optionnel)" k="email" placeholder="client@example.com" type="email" />
            </>
          )}

          {/* Step 2 — Localisation & Activité */}
          {!success && step === 2 && (
            <>
              <Field label="Adresse" k="address" placeholder="Avenue de l'Indépendance" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville" k="city" placeholder="Brazzaville" />
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Pays</label>
                  <select value={form.country} onChange={e => set('country', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500">
                    <option value="CG">Congo (CG)</option>
                    <option value="CD">RD Congo (CD)</option>
                    <option value="CM">Cameroun (CM)</option>
                    <option value="GA">Gabon (GA)</option>
                    <option value="CF">Centrafrique (CF)</option>
                    <option value="TD">Tchad (TD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Secteur d'activité</label>
                <select value={form.sector} onChange={e => set('sector', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-slate-800/60 border rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500
                    ${errors.sector ? 'border-rose-500' : 'border-slate-700'}`}>
                  <option value="">Sélectionner...</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.sector && <p className="text-xs text-rose-400 mt-1">{errors.sector}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Revenu mensuel estimé (FCFA)</label>
                <input type="number" value={form.monthlyIncome} onChange={e => set('monthlyIncome', e.target.value)}
                  placeholder="ex: 250000"
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Notes (optionnel)</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Informations complémentaires..." rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
            </>
          )}

          {/* Step 3 — Confirmation */}
          {!success && step === 3 && (
            <div className="space-y-3">
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Récapitulatif</p>
                {[
                  { icon: User, label: 'Identité', val: form.type === 'individual' ? `${form.firstName} ${form.lastName}` : form.companyName },
                  { icon: CreditCard, label: 'KYC ID', val: form.kyc_id },
                  { icon: Phone, label: 'Téléphone', val: form.phone },
                  { icon: Mail, label: 'Email', val: form.email || '—' },
                  { icon: MapPin, label: 'Ville', val: `${form.city}, ${form.country}` },
                  { icon: Building2, label: 'Secteur', val: form.sector || '—' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                    <span className="text-sm text-white font-medium truncate">{val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <p className="text-xs text-cyan-300">
                  ℹ️ Le score TERAS sera calculé automatiquement après création. 
                  Le client apparaîtra dans votre portefeuille avec le statut <strong>En attente</strong>.
                </p>
              </div>
              {errors.submit && (
                <p className="text-xs text-rose-400 text-center">{errors.submit}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <button onClick={step === 1 ? handleClose : () => setStep(s => s - 1)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">
              {step === 1 ? 'Annuler' : '← Retour'}
            </button>

            {step < 3 ? (
              <button onClick={handleNext}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-all">
                Suivant →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : '✓ Créer le client'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
