import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
//src/components/PasswordStrength.tsx
import { useMemo } from "react";
export default function PasswordStrength({ value }) {
    const score = useMemo(() => {
        let s = 0;
        if (!value)
            return 0;
        if (value.length >= 8)
            s += 1;
        if (/[A-Z]/.test(value))
            s += 1;
        if (/[a-z]/.test(value))
            s += 1;
        if (/\d/.test(value))
            s += 1;
        if (/[^A-Za-z0-9]/.test(value))
            s += 1;
        return s; // 0..5
    }, [value]);
    const pct = (score / 5) * 100;
    const label = score <= 1 ? "Faible" : score === 2 ? "Moyen" : score === 3 ? "Correct" : score === 4 ? "Bon" : "Excellent";
    return (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "h-2 w-full rounded bg-white/10 overflow-hidden", children: _jsx("div", { className: "h-2 transition-all", style: {
                        width: `${pct}%`,
                        background: "linear-gradient(90deg,#ef4444 0%,#f59e0b 40%,#22c55e 70%,#38bdf8 100%)",
                    } }) }), _jsxs("div", { className: "text-xs text-slate-400 mt-1", children: ["Robustesse : ", label] })] }));
}
