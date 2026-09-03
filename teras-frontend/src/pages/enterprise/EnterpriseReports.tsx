import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../services/authFetch";
import DOMPurify from 'dompurify';
import {
  BarChart2, DollarSign, Users, Shield, TrendingUp,
  FileText, Download, RefreshCw, Clock, Plus, X, Trash2,
  Calendar, ChevronRight,
} from "lucide-react";

const BASE = "/api/scoring/enterprise";

interface ReportHistory {
  id: number;
  report_type: string;
  label: string;
  generated_at: string;
  content_preview: string;
  full_content?: string;
}

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

function formatMarkdown(text: string): string {
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
  const navigate                           = useNavigate();
  const [activeTab, setActiveTab]         = useState<"templates" | "historique">("templates");
  const [generating, setGenerating]       = useState<string | null>(null);
  const [streamText, setStreamText]       = useState("");
  const [activeReport, setActiveReport]   = useState<string | null>(null);
  const [history, setHistory]             = useState<ReportHistory[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [exportingPdf, setExportingPdf]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [notice, setNotice]               = useState<string | null>(null);
  const abortRef                          = useRef<AbortController | null>(null);

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    try {
      const res  = await authFetch(`${BASE}/reports/ai/history/`);
      const data = await res.json();
      setHistory(data.reports || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [historyLoaded]);

  const handleTabChange = (tab: "templates" | "historique") => {
    setActiveTab(tab);
    setNotice(null);
    if (tab === "historique") {
      setHistoryLoaded(false);  // forcer rechargement à chaque clic
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

  const handleGenerate = async (reportKey: string) => {
    if (generating) return;
    setGenerating(reportKey);
    setActiveReport(reportKey);
    setStreamText("");
    setError(null);
    setNotice(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authFetch(`${BASE}/reports/ai/generate/`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
        },
        body:   JSON.stringify({ report_type: reportKey }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      if (!res.body) throw new Error("Aucun flux de génération reçu.");

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") { setGenerating(null); return; }
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "done") {
              setGenerating(null);
              setHistoryLoaded(false);
              setNotice("Rapport généré. Vous pouvez l'exporter ou le retrouver dans l'historique.");
              return;
            }
            if (evt.text) setStreamText(prev => prev + evt.text);
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError")
        setError("Erreur lors de la génération. Vérifiez votre connexion.");
    } finally {
      setGenerating(null);
    }
  };

  const handleExportPDF = async () => {
    if (!activeReport || exportingPdf) return;
    setExportingPdf(true);
    try {
      const res = await authFetch(`${BASE}/reports/ai/export-pdf/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ report_type: activeReport, content: streamText }),
      });
      if (!res.ok) throw new Error("PDF error");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `TERAS_${activeReport}_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice("Le rapport PDF a bien été téléchargé.");
    } catch {
      setError("Impossible de générer le PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    try {
      await authFetch(`${BASE}/reports/ai/${id}/delete/`, { method: "DELETE" });
      setHistory(prev => prev.filter(r => r.id !== id));
      setNotice("Rapport supprimé de l'historique.");
    } catch { /* silencieux */ }
  };

  const stats = [
    { label: "Rapports ce mois", value: history.length, delta: null, Icon: FileText,  color: "text-sky-400"     },
    { label: "Téléchargements",  value: 0,              delta: null, Icon: Download,  color: "text-emerald-400" },
    { label: "En cours",         value: generating ? 1 : 0, delta: null, Icon: RefreshCw, color: "text-amber-400" },
    { label: "Planifiés",        value: 0,              delta: null, Icon: Clock,     color: "text-purple-400"  },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rapports & Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm">Générez et consultez vos rapports TERAS Entreprise</p>
        </div>
        <div className="flex gap-3">
          {streamText && activeReport && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPdf || !!generating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download size={15} />
              {exportingPdf ? "Export…" : "Exporter PDF"}
            </button>
          )}
          <button
            onClick={() => setNotice("La planification de rapports arrive bientôt dans TERAS Entreprise.")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors"
          >
            <Calendar size={15} />
            Planifier un rapport
          </button>
          <button
            onClick={handleOpenTemplates}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nouveau rapport
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm flex items-center gap-3">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {notice && (
        <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg p-4 text-sky-200 text-sm flex items-center gap-3">
          ℹ️ {notice}
          <button onClick={() => setNotice(null)} className="ml-auto text-sky-300 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <s.Icon size={20} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zone streaming */}
      {activeReport && (
        <div className="bg-slate-900/70 border border-sky-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-3">
              {(() => {
                const rt = TYPE_MAP[activeReport];
                if (!rt) return null;
                return (
                  <>
                    <div className={`w-8 h-8 rounded-lg ${rt.iconBg} flex items-center justify-center`}>
                      <rt.Icon size={16} className={rt.iconColor} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{rt.label}</p>
                      <p className="text-xs">
                        {generating
                          ? <span className="text-sky-400 flex items-center gap-1"><RefreshCw size={10} className="animate-spin inline" /> Génération en cours…</span>
                          : <span className="text-emerald-400">✓ Rapport généré</span>
                        }
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2">
              {generating && (
                <button
                  onClick={() => { abortRef.current?.abort(); setGenerating(null); }}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors"
                >
                  Arrêter
                </button>
              )}
              <button
                onClick={handleOpenTemplates}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="p-5 max-h-[520px] overflow-y-auto">
            {streamText ? (
              <div
                className="text-slate-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMarkdown(streamText)) }}
              />
            ) : (
              <div className="flex items-center gap-3 text-slate-400 text-sm py-8 justify-center">
                <RefreshCw size={18} className="animate-spin text-sky-400" />
                Initialisation du rapport TERAS IA…
              </div>
            )}
            {generating && streamText && (
              <span className="inline-block w-2 h-4 bg-sky-400 animate-pulse ml-1 rounded-sm align-middle" />
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {(["templates", "historique"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-sky-400 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab === "templates" ? "Templates de rapports" : "Historique"}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      {activeTab === "templates" && (
        <div>
          <div className="mb-5">
            <h2 className="text-white font-semibold">Choisissez un template de rapport</h2>
            <p className="text-slate-400 text-sm mt-1">Sélectionnez un modèle prédéfini pour générer rapidement un rapport</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_TYPES.map(rt => {
              const isActive = generating === rt.key;
              return (
                <div
                  key={rt.key}
                  className={`bg-slate-900/50 border rounded-xl p-5 flex flex-col gap-4 transition-all ${
                    isActive ? "border-sky-400/40 bg-sky-900/10" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${rt.iconBg} flex items-center justify-center shrink-0`}>
                        <rt.Icon size={20} className={rt.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{rt.label}</h3>
                        <p className="text-slate-400 text-xs mt-0.5">{rt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-xs whitespace-nowrap ml-3 mt-0.5">
                      <Clock size={11} />
                      {rt.duration}
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate(rt.key)}
                    disabled={!!generating}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      isActive
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 cursor-not-allowed"
                        : generating
                        ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-sky-500 hover:bg-sky-400 text-white"
                    }`}
                  >
                    {isActive
                      ? <><RefreshCw size={14} className="animate-spin" /> Génération en cours…</>
                      : <><Plus size={14} /> Générer ce rapport</>
                    }
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate("/enterprise/assistant")}
            className="mt-4 w-full border border-dashed border-white/10 rounded-xl p-5 flex items-center gap-3 text-slate-500 hover:border-white/20 hover:text-slate-300 transition-colors"
          >
            <FileText size={18} />
            <span className="text-sm">Besoin d'un rapport personnalisé ?</span>
            <ChevronRight size={16} className="ml-auto" />
          </button>
        </div>
      )}

      {/* Historique */}
      {activeTab === "historique" && (
        <div>
          {!historyLoaded ? (
            <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
              <RefreshCw size={16} className="animate-spin text-sky-400" /> Chargement…
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FileText size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Aucun rapport généré pour l'instant.</p>
              <button
                onClick={() => handleTabChange("templates")}
                className="mt-4 text-sky-400 hover:text-sky-300 text-sm"
              >
                Générer votre premier rapport →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(r => {
                const rt = TYPE_MAP[r.report_type];
                return (
                  <div key={r.id} onClick={() => { if (r.full_content) { setStreamText(r.full_content); setActiveReport(r.report_type); setActiveTab("templates"); setNotice("Rapport rechargé depuis l'historique."); }}} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-sky-500/30 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {rt && (
                        <div className={`w-9 h-9 rounded-lg ${rt.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <rt.Icon size={16} className={rt.iconColor} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{r.label}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {new Date(r.generated_at).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-slate-500 text-xs mt-1 truncate">{r.content_preview}</p>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteReport(r.id);
                      }}
                      className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg border border-red-500/20 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
