import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
//teras-frontend/src/pages/Splash.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TerasLogo from "../components/TerasLogo";
export default function Splash() {
    const nav = useNavigate();
    useEffect(() => {
        const t = setTimeout(() => nav("/home", { replace: true }), 1800);
        return () => clearTimeout(t);
    }, [nav]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-[#0b1220] text-slate-100", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx(TerasLogo, { size: 88, animate: "float+pulse", className: "drop-shadow-lg" }), _jsx("div", { className: "text-2xl tracking-wide", children: "TERAS" }), _jsx("div", { className: "text-slate-400 text-sm", children: "Chargement\u2026" })] }) }));
}
