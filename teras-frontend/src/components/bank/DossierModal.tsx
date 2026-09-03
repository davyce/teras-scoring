// ═══════════════════════════════════════════════════════════════════════════
// PARTIE 1 — Modal DossierComplet.tsx
// Créer ce fichier : teras-frontend/src/components/bank/DossierModal.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import {
  X, FileText, Download, User, Building2, CheckCircle,
  CreditCard, Calendar, TrendingUp, Shield, Loader2,
  Smartphone, Banknote, AlertCircle, Clock,
} from 'lucide-react';

interface DossierModalProps {
  app: any;
  onClose: () => void;
}

const fmt = (val: any) => {
  const n = parseFloat(val);
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const calcMonthly = (principal: number, annualRate: number, months: number) => {
  if (months <= 0) return 0;
  if (annualRate <= 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

export default function DossierModal({ app, onClose }: DossierModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const principal   = parseFloat(app.requested_amount || 0);
  const duration    = parseInt(app.duration_months || 1);
  const annualRate  = parseFloat(app.interest_rate || 10);
  const monthly     = calcMonthly(principal, annualRate, duration);
  const totalCost   = monthly * duration;
  const totalInterets = totalCost - principal;

  const isIndividual = app.applicant_type === 'individual';
  const clientName   = app.client_name || app.enterprise_name || '—';
  const score        = app.teras_score_at_application || 0;

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'En attente acceptation client', color: 'text-amber-400',   bg: 'bg-amber-500/10 border border-amber-500/30' },
    disbursed: { label: 'Crédit actif / Décaissé',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/30' },
  };
  const statusCfg = STATUS_MAP[app.status] || STATUS_MAP.approved;

  // ── Télécharger le contrat PDF ────────────────────────────────────────────
  const downloadContract = async () => {
    setDownloading(true); setDownloadError(''); setDownloadSuccess(false);
    try {
      const res = await authFetch(`/api/scoring/bank/applications/${app.id}/contract/`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `TERAS_Contrat_${app.application_id}_${clientName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e: any) {
      setDownloadError(e.message || 'Erreur génération contrat.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Amortissement (6 premières lignes) ────────────────────────────────────
  const amortLines = [];
  let balance = principal;
  const r = annualRate / 100 / 12;
  for (let i = 1; i <= Math.min(duration, 6); i++) {
    const interest = r > 0 ? balance * r : 0;
    const capital  = r > 0 ? monthly - interest : monthly;
    balance       -= capital;
    amortLines.push({ month: i, monthly, capital, interest, balance: Math.max(balance, 0) });
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-400"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Dossier Crédit</h2>
              <p className="text-slate-400 text-xs">{app.application_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* Statut */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${statusCfg.bg}`}>
            {app.status === 'disbursed'
              ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0"/>
              : <Clock className="w-5 h-5 text-amber-400 shrink-0"/>}
            <span className={`font-semibold text-sm ${statusCfg.color}`}>{statusCfg.label}</span>
            <span className="text-slate-500 text-xs ml-auto">{fmtDate(app.reviewed_at || app.created_at)}</span>
          </div>

          {/* Infos client */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Emprunteur</p>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                {isIndividual ? <User className="w-6 h-6 text-blue-400"/> : <Building2 className="w-6 h-6 text-purple-400"/>}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Nom complet</p>
                  <p className="text-white font-semibold">{clientName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Score TERAS</p>
                  <p className={`font-bold ${score >= 700 ? 'text-emerald-400' : score >= 500 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {score} / 1000 {score >= 700 ? '🥇' : score >= 600 ? '🥈' : '🥉'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Produit</p>
                  <p className="text-white">{app.product_name || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Date approbation</p>
                  <p className="text-white">{fmtDate(app.reviewed_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions crédit */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Conditions du Crédit</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Montant',      value: fmt(principal),          color: 'sky'     },
                { label: 'Durée',        value: `${duration} mois`,      color: 'violet'  },
                { label: 'Taux /an',     value: `${annualRate.toFixed(1)}%`, color: 'amber' },
                { label: 'Mensualité',   value: fmt(Math.round(monthly)), color: 'emerald' },
                { label: 'Total',        value: fmt(Math.round(totalCost)),color: 'slate'  },
                { label: 'Intérêts',     value: fmt(Math.round(totalInterets)), color: 'rose' },
              ].map((k, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">{k.label}</p>
                  <p className={`font-bold text-sm text-${k.color}-400`}>{k.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modalités remboursement */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Modalités de Prélèvement Automatique
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
                <Smartphone className="w-5 h-5 text-sky-400 shrink-0"/>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Mobile Money</p>
                  <p className="text-slate-400 text-xs">Prélèvement automatique mensuel de <span className="text-sky-400 font-bold">{fmt(Math.round(monthly))}</span></p>
                  <p className="text-slate-500 text-xs mt-0.5">Airtel Money / MTN Money / Orange Money / ZOLA</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
                <Banknote className="w-5 h-5 text-emerald-400 shrink-0"/>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Compte Bancaire</p>
                  <p className="text-slate-400 text-xs">Prélèvement automatique mensuel de <span className="text-emerald-400 font-bold">{fmt(Math.round(monthly))}</span></p>
                  <p className="text-slate-500 text-xs mt-0.5">Virement automatique selon coordonnées bancaires déclarées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu amortissement */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Aperçu Remboursement ({Math.min(duration, 6)} premières échéances)
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-3 py-2 text-slate-400 text-left">Mois</th>
                    <th className="px-3 py-2 text-slate-400 text-right">Mensualité</th>
                    <th className="px-3 py-2 text-slate-400 text-right">Capital</th>
                    <th className="px-3 py-2 text-slate-400 text-right">Intérêts</th>
                    <th className="px-3 py-2 text-slate-400 text-right">Restant</th>
                  </tr>
                </thead>
                <tbody>
                  {amortLines.map((line, i) => (
                    <tr key={i} className={`border-t border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`}>
                      <td className="px-3 py-2 text-slate-300">Mois {line.month}</td>
                      <td className="px-3 py-2 text-right text-white font-medium">{fmt(Math.round(line.monthly))}</td>
                      <td className="px-3 py-2 text-right text-sky-400">{fmt(Math.round(line.capital))}</td>
                      <td className="px-3 py-2 text-right text-amber-400">{fmt(Math.round(line.interest))}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{fmt(Math.round(line.balance))}</td>
                    </tr>
                  ))}
                  {duration > 6 && (
                    <tr className="border-t border-slate-800 bg-slate-900/50">
                      <td colSpan={5} className="px-3 py-2 text-slate-500 text-center">
                        ... {duration - 6} échéances restantes — voir le contrat complet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infos légales */}
          <div className="bg-slate-800/20 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5"/>
              <div className="text-xs text-slate-400 leading-relaxed">
                <p className="text-white font-medium mb-1">Contrat de crédit TERAS</p>
                Le contrat PDF contient : identité complète, conditions de crédit, tableau d'amortissement complet,
                autorisation de prélèvement automatique signée par <strong className="text-white">{clientName}</strong>,
                et les conditions générales applicables. Ce contrat a valeur légale conformément au droit OHADA
                et à la réglementation bancaire en vigueur au Congo Brazzaville.
              </div>
            </div>
          </div>

          {/* Erreur download */}
          {downloadError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/>
              <p className="text-rose-300 text-sm">{downloadError}</p>
            </div>
          )}

          {/* Succès download */}
          {downloadSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
              <p className="text-emerald-300 text-sm">Contrat téléchargé avec succès.</p>
            </div>
          )}

        </div>

        {/* Footer avec bouton télécharger */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition">
            Fermer
          </button>

          <button onClick={downloadContract} disabled={downloading}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-500/20">
            {downloading
              ? <><Loader2 className="w-4 h-4 animate-spin"/> Génération du contrat...</>
              : <><Download className="w-4 h-4"/> Télécharger le Contrat PDF</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// PARTIE 2 — Modifications à apporter dans BankApplicationsApproved.tsx
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. Ajouter l'import en haut du fichier :
//
//    import DossierModal from '../../components/bank/DossierModal';
//
// 2. Ajouter le state dans le composant principal (après le state `editing`) :
//
//    const [dossierApp, setDossierApp] = useState<any | null>(null);
//
// 3. Ajouter le modal dans le JSX (après {editing && <EditAmountModal ...>}) :
//
//    {dossierApp && <DossierModal app={dossierApp} onClose={() => setDossierApp(null)} />}
//
// 4. Remplacer le bouton "Dossier" existant (ligne ~411) :
//
// AVANT :
//    <button
//      onClick={() => { if (isIndividual && app.client) navigate(`/bank/clients/${app.client}`); }}
//      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
//      <Eye className="w-3.5 h-3.5" /> Dossier
//    </button>
//
// APRÈS :
//    <button
//      onClick={() => setDossierApp(app)}
//      className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
//      <FileText className="w-3.5 h-3.5" /> Dossier complet
//    </button>
