import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/public/ContactPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle, Loader2, Building2, Users, Headphones, } from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";
export default function ContactPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "general",
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        // Simulation d'envoi
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSending(false);
        setSent(true);
        // Reset après 3 secondes
        setTimeout(() => {
            setSent(false);
            setFormData({
                name: "",
                email: "",
                subject: "",
                message: "",
                type: "general",
            });
        }, 3000);
    };
    const contactInfo = [
        {
            icon: _jsx(Mail, { className: "h-5 w-5" }),
            label: "Email",
            value: "contact@teras.io",
            href: "mailto:contact@teras.io",
        },
        {
            icon: _jsx(Phone, { className: "h-5 w-5" }),
            label: "Téléphone",
            value: "+242 06 XXX XX XX",
            href: "tel:+242060000000",
        },
        {
            icon: _jsx(MapPin, { className: "h-5 w-5" }),
            label: "Adresse",
            value: "Brazzaville, République du Congo",
            href: null,
        },
        {
            icon: _jsx(Clock, { className: "h-5 w-5" }),
            label: "Horaires",
            value: "Lun - Ven, 8h - 18h",
            href: null,
        },
    ];
    const supportOptions = [
        {
            icon: _jsx(MessageSquare, { className: "h-6 w-6" }),
            title: "Support Général",
            description: "Questions sur TERAS, votre compte ou votre score.",
            action: "general",
        },
        {
            icon: _jsx(Building2, { className: "h-6 w-6" }),
            title: "Entreprises & API",
            description: "Intégration API, partenariats et solutions B2B.",
            action: "business",
        },
        {
            icon: _jsx(Headphones, { className: "h-6 w-6" }),
            title: "Support Technique",
            description: "Problèmes techniques, bugs ou suggestions.",
            action: "technical",
        },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220] text-white", children: [_jsx(PublicNavbar, {}), _jsxs("main", { children: [_jsx("section", { className: "mx-auto max-w-7xl px-6 pt-16 pb-12", children: _jsxs("div", { className: "text-center max-w-3xl mx-auto", children: [_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6", children: [_jsx(MessageSquare, { className: "h-4 w-4" }), "Nous contacter"] }), _jsxs("h1", { className: "text-4xl sm:text-5xl font-bold mb-6", children: ["Comment pouvons-nous", " ", _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500", children: "vous aider" }), " ", "?"] }), _jsx("p", { className: "text-lg text-slate-300 leading-relaxed", children: "Notre \u00E9quipe est \u00E0 votre disposition pour r\u00E9pondre \u00E0 toutes vos questions. Choisissez le canal qui vous convient le mieux." })] }) }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-12", children: _jsx("div", { className: "grid gap-6 md:grid-cols-3", children: supportOptions.map((option, i) => (_jsxs("button", { onClick: () => setFormData((prev) => ({ ...prev, type: option.action })), className: `rounded-2xl border p-6 text-left transition ${formData.type === option.action
                                    ? "border-sky-500/50 bg-sky-500/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"}`, children: [_jsx("div", { className: `mb-4 inline-flex items-center justify-center rounded-lg p-2 ${formData.type === option.action
                                            ? "bg-sky-500/20 text-sky-400"
                                            : "bg-slate-800 text-slate-400"}`, children: option.icon }), _jsx("h3", { className: "font-semibold mb-2", children: option.title }), _jsx("p", { className: "text-sm text-slate-400", children: option.description })] }, i))) }) }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: _jsxs("div", { className: "grid gap-12 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-8", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6", children: "Envoyez-nous un message" }), sent ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4", children: _jsx(CheckCircle, { className: "h-8 w-8 text-green-400" }) }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: "Message envoy\u00E9 !" }), _jsx("p", { className: "text-slate-400", children: "Nous vous r\u00E9pondrons dans les plus brefs d\u00E9lais." })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-1.5", children: "Type de demande" }), _jsxs("select", { name: "type", value: formData.type, onChange: handleChange, className: "w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition", children: [_jsx("option", { value: "general", children: "Support G\u00E9n\u00E9ral" }), _jsx("option", { value: "business", children: "Entreprises & API" }), _jsx("option", { value: "technical", children: "Support Technique" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-1.5", children: "Nom complet" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, className: "w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition", placeholder: "Jean Dupont" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-1.5", children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition", placeholder: "vous@exemple.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-1.5", children: "Sujet" }), _jsx("input", { type: "text", name: "subject", value: formData.subject, onChange: handleChange, required: true, className: "w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition", placeholder: "Comment pouvons-nous vous aider ?" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-400 mb-1.5", children: "Message" }), _jsx("textarea", { name: "message", value: formData.message, onChange: handleChange, required: true, rows: 5, className: "w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition resize-none", placeholder: "D\u00E9crivez votre demande en d\u00E9tail..." })] }), _jsx("button", { type: "submit", disabled: sending, className: "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-wait transition", children: sending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Envoi en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "h-4 w-4" }), "Envoyer le message"] })) })] }))] }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-semibold mb-6", children: "Informations de contact" }), _jsx("div", { className: "space-y-4 mb-10", children: contactInfo.map((info, i) => (_jsxs("div", { className: "flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5", children: [_jsx("div", { className: "inline-flex items-center justify-center rounded-lg bg-sky-500/10 p-2 text-sky-400", children: info.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-slate-400 mb-0.5", children: info.label }), info.href ? (_jsx("a", { href: info.href, className: "text-white hover:text-sky-400 transition", children: info.value })) : (_jsx("span", { className: "text-white", children: info.value }))] })] }, i))) }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsxs("h3", { className: "font-semibold mb-4 flex items-center gap-2", children: [_jsx(Users, { className: "h-5 w-5 text-sky-400" }), "Questions fr\u00E9quentes"] }), _jsx("div", { className: "space-y-4", children: [
                                                        {
                                                            q: "Quel est le délai de réponse ?",
                                                            a: "Nous répondons généralement sous 24h ouvrées.",
                                                        },
                                                        {
                                                            q: "Comment obtenir un support prioritaire ?",
                                                            a: "Les plans Pro et Entreprise incluent un support prioritaire.",
                                                        },
                                                        {
                                                            q: "Proposez-vous des démonstrations ?",
                                                            a: "Oui, contactez-nous pour planifier une démo personnalisée.",
                                                        },
                                                    ].map((faq, i) => (_jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm mb-1", children: faq.q }), _jsx("div", { className: "text-sm text-slate-400", children: faq.a })] }, i))) })] })] })] }) }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-24", children: _jsx("div", { className: "rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold mb-2", children: "Vous pr\u00E9f\u00E9rez nous appeler ?" }), _jsx("p", { className: "text-slate-300", children: "Notre \u00E9quipe est disponible du lundi au vendredi, de 8h \u00E0 18h." })] }), _jsxs("a", { href: "tel:+242060000000", className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition", children: [_jsx(Phone, { className: "h-4 w-4" }), "+242 06 XXX XX XX"] })] }) }) })] }), _jsx("footer", { className: "border-t border-white/10 bg-slate-900/50 py-8", children: _jsxs("div", { className: "mx-auto max-w-7xl px-6 text-center text-sm text-slate-400", children: ["\u00A9 ", new Date().getFullYear(), " TERAS. Tous droits r\u00E9serv\u00E9s."] }) })] }));
}
