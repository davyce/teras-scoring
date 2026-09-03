import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Building2, DollarSign, Download, Eye, Plus, RefreshCw, Search, TrendingUp, Users, } from 'lucide-react';
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
function normalizeEnterprise(raw) {
    const score = Math.max(0, Math.round(toNumber(raw.teras_score)));
    return {
        id: raw.id,
        displayName: raw.legal_name || raw.name || `Entreprise #${raw.id}`,
        commercialName: raw.name || raw.legal_name || `Entreprise #${raw.id}`,
        taxId: raw.tax_id || '—',
        registrationNumber: raw.registration_number || '—',
        sector: raw.sector || 'Non renseigne',
        email: raw.email || '—',
        phone: raw.phone || '—',
        employees: raw.employees_count || 0,
        revenue: toNumber(raw.annual_revenue),
        score,
        band: raw.teras_band || inferBand(score),
        status: raw.status || 'inactive',
        activeLoansCount: raw.active_loans_count || 0,
        totalBorrowed: toNumber(raw.total_borrowed),
        crmLimit: toNumber(raw.crm_limit),
        createdAt: raw.created_at || raw.join_date || '',
    };
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
function formatCurrency(amount) {
    if (!amount)
        return '0 FCFA';
    return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}
function formatCompactCurrency(amount) {
    if (!amount)
        return '0';
    if (amount >= 1000000000)
        return `${(amount / 1000000000).toFixed(1)} Md`;
    if (amount >= 1000000)
        return `${(amount / 1000000).toFixed(1)} M`;
    if (amount >= 1000)
        return `${Math.round(amount / 1000)} k`;
    return `${Math.round(amount)}`;
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
function formatRelativeDate(dateString) {
    if (!dateString)
        return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()))
        return '—';
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return "Aujourd'hui";
    if (diffDays === 1)
        return 'Hier';
    if (diffDays < 7)
        return `Il y a ${diffDays} jours`;
    if (diffDays < 30)
        return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export default function BankEnterprises() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBand, setSelectedBand] = useState('all');
    const [selectedSector, setSelectedSector] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [enterprises, setEnterprises] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState(null);
    const loadEnterprises = async (showSpinner = true) => {
        if (showSpinner)
            setLoading(true);
        else
            setRefreshing(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/bank/enterprises/?page_size=100');
            const payload = await readApiPayload(res);
            if (!res.ok)
                throw new Error(payload.error || `Erreur ${res.status}`);
            const items = Array.isArray(payload) ? payload : (payload.results ?? payload.data ?? []);
            setEnterprises(items.map(normalizeEnterprise));
        }
        catch (e) {
            setError(e.message || 'Impossible de charger le portefeuille entreprises.');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    React.useEffect(() => {
        loadEnterprises(true);
    }, []);
    const sectors = (() => {
        const values = Array.from(new Set(enterprises.map((enterprise) => enterprise.sector))).sort();
        return [{ value: 'all', label: 'Tous les secteurs' }, ...values.map((value) => ({ value, label: value }))];
    })();
    const bands = [
        { value: 'all', label: 'Toutes les bandes' },
        { value: 'A+', label: 'A+ (900-1000)' },
        { value: 'A', label: 'A (800-899)' },
        { value: 'B', label: 'B (700-799)' },
        { value: 'C', label: 'C (600-699)' },
        { value: 'D', label: 'D (500-599)' },
        { value: 'E', label: 'E (<500)' },
    ];
    const statuses = [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' },
        { value: 'suspended', label: 'Suspendu' },
    ];
    const filteredEnterprises = enterprises.filter((enterprise) => {
        const haystack = [
            enterprise.displayName,
            enterprise.commercialName,
            enterprise.taxId,
            enterprise.registrationNumber,
            enterprise.email,
            String(enterprise.id),
        ].join(' ').toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesBand = selectedBand === 'all' || enterprise.band === selectedBand;
        const matchesSector = selectedSector === 'all' || enterprise.sector === selectedSector;
        const matchesStatus = selectedStatus === 'all' || enterprise.status === selectedStatus;
        return matchesSearch && matchesBand && matchesSector && matchesStatus;
    });
    const totalEnterprises = enterprises.length;
    const activeEnterprises = enterprises.filter((enterprise) => enterprise.status === 'active').length;
    const totalRevenue = enterprises.reduce((sum, enterprise) => sum + enterprise.revenue, 0);
    const employeesTotal = enterprises.reduce((sum, enterprise) => sum + enterprise.employees, 0);
    const scoredEnterprises = enterprises.filter((enterprise) => enterprise.score > 0);
    const avgScore = scoredEnterprises.length
        ? scoredEnterprises.reduce((sum, enterprise) => sum + enterprise.score, 0) / scoredEnterprises.length
        : 0;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Entreprises" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Portefeuille entreprises aligne sur les donnees bancaires reelles" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: () => loadEnterprises(false), className: "px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${refreshing ? 'animate-spin' : ''}` }), "Actualiser"] }), _jsxs("button", { onClick: () => navigate('/bank/enterprises/new'), className: "px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20", children: [_jsx(Plus, { className: "w-5 h-5" }), "Nouvelle entreprise"] })] })] }), error && (_jsx("div", { className: "rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300", children: error })), _jsxs("div", { className: "grid lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx(Building2, { className: "w-10 h-10 text-blue-400" }), _jsxs("span", { className: "text-green-400 text-sm font-medium", children: [activeEnterprises, "/", totalEnterprises] })] }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Entreprises actives" }), _jsx("p", { className: "text-3xl font-bold text-white", children: activeEnterprises })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx(DollarSign, { className: "w-10 h-10 text-green-400" }) }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: "CA total observe" }), _jsxs("p", { className: "text-3xl font-bold text-white", children: [(totalRevenue / 1000000).toFixed(1), "M"] }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: "FCFA annuel cumule" })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx(TrendingUp, { className: "w-10 h-10 text-amber-400" }) }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Score TERAS moyen" }), _jsx("p", { className: "text-3xl font-bold text-white", children: Math.round(avgScore) })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx(Users, { className: "w-10 h-10 text-purple-400" }) }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Effectifs cumules" }), _jsx("p", { className: "text-3xl font-bold text-white", children: employeesTotal })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "grid lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "text", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Rechercher par nom, RCCM, NIU, email...", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] }) }), _jsx("div", { children: _jsx("select", { value: selectedBand, onChange: (e) => setSelectedBand(e.target.value), className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", children: bands.map((band) => (_jsx("option", { value: band.value, children: band.label }, band.value))) }) }), _jsx("div", { children: _jsx("select", { value: selectedSector, onChange: (e) => setSelectedSector(e.target.value), className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", children: sectors.map((sector) => (_jsx("option", { value: sector.value, children: sector.label }, sector.value))) }) })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50", children: statuses.map((status) => (_jsx("option", { value: status.value, children: status.label }, status.value))) }), _jsxs("button", { className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm", children: [_jsx(Download, { className: "w-4 h-4" }), "Exporter"] })] }), _jsxs("p", { className: "text-slate-400 text-sm", children: [filteredEnterprises.length, " entreprise(s) trouvee(s)"] })] })] }), _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden", children: loading ? (_jsxs("div", { className: "flex items-center justify-center py-20 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-sky-400" }), "Chargement du portefeuille entreprises\u2026"] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-800/50 border-b border-slate-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: _jsxs("button", { className: "flex items-center gap-2 hover:text-white transition-colors", children: ["Entreprise", _jsx(ArrowUpDown, { className: "w-4 h-4" })] }) }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Secteur" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Score TERAS" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Employes" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "CA annuel" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Endettement actif" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Dossier bancaire" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-slate-300", children: "Actions" })] }) }), _jsxs("tbody", { className: "divide-y divide-slate-800/50", children: [filteredEnterprises.map((enterprise) => (_jsxs("tr", { className: "hover:bg-slate-800/30 transition-colors cursor-pointer", onClick: () => navigate(`/bank/enterprises/${enterprise.id}`), children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: enterprise.displayName }), _jsx("p", { className: "text-slate-400 text-sm", children: enterprise.commercialName }), _jsxs("p", { className: "text-slate-500 text-xs mt-0.5", children: ["RCCM ", enterprise.registrationNumber, " \u2022 NIU ", enterprise.taxId] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-lg", children: enterprise.sector }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white font-semibold text-lg", children: enterprise.score || '—' }), _jsx("span", { className: `px-2 py-1 bg-${getBandColor(enterprise.band)}-500/10 text-${getBandColor(enterprise.band)}-400 text-xs rounded-full font-semibold`, children: enterprise.band })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-slate-400" }), _jsx("span", { className: "text-white", children: enterprise.employees })] }) }), _jsxs("td", { className: "px-6 py-4", children: [_jsxs("div", { className: "text-white", children: [formatCompactCurrency(enterprise.revenue), " FCFA"] }), _jsx("div", { className: "text-slate-400 text-xs", children: formatCurrency(enterprise.revenue) })] }), _jsx("td", { className: "px-6 py-4", children: enterprise.activeLoansCount > 0 ? (_jsxs("div", { children: [_jsxs("div", { className: "text-white font-medium", children: [formatCompactCurrency(enterprise.totalBorrowed), " FCFA"] }), _jsxs("div", { className: "text-green-400 text-xs", children: [enterprise.activeLoansCount, " credit(s) actif(s)"] })] })) : (_jsx("span", { className: "text-slate-400 text-sm", children: "Aucun credit actif" })) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsxs("div", { className: "text-white font-medium", children: [formatCompactCurrency(enterprise.crmLimit), " FCFA"] }), _jsxs("div", { className: "text-slate-400 text-xs", children: ["CRM mensuel \u2022 ", getStatusLabel(enterprise.status), " \u2022 ", formatRelativeDate(enterprise.createdAt)] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        navigate(`/bank/enterprises/${enterprise.id}`);
                                                    }, className: "p-2 hover:bg-slate-700 rounded-lg transition-colors", title: "Voir les details", children: _jsx(Eye, { className: "w-4 h-4 text-slate-400 hover:text-white" }) }) })] }, enterprise.id))), filteredEnterprises.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-14 text-center text-slate-500", children: "Aucune entreprise ne correspond aux filtres actuels." }) }))] })] }) })) })] }));
}
