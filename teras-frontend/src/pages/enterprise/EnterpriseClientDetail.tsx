// src/pages/enterprise/EnterpriseClientDetail.tsx
// ✅ Connecté à l'API Django

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, TrendingUp, Users, FileText, Shield } from "lucide-react";
import enterpriseApi, { EnterpriseClient } from "../../services/enterpriseApi";

const riskLabel = (r: string) => ({ low: 'Faible', medium: 'Moyen', high: 'Élevé' }[r] || r);
const riskColor = (r: string) => {
  if (r === 'low')    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (r === 'medium') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
};
const bandLabel = (s: number) => s >= 900 ? 'A' : s >= 750 ? 'B' : s >= 600 ? 'C' : s >= 400 ? 'D' : 'E';
const bandColor = (s: number) => s >= 750 ? 'text-emerald-400' : s >= 600 ? 'text-sky-400' : s >= 400 ? 'text-amber-400' : 'text-rose-400';

const EnterpriseClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<EnterpriseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await enterpriseApi.getClient(Number(id));
        setClient(data);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  );

  if (error || !client) return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-rose-400" />
      <p className="text-slate-400">{error || 'Client introuvable'}</p>
      <Link to="/enterprise/clients" className="text-sm text-cyan-400 hover:text-cyan-300">← Retour à la liste</Link>
    </div>
  );

  const score = client.teras_score || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/enterprise/clients" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour au portefeuille
            </Link>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">TERAS Entreprise</p>
            <h1 className="text-2xl font-black text-white">{client.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{client.client_type_display || client.client_type} · {client.kyc_id || `#${client.id}`}</p>
          </div>
        </div>

        {/* Score + risque */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500 mb-2">Score TERAS</p>
            <p className={`text-6xl font-black ${bandColor(score)}`}>{score}</p>
            <p className="text-slate-500 text-sm mt-1">/ 1000</p>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${riskColor(client.risk_level)}`}>
              Bande {bandLabel(score)} · Risque {riskLabel(client.risk_level)}
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: 'Statut', value: client.status === 'active' ? '✓ Actif' : client.status_display || client.status, color: client.status === 'active' ? 'text-emerald-400' : 'text-slate-400' },
              { label: 'Type de client', value: client.client_type_display || client.client_type, color: 'text-slate-200' },
              { label: 'Réf. interne', value: client.internal_ref || '—', color: 'text-slate-300' },
              { label: 'Créé le', value: new Date(client.created_at).toLocaleDateString('fr-FR'), color: 'text-slate-300' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
            <p className="text-sm text-slate-300 leading-relaxed">{client.notes}</p>
          </div>
        )}

        {/* Documents placeholder */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Documents associés</p>
          <div className="flex items-center gap-3 text-slate-500">
            <FileText className="w-5 h-5" />
            <p className="text-sm">Les relevés bancaires, mobile money et bulletins de salaire utilisés pour ce dossier seront affichés ici.</p>
          </div>
        </div>

        {/* Dernière mise à jour */}
        <p className="text-xs text-slate-600 text-center">
          Dernière mise à jour : {new Date(client.updated_at).toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
};

export default EnterpriseClientDetail;
