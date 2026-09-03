import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import TerasLogo from "./TerasLogo";
export default function NavbarMinimal() {
    return (_jsx("header", { className: "sticky top-0 z-20 border-b border-white/5 bg-[#0b1220]/80 backdrop-blur", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4 h-14 flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(TerasLogo, { size: 28, animate: "hover-tilt", className: "drop-shadow-sm" }), _jsx("span", { className: "font-semibold tracking-wide text-slate-100 text-lg", children: "TERAS" })] }), _jsxs("nav", { className: "hidden md:flex items-center gap-6 text-sm text-slate-300", children: [_jsx("a", { href: "/docs", className: "hover:text-white transition", children: "Comment fonctionne le score" }), _jsx(Link, { to: "/login", className: "hover:text-white transition", children: "Se connecter" }), _jsx(Link, { to: "/register", className: "bg-sky-400 text-black px-3 py-1.5 rounded-md font-medium hover:bg-sky-300 transition", children: "Essayer gratuitement" })] })] }) }));
}
