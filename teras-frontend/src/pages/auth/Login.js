import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
// src/pages/auth/Login.tsx - AVEC LOGO TERAS OFFICIEL
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoTeras from "../../assets/logo-teras.svg";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const auth = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const API_ENDPOINT = `${API_URL}/api/auth/login/`;
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(`${API_URL}/api/health/`, { method: "GET" });
                setBackendStatus(response.ok);
                console.log("✅ Backend health check:", response.ok ? "OK" : "FAILED");
            }
            catch (err) {
                console.error("❌ Backend unreachable:", err);
                setBackendStatus(false);
            }
        };
        checkBackend();
    }, [API_URL]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            console.log("\n=== TENTATIVE DE CONNEXION ===");
            console.log("Email:", email);
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            console.log("Status:", response.status);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail ||
                    errorData.error ||
                    errorData.non_field_errors?.[0] ||
                    "Identifiants incorrects");
            }
            const data = await response.json();
            console.log("✅ Login réussi:", data.user.email, "Type:", data.user.user_type);
            if (!data.access || !data.refresh || !data.user) {
                throw new Error("Réponse serveur incomplète");
            }
            await auth.login(data);
            await new Promise(resolve => setTimeout(resolve, 100));
            const dashboardRoutes = {
                individual: '/mon-espace',
                standard: '/mon-espace',
                enterprise: '/enterprise/dashboard',
                entreprise: '/enterprise/dashboard',
                government: '/government/dashboard',
                regional: '/government/dashboard',
                admin: '/admin/dashboard',
                bank: '/bank/dashboard',
                banque: '/bank/dashboard',
            };
            const targetUrl = dashboardRoutes[data.user.user_type] || '/mon-espace';
            console.log("→ Redirection vers:", targetUrl);
            window.location.href = targetUrl;
        }
        catch (err) {
            console.error("❌ Erreur login:", err.message);
            setError(err.message || "Erreur de connexion");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f1829] to-[#0b1220]" }), _jsxs("div", { className: "absolute inset-0 opacity-30", children: [_jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" }), _jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse", style: { animationDelay: '700ms' } })] }), _jsx("div", { className: "relative min-h-screen flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsxs("div", { className: "relative inline-block", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 blur-3xl opacity-40 animate-pulse" }), _jsxs("div", { className: "relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-2xl blur-xl" }), _jsx("img", { src: LogoTeras, alt: "TERAS", className: "relative w-32 h-32 mx-auto drop-shadow-2xl", style: { filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))' } })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h1", { className: "text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-wider", children: "TERAS" }), _jsx("p", { className: "text-xs text-slate-400 font-semibold tracking-widest mt-2", children: "SYST\u00C8ME DE NOTATION FINANCI\u00C8RE" })] })] })] }), _jsx("p", { className: "mt-6 text-slate-300 font-medium text-lg", children: "Connexion \u00E0 votre espace s\u00E9curis\u00E9" })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20" }), _jsxs("div", { className: "relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl", children: [backendStatus === false && (_jsx("div", { className: "mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("svg", { className: "w-5 h-5 text-red-400 flex-shrink-0 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-red-400 text-sm font-medium", children: "Serveur non accessible" }), _jsx("p", { className: "text-red-300/70 text-xs mt-1", children: "V\u00E9rifiez que Django est d\u00E9marr\u00E9 sur le port 8000" })] })] }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-200 mb-2", children: "Adresse email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all", placeholder: "votre@email.com", disabled: loading, autoComplete: "email" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-200 mb-2", children: "Mot de passe" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: loading, autoComplete: "current-password" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors", children: showPassword ? (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) })) : (_jsxs("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) })] })] }), error && (_jsx("div", { className: "p-4 bg-red-500/10 border border-red-500/30 rounded-xl", children: _jsx("p", { className: "text-red-400 text-sm font-medium", children: error }) })), _jsx("button", { type: "submit", disabled: loading, className: "group relative w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40", children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-5 w-5", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Connexion..."] })) : (_jsxs("span", { className: "flex items-center justify-center gap-2", children: ["Se connecter", _jsx("svg", { className: "w-5 h-5 group-hover:translate-x-1 transition-transform", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14 5l7 7m0 0l-7 7m7-7H3" }) })] })) })] }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-slate-400 text-sm", children: ["Pas encore de compte ?", ' ', _jsx(Link, { to: "/register", className: "text-cyan-400 hover:text-cyan-300 font-semibold transition-colors", children: "Cr\u00E9er un compte" })] }) })] })] }), _jsxs("div", { className: "mt-8 text-center space-y-2", children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Plateforme s\u00E9curis\u00E9e de notation financi\u00E8re pour la r\u00E9gion CEMAC" }), _jsx("p", { className: "text-slate-600 text-xs", children: "\u00A9 2025 TERAS \u2022 Tous droits r\u00E9serv\u00E9s" })] })] }) })] }));
}
