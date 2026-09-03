import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function GradientGauge({ value, min = 300, max = 850, title }) {
    const clamped = Math.max(min, Math.min(max, value));
    const pct = ((clamped - min) / (max - min)) * 100;
    return (_jsxs("div", { className: "w-full", children: [title && _jsx("div", { className: "sr-only", children: title }), _jsx("div", { className: "w-full h-3 rounded-full bg-slate-800 overflow-hidden", children: _jsx("div", { className: "h-full", style: {
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #22d3ee, #3b82f6 60%, #8b5cf6)",
                    } }) })] }));
}
