import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Upload, DollarSign, Users, TrendingUp, CheckCircle, } from 'lucide-react';
export default function BankEnterpriseNew() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        legalName: '',
        taxId: '',
        sector: '',
        employees: '',
        monthlyRevenue: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        country: 'CG',
    });
    const [estimatedScore, setEstimatedScore] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const sectors = [
        'Commerce',
        'Transport',
        'Artisanat',
        'Restauration',
        'Immobilier',
        'Santé',
        'Services',
        'Alimentation',
        'Éducation',
        'Construction',
        'Agriculture',
        'Technologie',
    ];
    const countries = [
        { code: 'CG', name: 'Congo-Brazzaville' },
        { code: 'CD', name: 'RD Congo' },
        { code: 'GA', name: 'Gabon' },
        { code: 'CM', name: 'Cameroun' },
        { code: 'TD', name: 'Tchad' },
        { code: 'CF', name: 'Centrafrique' },
    ];
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const calculateScore = () => {
        setIsCalculating(true);
        // Simulation calcul score TERAS Entreprise (2 secondes)
        setTimeout(() => {
            const baseScore = 600;
            const revenueBonus = parseInt(formData.monthlyRevenue) > 5000000 ? 100 : 50;
            const employeesBonus = parseInt(formData.employees) > 10 ? 80 : 40;
            const sectorBonus = ['Commerce', 'Transport', 'Santé'].includes(formData.sector) ? 60 : 30;
            const randomBonus = Math.random() * 50;
            const score = Math.min(1000, baseScore + revenueBonus + employeesBonus + sectorBonus + randomBonus);
            setEstimatedScore(Math.round(score));
            setIsCalculating(false);
        }, 2000);
    };
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await authFetch('/api/scoring/bank/enterprises/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.error || `Erreur ${res.status}`);
            }
            navigate('/bank/enterprises');
        }
        catch (e) {
            setSubmitError(e.message || 'Erreur lors de la création.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const getBandColor = (score) => {
        if (score >= 900)
            return 'emerald';
        if (score >= 800)
            return 'green';
        if (score >= 700)
            return 'blue';
        if (score >= 600)
            return 'amber';
        if (score >= 500)
            return 'orange';
        return 'red';
    };
    const getBand = (score) => {
        if (score >= 900)
            return 'A+';
        if (score >= 800)
            return 'A';
        if (score >= 700)
            return 'B';
        if (score >= 600)
            return 'C';
        if (score >= 500)
            return 'D';
        return 'E';
    };
    const canCalculate = formData.legalName && formData.sector && formData.employees && formData.monthlyRevenue;
    const canSubmit = estimatedScore !== null;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/bank/enterprises'), className: "p-2 hover:bg-slate-800 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Nouvelle Entreprise" }), _jsx("p", { className: "text-slate-400 mt-1", children: "Cr\u00E9er un profil entreprise et calculer le score TERAS" })] })] }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center", children: _jsx(Building2, { className: "w-5 h-5 text-blue-400" }) }), _jsx("h2", { className: "text-xl font-bold text-white", children: "Informations Entreprise" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Raison Sociale *" }), _jsx("input", { type: "text", name: "legalName", value: formData.legalName, onChange: handleChange, placeholder: "Ex: SARL TransCongo", className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Num\u00E9ro Fiscal *" }), _jsx("input", { type: "text", name: "taxId", value: formData.taxId, onChange: handleChange, placeholder: "A0012345678", className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Secteur d'Activit\u00E9 *" }), _jsxs("select", { name: "sector", value: formData.sector, onChange: handleChange, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", required: true, children: [_jsx("option", { value: "", children: "S\u00E9lectionner..." }), sectors.map((sector) => (_jsx("option", { value: sector, children: sector }, sector)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Nombre d'Employ\u00E9s *" }), _jsxs("div", { className: "relative", children: [_jsx(Users, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "number", name: "employees", value: formData.employees, onChange: handleChange, placeholder: "Ex: 15", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Chiffre d'Affaires Mensuel (CFA) *" }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "number", name: "monthlyRevenue", value: formData.monthlyRevenue, onChange: handleChange, placeholder: "Ex: 5000000", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", required: true })] })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center", children: _jsx(User, { className: "w-5 h-5 text-green-400" }) }), _jsx("h2", { className: "text-xl font-bold text-white", children: "Contact Principal" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Nom Complet" }), _jsx("input", { type: "text", name: "contactName", value: formData.contactName, onChange: handleChange, placeholder: "Ex: Jean Mukendi", className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "email", name: "contactEmail", value: formData.contactEmail, onChange: handleChange, placeholder: "contact@entreprise.cd", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "T\u00E9l\u00E9phone" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "tel", name: "contactPhone", value: formData.contactPhone, onChange: handleChange, placeholder: "+243 999 123 456", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Pays" }), _jsx("select", { name: "country", value: formData.country, onChange: handleChange, className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", children: countries.map((country) => (_jsx("option", { value: country.code, children: country.name }, country.code))) })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-slate-300 font-medium mb-2", children: "Adresse" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "absolute left-4 top-4 w-5 h-5 text-slate-400" }), _jsx("input", { type: "text", name: "address", value: formData.address, onChange: handleChange, placeholder: "Avenue Lumumba, Kinshasa", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center", children: _jsx(Upload, { className: "w-5 h-5 text-purple-400" }) }), _jsx("h2", { className: "text-xl font-bold text-white", children: "Documents (Optionnel)" })] }), _jsxs("div", { className: "border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center hover:border-slate-600/50 transition-colors cursor-pointer", children: [_jsx(Upload, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-300 mb-1", children: "Cliquez pour uploader ou glissez-d\u00E9posez" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Statuts, RCCM, Bilan, Relev\u00E9s bancaires (PDF, JPG, PNG)" })] }), _jsx("div", { className: "mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl", children: _jsx("p", { className: "text-blue-300 text-sm", children: "\uD83D\uDCA1 Upload des relev\u00E9s bancaires \u2192 scoring TERAS automatique et analyse de viabilit\u00E9" }) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/bank/enterprises'), className: "px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors", children: "Annuler" }), _jsx("button", { type: "button", onClick: calculateScore, disabled: !canCalculate || isCalculating, className: "flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", children: isCalculating ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Calcul en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(TrendingUp, { className: "w-5 h-5" }), "Calculer Score TERAS"] })) }), _jsxs("button", { type: "submit", disabled: !canSubmit, className: "px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "Cr\u00E9er l'Entreprise"] })] })] }) }), _jsx("div", { children: _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 sticky top-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-amber-400" }), "Score TERAS Entreprise"] }), estimatedScore === null ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(TrendingUp, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Remplissez le formulaire et cliquez sur \"Calculer Score TERAS\"" })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "relative", children: _jsxs("svg", { className: "w-48 h-48 mx-auto", viewBox: "0 0 200 200", children: [_jsx("circle", { cx: "100", cy: "100", r: "90", fill: "none", stroke: "rgb(51, 65, 85)", strokeWidth: "12" }), _jsx("circle", { cx: "100", cy: "100", r: "90", fill: "none", stroke: `rgb(${getBandColor(estimatedScore) === 'emerald' ? '16, 185, 129' : getBandColor(estimatedScore) === 'green' ? '34, 197, 94' : getBandColor(estimatedScore) === 'blue' ? '59, 130, 246' : getBandColor(estimatedScore) === 'amber' ? '245, 158, 11' : '249, 115, 22'})`, strokeWidth: "12", strokeDasharray: `${(estimatedScore / 1000) * 565} 565`, strokeLinecap: "round", transform: "rotate(-90 100 100)", className: "transition-all duration-1000" }), _jsx("text", { x: "100", y: "100", textAnchor: "middle", dy: ".3em", className: "text-4xl font-bold fill-white", children: estimatedScore }), _jsx("text", { x: "100", y: "130", textAnchor: "middle", className: "text-sm fill-slate-400", children: "/ 1000" })] }) }), _jsx("div", { className: "text-center", children: _jsxs("span", { className: `px-4 py-2 bg-${getBandColor(estimatedScore)}-500/10 text-${getBandColor(estimatedScore)}-400 text-lg rounded-xl font-bold inline-block`, children: ["Bande ", getBand(estimatedScore)] }) }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Plafond Cr\u00E9dit Estim\u00E9" }), _jsx("p", { className: "text-slate-300 text-xs mb-3", children: "Bas\u00E9 sur CRM = 30% du CA mensuel net" }), formData.monthlyRevenue && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-2xl font-bold text-white mb-1", children: [((parseInt(formData.monthlyRevenue) * 0.3 * 6 * 0.85) / 1000000).toFixed(1), "M CFA"] }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Sur 6 mois (mensualit\u00E9: ", ((parseInt(formData.monthlyRevenue) * 0.3) / 1000).toFixed(0), "K CFA)"] })] }))] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-300 text-sm font-semibold mb-3", children: "Produits \u00C9ligibles" }), _jsxs("div", { className: "space-y-2", children: [estimatedScore >= 700 && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-slate-300", children: "Cr\u00E9dit PME Croissance" })] })), estimatedScore >= 680 && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-slate-300", children: "Cr\u00E9dit \u00C9quipement Pro" })] })), estimatedScore >= 720 && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-slate-300", children: "Fonds de Roulement" })] }))] })] })] }))] }) })] })] }));
}
