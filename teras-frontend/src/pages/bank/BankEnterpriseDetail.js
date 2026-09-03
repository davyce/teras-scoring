import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, AlertCircle, ArrowLeft, BarChart3, Building2, Calendar, CheckCircle, CreditCard, FileText, Mail, MapPin, Phone, RefreshCw, Send, ShieldCheck, Sparkles, Target, TrendingUp, Users, X, Zap, } from 'lucide-react';
function toNumber(value) {
    const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
function inferBand(score) {
    if (score >= 900)
        return 'A+';
    if (score >= 800)
        return 'A';
    if (score >= 700)
        return 'B';
    if (score >= 600)
        return 'C';
    if (score >= 500)
        return 'D';
    return 'E';
}
function formatCurrency(amount) {
    return `${Math.round(amount || 0).toLocaleString('fr-FR')} FCFA`;
}
function formatDate(dateString) {
    if (!dateString)
        return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()))
        return '—';
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function getBandColor(band) {
    const colors = {
        'A+': 'emerald',
        A: 'green',
        B: 'blue',
        C: 'amber',
        D: 'orange',
        E: 'red',
    };
    return colors[band] || 'slate';
}
function getStatusColor(status) {
    const colors = {
        active: 'green',
        inactive: 'amber',
        suspended: 'red',
    };
    return colors[status] || 'slate';
}
function getStatusLabel(status) {
    const labels = {
        active: 'Actif',
        inactive: 'Inactif',
        suspended: 'Suspendu',
    };
    return labels[status] || status;
}
function formatDocumentRole(value) {
    const labels = {
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
async function readApiPayload(res) {
    const text = await res.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
        return {
            error: isHtml ? `Le serveur a renvoye une page HTML (${res.status}).` : text.slice(0, 300),
        };
    }
}
function normalizeEnterprise(raw) {
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
function ModalShell({ title, onClose, children }) {
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10", children: [_jsx("h3", { className: "text-white font-bold text-base", children: title }), _jsx("button", { onClick: onClose, className: "p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "p-6", children: children })] }) }));
}
function ProposeEnterpriseOffer({ enterprise, onClose, }) {
    const [products, setProducts] = useState([]);
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
    const [simulation, setSimulation] = useState(null);
    React.useEffect(() => {
        (async () => {
            try {
                const res = await authFetch('/api/scoring/bank/products/');
                const payload = await readApiPayload(res);
                if (!res.ok)
                    throw new Error(payload.error || `Erreur ${res.status}`);
                const list = (Array.isArray(payload) ? payload : payload.results ?? []).filter((product) => {
                    if (!product.is_active)
                        return false;
                    if (product.product_type === 'salary')
                        return false;
                    return !enterprise.score || product.min_score_required <= enterprise.score;
                });
                setProducts(list);
            }
            catch (e) {
                setError(e.message || 'Impossible de charger les produits.');
                setProducts([]);
            }
            finally {
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
            if (!res.ok)
                throw new Error(payload.error || `Erreur ${res.status}`);
            setSuccess(true);
        }
        catch (e) {
            setError(e.message || "Impossible d'envoyer l'offre.");
        }
        finally {
            setSubmitting(false);
        }
    };
    if (success) {
        return (_jsxs("div", { className: "text-center py-6", children: [_jsx(CheckCircle, { className: "w-14 h-14 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-lg mb-2", children: "Offre envoyee" }), _jsxs("p", { className: "text-slate-400 text-sm mb-6", children: ["L'offre de financement pour ", enterprise.displayName, " est maintenant disponible dans son espace."] }), _jsx("button", { onClick: onClose, className: "px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Fermer" })] }));
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: enterprise.displayName }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: ["Score ", enterprise.score || '—', " \u2022 CRM ", formatCurrency(enterprise.crmLimit), "/mois"] })] }), _jsx("span", { className: `px-2.5 py-1 text-xs rounded-full font-medium bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400`, children: enterprise.band })] }), loadingProducts ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Produit" }), _jsxs("select", { value: form.product, onChange: (event) => setForm((current) => ({ ...current, product: event.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "", children: "Choisir un produit" }), products.map((product) => (_jsxs("option", { value: product.id, children: [product.name, " \u2022 ", formatCurrency(toNumber(product.min_amount)), " - ", formatCurrency(toNumber(product.max_amount))] }, product.id)))] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Montant (FCFA)" }), _jsx("input", { type: "number", value: form.amount, onChange: (event) => setForm((current) => ({ ...current, amount: event.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", placeholder: "Montant souhaite" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Duree (mois)" }), _jsxs("select", { value: form.duration, onChange: (event) => setForm((current) => ({ ...current, duration: event.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "", children: "Choisir" }), selectedProduct && Array.from({ length: selectedProduct.max_duration_months - selectedProduct.min_duration_months + 1 }, (_, index) => selectedProduct.min_duration_months + index)
                                                .filter((month) => month <= 12 || month % 3 === 0 || month === selectedProduct.max_duration_months)
                                                .slice(0, 20)
                                                .map((month) => (_jsxs("option", { value: month, children: [month, " mois"] }, month)))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Objet du financement" }), _jsx("textarea", { rows: 3, value: form.purpose, onChange: (event) => setForm((current) => ({ ...current, purpose: event.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none", placeholder: "Ex: vehicule logistique, stock, equipements, extension..." })] }), simulation && (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 grid md:grid-cols-4 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Mensualite" }), _jsx("p", { className: "text-white font-semibold", children: formatCurrency(simulation.monthly) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Total" }), _jsx("p", { className: "text-white font-semibold", children: formatCurrency(simulation.total) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Interets" }), _jsx("p", { className: "text-amber-300 font-semibold", children: formatCurrency(simulation.interest) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Effort CRM" }), _jsxs("p", { className: simulation.eligible ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold', children: [simulation.effort || 0, "%"] })] })] })), error && (_jsxs("p", { className: "text-rose-400 text-sm flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), error] })), _jsxs("div", { className: "flex items-center justify-end gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsxs("button", { onClick: handleSubmit, disabled: submitting, className: "px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2", children: [submitting ? _jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : _jsx(Send, { className: "w-4 h-4" }), "Envoyer l'offre"] })] })] }))] }));
}
export default function BankEnterpriseDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [enterprise, setEnterprise] = React.useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [modal, setModal] = useState(null);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [refreshingPassport, setRefreshingPassport] = React.useState(false);
    const [error, setError] = React.useState(null);
    const loadEnterprise = async (showSpinner = true) => {
        if (!id)
            return;
        if (showSpinner)
            setLoading(true);
        else
            setRefreshing(true);
        setError(null);
        try {
            const res = await authFetch(`/api/scoring/bank/enterprises/${id}/`);
            const payload = await readApiPayload(res);
            if (!res.ok)
                throw new Error(payload.error || `Entreprise introuvable (${res.status})`);
            setEnterprise(normalizeEnterprise(payload));
        }
        catch (e) {
            setError(e.message || 'Entreprise introuvable');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    React.useEffect(() => {
        loadEnterprise(true);
    }, [id]);
    const refreshPassport = async () => {
        if (!id)
            return;
        setRefreshingPassport(true);
        setError(null);
        try {
            const res = await authFetch(`/api/scoring/bank/enterprises/${id}/refresh-passport/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recompute: true }),
            });
            const payload = await readApiPayload(res);
            if (!res.ok)
                throw new Error(payload.error || `Erreur ${res.status}`);
            setEnterprise(normalizeEnterprise(payload));
        }
        catch (e) {
            setError(e.message || 'Impossible de rafraichir le passeport.');
        }
        finally {
            setRefreshingPassport(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsx("div", { className: "w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (error || !enterprise) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-96 gap-4", children: [_jsx("p", { className: "text-rose-400", children: error || 'Données indisponibles' }), _jsx("button", { onClick: () => navigate('/bank/enterprises'), className: "px-4 py-2 bg-slate-800 text-white rounded-xl text-sm", children: "\u2190 Retour" })] }));
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
    ];
    return (_jsxs("div", { className: "space-y-6", children: [modal === 'offer' && (_jsx(ModalShell, { title: "Proposer une offre", onClose: () => {
                    setModal(null);
                    loadEnterprise(false);
                }, children: _jsx(ProposeEnterpriseOffer, { enterprise: enterprise, onClose: () => {
                        setModal(null);
                        loadEnterprise(false);
                    } }) })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/bank/enterprises'), className: "p-2 hover:bg-slate-800 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: enterprise.displayName }), _jsxs("span", { className: `px-3 py-1 bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400 text-sm rounded-lg font-semibold`, children: ["Bande ", enterprise.band] }), _jsx("span", { className: `px-3 py-1 bg-${getStatusColor(enterprise.status)}-500/10 text-${getStatusColor(enterprise.status)}-400 text-sm rounded-lg`, children: getStatusLabel(enterprise.status) })] }), _jsxs("p", { className: "text-slate-400 mt-1", children: [enterprise.sector, " \u2022 RCCM ", enterprise.registrationNumber, " \u2022 NIU ", enterprise.taxId] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: refreshPassport, className: "px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl transition-colors flex items-center gap-2", children: [_jsx(Sparkles, { className: `w-4 h-4 ${refreshingPassport ? 'animate-pulse' : ''}` }), "Rafraichir le passeport"] }), _jsxs("button", { onClick: () => loadEnterprise(false), className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${refreshing ? 'animate-spin' : ''}` }), "Actualiser"] }), _jsxs("button", { onClick: () => setModal('offer'), className: "px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4" }), "Proposer une offre"] })] })] }), _jsxs("div", { className: "grid lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Score TERAS" }), _jsx("p", { className: "text-3xl font-bold text-white", children: enterprise.score || '—' }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["Dernier calcul ", formatDate(scoreMeta.computed_at)] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "CRM mensuel" }), _jsx("p", { className: "text-3xl font-bold text-emerald-400", children: formatCurrency(enterprise.crmLimit) }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: "Capacit\u00E9 de remboursement recommand\u00E9e" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Cr\u00E9dits actifs" }), _jsx("p", { className: "text-3xl font-bold text-white", children: enterprise.activeLoansCount }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: [formatCurrency(enterprise.totalBorrowed), " engag\u00E9s"] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Documents suivis" }), _jsx("p", { className: "text-3xl font-bold text-white", children: docMeta.total_docs || 0 }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: [(docMeta.analyzed_docs ?? docMeta.validated_docs) || 0, " analys\u00E9s \u2022 ", docMeta.applied_docs || 0, " appliqu\u00E9s"] })] })] }), _jsx("div", { className: "flex gap-2 border-b border-slate-800", children: tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), tab.label] }, tab.id));
                }) }), activeTab === 'overview' && (_jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Identit\u00E9 & contacts" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Mail, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Email" }), _jsx("p", { className: "text-white", children: enterprise.email })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Phone, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "T\u00E9l\u00E9phone" }), _jsx("p", { className: "text-white", children: enterprise.phone })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Users, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Effectif" }), _jsxs("p", { className: "text-white", children: [enterprise.employees, " employ\u00E9s"] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(MapPin, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Adresse" }), _jsx("p", { className: "text-white", children: enterprise.address }), _jsxs("p", { className: "text-slate-400 text-sm", children: [enterprise.city, ", ", enterprise.country] })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Calendar, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Membre depuis" }), _jsx("p", { className: "text-white", children: formatDate(enterprise.joinDate) })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Activity, { className: "w-5 h-5 text-slate-400 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Type d\u2019entreprise" }), _jsx("p", { className: "text-white", children: enterprise.enterpriseType })] })] })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Situation financi\u00E8re" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "CA annuel observ\u00E9" }), _jsx("p", { className: "text-2xl font-bold text-white", children: formatCurrency(enterprise.annualRevenue) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "CA mensuel estim\u00E9" }), _jsx("p", { className: "text-2xl font-bold text-white", children: formatCurrency(enterprise.monthlyRevenue) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Endettement cumul\u00E9" }), _jsx("p", { className: "text-2xl font-bold text-amber-400", children: formatCurrency(enterprise.totalBorrowed) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Capacit\u00E9 mensuelle" }), _jsx("p", { className: "text-2xl font-bold text-emerald-400", children: formatCurrency(enterprise.crmLimit) })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Derni\u00E8res demandes de cr\u00E9dit" }), _jsx("div", { className: "space-y-3", children: enterprise.applications.length > 0 ? (enterprise.applications.map((application) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: application.product_name || 'Produit non renseigné' }), _jsxs("p", { className: "text-slate-400 text-xs", children: [application.application_id, " \u2022 ", application.applicant_type === 'enterprise' ? 'Entreprise' : 'Individu'] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-white font-semibold", children: formatCurrency(toNumber(application.requested_amount)) }), _jsxs("p", { className: "text-slate-400 text-xs", children: [application.duration_months, " mois \u2022 ", application.status] })] })] }, application.id)))) : (_jsx("div", { className: "text-slate-500 text-sm", children: "Aucune demande r\u00E9cente pour cette entreprise." })) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "R\u00E9sum\u00E9 dossier" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Demandes totales" }), _jsx("span", { className: "text-white font-semibold", children: appsSummary.total || enterprise.applications.length })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Approuv\u00E9es / actives" }), _jsx("span", { className: "text-white font-semibold", children: (appsSummary.approved || 0) + (appsSummary.active || 0) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Rejets / annulations" }), _jsx("span", { className: "text-white font-semibold", children: (appsSummary.rejected || 0) + (appsSummary.cancelled || 0) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Compte TERAS" }), _jsx("span", { className: "text-white font-semibold", children: enterprise.terasAccountEmail || 'Non lié' })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Lecture rapide banque" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300", children: ["CRM 6 mois recommand\u00E9 : ", formatCurrency(toNumber(capacity.recommended_limit_6m))] }), _jsxs("div", { className: "rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300", children: ["CRM 12 mois recommand\u00E9 : ", formatCurrency(toNumber(capacity.recommended_limit_12m))] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300", children: ["Dernier traitement documentaire : ", formatDate(docMeta.last_processed_at)] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300", children: ["Qualite du dossier : ", _jsx("span", { className: "text-white font-semibold", children: docIntel.dossier_quality || 'a_structurer' })] }), _jsxs("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200", children: ["Actifs document\u00E9s : ", _jsx("span", { className: "font-semibold text-white", children: formatCurrency(toNumber(docIntel.assets_documented_total_xaf || enterprise.passport.metrics?.documented_assets_total_xaf)) }), _jsxs("div", { className: "text-xs text-amber-100/80 mt-1", children: [docIntel.assets_verified_count || 0, " preuve(s) d'actifs reconnue(s)"] })] }), _jsxs("div", { className: "rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-200", children: ["Facturation objectiv\u00E9e : ", _jsx("span", { className: "font-semibold text-white", children: formatCurrency(toNumber(docIntel.invoice_amount_total_xaf || enterprise.passport.metrics?.invoice_amount_total_xaf)) }), _jsxs("div", { className: "text-xs text-blue-100/80 mt-1", children: [docIntel.invoices_analyzed_count || 0, " facture(s) exploit\u00E9e(s)"] })] })] })] })] })] })), activeTab === 'scoring' && (_jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Piliers du score entreprise" }), _jsxs("button", { className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Recalculer"] })] }), enterprise.pillars.length > 0 ? (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Score actuel" }), _jsxs("p", { className: "text-5xl font-bold text-white", children: [enterprise.score, _jsx("span", { className: "text-slate-500 text-2xl", children: " /1000" })] })] }), _jsxs("div", { className: "text-right text-sm text-slate-400", children: [_jsxs("p", { children: ["Secteur moyen : ", scoreMeta.sector_average ?? '—'] }), _jsxs("p", { children: ["Percentile : ", scoreMeta.percentile ?? '—'] }), _jsxs("p", { children: ["Calcul\u00E9 le ", formatDate(scoreMeta.computed_at)] })] })] }), enterprise.pillars.map((pillar) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm", children: pillar.code }), _jsx("span", { className: "text-white font-medium", children: pillar.label })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-white font-semibold", children: [pillar.weighted_points, "/", pillar.max_points] }), _jsxs("p", { className: "text-slate-400 text-xs", children: [Math.round((pillar.ratio || 0) * 100), "%"] })] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full", style: { width: `${Math.round((pillar.ratio || 0) * 100)}%` } }) })] }, pillar.code)))] })) : (_jsx("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300", children: "Aucun score entreprise d\u00E9taill\u00E9 n\u2019est encore disponible pour cette fiche." }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-purple-400" }), "Lecture analytique"] }), _jsxs("div", { className: "space-y-3 text-sm text-slate-300", children: [_jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4", children: ["Score secteur : ", _jsx("span", { className: "text-white font-semibold", children: scoreMeta.sector_average ?? '—' })] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4", children: ["Percentile march\u00E9 : ", _jsx("span", { className: "text-white font-semibold", children: scoreMeta.percentile ?? '—' })] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4", children: ["Bande TERAS actuelle : ", _jsx("span", { className: `text-${getBandColor(enterprise.band)}-400 font-semibold`, children: enterprise.band })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4 text-emerald-400" }), "Recommandation TERAS"] }), _jsx("div", { className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300", children: enterprise.score >= 700
                                            ? "Entreprise suffisamment documentée pour une offre PME structurée."
                                            : "Renforcer le dossier documentaire et l'historique financier avant nouvelle offre." })] })] })] })), activeTab === 'passport' && (_jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Passeport financier banque" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Capacit\u00E9 mensuelle recommand\u00E9e" }), _jsx("p", { className: "text-2xl font-bold text-emerald-400", children: formatCurrency(toNumber(capacity.monthly_repayment_capacity ?? enterprise.crmLimit)) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Plafond recommand\u00E9 6 mois" }), _jsx("p", { className: "text-2xl font-bold text-white", children: formatCurrency(toNumber(capacity.recommended_limit_6m)) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Plafond recommand\u00E9 12 mois" }), _jsx("p", { className: "text-2xl font-bold text-white", children: formatCurrency(toNumber(capacity.recommended_limit_12m)) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Qualit\u00E9 documentaire" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [docMeta.validated_docs || 0, "/", docMeta.total_docs || 0] }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: [Math.round(Number(docIntel.completeness_ratio || 0) * 100), "% de maturite dossier"] })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Dossier documentaire & applicatif" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(FileText, { className: "w-4 h-4 text-blue-400" }), _jsx("p", { className: "text-white font-semibold", children: "Documents" })] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Total : ", docMeta.total_docs || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Analys\u00E9s : ", (docMeta.analyzed_docs ?? docMeta.validated_docs) || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Appliqu\u00E9s : ", docMeta.applied_docs || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["En attente : ", docMeta.pending_docs || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Qualit\u00E9 : ", docIntel.dossier_quality || 'a_structurer'] })] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(CreditCard, { className: "w-4 h-4 text-emerald-400" }), _jsx("p", { className: "text-white font-semibold", children: "Applications" })] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Approuv\u00E9es : ", appsSummary.approved || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Actives : ", appsSummary.active || 0] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["En attente : ", appsSummary.pending || 0] })] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:col-span-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-cyan-400" }), _jsx("p", { className: "text-white font-semibold", children: "Lecture documentaire" })] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Revenu mensuel objectiv\u00E9 : ", formatCurrency(toNumber(docIntel.avg_monthly_revenue_xaf))] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Cashflow moyen observ\u00E9 : ", formatCurrency(toNumber(docIntel.avg_monthly_cashflow_xaf))] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Authenticit\u00E9 moyenne : ", Math.round(Number(docIntel.avg_authenticity || 0) * 100), "%"] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Actifs document\u00E9s : ", formatCurrency(toNumber(docIntel.assets_documented_total_xaf || enterprise.passport.metrics?.documented_assets_total_xaf))] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Facturation objectiv\u00E9e : ", formatCurrency(toNumber(docIntel.invoice_amount_total_xaf || enterprise.passport.metrics?.invoice_amount_total_xaf))] }), _jsxs("p", { className: "text-slate-300 text-sm", children: ["Collat\u00E9ral estim\u00E9 : ", formatCurrency(toNumber(docIntel.collateral_value_xaf || enterprise.passport.metrics?.collateral_value_xaf))] }), _jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: (docIntel.categories || []).map((category) => (_jsx("span", { className: "px-2 py-1 rounded-full bg-slate-700 text-slate-200 text-xs", children: formatDocumentRole(category) }, category))) }), (docIntel.asset_proof_types || []).length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: (docIntel.asset_proof_types || []).map((proofType) => (_jsx("span", { className: "px-2 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs border border-amber-500/20", children: proofType }, proofType))) }))] })] })] })] }), _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4 text-cyan-400" }), "D\u00E9cision banque"] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsx("div", { className: "rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300", children: enterprise.score >= 700
                                                ? 'Passeport financier exploitable pour une proposition bancaire.'
                                                : 'Passeport partiel : compléter les preuves documentaires avant décaissement.' }), _jsxs("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200", children: ["Collat\u00E9ral estim\u00E9 : ", formatCurrency(toNumber(docIntel.collateral_value_xaf || enterprise.passport.metrics?.collateral_value_xaf)), _jsxs("div", { className: "text-xs text-amber-100/80 mt-1", children: ["Force de garantie : ", docIntel.collateral_strength === 'high' ? 'forte' : docIntel.collateral_strength === 'medium' ? 'moyenne' : 'faible'] })] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300", children: ["Compte TERAS li\u00E9 : ", enterprise.terasAccountEmail || 'Non renseigné'] }), _jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300", children: ["Dernier traitement documents : ", formatDate(docMeta.last_processed_at)] }), (docIntel.alerts || []).length > 0 && (_jsx("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200", children: (docIntel.alerts || []).slice(0, 2).map((alert) => (_jsxs("p", { className: "text-sm", children: ["\u2022 ", alert] }, alert))) })), docMeta.latest_summary?.recommended_actions?.length > 0 && (_jsxs("div", { className: "rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300", children: ["Derni\u00E8re action recommand\u00E9e : ", docMeta.latest_summary.recommended_actions[0]] }))] })] }) })] }))] }));
}
