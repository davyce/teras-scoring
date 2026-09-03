import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/PublicNavbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext"; // ✅ CORRIGÉ : context au lieu de stores
import terasLogoUrl from "../assets/logo-teras.svg";
export default function PublicNavbar() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth(); // ✅ CORRIGÉ : utilise isAuthenticated au lieu de accessToken
    const [mobileOpen, setMobileOpen] = useState(false);
    const navLinks = [
        { label: "Accueil", to: "/" },
        { label: "Score de crédit", to: "/score-credit" },
        { label: "API", to: "/api-docs" },
        { label: "Contact", to: "/contact" },
    ];
    return (_jsxs("header", { className: "sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/90 backdrop-blur-md", children: [_jsxs("nav", { className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-4", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [_jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "h-10 w-auto rounded-xl bg-[#020617] border border-sky-500/40 shadow-[0_0_18px_rgba(56,189,248,0.45)] p-1.5" }), _jsx("span", { className: "text-xl font-bold text-white", children: "TERAS" })] }), _jsx("div", { className: "hidden md:flex items-center gap-6", children: navLinks.map((link) => (_jsx(Link, { to: link.to, className: "text-sm text-slate-300 hover:text-white transition", children: link.label }, link.to))) }), _jsx("div", { className: "hidden md:flex items-center gap-3", children: isAuthenticated ? (_jsx("button", { onClick: () => navigate("/mon-espace"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition", children: "Mon Espace" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => navigate("/login"), className: "text-sm text-slate-300 hover:text-white transition px-3 py-2", children: "Se connecter" }), _jsx("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition", children: "Cr\u00E9er un compte" })] })) }), _jsx("button", { onClick: () => setMobileOpen(!mobileOpen), className: "md:hidden p-2 text-slate-400 hover:text-white", children: mobileOpen ? _jsx(X, { className: "h-6 w-6" }) : _jsx(Menu, { className: "h-6 w-6" }) })] }), mobileOpen && (_jsx("div", { className: "md:hidden border-t border-white/10 bg-slate-900/95 px-6 py-4", children: _jsxs("div", { className: "space-y-3", children: [navLinks.map((link) => (_jsx(Link, { to: link.to, onClick: () => setMobileOpen(false), className: "block text-slate-300 hover:text-white py-2 transition", children: link.label }, link.to))), _jsx("div", { className: "pt-4 border-t border-white/10 space-y-3", children: isAuthenticated ? (_jsx("button", { onClick: () => {
                                    setMobileOpen(false);
                                    navigate("/mon-espace");
                                }, className: "w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-medium text-slate-900 transition", children: "Mon Espace" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => {
                                            setMobileOpen(false);
                                            navigate("/login");
                                        }, className: "w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white transition", children: "Se connecter" }), _jsx("button", { onClick: () => {
                                            setMobileOpen(false);
                                            navigate("/register");
                                        }, className: "w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-medium text-slate-900 transition", children: "Cr\u00E9er un compte" })] })) })] }) }))] }));
}
