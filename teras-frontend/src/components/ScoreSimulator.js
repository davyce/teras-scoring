import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ScoreSimulator.tsx
import { useState, useMemo } from "react";
import { TrendingUp, PiggyBank, Wallet, Building2, Users, } from "lucide-react";
const sliders = [
    {
        key: "T",
        label: "Transactions",
        icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
        color: "sky",
        min: 0,
        max: 500000,
        step: 10000,
        unit: "FCFA",
        defaultValue: 150000,
    },
    {
        key: "E",
        label: "Épargne",
        icon: _jsx(PiggyBank, { className: "h-4 w-4" }),
        color: "green",
        min: 0,
        max: 2000000,
        step: 50000,
        unit: "FCFA",
        defaultValue: 500000,
    },
    {
        key: "R",
        label: "Revenus",
        icon: _jsx(Wallet, { className: "h-4 w-4" }),
        color: "yellow",
        min: 0,
        max: 5000000,
        step: 100000,
        unit: "FCFA",
        defaultValue: 1200000,
    },
    {
        key: "A",
        label: "Actifs",
        icon: _jsx(Building2, { className: "h-4 w-4" }),
        color: "purple",
        min: 0,
        max: 10000000,
        step: 250000,
        unit: "FCFA",
        defaultValue: 2500000,
    },
    {
        key: "S",
        label: "Social",
        icon: _jsx(Users, { className: "h-4 w-4" }),
        color: "orange",
        min: 0,
        max: 100,
        step: 5,
        unit: "/100",
        defaultValue: 70,
    },
];
export default function ScoreSimulator() {
    const [values, setValues] = useState(sliders.reduce((acc, s) => ({ ...acc, [s.key]: s.defaultValue }), {}));
    // Calcul du score simulé
    const { score, breakdown } = useMemo(() => {
        const T = Math.min(200, (values.T / 500000) * 200);
        const E = Math.min(200, (values.E / 2000000) * 200);
        const R = Math.min(200, (values.R / 5000000) * 200);
        const A = Math.min(200, (values.A / 10000000) * 200);
        const S = Math.min(200, (values.S / 100) * 200);
        const total = Math.round(T + E + R + A + S);
        return {
            score: total,
            breakdown: { T, E, R, A, S },
        };
    }, [values]);
    // Label du score
    const scoreLabel = useMemo(() => {
        if (score >= 800)
            return { text: "Excellent", color: "text-emerald-400" };
        if (score >= 700)
            return { text: "Très bon", color: "text-green-400" };
        if (score >= 600)
            return { text: "Bon", color: "text-sky-400" };
        if (score >= 500)
            return { text: "Moyen", color: "text-yellow-400" };
        return { text: "À améliorer", color: "text-orange-400" };
    }, [score]);
    // Formater les montants
    const formatValue = (value, unit) => {
        if (unit === "/100")
            return `${value}/100`;
        return new Intl.NumberFormat("fr-FR").format(value) + " " + unit;
    };
    // Couleurs Tailwind
    const getColorClasses = (color) => {
        const colors = {
            sky: { bg: "bg-sky-500", text: "text-sky-400", accent: "accent-sky-500" },
            green: { bg: "bg-green-500", text: "text-green-400", accent: "accent-green-500" },
            yellow: { bg: "bg-yellow-500", text: "text-yellow-400", accent: "accent-yellow-500" },
            purple: { bg: "bg-purple-500", text: "text-purple-400", accent: "accent-purple-500" },
            orange: { bg: "bg-orange-500", text: "text-orange-400", accent: "accent-orange-500" },
        };
        return colors[color] || colors.sky;
    };
    return (_jsxs("div", { className: "grid gap-8 lg:grid-cols-2", children: [_jsxs("div", { className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Ajustez vos param\u00E8tres" }), sliders.map((slider) => {
                        const colors = getColorClasses(slider.color);
                        return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: colors.text, children: slider.icon }), _jsxs("label", { className: "text-sm text-slate-300", children: [_jsx("span", { className: "font-bold text-white", children: slider.key }), " - ", slider.label] })] }), _jsx("span", { className: `text-sm font-semibold ${colors.text}`, children: formatValue(values[slider.key], slider.unit) })] }), _jsx("input", { type: "range", min: slider.min, max: slider.max, step: slider.step, value: values[slider.key], onChange: (e) => setValues((prev) => ({
                                        ...prev,
                                        [slider.key]: Number(e.target.value),
                                    })), className: `w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${colors.accent}` }), _jsxs("div", { className: "flex justify-between text-xs text-slate-500 mt-1", children: [_jsx("span", { children: slider.min }), _jsx("span", { children: slider.max.toLocaleString("fr-FR") })] })] }, slider.key));
                    })] }), _jsxs("div", { className: "rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-6", children: "Score Simul\u00E9" }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-4 border-sky-500/50 mb-4", children: _jsxs("div", { children: [_jsx("span", { className: "text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500", children: score }), _jsx("span", { className: "text-xl text-slate-400", children: "/1000" })] }) }), _jsx("p", { className: `text-lg font-semibold ${scoreLabel.color}`, children: scoreLabel.text })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-300", children: "D\u00E9tail par composante" }), Object.entries(breakdown).map(([key, value]) => {
                                const slider = sliders.find((s) => s.key === key);
                                if (!slider)
                                    return null;
                                const colors = getColorClasses(slider.color);
                                const percentage = (value / 200) * 100;
                                return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsxs("span", { className: "text-slate-400", children: [_jsx("span", { className: "font-bold text-white", children: key }), " - ", slider.label] }), _jsxs("span", { className: `font-semibold ${colors.text}`, children: [Math.round(value), "/200"] })] }), _jsx("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${colors.bg} transition-all duration-300`, style: { width: `${percentage}%` } }) })] }, key));
                            })] }), _jsx("p", { className: "mt-6 text-xs text-slate-500 text-center", children: "Ce score est une simulation. Cr\u00E9ez un compte pour obtenir votre score r\u00E9el bas\u00E9 sur vos donn\u00E9es financi\u00E8res." })] })] }));
}
