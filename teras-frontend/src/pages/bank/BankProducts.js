import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, CreditCard, PiggyBank, TrendingUp, CheckCircle, Calculator, BarChart3, Edit, AlertCircle, RefreshCw, Leaf, GraduationCap, Home, Bike, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    microcredit: { icon: Bike, color: 'amber', tab: 'micro' },
    salary: { icon: CreditCard, color: 'blue', tab: 'personal' },
    personal: { icon: CreditCard, color: 'blue', tab: 'personal' },
    auto: { icon: Bike, color: 'cyan', tab: 'personal' },
    immobilier: { icon: Home, color: 'emerald', tab: 'immobilier' },
    pme: { icon: TrendingUp, color: 'purple', tab: 'pme' },
    agricole: { icon: Leaf, color: 'green', tab: 'agricole' },
    education: { icon: GraduationCap, color: 'pink', tab: 'education' },
    epargne: { icon: PiggyBank, color: 'teal', tab: 'epargne' },
    other: { icon: Package, color: 'slate', tab: 'other' },
};
const RISK_COLOR = {
    low: 'text-emerald-400 bg-emerald-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    high: 'text-red-400 bg-red-500/10',
};
const BAND_COLOR = {
    A: 'text-emerald-400', B: 'text-green-400', C: 'text-amber-400',
    D: 'text-orange-400', E: 'text-red-400',
};
function formatFCFA(val) {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k FCFA`;
    return `${n.toLocaleString()} FCFA`;
}
// ── Composant ─────────────────────────────────────────────────────────────────
export default function BankProducts() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editProduct, setEditProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    // ── Charger les produits ──────────────────────────────────────────────────
    const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/bank/products/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            const list = Array.isArray(json) ? json : (json.results ?? []);
            setProducts(list);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    React.useEffect(() => { loadProducts(); }, []);
    // ── Tabs dynamiques depuis les produits ──────────────────────────────────
    const tabs = [
        { value: 'all', label: 'Tous', count: products.length },
        { value: 'micro', label: 'Microcrédit', count: products.filter(p => p.product_type === 'microcredit').length },
        { value: 'personal', label: 'Particulier', count: products.filter(p => ['personal', 'salary', 'auto'].includes(p.product_type)).length },
        { value: 'pme', label: 'PME', count: products.filter(p => p.product_type === 'pme').length },
        { value: 'immobilier', label: 'Immobilier', count: products.filter(p => p.product_type === 'immobilier').length },
        { value: 'agricole', label: 'Agricole', count: products.filter(p => p.product_type === 'agricole').length },
        { value: 'education', label: 'Éducation', count: products.filter(p => p.product_type === 'education').length },
    ].filter(t => t.value === 'all' || t.count > 0);
    const filtered = products.filter(p => {
        const cfg = TYPE_CONFIG[p.product_type] || TYPE_CONFIG.other;
        const matchTab = activeTab === 'all' || cfg.tab === activeTab;
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });
    // ── Sauvegarde édition ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (!editProduct)
            return;
        setSaving(true);
        try {
            const res = await authFetch(`/api/scoring/bank/products/${editProduct.id}/update/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interest_rate: editProduct.interest_rate,
                    min_amount: editProduct.min_amount,
                    max_amount: editProduct.max_amount,
                    min_duration_months: editProduct.min_duration_months,
                    max_duration_months: editProduct.max_duration_months,
                    min_score_required: editProduct.min_score_required,
                    origination_fee: editProduct.origination_fee,
                    is_active: editProduct.is_active,
                    description: editProduct.description,
                }),
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            setEditProduct(null);
            loadProducts();
        }
        catch (e) {
            alert(`Erreur sauvegarde: ${e.message}`);
        }
        finally {
            setSaving(false);
        }
    };
    // ── Render ────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Produits Financiers" }), _jsxs("p", { className: "text-slate-400 mt-1", children: ["Catalogue et gestion de ", products.length, " produits"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: () => navigate('/bank/analytics'), className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm", children: [_jsx(BarChart3, { className: "w-4 h-4" }), " Analytics"] }), _jsxs("button", { onClick: () => navigate('/bank/simulator'), className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm", children: [_jsx(Calculator, { className: "w-4 h-4" }), " Simulateur"] }), _jsxs("button", { onClick: () => navigate('/bank/products/create'), className: "px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-blue-500/20", children: [_jsx(Plus, { className: "w-4 h-4" }), " Cr\u00E9er un Produit"] })] })] }), error && (_jsxs("div", { className: "bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm", children: [_jsx(AlertCircle, { className: "w-5 h-5 shrink-0" }), " ", error, _jsxs("button", { onClick: loadProducts, className: "ml-auto flex items-center gap-1 hover:text-red-100", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " R\u00E9essayer"] })] })), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "text", value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher un produit...", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50" })] }) }), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-2", children: _jsx("div", { className: "flex items-center gap-2 overflow-x-auto", children: tabs.map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.value), className: `flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap text-sm ${activeTab === tab.value
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`, children: [tab.label, _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.value ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700 text-slate-400'}`, children: tab.count })] }, tab.value))) }) }), loading && (_jsxs("div", { className: "flex items-center justify-center py-16 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-blue-400" }), "Chargement des produits\u2026"] })), !loading && (_jsx("div", { className: "grid lg:grid-cols-2 xl:grid-cols-3 gap-6", children: filtered.map(product => {
                    const cfg = TYPE_CONFIG[product.product_type] || TYPE_CONFIG.other;
                    const Icon = cfg.icon;
                    const color = cfg.color;
                    return (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col gap-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-white font-semibold text-sm", children: product.name }), product.is_active && _jsx("span", { className: "w-2 h-2 bg-emerald-400 rounded-full" })] }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${RISK_COLOR[product.risk_level] || 'text-slate-400 bg-slate-700'}`, children: product.risk_level_display })] })] }), _jsx("button", { onClick: () => setEditProduct(product), className: "p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors", children: _jsx(Edit, { className: "w-4 h-4" }) })] }), _jsx("p", { className: "text-slate-400 text-xs leading-relaxed line-clamp-2", children: product.description }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Montant" }), _jsxs("p", { className: "text-white font-semibold", children: [formatFCFA(product.min_amount), " \u2013 ", formatFCFA(product.max_amount)] })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Taux annuel" }), _jsxs("p", { className: "text-white font-semibold", children: [product.interest_rate, "%"] })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [product.min_duration_months, "\u2013", product.max_duration_months, " mois"] })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Score min" }), _jsxs("p", { className: `font-semibold ${BAND_COLOR[product.band_required] || 'text-white'}`, children: [product.min_score_required, " ", _jsxs("span", { className: "text-slate-400", children: ["(", product.band_required, ")"] })] })] })] }), product.features?.length > 0 && (_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-2 font-medium", children: "\u2713 Avantages" }), _jsx("ul", { className: "space-y-1", children: product.features.slice(0, 3).map((f, i) => (_jsxs("li", { className: "flex items-start gap-2 text-slate-300 text-xs", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400 shrink-0 mt-0.5" }), f] }, i))) })] })), product.requirements?.length > 0 && (_jsxs("div", { className: "bg-slate-800/20 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-2 font-medium", children: "\uD83D\uDCCB Conditions" }), _jsx("ul", { className: "space-y-1", children: product.requirements.slice(0, 3).map((r, i) => (_jsxs("li", { className: "text-slate-400 text-xs flex items-start gap-1.5", children: [_jsx("span", { className: "text-slate-600 mt-0.5", children: "\u2022" }), " ", r] }, i))) })] })), _jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800/50", children: [_jsxs("span", { children: [product.applications_count, " demandes"] }), _jsx("span", { children: parseFloat(product.total_disbursed) > 0 ? formatFCFA(product.total_disbursed) + ' décaissés' : 'Nouveau produit' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => navigate('/bank/simulator'), className: "flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors", children: [_jsx(Calculator, { className: "w-3.5 h-3.5" }), " Simuler"] }), _jsxs("button", { onClick: () => setEditProduct(product), className: "flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors", children: [_jsx(Edit, { className: "w-3.5 h-3.5" }), " Modifier"] })] })] }, product.id));
                }) })), !loading && filtered.length === 0 && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-12 text-center", children: [_jsx(Package, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-semibold mb-2", children: "Aucun produit trouv\u00E9" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Modifiez votre recherche ou cr\u00E9ez un nouveau produit." })] })), editProduct && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-white font-bold text-lg", children: ["Modifier \u2014 ", editProduct.name] }), _jsx("button", { onClick: () => setEditProduct(null), className: "text-slate-400 hover:text-white text-xl", children: "\u2715" })] }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: [
                                { label: 'Taux (%/an)', field: 'interest_rate', type: 'number', step: '0.1' },
                                { label: 'Frais dossier (%)', field: 'origination_fee', type: 'number', step: '0.1' },
                                { label: 'Montant min (FCFA)', field: 'min_amount', type: 'number', step: '1000' },
                                { label: 'Montant max (FCFA)', field: 'max_amount', type: 'number', step: '1000' },
                                { label: 'Durée min (mois)', field: 'min_duration_months', type: 'number', step: '1' },
                                { label: 'Durée max (mois)', field: 'max_duration_months', type: 'number', step: '1' },
                                { label: 'Score min TERAS', field: 'min_score_required', type: 'number', step: '10' },
                            ].map(({ label, field, type, step }) => (_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1 block", children: label }), _jsx("input", { type: type, step: step, value: editProduct[field], onChange: e => setEditProduct({ ...editProduct, [field]: e.target.value }), className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" })] }, field))) }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1 block", children: "Description" }), _jsx("textarea", { value: editProduct.description, onChange: e => setEditProduct({ ...editProduct, description: e.target.value }), rows: 3, className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("label", { className: "text-slate-300 text-sm flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: editProduct.is_active, onChange: e => setEditProduct({ ...editProduct, is_active: e.target.checked }), className: "w-4 h-4 accent-blue-500" }), "Produit actif"] }) }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { onClick: () => setEditProduct(null), className: "flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2", children: saving ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Sauvegarde\u2026"] }) : 'Enregistrer' })] })] }) }))] }));
}
