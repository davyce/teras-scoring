import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
/**
 * Page de Conformité Fiscale TERAS Entreprise
 * @module pages/enterprise/EnterpriseCompliance
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import enterpriseApi from "../../services/enterpriseApi";
import { FileText, Calendar, AlertTriangle, CheckCircle, Clock, Upload, Download, ChevronRight, TrendingUp, Bell, RefreshCw, Eye, Search, AlertCircle, Info } from "lucide-react";
// ============================================================================
// DONNÉES MOCK
// ============================================================================
const [] = [
    {
        id: "1",
        name: "Déclaration TVA Mensuelle",
        category: "tax",
        status: "compliant",
        dueDate: "2024-11-15",
        submittedDate: "2024-11-10",
        description: "Déclaration de la TVA collectée et déductible du mois",
        impact: "high",
        documents: ["declaration_tva_oct_2024.pdf"]
    },
    {
        id: "2",
        name: "Impôt sur les Sociétés (IS)",
        category: "tax",
        status: "pending",
        dueDate: "2024-12-31",
        description: "Acompte trimestriel de l'IS",
        impact: "high"
    },
    {
        id: "3",
        name: "Cotisations CNSS",
        category: "social",
        status: "compliant",
        dueDate: "2024-11-15",
        submittedDate: "2024-11-12",
        description: "Cotisations sociales des employés",
        impact: "high",
        documents: ["cnss_nov_2024.pdf"]
    },
    {
        id: "4",
        name: "Déclaration Annuelle des Revenus",
        category: "tax",
        status: "upcoming",
        dueDate: "2025-03-31",
        description: "Déclaration annuelle des revenus de l'entreprise",
        impact: "high"
    },
    {
        id: "5",
        name: "Bilan Comptable Annuel",
        category: "legal",
        status: "overdue",
        dueDate: "2024-10-31",
        description: "Dépôt du bilan comptable de l'exercice précédent",
        impact: "high"
    },
    {
        id: "6",
        name: "Patente",
        category: "tax",
        status: "compliant",
        dueDate: "2024-06-30",
        submittedDate: "2024-06-25",
        description: "Taxe professionnelle annuelle",
        impact: "medium",
        documents: ["patente_2024.pdf"]
    }
];
const [] = [
    {
        id: "1",
        type: "error",
        title: "Bilan comptable en retard",
        message: "Le dépôt du bilan comptable annuel est en retard de 22 jours. Des pénalités peuvent s'appliquer.",
        date: "2024-11-22",
        actionRequired: true
    },
    {
        id: "2",
        type: "warning",
        title: "Échéance IS proche",
        message: "L'acompte trimestriel de l'IS est dû dans 39 jours.",
        date: "2024-11-22",
        actionRequired: true
    },
    {
        id: "3",
        type: "info",
        title: "Nouvelle réglementation",
        message: "De nouvelles règles de facturation électronique entreront en vigueur en janvier 2025.",
        date: "2024-11-20",
        actionRequired: false
    }
];
// ============================================================================
// COMPOSANTS
// ============================================================================
// Badge de statut
const StatusBadge = ({ status }) => {
    const configs = {
        compliant: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Conforme" },
        pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", label: "En attente" },
        overdue: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "En retard" },
        upcoming: { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", label: "À venir" }
    };
    const config = configs[status];
    const Icon = config.icon;
    return (_jsxs("div", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`, children: [_jsx(Icon, { className: `w-3.5 h-3.5 ${config.color}` }), _jsx("span", { className: `text-xs font-medium ${config.color}`, children: config.label })] }));
};
// Badge d'impact
const ImpactBadge = ({ impact }) => {
    const configs = {
        high: { color: "text-red-400", bg: "bg-red-500/10", label: "Impact élevé" },
        medium: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Impact moyen" },
        low: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Impact faible" }
    };
    const config = configs[impact];
    return (_jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.color}`, children: config.label }));
};
// Carte d'alerte
const AlertCard = ({ alert, onAction }) => {
    const configs = {
        error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
        warning: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
        info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" }
    };
    const config = configs[alert.type];
    const Icon = config.icon;
    return (_jsx("div", { className: `p-4 rounded-xl ${config.bg} border ${config.border}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Icon, { className: `w-5 h-5 ${config.color} flex-shrink-0 mt-0.5` }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h4", { className: `font-medium ${config.color}`, children: alert.title }), _jsx("span", { className: "text-xs text-slate-500", children: alert.date })] }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: alert.message }), alert.actionRequired && (_jsx("button", { onClick: onAction, className: `mt-3 text-sm font-medium ${config.color} hover:underline`, children: "Prendre action \u2192" }))] })] }) }));
};
// Carte de conformité
const ComplianceCard = ({ item, onUpload, onViewDocument }) => {
    const categoryLabels = {
        tax: "Fiscal",
        social: "Social",
        legal: "Juridique",
        other: "Autre"
    };
    const categoryColors = {
        tax: "bg-purple-500/20 text-purple-400",
        social: "bg-blue-500/20 text-blue-400",
        legal: "bg-amber-500/20 text-amber-400",
        other: "bg-slate-500/20 text-slate-400"
    };
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded ${categoryColors[item.category]}`, children: categoryLabels[item.category] }), _jsx(ImpactBadge, { impact: item.impact })] }), _jsx(StatusBadge, { status: item.status })] }), _jsx("h3", { className: "font-semibold text-white mb-1", children: item.name }), _jsx("p", { className: "text-sm text-slate-400 mb-3", children: item.description }), _jsxs("div", { className: "space-y-2 mb-4", children: [item.dueDate && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Calendar, { className: "w-4 h-4 text-slate-500" }), _jsxs("span", { className: "text-slate-400", children: ["\u00C9ch\u00E9ance: ", _jsx("span", { className: item.status === "overdue" ? "text-red-400" : "text-white", children: new Date(item.dueDate).toLocaleDateString("fr-FR") })] })] })), item.submittedDate && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" }), _jsxs("span", { className: "text-slate-400", children: ["Soumis le: ", _jsx("span", { className: "text-green-400", children: new Date(item.submittedDate).toLocaleDateString("fr-FR") })] })] }))] }), _jsx("div", { className: "flex gap-2", children: item.documents && item.documents.length > 0 ? (_jsxs("button", { onClick: onViewDocument, className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition", children: [_jsx(Eye, { className: "w-4 h-4" }), "Voir document"] })) : (_jsxs("button", { onClick: onUpload, className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:bg-purple-500/30 transition", children: [_jsx(Upload, { className: "w-4 h-4" }), "Uploader"] })) })] }));
};
// Jauge de conformité globale
const ComplianceGauge = ({ percentage }) => {
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percentage / 100) * circumference;
    const getColor = (p) => {
        if (p >= 90)
            return { stroke: "#10b981", text: "text-emerald-400", label: "Excellent" };
        if (p >= 70)
            return { stroke: "#a855f7", text: "text-purple-400", label: "Bon" };
        if (p >= 50)
            return { stroke: "#eab308", text: "text-amber-400", label: "À améliorer" };
        return { stroke: "#ef4444", text: "text-red-400", label: "Critique" };
    };
    const colorInfo = getColor(percentage);
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative", children: [_jsxs("svg", { width: "140", height: "140", className: "transform -rotate-90", children: [_jsx("circle", { cx: "70", cy: "70", r: "60", fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: "8" }), _jsx("circle", { cx: "70", cy: "70", r: "60", fill: "none", stroke: colorInfo.stroke, strokeWidth: "8", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, className: "transition-all duration-1000", style: { filter: `drop-shadow(0 0 8px ${colorInfo.stroke})` } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsxs("span", { className: `text-3xl font-bold ${colorInfo.text}`, children: [percentage, "%"] }), _jsx("span", { className: "text-xs text-slate-400", children: "Conformit\u00E9" })] })] }), _jsx("span", { className: `mt-2 text-sm font-medium ${colorInfo.text}`, children: colorInfo.label })] }));
};
// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const EnterpriseCompliance = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const buildComplianceItems = (data) => {
        const generatedItems = [];
        const today = new Date();
        (data?.missing_declarations || []).forEach((entry, index) => {
            const dueDate = entry?.deadline || entry?.due_date || undefined;
            const parsedDueDate = dueDate ? new Date(dueDate) : null;
            const status = parsedDueDate && parsedDueDate.getTime() < today.getTime() ? "overdue" : "pending";
            generatedItems.push({
                id: `missing-${index}`,
                name: entry?.type || `Déclaration manquante ${index + 1}`,
                category: "tax",
                status,
                dueDate,
                description: `Pièce ou déclaration manquante à régulariser pour maintenir la conformité fiscale.`,
                impact: "high",
            });
        });
        if (data?.last_tax_filing) {
            generatedItems.push({
                id: "last-tax-filing",
                name: "Dernier dépôt fiscal",
                category: "tax",
                status: "compliant",
                submittedDate: data.last_tax_filing,
                description: "Dernier dépôt fiscal enregistré dans TERAS.",
                impact: "medium",
                documents: ["Dernier dépôt fiscal"],
            });
        }
        if (Number(data?.late_payments || 0) > 0) {
            generatedItems.push({
                id: "late-payments",
                name: "Paiements en retard",
                category: "social",
                status: "overdue",
                description: `${data.late_payments} paiement(s) en retard détecté(s).`,
                impact: Number(data?.late_payments) > 1 ? "high" : "medium",
            });
        }
        if (Number(data?.penalties || 0) > 0) {
            generatedItems.push({
                id: "penalties",
                name: "Pénalités administratives",
                category: "legal",
                status: "pending",
                description: `Pénalités estimées à ${Number(data.penalties).toLocaleString("fr-FR")} FCFA à régulariser.`,
                impact: "high",
            });
        }
        if (!generatedItems.length && typeof data?.compliance_rate !== "undefined") {
            generatedItems.push({
                id: "compliance-summary",
                name: "Statut global de conformité",
                category: "other",
                status: Number(data.compliance_rate) >= 80 ? "compliant" : Number(data.compliance_rate) >= 60 ? "pending" : "overdue",
                description: `Synthèse calculée automatiquement à partir des signaux de conformité TERAS.`,
                impact: "medium",
            });
        }
        return generatedItems;
    };
    const buildComplianceAlerts = (data) => {
        return (data?.active_alerts || []).map((entry, index) => {
            const rawLevel = typeof entry === "object" ? entry.level : "warning";
            const message = typeof entry === "object" ? entry.message : String(entry);
            return {
                id: `alert-${index}`,
                type: rawLevel === "error" ? "error" : rawLevel === "info" ? "info" : "warning",
                title: typeof entry === "object" ? (entry.title || entry.type || "Alerte conformité") : "Alerte conformité",
                message,
                date: typeof entry === "object" ? (entry.deadline || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
                actionRequired: rawLevel !== "info",
            };
        });
    };
    const loadCompliance = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await enterpriseApi.getCompliance();
            if (!data) {
                setItems([]);
                setAlerts([]);
                return;
            }
            setItems(buildComplianceItems(data));
            setAlerts(buildComplianceAlerts(data));
        }
        catch (e) {
            setItems([]);
            setAlerts([]);
            setError('Impossible de charger la conformité.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadCompliance();
    }, []);
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    // Calcul du taux de conformité
    const complianceRate = items.length
        ? Math.round((items.filter(i => i.status === "compliant").length / items.length) * 100)
        : 0;
    // Stats
    const stats = {
        total: items.length,
        compliant: items.filter(i => i.status === "compliant").length,
        pending: items.filter(i => i.status === "pending").length,
        overdue: items.filter(i => i.status === "overdue").length
    };
    // Filtrage
    const filteredItems = items.filter((item) => {
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesStatus && matchesSearch;
    });
    // Prochaines échéances
    const upcomingDeadlines = items
        .filter(i => i.status !== "compliant" && i.dueDate)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
    const exportCompliance = () => {
        const headers = ["id", "obligation", "categorie", "statut", "echeance", "soumis_le", "impact", "description"];
        const rows = filteredItems.map((item) => [
            item.id,
            item.name,
            item.category,
            item.status,
            item.dueDate || "",
            item.submittedDate || "",
            item.impact,
            item.description.replace(/\n/g, " "),
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "teras_enterprise_compliance.csv";
        link.click();
        URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Conformit\u00E9 Fiscale" }), _jsx("p", { className: "text-slate-400", children: "Suivez vos obligations fiscales et sociales" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: exportCompliance, className: "px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition flex items-center gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), "Exporter"] }), _jsxs("button", { onClick: loadCompliance, className: "px-4 py-2 bg-purple-500 rounded-xl text-sm font-semibold text-white hover:bg-purple-400 transition flex items-center gap-2", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${loading ? "animate-spin" : ""}` }), "Actualiser"] })] })] }), error && (_jsx("div", { className: "px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300", children: error })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center", children: [_jsx("h3", { className: "text-sm font-medium text-slate-400 mb-4", children: "Taux de conformit\u00E9" }), _jsx(ComplianceGauge, { percentage: complianceRate })] }), _jsxs("div", { className: "lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3", children: _jsx(FileText, { className: "w-5 h-5 text-purple-400" }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.total }), _jsx("p", { className: "text-sm text-slate-400", children: "Obligations" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3", children: _jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.compliant }), _jsx("p", { className: "text-sm text-slate-400", children: "Conformes" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3", children: _jsx(Clock, { className: "w-5 h-5 text-amber-400" }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.pending }), _jsx("p", { className: "text-sm text-slate-400", children: "En attente" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3", children: _jsx(AlertTriangle, { className: "w-5 h-5 text-red-400" }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.overdue }), _jsx("p", { className: "text-sm text-slate-400", children: "En retard" })] })] })] }), alerts.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(Bell, { className: "w-5 h-5 text-amber-400" }), "Alertes"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: alerts.map((alert) => (_jsx(AlertCard, { alert: alert, onAction: () => navigate("/enterprise/documents") }, alert.id))) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" })] }), _jsxs("select", { value: filterCategory, onChange: (e) => setFilterCategory(e.target.value), className: "px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500", children: [_jsx("option", { value: "all", children: "Toutes cat\u00E9gories" }), _jsx("option", { value: "tax", children: "Fiscal" }), _jsx("option", { value: "social", children: "Social" }), _jsx("option", { value: "legal", children: "Juridique" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500", children: [_jsx("option", { value: "all", children: "Tous statuts" }), _jsx("option", { value: "compliant", children: "Conforme" }), _jsx("option", { value: "pending", children: "En attente" }), _jsx("option", { value: "overdue", children: "En retard" }), _jsx("option", { value: "upcoming", children: "\u00C0 venir" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredItems.map((item) => (_jsx(ComplianceCard, { item: item, onUpload: () => navigate("/enterprise/documents"), onViewDocument: () => navigate("/enterprise/documents") }, item.id))) }), filteredItems.length === 0 && (_jsxs("div", { className: "text-center py-12 bg-slate-900/50 border border-white/10 rounded-xl", children: [_jsx(FileText, { className: "w-12 h-12 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Aucune obligation trouv\u00E9e" })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h3", { className: "font-semibold text-white mb-4 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-5 h-5 text-purple-400" }), "Prochaines \u00E9ch\u00E9ances"] }), _jsx("div", { className: "space-y-3", children: upcomingDeadlines.map((item) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: item.name }), _jsx("p", { className: `text-xs ${item.status === "overdue" ? "text-red-400" : "text-slate-400"}`, children: item.status === "overdue" ? "En retard" : new Date(item.dueDate).toLocaleDateString("fr-FR") })] }), _jsx(StatusBadge, { status: item.status })] }, item.id))) })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl p-6", children: [_jsxs("h3", { className: "font-semibold text-white mb-4 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-purple-400" }), "Impact sur le score"] }), _jsxs("p", { className: "text-sm text-slate-400 mb-4", children: ["La conformit\u00E9 fiscale repr\u00E9sente ", _jsx("strong", { className: "text-white", children: "30%" }), " de votre score TERAS Entreprise."] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-slate-400", children: "Score actuel (T)" }), _jsx("span", { className: "text-purple-400 font-semibold", children: "210/250" })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-slate-400", children: "Potentiel" }), _jsx("span", { className: "text-green-400 font-semibold", children: "+40 pts" })] })] }), _jsx("button", { onClick: () => navigate("/enterprise/documents"), className: "w-full mt-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition", children: "Voir les recommandations" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsx("h3", { className: "font-semibold text-white mb-4", children: "Besoin d'aide ?" }), _jsx("p", { className: "text-sm text-slate-400 mb-4", children: "Notre \u00E9quipe peut vous accompagner dans vos d\u00E9marches fiscales." }), _jsxs("button", { onClick: () => navigate("/enterprise/support"), className: "w-full py-2 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition flex items-center justify-center gap-2", children: ["Contacter un conseiller", _jsx(ChevronRight, { className: "w-4 h-4" })] })] })] })] })] }));
};
export default EnterpriseCompliance;
