import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface PassportPillar {
  code: string;
  label: string;
  ratio: number;
  weighted_points: number;
  max_points: number;
}

interface EnterprisePassport {
  identity?: {
    name?: string;
    legal_name?: string;
    registration_number?: string;
    tax_id?: string;
    enterprise_type?: string;
    sector?: string;
    join_date?: string | null;
    status?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  metrics?: {
    annual_revenue?: number;
    estimated_monthly_revenue?: number;
    employees_count?: number;
    crm_limit?: number;
    active_loans_count?: number;
    total_borrowed?: number;
    documented_assets_total_xaf?: number;
    invoice_amount_total_xaf?: number;
    collateral_value_xaf?: number;
  };
  applications_summary?: Record<string, number>;
  credit_capacity?: {
    monthly_repayment_capacity?: number;
    recommended_limit_6m?: number;
    recommended_limit_12m?: number;
  };
  documents?: {
    total_docs?: number;
    validated_docs?: number;
    pending_docs?: number;
    last_processed_at?: string | null;
    analyzed_docs?: number;
    applied_docs?: number;
    latest_summary?: {
      extracted_metrics?: {
        monthly_revenue_xaf?: number;
        monthly_cashflow_xaf?: number;
        crm_estimated_xaf?: number;
        authenticity_score?: number;
        asset_value_xaf?: number;
        asset_items_count?: number;
        invoice_amount_xaf?: number;
        collateral_value_xaf?: number;
      };
      recommended_actions?: string[];
    };
    document_intelligence?: {
      categories?: string[];
      completeness_ratio?: number;
      avg_monthly_revenue_xaf?: number;
      avg_monthly_cashflow_xaf?: number;
      avg_authenticity?: number;
      assets_documented_total_xaf?: number;
      assets_verified_count?: number;
      invoice_amount_total_xaf?: number;
      invoices_analyzed_count?: number;
      collateral_value_xaf?: number;
      collateral_strength?: string;
      asset_proof_types?: string[];
      dossier_quality?: string;
      alerts?: string[];
    };
  };
  score?: {
    value?: number | null;
    band?: string;
    computed_at?: string | null;
    sector_average?: number | null;
    percentile?: number | null;
    pillars?: PassportPillar[];
  };
  recent_applications?: any[];
}

interface BankEnterpriseDetailApi {
  id: number;
  name?: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  enterprise_type?: string;
  sector?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  annual_revenue?: number | string;
  employees_count?: number;
  teras_score?: number | null;
  teras_band?: string;
  active_loans_count?: number;
  total_borrowed?: number | string;
  crm_limit?: number | string;
  status?: string;
  join_date?: string;
  created_at?: string;
  applications?: any[];
  teras_account?: {
    email?: string;
    created?: boolean;
  };
  financial_passport?: EnterprisePassport;
  score_breakdown?: PassportPillar[];
}

interface EnterpriseViewModel {
  id: number;
  displayName: string;
  commercialName: string;
  sector: string;
  status: string;
  band: string;
  score: number;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  registrationNumber: string;
  taxId: string;
  enterpriseType: string;
  employees: number;
  annualRevenue: number;
  monthlyRevenue: number;
  crmLimit: number;
  totalBorrowed: number;
  activeLoansCount: number;
  joinDate: string;
  applications: any[];
  passport: EnterprisePassport;
  pillars: PassportPillar[];
  terasAccountEmail: string;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function inferBand(score: number): string {
  if (score >= 900) return 'A+';
  if (score >= 800) return 'A';
  if (score >= 700) return 'B';
  if (score >= 600) return 'C';
  if (score >= 500) return 'D';
  return 'E';
}

function formatCurrency(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString('fr-FR')} FCFA`;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getBandColor(band: string): string {
  const colors: Record<string, string> = {
    'A+': 'emerald',
    A: 'green',
    B: 'blue',
    C: 'amber',
    D: 'orange',
    E: 'red',
  };
  return colors[band] || 'slate';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'amber',
    suspended: 'red',
  };
  return colors[status] || 'slate';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  };
  return labels[status] || status;
}

function formatDocumentRole(value?: string): string {
  const labels: Record<string, string> = {
    asset_register: "Registre d'actifs",
    asset_statement: "État des actifs",
    vehicle_title: "Carte grise",
    property_or_lease: "Titre / bail",
    invoice_evidence: "Facture",
    bank_statement: 'Relevé bancaire',
    balance_sheet: 'Bilan',
    tax_filing: 'Fiscal',
    payroll: 'Paie',
    contract: 'Contrat',
  };
  return labels[value || ''] || String(value || '').replace(/_/g, ' ');
}

async function readApiPayload(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    return {
      error: isHtml ? `Le serveur a renvoye une page HTML (${res.status}).` : text.slice(0, 300),
    };
  }
}

function normalizeEnterprise(raw: BankEnterpriseDetailApi): EnterpriseViewModel {
  const passport = raw.financial_passport || {};
  const metrics = passport.metrics || {};
  const score = toNumber(passport.score?.value ?? raw.teras_score);
  const applications = raw.applications || passport.recent_applications || [];

  return {
    id: raw.id,
    displayName: raw.legal_name || passport.identity?.legal_name || raw.name || `Entreprise #${raw.id}`,
    commercialName: raw.name || passport.identity?.name || raw.legal_name || `Entreprise #${raw.id}`,
    sector: raw.sector || passport.identity?.sector || 'Non renseigne',
    status: raw.status || passport.identity?.status || 'inactive',
    band: raw.teras_band || passport.score?.band || inferBand(score),
    score,
    email: raw.email || passport.contact?.email || '—',
    phone: raw.phone || passport.contact?.phone || '—',
    address: raw.address || passport.contact?.address || '—',
    city: raw.city || passport.contact?.city || '—',
    country: raw.country || passport.contact?.country || '—',
    registrationNumber: raw.registration_number || passport.identity?.registration_number || '—',
    taxId: raw.tax_id || passport.identity?.tax_id || '—',
    enterpriseType: raw.enterprise_type || passport.identity?.enterprise_type || '—',
    employees: raw.employees_count || metrics.employees_count || 0,
    annualRevenue: toNumber(raw.annual_revenue ?? metrics.annual_revenue),
    monthlyRevenue: toNumber(metrics.estimated_monthly_revenue ?? toNumber(raw.annual_revenue) / 12),
    crmLimit: toNumber(raw.crm_limit ?? metrics.crm_limit),
    totalBorrowed: toNumber(raw.total_borrowed ?? metrics.total_borrowed),
    activeLoansCount: raw.active_loans_count || metrics.active_loans_count || 0,
    joinDate: raw.join_date || raw.created_at || passport.identity?.join_date || '',
    applications,
    passport,
    pillars: passport.score?.pillars || raw.score_breakdown || [],
    terasAccountEmail: raw.teras_account?.email || '',
  };
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ProposeEnterpriseOffer({
  enterprise,
  onClose,
}: {
  enterprise: EnterpriseViewModel;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    product: '',
    amount: '',
    duration: '',
    purpose: '',
  });
  const [simulation, setSimulation] = useState<{
    monthly: number;
    total: number;
    interest: number;
    eligible: boolean;
    effort: number;
  } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/scoring/bank/products/');
        const payload = await readApiPayload(res);
        if (!res.ok) throw new Error(payload.error || `Erreur ${res.status}`);

        const list = (Array.isArray(payload) ? payload : payload.results ?? []).filter((product: any) => {
          if (!product.is_active) return false;
          if (product.product_type === 'salary') return false;
          return !enterprise.score || product.min_score_required <= enterprise.score;
        });
        setProducts(list);
      } catch (e: any) {
        setError(e.message || 'Impossible de charger les produits.');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [enterprise.id, enterprise.score]);

  const selectedProduct = products.find((product) => String(product.id) === form.product);

  React.useEffect(() => {
    if (!selectedProduct || !form.amount || !form.duration) {
      setSimulation(null);
      return;
    }

    const rate = parseFloat(selectedProduct.interest_rate) / 100 / 12;
    const duration = parseInt(form.duration, 10);
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(duration) || !Number.isFinite(amount) || duration <= 0 || amount <= 0) {
      setSimulation(null);
      return;
    }

    const monthly = rate > 0
      ? amount * (rate * Math.pow(1 + rate, duration)) / (Math.pow(1 + rate, duration) - 1)
      : amount / duration;
    const total = monthly * duration;
    const crm = enterprise.crmLimit || 0;

    setSimulation({
      monthly: Math.round(monthly),
      total: Math.round(total),
      interest: Math.round(total - amount),
      eligible: crm <= 0 || monthly <= crm,
      effort: crm > 0 ? Math.round((monthly / crm) * 100) : 0,
    });
  }, [form.amount, form.duration, selectedProduct, enterprise.crmLimit]);

  const handleSubmit = async () => {
    if (!form.product || !form.amount || !form.duration || !form.purpose) {
      setError('Tous les champs sont requis.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/scoring/bank/applications/submit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_type: 'enterprise',
          enterprise: enterprise.id,
          product: parseInt(form.product, 10),
          requested_amount: parseFloat(form.amount),
          duration_months: parseInt(form.duration, 10),
          purpose: form.purpose,
        }),
      });
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(payload.error || `Erreur ${res.status}`);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Impossible d'envoyer l'offre.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-white font-bold text-lg mb-2">Offre envoyee</h3>
        <p className="text-slate-400 text-sm mb-6">
          L&apos;offre de financement pour {enterprise.displayName} est maintenant disponible dans son espace.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 rounded-xl p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-semibold">{enterprise.displayName}</p>
          <p className="text-slate-400 text-xs mt-1">
            Score {enterprise.score || '—'} • CRM {formatCurrency(enterprise.crmLimit)}/mois
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-medium bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400`}
        >
          {enterprise.band}
        </span>
      </div>

      {loadingProducts ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Produit</label>
            <select
              value={form.product}
              onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="">Choisir un produit</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} • {formatCurrency(toNumber(product.min_amount))} - {formatCurrency(toNumber(product.max_amount))}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-xs font-medium mb-1 block">Montant (FCFA)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                placeholder="Montant souhaite"
              />
            </div>
            <div>
              <label className="text-slate-300 text-xs font-medium mb-1 block">Duree (mois)</label>
              <select
                value={form.duration}
                onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">Choisir</option>
                {selectedProduct && Array.from(
                  { length: selectedProduct.max_duration_months - selectedProduct.min_duration_months + 1 },
                  (_, index) => selectedProduct.min_duration_months + index,
                )
                  .filter((month) => month <= 12 || month % 3 === 0 || month === selectedProduct.max_duration_months)
                  .slice(0, 20)
                  .map((month) => (
                    <option key={month} value={month}>
                      {month} mois
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Objet du financement</label>
            <textarea
              rows={3}
              value={form.purpose}
              onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
              placeholder="Ex: vehicule logistique, stock, equipements, extension..."
            />
          </div>

          {simulation && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 grid md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Mensualite</p>
                <p className="text-white font-semibold">{formatCurrency(simulation.monthly)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Total</p>
                <p className="text-white font-semibold">{formatCurrency(simulation.total)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Interets</p>
                <p className="text-amber-300 font-semibold">{formatCurrency(simulation.interest)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Effort CRM</p>
                <p className={simulation.eligible ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                  {simulation.effort || 0}%
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer l&apos;offre
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function BankEnterpriseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [enterprise, setEnterprise] = React.useState<EnterpriseViewModel | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'passport'>('overview');
  const [modal, setModal] = useState<'offer' | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshingPassport, setRefreshingPassport] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadEnterprise = async (showSpinner = true) => {
    if (!id) return;
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await authFetch(`/api/scoring/bank/enterprises/${id}/`);
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(payload.error || `Entreprise introuvable (${res.status})`);
      setEnterprise(normalizeEnterprise(payload));
    } catch (e: any) {
      setError(e.message || 'Entreprise introuvable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadEnterprise(true);
  }, [id]);

  const refreshPassport = async () => {
    if (!id) return;
    setRefreshingPassport(true);
    setError(null);
    try {
      const res = await authFetch(`/api/scoring/bank/enterprises/${id}/refresh-passport/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recompute: true }),
      });
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(payload.error || `Erreur ${res.status}`);
      setEnterprise(normalizeEnterprise(payload));
    } catch (e: any) {
      setError(e.message || 'Impossible de rafraichir le passeport.');
    } finally {
      setRefreshingPassport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-rose-400">{error || 'Données indisponibles'}</p>
        <button
          onClick={() => navigate('/bank/enterprises')}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"
        >
          ← Retour
        </button>
      </div>
    );
  }

  const scoreMeta = enterprise.passport.score || {};
  const docMeta = enterprise.passport.documents || {};
  const docIntel = docMeta.document_intelligence || {};
  const capacity = enterprise.passport.credit_capacity || {};
  const appsSummary = enterprise.passport.applications_summary || {};
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: Building2 },
    { id: 'scoring', label: 'Scoring entreprise', icon: TrendingUp },
    { id: 'passport', label: 'Passeport financier', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6">
      {modal === 'offer' && (
        <ModalShell
          title="Proposer une offre"
          onClose={() => {
            setModal(null);
            loadEnterprise(false);
          }}
        >
          <ProposeEnterpriseOffer
            enterprise={enterprise}
            onClose={() => {
              setModal(null);
              loadEnterprise(false);
            }}
          />
        </ModalShell>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bank/enterprises')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white">{enterprise.displayName}</h1>
              <span
                className={`px-3 py-1 bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400 text-sm rounded-lg font-semibold`}
              >
                Bande {enterprise.band}
              </span>
              <span
                className={`px-3 py-1 bg-${getStatusColor(enterprise.status)}-500/10 text-${getStatusColor(enterprise.status)}-400 text-sm rounded-lg`}
              >
                {getStatusLabel(enterprise.status)}
              </span>
            </div>
            <p className="text-slate-400 mt-1">
              {enterprise.sector} • RCCM {enterprise.registrationNumber} • NIU {enterprise.taxId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshPassport}
            className="px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl transition-colors flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${refreshingPassport ? 'animate-pulse' : ''}`} />
            Rafraichir le passeport
          </button>
          <button
            onClick={() => loadEnterprise(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setModal('offer')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Proposer une offre
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-400 text-sm mb-2">Score TERAS</p>
          <p className="text-3xl font-bold text-white">{enterprise.score || '—'}</p>
          <p className="text-slate-500 text-xs mt-1">Dernier calcul {formatDate(scoreMeta.computed_at)}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-400 text-sm mb-2">CRM mensuel</p>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(enterprise.crmLimit)}</p>
          <p className="text-slate-500 text-xs mt-1">Capacité de remboursement recommandée</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-400 text-sm mb-2">Crédits actifs</p>
          <p className="text-3xl font-bold text-white">{enterprise.activeLoansCount}</p>
          <p className="text-slate-500 text-xs mt-1">{formatCurrency(enterprise.totalBorrowed)} engagés</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-400 text-sm mb-2">Documents suivis</p>
          <p className="text-3xl font-bold text-white">{docMeta.total_docs || 0}</p>
          <p className="text-slate-500 text-xs mt-1">
            {(docMeta.analyzed_docs ?? docMeta.validated_docs) || 0} analysés • {docMeta.applied_docs || 0} appliqués
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Identité & contacts</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white">{enterprise.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Téléphone</p>
                      <p className="text-white">{enterprise.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Effectif</p>
                      <p className="text-white">{enterprise.employees} employés</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Adresse</p>
                      <p className="text-white">{enterprise.address}</p>
                      <p className="text-slate-400 text-sm">{enterprise.city}, {enterprise.country}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Membre depuis</p>
                      <p className="text-white">{formatDate(enterprise.joinDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-sm">Type d’entreprise</p>
                      <p className="text-white">{enterprise.enterpriseType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Situation financière</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">CA annuel observé</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(enterprise.annualRevenue)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">CA mensuel estimé</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(enterprise.monthlyRevenue)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Endettement cumulé</p>
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(enterprise.totalBorrowed)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Capacité mensuelle</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(enterprise.crmLimit)}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Dernières demandes de crédit</h2>
              <div className="space-y-3">
                {enterprise.applications.length > 0 ? (
                  enterprise.applications.map((application) => (
                    <div key={application.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{application.product_name || 'Produit non renseigné'}</p>
                        <p className="text-slate-400 text-xs">
                          {application.application_id} • {application.applicant_type === 'enterprise' ? 'Entreprise' : 'Individu'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(toNumber(application.requested_amount))}</p>
                        <p className="text-slate-400 text-xs">{application.duration_months} mois • {application.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">Aucune demande récente pour cette entreprise.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Résumé dossier</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Demandes totales</span>
                  <span className="text-white font-semibold">{appsSummary.total || enterprise.applications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Approuvées / actives</span>
                  <span className="text-white font-semibold">
                    {(appsSummary.approved || 0) + (appsSummary.active || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Rejets / annulations</span>
                  <span className="text-white font-semibold">
                    {(appsSummary.rejected || 0) + (appsSummary.cancelled || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Compte TERAS</span>
                  <span className="text-white font-semibold">{enterprise.terasAccountEmail || 'Non lié'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Lecture rapide banque</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                  CRM 6 mois recommandé : {formatCurrency(toNumber(capacity.recommended_limit_6m))}
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
                  CRM 12 mois recommandé : {formatCurrency(toNumber(capacity.recommended_limit_12m))}
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300">
                  Dernier traitement documentaire : {formatDate(docMeta.last_processed_at)}
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300">
                  Qualite du dossier : <span className="text-white font-semibold">{docIntel.dossier_quality || 'a_structurer'}</span>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                  Actifs documentés : <span className="font-semibold text-white">{formatCurrency(toNumber(docIntel.assets_documented_total_xaf || enterprise.passport.metrics?.documented_assets_total_xaf))}</span>
                  <div className="text-xs text-amber-100/80 mt-1">
                    {docIntel.assets_verified_count || 0} preuve(s) d'actifs reconnue(s)
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-200">
                  Facturation objectivée : <span className="font-semibold text-white">{formatCurrency(toNumber(docIntel.invoice_amount_total_xaf || enterprise.passport.metrics?.invoice_amount_total_xaf))}</span>
                  <div className="text-xs text-blue-100/80 mt-1">
                    {docIntel.invoices_analyzed_count || 0} facture(s) exploitée(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Piliers du score entreprise</h2>
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recalculer
              </button>
            </div>

            {enterprise.pillars.length > 0 ? (
              <div className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Score actuel</p>
                    <p className="text-5xl font-bold text-white">{enterprise.score}<span className="text-slate-500 text-2xl"> /1000</span></p>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <p>Secteur moyen : {scoreMeta.sector_average ?? '—'}</p>
                    <p>Percentile : {scoreMeta.percentile ?? '—'}</p>
                    <p>Calculé le {formatDate(scoreMeta.computed_at)}</p>
                  </div>
                </div>

                {enterprise.pillars.map((pillar) => (
                  <div key={pillar.code}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                          {pillar.code}
                        </div>
                        <span className="text-white font-medium">{pillar.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{pillar.weighted_points}/{pillar.max_points}</p>
                        <p className="text-slate-400 text-xs">{Math.round((pillar.ratio || 0) * 100)}%</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.round((pillar.ratio || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
                Aucun score entreprise détaillé n’est encore disponible pour cette fiche.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Lecture analytique
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  Score secteur : <span className="text-white font-semibold">{scoreMeta.sector_average ?? '—'}</span>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  Percentile marché : <span className="text-white font-semibold">{scoreMeta.percentile ?? '—'}</span>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  Bande TERAS actuelle : <span className={`text-${getBandColor(enterprise.band)}-400 font-semibold`}>{enterprise.band}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Recommandation TERAS
              </h3>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                {enterprise.score >= 700
                  ? "Entreprise suffisamment documentée pour une offre PME structurée."
                  : "Renforcer le dossier documentaire et l'historique financier avant nouvelle offre."}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'passport' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Passeport financier banque</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Capacité mensuelle recommandée</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(toNumber(capacity.monthly_repayment_capacity ?? enterprise.crmLimit))}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Plafond recommandé 6 mois</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(toNumber(capacity.recommended_limit_6m))}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Plafond recommandé 12 mois</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(toNumber(capacity.recommended_limit_12m))}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Qualité documentaire</p>
                  <p className="text-2xl font-bold text-white">
                    {docMeta.validated_docs || 0}/{docMeta.total_docs || 0}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {Math.round(Number(docIntel.completeness_ratio || 0) * 100)}% de maturite dossier
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Dossier documentaire & applicatif</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <p className="text-white font-semibold">Documents</p>
                  </div>
                  <p className="text-slate-300 text-sm">Total : {docMeta.total_docs || 0}</p>
                  <p className="text-slate-300 text-sm">Analysés : {(docMeta.analyzed_docs ?? docMeta.validated_docs) || 0}</p>
                  <p className="text-slate-300 text-sm">Appliqués : {docMeta.applied_docs || 0}</p>
                  <p className="text-slate-300 text-sm">En attente : {docMeta.pending_docs || 0}</p>
                  <p className="text-slate-300 text-sm">Qualité : {docIntel.dossier_quality || 'a_structurer'}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <p className="text-white font-semibold">Applications</p>
                  </div>
                  <p className="text-slate-300 text-sm">Approuvées : {appsSummary.approved || 0}</p>
                  <p className="text-slate-300 text-sm">Actives : {appsSummary.active || 0}</p>
                  <p className="text-slate-300 text-sm">En attente : {appsSummary.pending || 0}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <p className="text-white font-semibold">Lecture documentaire</p>
                  </div>
                  <p className="text-slate-300 text-sm">Revenu mensuel objectivé : {formatCurrency(toNumber(docIntel.avg_monthly_revenue_xaf))}</p>
                  <p className="text-slate-300 text-sm">Cashflow moyen observé : {formatCurrency(toNumber(docIntel.avg_monthly_cashflow_xaf))}</p>
                  <p className="text-slate-300 text-sm">Authenticité moyenne : {Math.round(Number(docIntel.avg_authenticity || 0) * 100)}%</p>
                  <p className="text-slate-300 text-sm">Actifs documentés : {formatCurrency(toNumber(docIntel.assets_documented_total_xaf || enterprise.passport.metrics?.documented_assets_total_xaf))}</p>
                  <p className="text-slate-300 text-sm">Facturation objectivée : {formatCurrency(toNumber(docIntel.invoice_amount_total_xaf || enterprise.passport.metrics?.invoice_amount_total_xaf))}</p>
                  <p className="text-slate-300 text-sm">Collatéral estimé : {formatCurrency(toNumber(docIntel.collateral_value_xaf || enterprise.passport.metrics?.collateral_value_xaf))}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(docIntel.categories || []).map((category) => (
                      <span key={category} className="px-2 py-1 rounded-full bg-slate-700 text-slate-200 text-xs">
                        {formatDocumentRole(category)}
                      </span>
                    ))}
                  </div>
                  {(docIntel.asset_proof_types || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(docIntel.asset_proof_types || []).map((proofType) => (
                        <span key={proofType} className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs border border-amber-500/20">
                          {proofType}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Décision banque
              </h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300">
                  {enterprise.score >= 700
                    ? 'Passeport financier exploitable pour une proposition bancaire.'
                    : 'Passeport partiel : compléter les preuves documentaires avant décaissement.'}
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                  Collatéral estimé : {formatCurrency(toNumber(docIntel.collateral_value_xaf || enterprise.passport.metrics?.collateral_value_xaf))}
                  <div className="text-xs text-amber-100/80 mt-1">
                    Force de garantie : {docIntel.collateral_strength === 'high' ? 'forte' : docIntel.collateral_strength === 'medium' ? 'moyenne' : 'faible'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300">
                  Compte TERAS lié : {enterprise.terasAccountEmail || 'Non renseigné'}
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300">
                  Dernier traitement documents : {formatDate(docMeta.last_processed_at)}
                </div>
                {(docIntel.alerts || []).length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                    {(docIntel.alerts || []).slice(0, 2).map((alert) => (
                      <p key={alert} className="text-sm">• {alert}</p>
                    ))}
                  </div>
                )}
                {docMeta.latest_summary?.recommended_actions?.length > 0 && (
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300">
                    Dernière action recommandée : {docMeta.latest_summary.recommended_actions[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
