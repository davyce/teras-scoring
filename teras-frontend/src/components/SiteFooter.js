import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// src/components/SiteFooter.tsx
// ------------------------------------------------------------
// ✅ Footer simple, liens internes (routing côté app ok)
// ------------------------------------------------------------
export default function SiteFooter() {
    return (_jsx("footer", { className: "border-t border-white/5", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4 h-14 text-xs md:text-sm flex items-center justify-between text-slate-400", children: [_jsxs("span", { children: ["\u00A9 ", new Date().getFullYear(), " TERAS"] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("a", { className: "hover:text-slate-200", href: "/privacy", children: "Confidentialit\u00E9" }), _jsx("a", { className: "hover:text-slate-200", href: "/terms", children: "CGU" }), _jsx("a", { className: "hover:text-slate-200", href: "/contact", children: "Contact" })] })] }) }));
}
