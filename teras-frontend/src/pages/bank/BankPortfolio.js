import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, Clock, DollarSign, Eye, FileText, Percent, RefreshCw, ShieldCheck, TrendingUp, User, Users, } from 'lucide-react';
function toNumber(value) {
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}
function formatCurrency(amount) {
    return `${Math.round(amount || 0).toLocaleString('fr-FR')} FCFA`;
}
function formatCompactCurrency(amount) {
    if (amount >= 1000000000)
        return `${(amount / 1000000000).toFixed(1)} Md FCFA`;
    if (amount >= 1000000)
        return `${(amount / 1000000).toFixed(1)} M FCFA`;
    if (amount >= 1000)
        return `${Math.round(amount / 1000)} k FCFA`;
    return formatCurrency(amount);
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
function getRiskMeta(risk) {
    const normalized = (risk || '').toLowerCase();
    if (normalized === 'low')
        return { label: 'Faible', color: 'emerald' };
    if (normalized === 'medium')
        return { label: 'Moyen', color: 'amber' };
    if (normalized === 'high' || normalized === 'critical')
        return { label: 'Élevé', color: 'rose' };
    return { label: 'À calculer', color: 'slate' };
}
function getStatusMeta(status) {
    switch ((status || '').toLowerCase()) {
        case 'disbursed':
            return { label: 'Actif', color: 'emerald', bucket: 'active' };
        case 'approved':
            return { label: 'Approuvé', color: 'green', bucket: 'approved' };
        case 'review':
            return { label: 'En revue', color: 'sky', bucket: 'review' };
        case 'pending':
            return { label: 'En attente', color: 'amber', bucket: 'pending' };
        case 'rejected':
            return { label: 'Rejeté', color: 'rose', bucket: 'closed' };
        case 'cancelled':
            return { label: 'Annulé', color: 'slate', bucket: 'closed' };
        default:
            return { label: status || '—', color: 'slate', bucket: 'other' };
    }
}
export default function BankPortfolio() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRisk, setFilterRisk] = useState('all');
    const [loans, setLoans] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadPortfolio = async () => {
        setLoading(true);
        setError(null);
        try {
            const [loansRes, analyticsRes] = await Promise.all([
                authFetch('/api/scoring/bank/applications/?page_size=200'),
                authFetch('/api/scoring/bank/analytics/'),
            ]);
            const loansPayload = await loansRes.json().catch(() => ({}));
            const analyticsPayload = await analyticsRes.json().catch(() => ({}));
            if (!loansRes.ok)
                throw new Error(loansPayload.error || `Erreur ${loansRes.status}`);
            if (!analyticsRes.ok)
                throw new Error(analyticsPayload.error || `Erreur ${analyticsRes.status}`);
            setLoans(Array.isArray(loansPayload) ? loansPayload : (loansPayload.results ?? []));
            setAnalytics(analyticsPayload);
        }
        catch (e) {
            setError(e.message || 'Impossible de charger le portefeuille.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadPortfolio();
    }, []);
    const filteredLoans = useMemo(() => {
        return loans.filter((loan) => {
            const searchValue = search.trim().toLowerCase();
            const riskValue = (loan.risk_level || '').toLowerCase();
            const matchesSearch = !searchValue || [
                loan.application_id,
                loan.client_name,
                loan.enterprise_name,
                loan.product_name,
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
            const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
            const matchesRisk = filterRisk === 'all' || riskValue === filterRisk;
            return matchesSearch && matchesStatus && matchesRisk;
        });
    }, [filterRisk, filterStatus, loans, search]);
    const statusCounts = useMemo(() => {
        const counts = { active: 0, approved: 0, pending: 0, review: 0, closed: 0, other: 0 };
        for (const loan of filteredLoans) {
            const meta = getStatusMeta(loan.status);
            counts[meta.bucket] += 1;
        }
        return counts;
    }, [filteredLoans]);
    const riskCounts = useMemo(() => {
        const counts = { low: 0, medium: 0, high: 0, unknown: 0 };
        for (const loan of filteredLoans) {
            const risk = (loan.risk_level || '').toLowerCase();
            if (risk === 'low')
                counts.low += 1;
            else if (risk === 'medium')
                counts.medium += 1;
            else if (risk === 'high' || risk === 'critical')
                counts.high += 1;
            else
                counts.unknown += 1;
        }
        return counts;
    }, [filteredLoans]);
    const totalFilteredVolume = filteredLoans.reduce((sum, loan) => sum + toNumber(loan.requested_amount), 0);
    const avgFilteredScore = filteredLoans.length
        ? Math.round(filteredLoans
            .filter((loan) => loan.teras_score_at_application != null)
            .reduce((sum, loan, _, arr) => sum + (loan.teras_score_at_application || 0) / Math.max(arr.length, 1), 0))
        : 0;
    const portfolioValue = toNumber(analytics?.overview?.portfolioValue);
    const avgTicket = toNumber(analytics?.overview?.avgTicket);
    const totalLoans = toNumber(analytics?.overview?.totalLoans || loans.length);
    const portfolioHealth = toNumber(analytics?.riskMetrics?.portfolioHealth);
    const defaultRate = toNumber(analytics?.riskMetrics?.defaultRate);
    const collectionRate = toNumber(analytics?.riskMetrics?.collectionRate);
    const provisions = toNumber(analytics?.riskMetrics?.provisions);
    const ratio = (value, total) => (total > 0 ? (value / total) * 100 : 0);
    const openDossier = (loan) => {
        if (loan.applicant_type === 'individual' && loan.client) {
            navigate(`/bank/clients/${loan.client}`);
            return;
        }
        if (loan.applicant_type === 'enterprise' && loan.enterprise) {
            navigate(`/bank/enterprises/${loan.enterprise}`);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center h-96 gap-3 text-slate-300", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-cyan-400" }), "Chargement du portefeuille\u2026"] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Portefeuille de Cr\u00E9dits" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Suivi consolid\u00E9 des demandes, offres valid\u00E9es et cr\u00E9dits actifs de la banque." })] }), _jsxs("button", { onClick: loadPortfolio, className: "inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Actualiser"] })] }), error && (_jsxs("div", { className: "bg-rose-900/30 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-sm", children: [_jsx(AlertTriangle, { className: "w-4 h-4 shrink-0" }), error] })), _jsx("div", { className: "grid grid-cols-2 xl:grid-cols-6 gap-4", children: [
                    { label: 'Encours actif', value: formatCompactCurrency(portfolioValue), icon: DollarSign, color: 'blue' },
                    { label: 'Santé portefeuille', value: `${portfolioHealth.toFixed(1)}%`, icon: ShieldCheck, color: 'emerald' },
                    { label: 'Taux de retard', value: `${defaultRate.toFixed(1)}%`, icon: Clock, color: 'amber' },
                    { label: 'Taux de collecte', value: `${collectionRate.toFixed(1)}%`, icon: TrendingUp, color: 'cyan' },
                    { label: 'Ticket moyen', value: formatCompactCurrency(avgTicket), icon: Percent, color: 'violet' },
                    { label: 'Crédits suivis', value: totalLoans.toLocaleString('fr-FR'), icon: Users, color: 'purple' },
                ].map(({ label, value, icon: Icon, color }) => (_jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-11 h-11 rounded-xl bg-${color}-500/15 flex items-center justify-center`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-300` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: label }), _jsx("p", { className: "text-white text-2xl font-bold", children: value })] })] }) }, label))) }), _jsxs("div", { className: "grid xl:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("h2", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(FileText, { className: "w-5 h-5 text-emerald-300" }), "R\u00E9partition par statut"] }), _jsxs("span", { className: "text-slate-500 text-xs", children: [filteredLoans.length, " dossier(s) filtr\u00E9(s)"] })] }), _jsx("div", { className: "space-y-4", children: [
                                    { label: 'Actifs', value: statusCounts.active, color: 'bg-emerald-500' },
                                    { label: 'Approuvés', value: statusCounts.approved, color: 'bg-green-500' },
                                    { label: 'En instruction', value: statusCounts.pending + statusCounts.review, color: 'bg-amber-500' },
                                    { label: 'Clôturés', value: statusCounts.closed, color: 'bg-slate-500' },
                                ].map((item) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-sm mb-1.5", children: [_jsx("span", { className: "text-slate-300", children: item.label }), _jsxs("span", { className: "text-white font-semibold", children: [item.value, " (", ratio(item.value, filteredLoans.length).toFixed(0), "%)"] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${item.color}`, style: { width: `${ratio(item.value, filteredLoans.length)}%` } }) })] }, item.label))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("h2", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-300" }), "Lecture risque & pilotage"] }), _jsxs("span", { className: "text-slate-500 text-xs", children: ["Provision recommand\u00E9e : ", formatCompactCurrency(provisions)] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-950/60 p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Volume filtr\u00E9" }), _jsx("p", { className: "text-white text-xl font-bold", children: formatCompactCurrency(totalFilteredVolume) }), _jsx("p", { className: "text-slate-400 text-xs mt-3", children: "Score moyen filtr\u00E9" }), _jsx("p", { className: "text-cyan-300 text-lg font-semibold", children: avgFilteredScore || '—' })] }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2", children: [[
                                                { label: 'Risque faible', value: riskCounts.low, color: 'text-emerald-300' },
                                                { label: 'Risque moyen', value: riskCounts.medium, color: 'text-amber-300' },
                                                { label: 'Risque élevé', value: riskCounts.high, color: 'text-rose-300' },
                                            ].map((risk) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-slate-300", children: risk.label }), _jsx("span", { className: `${risk.color} font-semibold`, children: risk.value })] }, risk.label))), _jsxs("div", { className: "pt-2 border-t border-slate-800 text-xs text-slate-500", children: ["En attente : ", toNumber(analytics?.counts?.pendingApplications), " \u2022 Rejet\u00E9es : ", toNumber(analytics?.counts?.rejectedApplications)] })] })] })] })] }), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: _jsxs("div", { className: "grid lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { className: "text-slate-400 text-xs block mb-2", children: "Recherche dossier" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Client, produit, identifiant\u2026", className: "w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs block mb-2", children: "Filtrer par statut" }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500/50", children: [_jsx("option", { value: "all", children: "Tous les statuts" }), _jsx("option", { value: "pending", children: "En attente" }), _jsx("option", { value: "review", children: "En revue" }), _jsx("option", { value: "approved", children: "Approuv\u00E9s" }), _jsx("option", { value: "disbursed", children: "Actifs" }), _jsx("option", { value: "rejected", children: "Rejet\u00E9s" }), _jsx("option", { value: "cancelled", children: "Annul\u00E9s" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs block mb-2", children: "Filtrer par risque" }), _jsxs("select", { value: filterRisk, onChange: (e) => setFilterRisk(e.target.value), className: "w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500/50", children: [_jsx("option", { value: "all", children: "Tous les niveaux" }), _jsx("option", { value: "low", children: "Faible" }), _jsx("option", { value: "medium", children: "Moyen" }), _jsx("option", { value: "high", children: "\u00C9lev\u00E9" }), _jsx("option", { value: "critical", children: "Critique" })] })] })] }) }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[1100px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800", children: [_jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Dossier" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Client" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Produit" }), _jsx("th", { className: "text-right p-4 text-slate-400 font-medium", children: "Montant" }), _jsx("th", { className: "text-right p-4 text-slate-400 font-medium", children: "Mensualit\u00E9" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Score" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Statut" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Risque" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "D\u00E9pos\u00E9 le" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Actions" })] }) }), _jsx("tbody", { children: filteredLoans.map((loan) => {
                                        const statusMeta = getStatusMeta(loan.status);
                                        const riskMeta = getRiskMeta(loan.risk_level);
                                        const isEnterprise = loan.applicant_type === 'enterprise';
                                        const hasDossier = Boolean((isEnterprise && loan.enterprise) || (!isEnterprise && loan.client));
                                        return (_jsxs("tr", { className: "border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors", children: [_jsxs("td", { className: "p-4", children: [_jsx("p", { className: "text-white font-medium", children: loan.application_id }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: [toNumber(loan.interest_rate).toFixed(1), "% \u2022 ", loan.duration_months || 0, " mois"] })] }), _jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${isEnterprise ? 'bg-purple-500/20' : 'bg-blue-500/20'}`, children: isEnterprise ? (_jsx(Building2, { className: "w-5 h-5 text-purple-300" })) : (_jsx(User, { className: "w-5 h-5 text-blue-300" })) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: loan.client_name || loan.enterprise_name || '—' }), _jsx("p", { className: "text-slate-500 text-xs", children: isEnterprise ? 'Entreprise' : 'Particulier' })] })] }) }), _jsxs("td", { className: "p-4", children: [_jsx("p", { className: "text-white", children: loan.product_name || '—' }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: loan.product_type || 'Produit crédit' })] }), _jsxs("td", { className: "p-4 text-right", children: [_jsx("p", { className: "text-white font-semibold", children: formatCurrency(toNumber(loan.requested_amount)) }), _jsxs("p", { className: "text-slate-500 text-xs mt-1", children: ["Total th\u00E9orique: ", formatCompactCurrency(toNumber(loan.total_repayment))] })] }), _jsxs("td", { className: "p-4 text-right", children: [_jsx("p", { className: "text-cyan-300 font-semibold", children: formatCurrency(toNumber(loan.monthly_payment)) }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: "mensualit\u00E9 estim\u00E9e" })] }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: "text-white font-semibold", children: loan.teras_score_at_application ?? '—' }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: `px-3 py-1 rounded-lg text-sm bg-${statusMeta.color}-500/10 text-${statusMeta.color}-300`, children: statusMeta.label }) }), _jsx("td", { className: "p-4 text-center", children: _jsx("span", { className: `px-3 py-1 rounded-lg text-sm bg-${riskMeta.color}-500/10 text-${riskMeta.color}-300`, children: riskMeta.label }) }), _jsx("td", { className: "p-4", children: _jsx("p", { className: "text-slate-300 text-sm", children: formatDate(loan.created_at) }) }), _jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => openDossier(loan), disabled: !hasDossier, className: "p-2 hover:bg-cyan-500/20 text-cyan-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed", title: "Voir le dossier", children: _jsx(Eye, { className: "w-4 h-4" }) }), (loan.status === 'pending' || loan.status === 'review') && (_jsx("button", { onClick: () => navigate('/bank/applications/pending'), className: "px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs transition-colors", children: "Traiter" }))] }) })] }, loan.id));
                                    }) })] }) }), filteredLoans.length === 0 && (_jsxs("div", { className: "text-center py-14", children: [_jsx(DollarSign, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400", children: "Aucun dossier ne correspond aux filtres actuels." })] }))] })] }));
}
