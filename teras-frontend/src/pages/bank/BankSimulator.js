import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertCircle, CheckCircle, Zap, Download, BarChart3, } from 'lucide-react';
export default function BankSimulator() {
    const [productType, setProductType] = useState('personal_credit');
    const [amount, setAmount] = useState(1000000);
    const [duration, setDuration] = useState(12);
    const [clientScore, setClientScore] = useState(720);
    const [result, setResult] = useState(null);
    const productTypes = [
        { value: 'personal_credit', label: 'Crédit Personnel', minScore: 650, maxAmount: 2000000, rateMin: 12, rateMax: 18 },
        { value: 'auto_credit', label: 'Crédit Auto', minScore: 720, maxAmount: 5000000, rateMin: 10, rateMax: 14 },
        { value: 'housing_credit', label: 'Crédit Immobilier', minScore: 750, maxAmount: 15000000, rateMin: 8, rateMax: 12 },
        { value: 'business_credit', label: 'Crédit PME', minScore: 700, maxAmount: 10000000, rateMin: 11, rateMax: 16 },
        { value: 'equipment_credit', label: 'Crédit Équipement', minScore: 680, maxAmount: 8000000, rateMin: 12, rateMax: 17 },
    ];
    const selectedProduct = productTypes.find((p) => p.value === productType);
    const calculateInterestRate = (score) => {
        const { rateMin, rateMax, minScore } = selectedProduct;
        if (score < minScore)
            return rateMax;
        if (score >= 900)
            return rateMin;
        // Linear interpolation
        const scoreDiff = 900 - minScore;
        const rateDiff = rateMax - rateMin;
        const adjustedScore = score - minScore;
        return rateMax - (adjustedScore / scoreDiff) * rateDiff;
    };
    const calculateSimulation = () => {
        const annualRate = calculateInterestRate(clientScore);
        const monthlyRate = annualRate / 100 / 12;
        // Monthly payment calculation (PMT formula)
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
            (Math.pow(1 + monthlyRate, duration) - 1);
        const totalCost = monthlyPayment * duration;
        const totalInterest = totalCost - amount;
        // Amortization schedule
        const amortizationSchedule = [];
        let remainingBalance = amount;
        for (let month = 1; month <= duration; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance -= principalPayment;
            amortizationSchedule.push({
                month,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                remainingBalance: Math.max(0, remainingBalance),
            });
        }
        setResult({
            monthlyPayment,
            totalCost,
            totalInterest,
            effectiveRate: annualRate,
            amortizationSchedule,
        });
    };
    useEffect(() => {
        calculateSimulation();
    }, [productType, amount, duration, clientScore]);
    const isEligible = clientScore >= selectedProduct.minScore;
    const currentRate = calculateInterestRate(clientScore);
    const bestRate = selectedProduct.rateMin;
    const potentialSavings = result
        ? ((currentRate - bestRate) / 100 / 12) * amount * duration
        : 0;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Simulateur de Cr\u00E9dit" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Estimez vos mensualit\u00E9s et co\u00FBts en temps r\u00E9el" })] }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [!isEligible && (_jsx("div", { className: "bg-red-500/10 border border-red-500/20 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx(AlertCircle, { className: "w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("h3", { className: "text-red-400 font-semibold mb-2", children: "Score insuffisant" }), _jsxs("p", { className: "text-red-300/80 text-sm", children: ["Le score TERAS minimum requis pour ce produit est", ' ', _jsx("strong", { children: selectedProduct.minScore }), ". Score actuel:", ' ', _jsx("strong", { children: clientScore })] })] })] }) })), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Param\u00E8tres de Simulation" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-3", children: "Type de Cr\u00E9dit" }), _jsx("select", { value: productType, onChange: (e) => setProductType(e.target.value), className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", children: productTypes.map((type) => (_jsxs("option", { value: type.value, children: [type.label, " (Score min: ", type.minScore, ")"] }, type.value))) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("label", { className: "text-slate-300 font-medium", children: "Montant du Cr\u00E9dit" }), _jsxs("span", { className: "text-white font-bold text-lg", children: [amount.toLocaleString(), " CFA"] })] }), _jsx("input", { type: "range", min: "100000", max: selectedProduct.maxAmount, step: "100000", value: amount, onChange: (e) => setAmount(Number(e.target.value)), className: "w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer", style: {
                                                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((amount - 100000) /
                                                                (selectedProduct.maxAmount - 100000)) *
                                                                100}%, #334155 ${((amount - 100000) /
                                                                (selectedProduct.maxAmount - 100000)) *
                                                                100}%, #334155 100%)`,
                                                        } }), _jsxs("div", { className: "flex justify-between text-sm text-slate-400 mt-2", children: [_jsx("span", { children: "100K CFA" }), _jsxs("span", { children: [(selectedProduct.maxAmount / 1000000).toFixed(1), "M CFA"] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("label", { className: "text-slate-300 font-medium", children: "Dur\u00E9e" }), _jsxs("span", { className: "text-white font-bold text-lg", children: [duration, " mois"] })] }), _jsx("input", { type: "range", min: "3", max: "60", step: "3", value: duration, onChange: (e) => setDuration(Number(e.target.value)), className: "w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer", style: {
                                                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((duration - 3) / (60 - 3)) * 100}%, #334155 ${((duration - 3) / (60 - 3)) * 100}%, #334155 100%)`,
                                                        } }), _jsxs("div", { className: "flex justify-between text-sm text-slate-400 mt-2", children: [_jsx("span", { children: "3 mois" }), _jsx("span", { children: "60 mois" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("label", { className: "text-slate-300 font-medium", children: "Score TERAS Client" }), _jsx("span", { className: "text-white font-bold text-lg", children: clientScore })] }), _jsx("input", { type: "range", min: "300", max: "1000", step: "10", value: clientScore, onChange: (e) => setClientScore(Number(e.target.value)), className: "w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer", style: {
                                                            background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((clientScore - 300) / (1000 - 300)) * 100}%, #334155 ${((clientScore - 300) / (1000 - 300)) * 100}%, #334155 100%)`,
                                                        } }), _jsxs("div", { className: "flex justify-between text-sm text-slate-400 mt-2", children: [_jsx("span", { children: "300" }), _jsx("span", { children: "1000" })] })] }), _jsxs("button", { onClick: calculateSimulation, disabled: !isEligible, className: `w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isEligible
                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`, children: [_jsx(Calculator, { className: "w-5 h-5" }), "Recalculer"] })] })] }), result && isEligible && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Tableau d'Amortissement" }), _jsxs("button", { className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm", children: [_jsx(Download, { className: "w-4 h-4" }), "Exporter PDF"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-800/50 border-b border-slate-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-slate-300 font-medium", children: "Mois" }), _jsx("th", { className: "px-4 py-3 text-right text-slate-300 font-medium", children: "Mensualit\u00E9" }), _jsx("th", { className: "px-4 py-3 text-right text-slate-300 font-medium", children: "Capital" }), _jsx("th", { className: "px-4 py-3 text-right text-slate-300 font-medium", children: "Int\u00E9r\u00EAts" }), _jsx("th", { className: "px-4 py-3 text-right text-slate-300 font-medium", children: "Restant D\u00FB" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800/50", children: result.amortizationSchedule.map((row) => (_jsxs("tr", { className: "hover:bg-slate-800/30 transition-colors", children: [_jsx("td", { className: "px-4 py-3 text-white font-medium", children: row.month }), _jsx("td", { className: "px-4 py-3 text-right text-white", children: row.payment.toLocaleString(undefined, {
                                                                    maximumFractionDigits: 0,
                                                                }) }), _jsx("td", { className: "px-4 py-3 text-right text-green-400", children: row.principal.toLocaleString(undefined, {
                                                                    maximumFractionDigits: 0,
                                                                }) }), _jsx("td", { className: "px-4 py-3 text-right text-amber-400", children: row.interest.toLocaleString(undefined, {
                                                                    maximumFractionDigits: 0,
                                                                }) }), _jsx("td", { className: "px-4 py-3 text-right text-slate-300", children: row.remainingBalance.toLocaleString(undefined, {
                                                                    maximumFractionDigits: 0,
                                                                }) })] }, row.month))) })] }) })] }))] }), _jsxs("div", { className: "space-y-6", children: [result && isEligible && (_jsxs("div", { className: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-4xl font-bold text-white mb-1", children: result.monthlyPayment.toLocaleString(undefined, {
                                            maximumFractionDigits: 0,
                                        }) }), _jsx("p", { className: "text-blue-400 text-sm", children: "CFA / mois" })] })), result && isEligible && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "R\u00E9sum\u00E9" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Taux effectif" }), _jsxs("span", { className: "text-white font-semibold", children: [result.effectiveRate.toFixed(2), "% /an"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Co\u00FBt total" }), _jsxs("span", { className: "text-white font-semibold", children: [result.totalCost.toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            }), ' ', "CFA"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Dont int\u00E9r\u00EAts" }), _jsxs("span", { className: "text-amber-400 font-semibold", children: [result.totalInterest.toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            }), ' ', "CFA"] })] }), _jsx("div", { className: "pt-4 border-t border-slate-700/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-sm", children: "Ratio int\u00E9r\u00EAts/capital" }), _jsxs("span", { className: "text-white font-semibold", children: [((result.totalInterest / amount) * 100).toFixed(1), "%"] })] }) })] })] })), result && isEligible && (_jsxs("div", { className: "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center", children: _jsx(Zap, { className: "w-5 h-5 text-purple-400" }) }), _jsx("h3", { className: "text-white font-semibold", children: "Recommandations IA" })] }), _jsxs("div", { className: "space-y-3", children: [clientScore < 900 && (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [_jsx("p", { className: "text-purple-300 text-sm mb-2", children: "\uD83D\uDCA1 Am\u00E9lioration possible" }), _jsxs("p", { className: "text-slate-300 text-xs leading-relaxed", children: ["Un score de ", _jsx("strong", { children: "900+" }), " permettrait un taux de", ' ', _jsxs("strong", { children: [bestRate, "%"] }), " au lieu de", ' ', _jsxs("strong", { children: [currentRate.toFixed(2), "%"] })] }), _jsxs("p", { className: "text-green-400 text-xs mt-2", children: ["\u00C9conomie potentielle:", ' ', _jsxs("strong", { children: [potentialSavings.toLocaleString(undefined, {
                                                                        maximumFractionDigits: 0,
                                                                    }), ' ', "CFA"] })] })] })), duration > 24 && (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [_jsx("p", { className: "text-blue-300 text-sm mb-2", children: "\u26A1 Optimisation dur\u00E9e" }), _jsxs("p", { className: "text-slate-300 text-xs leading-relaxed", children: ["R\u00E9duire la dur\u00E9e \u00E0 ", _jsx("strong", { children: "24 mois" }), " diminuerait les int\u00E9r\u00EAts de", ' ', _jsxs("strong", { children: [(result.totalInterest -
                                                                        (amount *
                                                                            (currentRate / 100 / 12) *
                                                                            Math.pow(1 + currentRate / 100 / 12, 24)) /
                                                                            (Math.pow(1 + currentRate / 100 / 12, 24) - 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }), ' ', "CFA"] })] })] })), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [_jsx("p", { className: "text-amber-300 text-sm mb-2", children: "\uD83D\uDCCA Capacit\u00E9 de remboursement" }), _jsxs("p", { className: "text-slate-300 text-xs leading-relaxed", children: ["Mensualit\u00E9 recommand\u00E9e \u2264 ", _jsx("strong", { children: "30%" }), " des revenus. Pour cette mensualit\u00E9, revenus min:", ' ', _jsxs("strong", { children: [((result.monthlyPayment / 0.3) * 1).toLocaleString(undefined, { maximumFractionDigits: 0 }), ' ', "CFA/mois"] })] })] })] })] })), !isEligible && (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Comment devenir \u00E9ligible ?" }), _jsxs("ul", { className: "space-y-3 text-sm", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" }), _jsx("span", { className: "text-slate-300", children: "Am\u00E9liorez votre score TERAS en maintenant une \u00E9pargne r\u00E9guli\u00E8re" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" }), _jsx("span", { className: "text-slate-300", children: "Diversifiez vos canaux de transactions" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" }), _jsx("span", { className: "text-slate-300", children: "D\u00E9clarez vos actifs pour augmenter votre score" })] })] })] }))] })] })] }));
}
