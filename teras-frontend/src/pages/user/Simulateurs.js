import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Simulateurs TERAS — VERSION AMÉLIORÉE
 * ✅ Calcul en temps réel (pas besoin de cliquer)
 * ✅ Produits bancaires réels intégrés
 * ✅ Amortissement visuel
 * ✅ CTA "Faire une demande" post-simulation
 * ✅ Design FCFA / Congo Brazzaville
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, PiggyBank, Target, TrendingUp, AlertCircle, CheckCircle, DollarSign, Calendar, Percent, ArrowRight, BarChart3, Zap, RefreshCw, Send, ChevronDown, ChevronUp, Info, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => {
    if (!n || isNaN(n))
        return '0';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k`;
    return n.toLocaleString('fr-FR');
};
const fmtFull = (n) => `${fmt(n)} FCFA`;
// ── Composant Slider enrichi ──────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format, color = '#0ea5e9' }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("label", { className: "text-slate-300 text-sm font-medium", children: label }), _jsx("span", { className: "text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-lg", children: format(value) })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "range", min: min, max: max, step: step, value: value, onChange: e => onChange(Number(e.target.value)), className: "w-full h-2 appearance-none rounded-full cursor-pointer", style: { background: `linear-gradient(to right, ${color} ${pct}%, #1e293b ${pct}%)` } }), _jsxs("div", { className: "flex justify-between text-slate-600 text-xs mt-1", children: [_jsx("span", { children: format(min) }), _jsx("span", { children: format(max) })] })] })] }));
}
// ── Mini barre de progression ─────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
    return (_jsx("div", { className: "h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${color}`, style: { width: `${Math.min((value / max) * 100, 100)}%` } }) }));
}
// ═══════════════════════════════════════════════════════════════════════
// 1. SIMULATEUR CRÉDIT
// ═══════════════════════════════════════════════════════════════════════
function CreditSimulator() {
    const navigate = useNavigate();
    const [amount, setAmount] = useState(500000);
    const [duration, setDuration] = useState(12);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showTable, setShowTable] = useState(false);
    const [useBank, setUseBank] = useState(false); // mode: taux banque vs taux backend
    // Charger les produits bancaires
    useEffect(() => {
        authFetch('/api/scoring/bank/products/').then(r => r.json())
            .then(d => { const list = Array.isArray(d) ? d : (d.results || []); setProducts(list.filter((p) => p.is_active)); })
            .catch(() => { });
    }, []);
    // Calcul temps réel avec produit banque
    const calcWithProduct = useCallback(() => {
        if (!selectedProduct)
            return;
        const rate = parseFloat(selectedProduct.interest_rate) / 100 / 12;
        const n = duration;
        const amt = amount;
        const fees = amt * (parseFloat(selectedProduct.origination_fee || '1.5') / 100);
        const monthly = rate > 0 ? amt * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amt / n;
        const total = monthly * n;
        setResult({
            is_feasible: true,
            monthly_payment: Math.round(monthly),
            total_cost: Math.round(total + fees),
            total_interest: Math.round(total - amt),
            fees: Math.round(fees),
            interest_rate: `${selectedProduct.interest_rate}%/an`,
            from_bank: true,
            product_name: selectedProduct.name,
            amortization: buildAmortization(amt, rate, monthly, n),
        });
    }, [selectedProduct, amount, duration]);
    useEffect(() => { if (useBank && selectedProduct)
        calcWithProduct(); }, [amount, duration, selectedProduct, useBank, calcWithProduct]);
    const buildAmortization = (amt, rate, monthly, n) => {
        let balance = amt;
        const rows = [];
        for (let i = 1; i <= Math.min(n, 24); i++) {
            const interest = balance * rate;
            const principal = monthly - interest;
            balance -= principal;
            rows.push({ month: i, monthly: Math.round(monthly), principal: Math.round(principal), interest: Math.round(interest), balance: Math.max(0, Math.round(balance)) });
        }
        return rows;
    };
    // Simulation via backend
    const simulate = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/scoring/user/simulators/credit/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, duration }),
            });
            if (res.ok) {
                const data = await res.json();
                // Enrichir avec amortissement
                if (data.monthly_payment) {
                    const rate = (parseFloat(data.interest_rate) || 10) / 100 / 12;
                    data.amortization = buildAmortization(amount, rate, data.monthly_payment, duration);
                }
                setResult(data);
            }
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-2 bg-slate-800/50 rounded-xl p-1.5", children: [_jsx("button", { onClick: () => setUseBank(false), className: `flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!useBank ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`, children: "Taux TERAS auto" }), _jsx("button", { onClick: () => { setUseBank(true); if (products.length)
                            setSelectedProduct(products[0]); }, className: `flex-1 py-2 rounded-lg text-sm font-medium transition-all ${useBank ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`, children: "Choisir un produit banque" })] }), useBank && (_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm font-medium mb-2 block", children: "Produit financier" }), _jsx("div", { className: "grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1", children: products.map(p => (_jsxs("button", { onClick: () => setSelectedProduct(p), className: `w-full p-3 rounded-xl border text-left transition-all ${selectedProduct?.id === p.id ? 'border-sky-500/50 bg-sky-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'}`, children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-white text-sm font-medium", children: p.name }), _jsxs("span", { className: "text-sky-400 text-sm font-bold", children: [p.interest_rate, "%/an"] })] }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: [fmt(p.min_amount), "\u2013", fmt(p.max_amount), " FCFA \u00B7 ", p.min_duration_months, "\u2013", p.max_duration_months, " mois"] })] }, p.id))) })] })), _jsxs("div", { className: "space-y-5", children: [_jsx(Slider, { label: "Montant souhait\u00E9", value: amount, min: 50000, max: 5000000, step: 50000, onChange: v => { setAmount(v); if (!useBank)
                            setResult(null); }, format: v => `${fmt(v)} FCFA`, color: "#0ea5e9" }), _jsx(Slider, { label: "Dur\u00E9e", value: duration, min: 3, max: 60, step: 1, onChange: v => { setDuration(v); if (!useBank)
                            setResult(null); }, format: v => `${v} mois`, color: "#8b5cf6" })] }), !useBank && (_jsx("button", { onClick: simulate, disabled: loading, className: "w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin" }), "Calcul en cours\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Calculator, { className: "w-5 h-5" }), "Simuler avec mon profil TERAS"] }) })), result && (_jsxs("div", { className: "space-y-4 animate-in fade-in duration-300", children: [_jsx("div", { className: `p-4 rounded-xl border ${result.is_feasible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [result.is_feasible ? _jsx(CheckCircle, { className: "w-6 h-6 text-emerald-400" }) : _jsx(AlertCircle, { className: "w-6 h-6 text-red-400" }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold", children: result.is_feasible ? '✅ Simulation réalisable' : '⚠️ Attention' }), result.product_name && _jsxs("p", { className: "text-slate-400 text-xs", children: ["Produit : ", result.product_name] })] })] }) }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                            { label: 'Mensualité', value: fmtFull(result.monthly_payment), color: 'sky', icon: Calendar, big: true },
                            { label: 'Coût total', value: fmtFull(result.total_cost), color: 'white', icon: DollarSign },
                            { label: 'Intérêts', value: fmtFull(result.total_interest), color: 'amber', icon: Percent },
                            { label: 'Taux', value: result.interest_rate, color: 'purple', icon: TrendingUp },
                        ].map(({ label, value, color, icon: Icon, big }) => (_jsxs("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Icon, { className: `w-4 h-4 text-${color === 'white' ? 'slate-400' : color + '-400'}` }), _jsx("span", { className: "text-slate-400 text-xs", children: label })] }), _jsx("div", { className: `font-bold ${big ? 'text-xl text-sky-400' : 'text-base text-white'}`, children: value })] }, label))) }), result.warnings?.map((w, i) => (_jsx("div", { className: `p-3 rounded-xl border text-sm ${w.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`, children: w.message }, i))), result.amortization?.length > 0 && (_jsxs("div", { className: "bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden", children: [_jsxs("button", { onClick: () => setShowTable(p => !p), className: "w-full flex items-center justify-between p-4 text-white hover:bg-slate-800/50 transition-colors", children: [_jsxs("span", { className: "font-medium text-sm flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-sky-400" }), "Tableau d'amortissement"] }), showTable ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-400" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-400" })] }), showTable && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { className: "bg-slate-800/70", children: _jsx("tr", { children: ['Mois', 'Mensualité', 'Capital', 'Intérêts', 'Capital restant'].map(h => (_jsx("th", { className: "px-3 py-2 text-slate-400 font-medium text-left", children: h }, h))) }) }), _jsx("tbody", { children: result.amortization.slice(0, showTable ? result.amortization.length : 6).map((row) => (_jsxs("tr", { className: "border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors", children: [_jsx("td", { className: "px-3 py-2 text-slate-400", children: row.month }), _jsx("td", { className: "px-3 py-2 text-white font-medium", children: fmt(row.monthly) }), _jsx("td", { className: "px-3 py-2 text-emerald-400", children: fmt(row.principal) }), _jsx("td", { className: "px-3 py-2 text-amber-400", children: fmt(row.interest) }), _jsx("td", { className: "px-3 py-2 text-slate-300", children: fmt(row.balance) })] }, row.month))) })] }) }))] })), result.alternative_scenarios?.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-3 text-sm", children: "\uD83D\uDCA1 Sc\u00E9narios alternatifs" }), _jsx("div", { className: "space-y-2", children: result.alternative_scenarios.map((s, i) => (_jsxs("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl p-3", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("span", { className: "text-white font-medium text-sm", children: s.label }), _jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400" })] }), _jsxs("div", { className: "flex gap-4 text-xs text-slate-400", children: [_jsxs("span", { children: ["Montant: ", _jsxs("span", { className: "text-white", children: [fmt(s.amount), " FCFA"] })] }), _jsxs("span", { children: ["Dur\u00E9e: ", _jsxs("span", { className: "text-white", children: [s.duration, " mois"] })] }), _jsxs("span", { children: ["Mensualit\u00E9: ", _jsxs("span", { className: "text-white", children: [fmt(s.monthly_payment), " FCFA"] })] })] })] }, i))) })] })), result.is_feasible && (_jsxs("button", { onClick: () => navigate('/mes-messages', { state: { openTab: 'produits' } }), className: "w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2", children: [_jsx(Send, { className: "w-5 h-5" }), " Faire une demande de cr\u00E9dit \u2192"] }))] }))] }));
}
// ═══════════════════════════════════════════════════════════════════════
// 2. SIMULATEUR ÉPARGNE
// ═══════════════════════════════════════════════════════════════════════
function SavingsSimulator() {
    const [monthly, setMonthly] = useState(50000);
    const [duration, setDuration] = useState(12);
    const [rate, setRate] = useState(5); // taux annuel épargne %
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    // Calcul temps réel
    useEffect(() => {
        const monthlyRate = rate / 100 / 12;
        const n = duration;
        let balance = 0;
        const breakdown = [];
        for (let i = 1; i <= n; i++) {
            const interest = balance * monthlyRate;
            balance += monthly + interest;
            breakdown.push({ month: i, deposit: monthly, interest: Math.round(interest), cumulative: Math.round(balance) });
        }
        const totalDeposited = monthly * n;
        const totalInterest = Math.round(balance - totalDeposited);
        setResult({
            total_saved: totalDeposited,
            interest_earned: totalInterest,
            future_value: Math.round(balance),
            rate_pct: rate,
            monthly_breakdown: breakdown,
        });
    }, [monthly, duration, rate]);
    const simulate = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/scoring/user/simulators/savings/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monthly_amount: monthly, duration }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(prev => ({ ...prev, ...data }));
            }
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-5", children: [_jsx(Slider, { label: "\u00C9pargne mensuelle", value: monthly, min: 10000, max: 500000, step: 5000, onChange: setMonthly, format: v => `${fmt(v)} FCFA`, color: "#22c55e" }), _jsx(Slider, { label: "Dur\u00E9e", value: duration, min: 3, max: 60, step: 1, onChange: setDuration, format: v => `${v} mois`, color: "#0ea5e9" }), _jsx(Slider, { label: "Taux d'int\u00E9r\u00EAt annuel", value: rate, min: 1, max: 15, step: 0.5, onChange: setRate, format: v => `${v}%`, color: "#a855f7" })] }), result && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5", children: [_jsxs("p", { className: "text-slate-400 text-sm mb-1", children: ["Valeur finale apr\u00E8s ", duration, " mois"] }), _jsx("p", { className: "text-4xl font-black text-emerald-400 mb-4", children: fmtFull(result.future_value) }), _jsx("div", { className: "grid grid-cols-3 gap-3 text-xs", children: [
                                    { l: 'Versements', v: fmtFull(result.total_saved), c: 'text-white' },
                                    { l: '+ Intérêts', v: fmtFull(result.interest_earned), c: 'text-emerald-400' },
                                    { l: 'Rendement', v: `${result.rate_pct}%/an`, c: 'text-purple-400' },
                                ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: l }), _jsx("p", { className: `font-bold ${c}`, children: v })] }, l))) })] }), result.monthly_breakdown?.length > 0 && (_jsxs("div", { className: "bg-slate-800/30 border border-white/5 rounded-xl p-4", children: [_jsx("h4", { className: "text-white text-sm font-semibold mb-4", children: "\uD83D\uDCC8 Progression du solde" }), _jsx("div", { className: "flex items-end gap-1 h-24", children: result.monthly_breakdown.filter((_, i) => i % Math.ceil(result.monthly_breakdown.length / 12) === 0 || i === result.monthly_breakdown.length - 1)
                                    .map((m, i, arr) => {
                                    const maxVal = arr[arr.length - 1].cumulative;
                                    const h = Math.round((m.cumulative / maxVal) * 100);
                                    return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx("p", { className: "text-slate-500 text-xs", style: { fontSize: '9px' }, children: fmt(m.cumulative) }), _jsx("div", { className: "w-full bg-emerald-500 rounded-sm transition-all", style: { height: `${h}%` } }), _jsxs("p", { className: "text-slate-600", style: { fontSize: '8px' }, children: ["M", m.month] })] }, i));
                                }) })] })), _jsxs("div", { className: "bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-slate-700/50", children: _jsx("h4", { className: "text-white text-sm font-medium", children: "Progression mensuelle (6 premiers mois)" }) }), _jsx("div", { className: "divide-y divide-slate-800/50", children: result.monthly_breakdown?.slice(0, 6).map((m) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-2.5 text-sm", children: [_jsxs("span", { className: "text-slate-400 w-12", children: ["Mois ", m.month] }), _jsxs("span", { className: "text-slate-300", children: ["+", fmt(m.deposit), " FCFA"] }), _jsxs("span", { className: "text-emerald-400 text-xs", children: ["+", fmt(m.interest), " int\u00E9r\u00EAts"] }), _jsxs("span", { className: "text-white font-semibold", children: [fmt(m.cumulative), " FCFA"] })] }, m.month))) })] }), _jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(Info, { className: "w-4 h-4 text-blue-400 shrink-0 mt-0.5" }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["\u00C9pargner ", _jsxs("strong", { className: "text-white", children: [fmt(monthly), " FCFA/mois"] }), " am\u00E9liore votre pilier ", _jsx("strong", { className: "text-emerald-400", children: "E (\u00C9pargne)" }), " TERAS et augmente votre score.", _jsx("button", { onClick: simulate, className: "text-blue-400 ml-1 hover:text-blue-300 underline", disabled: loading, children: loading ? 'Calcul…' : 'Vérifier avec mon profil →' })] })] }), result.recommendations?.map((r, i) => (_jsx("div", { className: "bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300", children: r }, i)))] }))] }));
}
// ═══════════════════════════════════════════════════════════════════════
// 3. SIMULATEUR IMPACT SCORE
// ═══════════════════════════════════════════════════════════════════════
function ScoreImpactSimulator() {
    const [actions, setActions] = useState({
        increase_transactions: false,
        start_savings: false,
        increase_income: false,
        add_asset: false,
        improve_social: false,
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const actionConfig = [
        { key: 'increase_transactions', label: 'Augmenter mes transactions ZOLA', desc: 'Utiliser ZOLA 20+ fois/mois', gain: '+40 pts', icon: '📱', color: 'sky' },
        { key: 'start_savings', label: 'Commencer à épargner', desc: 'Dépôt mensuel régulier', gain: '+30 pts', icon: '🏦', color: 'emerald' },
        { key: 'increase_income', label: 'Augmenter mes revenus', desc: 'Déclarer des revenus supplémentaires', gain: '+25 pts', icon: '💰', color: 'amber' },
        { key: 'add_asset', label: 'Déclarer un actif', desc: 'Moto, terrain, équipement…', gain: '+35 pts', icon: '🏠', color: 'purple' },
        { key: 'improve_social', label: 'Améliorer ma réputation', desc: 'Rejoindre une tontine ou coopérative', gain: '+20 pts', icon: '🤝', color: 'pink' },
    ];
    const simulate = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/scoring/user/simulators/score-impact/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actions }),
            });
            if (res.ok)
                setResult(await res.json());
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    const hasSelection = Object.values(actions).some(v => v);
    const estimatedGain = actionConfig.filter(a => actions[a.key]).reduce((sum, a) => sum + parseInt(a.gain), 0);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "space-y-2", children: actionConfig.map(({ key, label, desc, gain, icon, color }) => {
                    const isSelected = actions[key];
                    return (_jsx("button", { onClick: () => setActions(p => ({ ...p, [key]: !p[key] })), className: `w-full p-4 rounded-xl border transition-all text-left ${isSelected ? `bg-${color}-500/10 border-${color}-500/40` : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isSelected ? `bg-${color}-500/20` : 'bg-slate-700/50'}`, children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`, children: label }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: desc })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsx("span", { className: `font-bold text-sm ${isSelected ? `text-${color}-400` : 'text-slate-500'}`, children: gain }), _jsx("div", { className: `w-5 h-5 rounded-full border-2 ml-auto mt-1 flex items-center justify-center ${isSelected ? `border-${color}-500 bg-${color}-500` : 'border-slate-600'}`, children: isSelected && _jsx(CheckCircle, { className: "w-3 h-3 text-white" }) })] })] }) }, key));
                }) }), hasSelection && (_jsxs("div", { className: "bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Gain estim\u00E9 avec ces actions" }), _jsxs("span", { className: "text-purple-400 font-bold text-xl", children: ["+", estimatedGain, " pts"] })] })), _jsx("button", { onClick: simulate, disabled: loading || !hasSelection, className: "w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin" }), "Calcul en cours\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Zap, { className: "w-5 h-5" }), "Calculer l'impact pr\u00E9cis"] }) }), result && (_jsxs("div", { className: "space-y-4 animate-in fade-in duration-300", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Score actuel" }), _jsx("p", { className: "text-4xl font-black text-white", children: result.current_score })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx(ArrowRight, { className: "w-8 h-8 text-purple-400" }), _jsxs("span", { className: "text-emerald-400 font-bold text-xl", children: ["+", result.total_gain] }), _jsx("span", { className: "text-slate-400 text-xs", children: "pts" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Score projet\u00E9" }), _jsx("p", { className: "text-4xl font-black text-emerald-400", children: result.projected_score })] })] }), _jsxs("div", { className: "flex items-center gap-3 mt-2", children: [_jsx("div", { className: "flex-1 h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-white/20 rounded-full", style: { width: `${result.current_score / 10}%` } }) }), _jsx("div", { className: "flex-1 h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-emerald-500 rounded-full", style: { width: `${result.projected_score / 10}%` } }) })] }), _jsxs("p", { className: "text-slate-400 text-xs text-center mt-3", children: ["R\u00E9sultat estim\u00E9 en ", _jsxs("strong", { className: "text-white", children: [result.estimated_weeks, " semaines"] })] })] }), result.projected_breakdown && (_jsxs("div", { className: "bg-slate-800/30 border border-white/5 rounded-xl p-5", children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-4", children: "Impact par pilier" }), _jsx("div", { className: "space-y-3", children: Object.entries({ T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social' }).map(([key, label]) => {
                                    const curr = result.current_breakdown?.[key] || 0;
                                    const proj = result.projected_breakdown?.[key] || curr;
                                    const gain = proj - curr;
                                    const max = { T: 300, E: 150, R: 200, A: 150, S: 200 }[key] || 200;
                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsxs("span", { className: "text-slate-300", children: [_jsx("span", { className: "text-slate-500 font-bold", children: key }), " ", label] }), _jsxs("span", { className: "text-white", children: [curr, " \u2192 ", _jsx("span", { className: "text-emerald-400 font-bold", children: proj }), " ", gain > 0 && _jsxs("span", { className: "text-emerald-400", children: ["(+", gain, ")"] })] })] }), _jsxs("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden relative", children: [_jsx("div", { className: "h-full bg-slate-600 rounded-full", style: { width: `${(curr / max) * 100}%` } }), gain > 0 && _jsx("div", { className: "h-full bg-emerald-500 rounded-full absolute top-0", style: { left: `${(curr / max) * 100}%`, width: `${(gain / max) * 100}%` } })] })] }, key));
                                }) })] })), result.impacts && Object.values(result.impacts).length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-white font-semibold text-sm", children: "D\u00E9tail par action" }), Object.values(result.impacts).map((impact, i) => (_jsxs("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl p-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white text-sm font-medium", children: impact.action }), _jsxs("p", { className: "text-slate-400 text-xs", children: [impact.current, "/100 \u2192 ", impact.potential, "/100"] }), _jsx(MiniBar, { value: impact.potential, max: 100, color: "bg-emerald-500" })] }), _jsxs("span", { className: "text-emerald-400 font-bold text-lg ml-4", children: ["+", impact.gain] })] }, i)))] }))] }))] }));
}
// ═══════════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════
export default function Simulateurs() {
    const [activeTab, setActiveTab] = useState('credit');
    const tabs = [
        { id: 'credit', label: 'Crédit', icon: Calculator, desc: 'Capacité d\'emprunt', color: 'sky' },
        { id: 'savings', label: 'Épargne', icon: PiggyBank, desc: 'Plan d\'épargne FCFA', color: 'emerald' },
        { id: 'score', label: 'Impact Score', icon: Target, desc: 'Améliorer mon score TERAS', color: 'purple' },
    ];
    return (_jsx("div", { className: "min-h-screen bg-[#0b1220] text-white p-4 md:p-6", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "flex items-center gap-4 mb-8", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center", children: _jsx(Calculator, { className: "w-7 h-7 text-sky-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Simulateurs Financiers" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Planifiez vos finances avec vos donn\u00E9es r\u00E9elles TERAS" })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3 mb-6", children: tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `p-4 rounded-2xl border transition-all text-left ${active ? `bg-${tab.color}-500/10 border-${tab.color}-500/40` : 'bg-slate-900/50 border-white/10 hover:border-white/20'}`, children: [_jsx(Icon, { className: `w-6 h-6 mb-2 ${active ? `text-${tab.color}-400` : 'text-slate-400'}` }), _jsx("p", { className: `font-semibold text-sm ${active ? 'text-white' : 'text-slate-300'}`, children: tab.label }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: tab.desc })] }, tab.id));
                    }) }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [activeTab === 'credit' && _jsx(CreditSimulator, {}), activeTab === 'savings' && _jsx(SavingsSimulator, {}), activeTab === 'score' && _jsx(ScoreImpactSimulator, {})] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3", children: [_jsx(Zap, { className: "w-5 h-5 text-yellow-400 shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-1", children: "Simulations illimit\u00E9es" }), _jsx("p", { className: "text-slate-400 text-xs", children: "Testez autant de sc\u00E9narios que vous voulez, sans engagement." })] })] }), _jsxs("div", { className: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3", children: [_jsx(BarChart3, { className: "w-5 h-5 text-emerald-400 shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-1", children: "Donn\u00E9es r\u00E9elles TERAS" }), _jsx("p", { className: "text-slate-400 text-xs", children: "Les simulations utilisent votre score et revenus actuels." })] })] })] })] }) }));
}
