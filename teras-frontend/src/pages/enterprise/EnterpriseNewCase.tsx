// src/pages/enterprise/EnterpriseNewCase.tsx
// ✅ Formulaire connecté à l'API Django

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";

const EnterpriseNewCase: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm]         = useState({
    name: '', client_type: 'individual', kyc_id: '', internal_ref: '', notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.kyc_id.trim()) {
      setError('Le nom et le KYC ID sont obligatoires.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await enterpriseApi.createClient(form);
      setSuccess(true);
      setTimeout(() => navigate('/enterprise/clients'), 1500);
    } catch (e: any) { setError(e.message || 'Erreur lors de la création.'); }
    finally { setLoading(false); }
  };

  const field = (label: string, key: keyof typeof form, placeholder = '', type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type} value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link to="/enterprise/clients" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au portefeuille
          </Link>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">TERAS Entreprise</p>
          <h1 className="text-2xl font-black text-white">Nouveau dossier client</h1>
          <p className="text-sm text-slate-400 mt-1">Créez un dossier analysé par le moteur TERAS.</p>
        </div>

        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700 rounded-xl text-emerald-300">
            <CheckCircle className="w-4 h-4" /> Client créé avec succès ! Redirection...
          </div>
        )}
        {error && (
          <div className="px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Nom / Raison sociale *', 'name', 'Ex: Boutique Marchand OYO')}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type de client</label>
              <select value={form.client_type} onChange={e => setForm(f => ({ ...f, client_type: e.target.value }))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500">
                <option value="individual">Particulier</option>
                <option value="sme">PME</option>
                <option value="enterprise">Entreprise</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('KYC ID *', 'kyc_id', 'Ex: CG-2025-001234')}
            {field('Référence interne', 'internal_ref', 'Code dans votre système')}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Observations, contexte..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Link to="/enterprise/clients"
              className="px-4 py-2 rounded-xl text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              Annuler
            </Link>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer le dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterpriseNewCase;
