import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/components/user/LoanSimulator.tsx
/**
 * Simulateur de Crédit Interactif
 * Calcule la mensualité et affiche des scénarios alternatifs
 */
import { useState } from 'react';
import { Calculator, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
export default function LoanSimulator() {
    const [amount, setAmount] = useState(500000);
    const [duration, setDuration] = useState(12);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSimulate = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch('/api/scoring/simulate-loan/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, duration })
            });
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            }
        }
        catch (error) {
            console.error('Erreur simulation:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
    };
    const getWarningIcon = (type) => {
        switch (type) {
            case 'error': return _jsx(AlertCircle, { className: "w-5 h-5 text-red-500" });
            case 'warning': return _jsx(AlertCircle, { className: "w-5 h-5 text-orange-500" });
            case 'info': return _jsx(Info, { className: "w-5 h-5 text-blue-500" });
            default: return null;
        }
    };
    const getWarningBg = (type) => {
        switch (type) {
            case 'error': return 'bg-red-500/10 border-red-500/20';
            case 'warning': return 'bg-orange-500/10 border-orange-500/20';
            case 'info': return 'bg-blue-500/10 border-blue-500/20';
            default: return '';
        }
    };
    return (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "p-2 bg-sky-500/20 rounded-lg", children: _jsx(Calculator, { className: "w-6 h-6 text-sky-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Simulateur de Cr\u00E9dit" }), _jsx("p", { className: "text-sm text-slate-400", children: "Calculez votre capacit\u00E9 d'emprunt" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Montant souhait\u00E9" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(Number(e.target.value)), step: "50000", min: "50000", max: "10000000", className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50" }), _jsx("span", { className: "absolute right-4 top-3 text-slate-400", children: "FCFA" })] }), _jsx("input", { type: "range", value: amount, onChange: (e) => setAmount(Number(e.target.value)), min: "50000", max: "3000000", step: "50000", className: "w-full mt-2" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Dur\u00E9e (mois)" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", value: duration, onChange: (e) => setDuration(Number(e.target.value)), min: "3", max: "24", className: "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50" }), _jsx("span", { className: "absolute right-4 top-3 text-slate-400", children: "mois" })] }), _jsx("input", { type: "range", value: duration, onChange: (e) => setDuration(Number(e.target.value)), min: "3", max: "24", className: "w-full mt-2" })] })] }), _jsx("button", { onClick: handleSimulate, disabled: isLoading, className: "w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Calcul en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Calculator, { className: "w-5 h-5" }), "Simuler"] })) }), result && (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { className: `flex items-start gap-3 p-4 rounded-lg border ${result.is_feasible
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-red-500/10 border-red-500/20'}`, children: [result.is_feasible ? (_jsx(CheckCircle, { className: "w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" })) : (_jsx(AlertCircle, { className: "w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" })), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `font-medium ${result.is_feasible ? 'text-emerald-300' : 'text-red-300'}`, children: result.is_feasible
                                            ? '✓ Prêt réalisable avec votre profil'
                                            : '✗ Montant trop élevé pour votre capacité actuelle' }), _jsxs("p", { className: "text-sm text-slate-400 mt-1", children: ["Score : ", result.score_value, "/1000 (Niveau ", result.score_level, ") \u2022 Taux : ", result.interest_rate] })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-white/5", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-lg font-semibold text-white", children: formatCurrency(result.monthly_payment) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-white/5", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "Co\u00FBt total" }), _jsx("p", { className: "text-lg font-semibold text-white", children: formatCurrency(result.total_cost) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-white/5", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "Int\u00E9r\u00EAts" }), _jsx("p", { className: "text-lg font-semibold text-orange-400", children: formatCurrency(result.total_interest) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-white/5", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "CRM utilis\u00E9" }), _jsxs("p", { className: "text-lg font-semibold text-sky-400", children: [result.crm_used_percent, "%"] })] })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-lg p-4 border border-white/5", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-slate-300", children: "Utilisation du CRM" }), _jsxs("span", { className: "text-white font-medium", children: [formatCurrency(result.crm_used), " / ", formatCurrency(result.crm_available)] })] }), _jsx("div", { className: "h-3 bg-slate-700/50 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-500 ${result.crm_used_percent > 80 ? 'bg-red-500' :
                                        result.crm_used_percent > 50 ? 'bg-orange-500' :
                                            'bg-emerald-500'}`, style: { width: `${Math.min(result.crm_used_percent, 100)}%` } }) })] }), result.warnings && result.warnings.length > 0 && (_jsx("div", { className: "space-y-2", children: result.warnings.map((warning, idx) => (_jsxs("div", { className: `flex items-start gap-3 p-3 rounded-lg border ${getWarningBg(warning.type)}`, children: [getWarningIcon(warning.type), _jsx("p", { className: "text-sm text-slate-200 flex-1", children: warning.message })] }, idx))) })), result.alternative_scenarios && result.alternative_scenarios.length > 0 && (_jsxs("div", { className: "border-t border-white/10 pt-4", children: [_jsxs("h3", { className: "text-sm font-medium text-slate-300 mb-3 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), "Sc\u00E9narios alternatifs"] }), _jsx("div", { className: "space-y-2", children: result.alternative_scenarios.map((scenario, idx) => (_jsxs("div", { onClick: () => {
                                        setAmount(scenario.amount);
                                        setDuration(scenario.duration);
                                    }, className: "bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-white/5 cursor-pointer transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium text-white", children: scenario.label }), scenario.is_feasible && (_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400" }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs text-slate-400", children: [_jsxs("div", { children: [_jsx("span", { className: "block", children: "Montant" }), _jsx("span", { className: "text-white font-medium", children: formatCurrency(scenario.amount) })] }), _jsxs("div", { children: [_jsx("span", { className: "block", children: "Mensualit\u00E9" }), _jsx("span", { className: "text-white font-medium", children: formatCurrency(scenario.monthly_payment) })] }), _jsxs("div", { children: [_jsx("span", { className: "block", children: "Dur\u00E9e" }), _jsxs("span", { className: "text-white font-medium", children: [scenario.duration, " mois"] })] })] })] }, idx))) })] }))] }))] }));
}
