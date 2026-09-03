import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../services/authFetch";
import { BarChart2, DollarSign, Users, Shield, TrendingUp, FileText, Download, RefreshCw, Clock, Plus, X, Trash2, Calendar, ChevronRight, } from "lucide-react";
const BASE = "/api/scoring/enterprise";
// ── Config templates avec icônes Lucide ──────────────────────────────────────
const REPORT_TYPES = [
    {
        key: "teras_complet",
        label: "Rapport TERAS Complet",
        description: "Score TERAS détaillé avec breakdown des 5 piliers et recommandations",
        duration: "2-3 min",
        Icon: BarChart2,
        iconBg: "bg-teal-500/20",
        iconColor: "text-teal-400",
    },
    {
        key: "analyse_financiere",
        label: "Analyse Financière",
        description: "États financiers, flux de trésorerie et ratios clés",
        duration: "3-5 min",
        Icon: DollarSign,
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-400",
    },
    {
        key: "rapport_rh",
        label: "Rapport RH",
        description: "Effectifs, turnover, performance et formation des employés",
        duration: "2-3 min",
        Icon: Users,
        iconBg: "bg-purple-500/20",
        iconColor: "text-purple-400",
    },
    {
        key: "conformite_reglementaire",
        label: "Conformité Réglementaire",
        description: "Statut de conformité, documents requis et échéances OHADA/CEMAC",
        duration: "1-2 min",
        Icon: Shield,
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-400",
    },
    {
        key: "strategie_croissance",
        label: "Stratégie de Croissance",
        description: "Opportunités de marché, recommandations d'expansion et feuille de route",
        duration: "3-4 min",
        Icon: TrendingUp,
        iconBg: "bg-sky-500/20",
        iconColor: "text-sky-400",
    },
];
const TYPE_MAP = Object.fromEntries(REPORT_TYPES.map(r => [r.key, r]));
function formatMarkdown(text) {
    return text
        .replace(/#### (.+)/g, '<h4 class="text-sm font-semibold text-slate-300 mt-3 mb-1">$1</h4>')
        .replace(/### (.+)/g, '<h3 class="text-base font-semibold text-white mt-4 mb-1">$1</h3>')
        .replace(/## (.+)/g, '<h2 class="text-lg font-bold text-sky-400 mt-6 mb-2">$1</h2>')
        .replace(/^# (.+)/gm, '<h2 class="text-xl font-bold text-sky-400 mt-6 mb-2">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/^[-•] (.+)/gm, '<li class="ml-4 list-disc text-slate-300 mb-1">$1</li>')
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/\n/g, "<br/>");
}
export default function EnterpriseReports() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("templates");
    const [generating, setGenerating] = useState(null);
    const [streamText, setStreamText] = useState("");
    const [activeReport, setActiveReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const abortRef = useRef(null);
    const loadHistory = useCallback(async () => {
        if (historyLoaded)
            return;
        try {
            const res = await authFetch(`${BASE}/reports/ai/history/`);
            const data = await res.json();
            setHistory(data.reports || []);
        }
        catch {
            setHistory([]);
        }
        finally {
            setHistoryLoaded(true);
        }
    }, [historyLoaded]);
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setNotice(null);
        if (tab === "historique") {
            setHistoryLoaded(false); // forcer rechargement à chaque clic
            setHistory([]);
        }
    };
    useEffect(() => {
        if (activeTab === "historique" && !historyLoaded) {
            loadHistory();
        }
    }, [activeTab, historyLoaded, loadHistory]);
    const handleOpenTemplates = () => {
        setActiveReport(null);
        setStreamText("");
        setError(null);
        setNotice(null);
        setActiveTab("templates");
    };
    const handleGenerate = async (reportKey) => {
        if (generating)
            return;
        setGenerating(reportKey);
        setActiveReport(reportKey);
        setStreamText("");
        setError(null);
        setNotice(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const res = await authFetch(`${BASE}/reports/ai/generate/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ report_type: reportKey }),
                signal: controller.signal,
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            if (!res.body)
                throw new Error("Aucun flux de génération reçu.");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (!line.startsWith("data: "))
                        continue;
                    const raw = line.slice(6).trim();
                    if (raw === "[DONE]") {
                        setGenerating(null);
                        return;
                    }
                    try {
                        const evt = JSON.parse(raw);
                        if (evt.type === "done") {
                            setGenerating(null);
                            setHistoryLoaded(false);
                            setNotice("Rapport généré. Vous pouvez l'exporter ou le retrouver dans l'historique.");
                            return;
                        }
                        if (evt.text)
                            setStreamText(prev => prev + evt.text);
                    }
                    catch { /* ignore */ }
                }
            }
        }
        catch (err) {
            if (err.name !== "AbortError")
                setError("Erreur lors de la génération. Vérifiez votre connexion.");
        }
        finally {
            setGenerating(null);
        }
    };
    const handleExportPDF = async () => {
        if (!activeReport || exportingPdf)
            return;
        setExportingPdf(true);
        try {
            const res = await authFetch(`${BASE}/reports/ai/export-pdf/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report_type: activeReport, content: streamText }),
            });
            if (!res.ok)
                throw new Error("PDF error");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `TERAS_${activeReport}_${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            setNotice("Le rapport PDF a bien été téléchargé.");
        }
        catch {
            setError("Impossible de générer le PDF.");
        }
        finally {
            setExportingPdf(false);
        }
    };
    const handleDeleteReport = async (id) => {
        try {
            await authFetch(`${BASE}/reports/ai/${id}/delete/`, { method: "DELETE" });
            setHistory(prev => prev.filter(r => r.id !== id));
            setNotice("Rapport supprimé de l'historique.");
        }
        catch { /* silencieux */ }
    };
    const stats = [
        { label: "Rapports ce mois", value: history.length, delta: null, Icon: FileText, color: "text-sky-400" },
        { label: "Téléchargements", value: 0, delta: null, Icon: Download, color: "text-emerald-400" },
        { label: "En cours", value: generating ? 1 : 0, delta: null, Icon: RefreshCw, color: "text-amber-400" },
        { label: "Planifiés", value: 0, delta: null, Icon: Clock, color: "text-purple-400" },
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Rapports & Analytics" }), _jsx("p", { className: "text-slate-400 mt-1 text-sm", children: "G\u00E9n\u00E9rez et consultez vos rapports TERAS Entreprise" })] }), _jsxs("div", { className: "flex gap-3", children: [streamText && activeReport && (_jsxs("button", { onClick: handleExportPDF, disabled: exportingPdf || !!generating, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors", children: [_jsx(Download, { size: 15 }), exportingPdf ? "Export…" : "Exporter PDF"] })), _jsxs("button", { onClick: () => setNotice("La planification de rapports arrive bientôt dans TERAS Entreprise."), className: "flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors", children: [_jsx(Calendar, { size: 15 }), "Planifier un rapport"] }), _jsxs("button", { onClick: handleOpenTemplates, className: "flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors", children: [_jsx(Plus, { size: 15 }), "Nouveau rapport"] })] })] }), error && (_jsxs("div", { className: "bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm flex items-center gap-3", children: ["\u26A0\uFE0F ", error, _jsx("button", { onClick: () => setError(null), className: "ml-auto", children: _jsx(X, { size: 14 }) })] })), notice && (_jsxs("div", { className: "bg-sky-900/20 border border-sky-500/30 rounded-lg p-4 text-sky-200 text-sm flex items-center gap-3", children: ["\u2139\uFE0F ", notice, _jsx("button", { onClick: () => setNotice(null), className: "ml-auto text-sky-300 hover:text-white", children: _jsx(X, { size: 14 }) })] })), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((s, i) => (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx(s.Icon, { size: 20, className: s.color }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: s.value }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: s.label })] }, i))) }), activeReport && (_jsxs("div", { className: "bg-slate-900/70 border border-sky-500/20 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-800/50", children: [_jsx("div", { className: "flex items-center gap-3", children: (() => {
                                    const rt = TYPE_MAP[activeReport];
                                    if (!rt)
                                        return null;
                                    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `w-8 h-8 rounded-lg ${rt.iconBg} flex items-center justify-center`, children: _jsx(rt.Icon, { size: 16, className: rt.iconColor }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: rt.label }), _jsx("p", { className: "text-xs", children: generating
                                                            ? _jsxs("span", { className: "text-sky-400 flex items-center gap-1", children: [_jsx(RefreshCw, { size: 10, className: "animate-spin inline" }), " G\u00E9n\u00E9ration en cours\u2026"] })
                                                            : _jsx("span", { className: "text-emerald-400", children: "\u2713 Rapport g\u00E9n\u00E9r\u00E9" }) })] })] }));
                                })() }), _jsxs("div", { className: "flex gap-2", children: [generating && (_jsx("button", { onClick: () => { abortRef.current?.abort(); setGenerating(null); }, className: "px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors", children: "Arr\u00EAter" })), _jsx("button", { onClick: handleOpenTemplates, className: "p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors", children: _jsx(X, { size: 14 }) })] })] }), _jsxs("div", { className: "p-5 max-h-[520px] overflow-y-auto", children: [streamText ? (_jsx("div", { className: "text-slate-300 text-sm leading-relaxed", dangerouslySetInnerHTML: { __html: formatMarkdown(streamText) } })) : (_jsxs("div", { className: "flex items-center gap-3 text-slate-400 text-sm py-8 justify-center", children: [_jsx(RefreshCw, { size: 18, className: "animate-spin text-sky-400" }), "Initialisation du rapport TERAS IA\u2026"] })), generating && streamText && (_jsx("span", { className: "inline-block w-2 h-4 bg-sky-400 animate-pulse ml-1 rounded-sm align-middle" }))] })] })), _jsx("div", { className: "border-b border-white/10", children: _jsx("div", { className: "flex gap-6", children: ["templates", "historique"].map(tab => (_jsx("button", { onClick: () => handleTabChange(tab), className: `pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? "border-sky-400 text-sky-400"
                            : "border-transparent text-slate-400 hover:text-white"}`, children: tab === "templates" ? "Templates de rapports" : "Historique" }, tab))) }) }), activeTab === "templates" && (_jsxs("div", { children: [_jsxs("div", { className: "mb-5", children: [_jsx("h2", { className: "text-white font-semibold", children: "Choisissez un template de rapport" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "S\u00E9lectionnez un mod\u00E8le pr\u00E9d\u00E9fini pour g\u00E9n\u00E9rer rapidement un rapport" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: REPORT_TYPES.map(rt => {
                            const isActive = generating === rt.key;
                            return (_jsxs("div", { className: `bg-slate-900/50 border rounded-xl p-5 flex flex-col gap-4 transition-all ${isActive ? "border-sky-400/40 bg-sky-900/10" : "border-white/10 hover:border-white/20"}`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl ${rt.iconBg} flex items-center justify-center shrink-0`, children: _jsx(rt.Icon, { size: 20, className: rt.iconColor }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold text-sm", children: rt.label }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: rt.description })] })] }), _jsxs("div", { className: "flex items-center gap-1 text-slate-500 text-xs whitespace-nowrap ml-3 mt-0.5", children: [_jsx(Clock, { size: 11 }), rt.duration] })] }), _jsx("button", { onClick: () => handleGenerate(rt.key), disabled: !!generating, className: `w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${isActive
                                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 cursor-not-allowed"
                                            : generating
                                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                                : "bg-sky-500 hover:bg-sky-400 text-white"}`, children: isActive
                                            ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 14, className: "animate-spin" }), " G\u00E9n\u00E9ration en cours\u2026"] })
                                            : _jsxs(_Fragment, { children: [_jsx(Plus, { size: 14 }), " G\u00E9n\u00E9rer ce rapport"] }) })] }, rt.key));
                        }) }), _jsxs("button", { type: "button", onClick: () => navigate("/enterprise/assistant"), className: "mt-4 w-full border border-dashed border-white/10 rounded-xl p-5 flex items-center gap-3 text-slate-500 hover:border-white/20 hover:text-slate-300 transition-colors", children: [_jsx(FileText, { size: 18 }), _jsx("span", { className: "text-sm", children: "Besoin d'un rapport personnalis\u00E9 ?" }), _jsx(ChevronRight, { size: 16, className: "ml-auto" })] })] })), activeTab === "historique" && (_jsx("div", { children: !historyLoaded ? (_jsxs("div", { className: "flex items-center gap-3 text-slate-400 py-12 justify-center", children: [_jsx(RefreshCw, { size: 16, className: "animate-spin text-sky-400" }), " Chargement\u2026"] })) : history.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-slate-500", children: [_jsx(FileText, { size: 40, className: "mx-auto mb-4 opacity-30" }), _jsx("p", { className: "text-sm", children: "Aucun rapport g\u00E9n\u00E9r\u00E9 pour l'instant." }), _jsx("button", { onClick: () => handleTabChange("templates"), className: "mt-4 text-sky-400 hover:text-sky-300 text-sm", children: "G\u00E9n\u00E9rer votre premier rapport \u2192" })] })) : (_jsx("div", { className: "space-y-3", children: history.map(r => {
                        const rt = TYPE_MAP[r.report_type];
                        return (_jsxs("div", { onClick: () => { if (r.full_content) {
                                setStreamText(r.full_content);
                                setActiveReport(r.report_type);
                                setActiveTab("templates");
                                setNotice("Rapport rechargé depuis l'historique.");
                            } }, className: "bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-sky-500/30 transition-colors cursor-pointer", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [rt && (_jsx("div", { className: `w-9 h-9 rounded-lg ${rt.iconBg} flex items-center justify-center shrink-0 mt-0.5`, children: _jsx(rt.Icon, { size: 16, className: rt.iconColor }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white font-medium text-sm", children: r.label }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: new Date(r.generated_at).toLocaleDateString("fr-FR", {
                                                        day: "2-digit", month: "long", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    }) }), _jsx("p", { className: "text-slate-500 text-xs mt-1 truncate", children: r.content_preview })] })] }), _jsx("button", { onClick: (event) => {
                                        event.stopPropagation();
                                        handleDeleteReport(r.id);
                                    }, className: "p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg border border-red-500/20 transition-colors shrink-0", children: _jsx(Trash2, { size: 13 }) })] }, r.id));
                    }) })) }))] }));
}
