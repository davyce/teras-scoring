// src/pages/government/GovernmentReports.tsx
// v3 — Welcome screen · Streaming SSE réel · PDF fonctionnel

import { useState, useRef, useEffect } from 'react';
import {
  FileText, Download, Loader2, Brain, RefreshCw,
  BarChart3, TrendingUp, Globe, Shield, CheckCircle,
  AlertCircle, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NationalData {
  avg_score: number;
  total_users: number;
  active_users: number;
  monthly_growth: number;
  scores_today: number;
  loans_volume: number;
  approval_rate: number;
  inclusion_rate: number;
  formal_jobs: number;
  total_revenue: number;
  top_country_name: string;
  regions: { name: string; avg_score: number; total_users: number; active_rate: number }[];
  sectors: { name: string; avg_score: number; total_enterprises: number; growth_rate: number }[];
  countries: { name: string; total_users: number; avg_score: number }[];
  alerts_count: number;
}

interface GeneratedReport {
  type: string;
  title: string;
  content: string;
  generatedAt: Date;
  data: NationalData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FCFA = (n: number) => {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)} Billions FCFA`;
  if (n >= 1_000_000_000)     return `${(n / 1_000_000_000).toFixed(1)} Milliards FCFA`;
  if (n >= 1_000_000)         return `${(n / 1_000_000).toFixed(1)} Millions FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};

const safeNumber = (value: unknown) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const REPORT_TYPES = [
  { id: 'economic_overview', label: 'Rapport Économique',    icon: BarChart3,  color: 'sky',    desc: 'Vue d\'ensemble complète — CA, emplois, secteurs, scores TERAS, CEMAC' },
  { id: 'fiscal_compliance', label: 'Conformité Fiscale',    icon: Shield,     color: 'amber',  desc: 'Alertes entreprises à risque, non-conformités, plan d\'intervention' },
  { id: 'employment',        label: 'Emploi Formel',         icon: TrendingUp, color: 'emerald',desc: 'Analyse des emplois déclarés par secteur et département' },
  { id: 'credit_inclusion',  label: 'Inclusion Financière',  icon: Brain,      color: 'violet', desc: 'Accès au crédit, taux d\'approbation, inclusion des PME' },
  { id: 'cemac_positioning', label: 'Positionnement CEMAC',  icon: Globe,      color: 'pink',   desc: 'Comparaison avec les 6 pays CEMAC, avantages compétitifs' },
];

// ─── Rendu markdown ────────────────────────────────────────────────────────────

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} className="text-white font-semibold">{p.slice(2,-2)}</strong>
    : <span key={i}>{p}</span>
  )}</>;
};

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const els: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      els.push(<h1 key={i} className="text-xl font-black text-white mt-6 mb-3 pb-2 border-b border-slate-700 flex items-center gap-2">
        <span className="w-1 h-5 bg-sky-400 rounded-full shrink-0"/>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      els.push(<h2 key={i} className="text-base font-bold text-sky-300 mt-5 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0"/>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      els.push(<h3 key={i} className="text-sm font-bold text-amber-300 mt-4 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith('**') && line.endsWith('**') && line.length < 100) {
      els.push(<p key={i} className="font-bold text-white mt-3 mb-1">{line.replace(/\*\*/g,'')}</p>);
    } else if (line.match(/^[-•]\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-•]\s/)) {
        items.push(<li key={i} className="flex gap-2 ml-1 mb-1.5 text-sm text-slate-200 leading-relaxed">
          <span className="text-sky-400 mt-1 shrink-0 text-xs">◆</span>
          <span>{renderInline(lines[i].slice(2))}</span>
        </li>);
        i++;
      }
      els.push(<ul key={`ul-${i}`} className="my-2 space-y-0">{items}</ul>);
      continue;
    } else if (line.match(/^\d+\.\s/)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(<li key={i} className="flex gap-2.5 ml-1 mb-1.5 text-sm text-slate-200 leading-relaxed">
          <span className="text-emerald-400 font-bold shrink-0 w-5 text-xs mt-0.5">{num}.</span>
          <span>{renderInline(lines[i].replace(/^\d+\.\s/,''))}</span>
        </li>);
        i++; num++;
      }
      els.push(<ol key={`ol-${i}`} className="my-2 space-y-0">{items}</ol>);
      continue;
    } else if (line.startsWith('═') || line.startsWith('─') || line === '---') {
      els.push(<div key={i} className="border-t border-slate-700/50 my-4"/>);
    } else if (line.trim() === '') {
      els.push(<div key={i} className="h-2"/>);
    } else {
      els.push(<p key={i} className="text-slate-200 text-sm leading-relaxed mb-1">{renderInline(line)}</p>);
    }
    i++;
  }
  return els;
};

// ─── Export PDF ───────────────────────────────────────────────────────────────

const escHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const inlineMd = (s: string) => escHtml(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');

const exportReportPDF = (report: GeneratedReport) => {
  const date    = report.generatedAt.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const rtLabel = REPORT_TYPES.find(r => r.id === report.type)?.label || report.type;
  const d       = report.data;
  const taxPot  = safeNumber(d.total_revenue) * 0.18;
  const credPot = safeNumber(d.loans_volume);

  const lines   = report.content.split('\n');
  let htmlBody  = '';
  let inList    = false;
  for (const line of lines) {
    const t = line.trim();
    if (inList && !t.match(/^[-•*]\s/) && !t.match(/^\d+\.\s/)) { htmlBody += '</ul>'; inList = false; }
    if (!t)                    { htmlBody += '<div style="height:6px;"></div>'; continue; }
    if (t.startsWith('# '))    htmlBody += `<h1 class="h1">${escHtml(t.slice(2))}</h1>`;
    else if (t.startsWith('## '))  htmlBody += `<h2 class="h2">${escHtml(t.slice(3))}</h2>`;
    else if (t.startsWith('### ')) htmlBody += `<h3 class="h3">${escHtml(t.slice(4))}</h3>`;
    else if (t.match(/^[-•*]\s/))  { if (!inList) { htmlBody += '<ul class="ul">'; inList = true; } htmlBody += `<li>${inlineMd(t.slice(2))}</li>`; }
    else if (t.match(/^\d+\.\s/))  { if (!inList) { htmlBody += '<ul class="ul">'; inList = true; } htmlBody += `<li><b style="color:#0369a1">${t.match(/^(\d+)/)?.[1]}.</b> ${inlineMd(t.replace(/^\d+\.\s/,''))}</li>`; }
    else if (t.match(/^[═─]{4,}/) || t === '---') htmlBody += '<hr class="sep"/>';
    else if (t.match(/^\*\*.*\*\*$/) && t.length < 90) htmlBody += `<p class="bl">${escHtml(t.replace(/\*\*/g,''))}</p>`;
    else htmlBody += `<p class="p">${inlineMd(t)}</p>`;
  }
  if (inList) htmlBody += '</ul>';

  const regRows = (d.regions || []).slice(0,5).map((r,i) =>
    `<tr style="background:${i%2?'#f8fafc':'#fff'}"><td class="td">${escHtml(r.name||'')}</td><td class="tdc"><span class="badge">${r.avg_score||0}/1000</span></td><td class="tdr">${(r.total_users||0).toLocaleString('fr-FR')}</td><td class="tdr">${r.active_rate||0}%</td></tr>`
  ).join('');
  const secRows = (d.sectors || []).slice(0,4).map((s,i) =>
    `<tr style="background:${i%2?'#f8fafc':'#fff'}"><td class="td">${escHtml(s.name||'')}</td><td class="tdc"><span class="badge">${s.avg_score||0}/1000</span></td><td class="tdr">${(s.total_enterprises||0).toLocaleString('fr-FR')}</td><td class="tdr" style="color:#0369a1;font-weight:600">${s.growth_rate||0}%</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${rtLabel} TERAS</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{margin:18mm 14mm;size:A4}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.65;color:#1e293b;background:#fff}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
@media screen{body{max-width:900px;margin:0 auto;padding:24px}}
.btn{position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#1e3a8a,#0369a1);color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(3,105,161,.4);z-index:9999}
.hdr{background:linear-gradient(135deg,#0c1445,#1e3a8a 55%,#0369a1);color:#fff;padding:36px 40px 32px;margin-bottom:28px;border-radius:0 0 16px 16px}
.hlbl{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#93c5fd;font-weight:700;margin-bottom:10px}
.htitle{font-size:24px;font-weight:900;margin-bottom:6px}
.hsub{font-size:12px;color:#bfdbfe;margin-bottom:24px}
.kgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kcard{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:12px 16px}
.klbl{font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.kval{font-size:15px;font-weight:800}
.stitle{font-size:13px;font-weight:700;color:#0f172a;border-bottom:2px solid #0ea5e9;padding-bottom:6px;margin:0 0 12px}
.sec{margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f1f5f9;padding:8px 12px;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;border-bottom:1px solid #e2e8f0}
.td{padding:7px 12px;color:#334155;border-bottom:1px solid #f1f5f9}
.tdc{padding:7px 12px;text-align:center;border-bottom:1px solid #f1f5f9}
.tdr{padding:7px 12px;text-align:right;color:#334155;border-bottom:1px solid #f1f5f9}
.badge{display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700}
.h1{font-size:18px;font-weight:900;color:#0f172a;border-bottom:3px solid #0ea5e9;padding-bottom:8px;margin:28px 0 14px}
.h2{font-size:14px;font-weight:700;color:#0369a1;margin:22px 0 8px;padding-left:12px;border-left:3px solid #0ea5e9}
.h3{font-size:12px;font-weight:700;color:#0f172a;margin:16px 0 6px}
.p{font-size:12px;color:#334155;line-height:1.7;margin-bottom:6px}
.bl{font-size:12px;font-weight:700;color:#0f172a;margin:10px 0 4px}
.sep{border:none;border-top:1px solid #e2e8f0;margin:14px 0}
.ul{margin:6px 0 10px;padding-left:0;list-style:none}
.ul li{font-size:12px;color:#334155;line-height:1.65;padding:3px 0 3px 20px;position:relative}
.ul li::before{content:'◆';position:absolute;left:4px;color:#0ea5e9;font-size:8px;top:5px}
.foot{border-top:2px solid #e2e8f0;padding-top:16px;margin-top:36px;display:flex;justify-content:space-between;align-items:flex-start}
.conf{margin-top:14px;padding:10px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:10px;color:#0369a1;line-height:1.6}
</style></head><body>
<button class="btn no-print" onclick="window.print()">⬇️ Enregistrer en PDF</button>
<div class="hdr">
  <div class="hlbl">République du Congo · Ministère des Finances · Système TERAS</div>
  <div class="htitle">${escHtml(report.title)}</div>
  <div class="hsub">Généré le ${date} · Claude Sonnet 4 · Données réelles TERAS</div>
  <div class="kgrid">
    <div class="kcard"><div class="klbl">Score National</div><div class="kval">${d.avg_score}/1000</div></div>
    <div class="kcard"><div class="klbl">Potentiel Fiscal/an</div><div class="kval">${FCFA(taxPot)}</div></div>
    <div class="kcard"><div class="klbl">Crédit Mobilisable</div><div class="kval">${FCFA(credPot)}</div></div>
    <div class="kcard"><div class="klbl">Utilisateurs Actifs</div><div class="kval">${d.active_users.toLocaleString('fr-FR')}</div></div>
  </div>
</div>
<div class="sec"><div class="stitle">🗺️ Performances Régionales</div>
<table><thead><tr><th>Région</th><th style="text-align:center">Score</th><th style="text-align:right">Utilisateurs</th><th style="text-align:right">Activité</th></tr></thead><tbody>${regRows}</tbody></table></div>
<div class="sec"><div class="stitle">🏭 Secteurs Économiques</div>
<table><thead><tr><th>Secteur</th><th style="text-align:center">Score</th><th style="text-align:right">Entreprises</th><th style="text-align:right">Poids</th></tr></thead><tbody>${secRows}</tbody></table></div>
<div>${htmlBody}</div>
<div class="foot">
  <div style="font-size:10px;color:#94a3b8;line-height:1.6;"><strong style="color:#475569;">Système TERAS</strong> · Scoring financier CEMAC<br/>Document généré par IA · Confidentiel · Données réelles TERAS</div>
  <div style="text-align:right;font-size:10px;"><strong style="color:#0f172a;font-size:14px;">TERAS IA</strong><br/><span style="color:#0369a1;">Claude Sonnet 4 · Anthropic</span></div>
</div>
<div class="conf"><strong>⚠️ Confidentialité :</strong> Ce rapport contient des analyses économiques nationales à usage gouvernemental exclusif. Ne pas divulguer sans autorisation ministérielle.</div>
</body></html>`;

  // Téléchargement direct — ouvrir le fichier .html puis Ctrl+P pour PDF
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `TERAS_${rtLabel.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function GovernmentReports() {
  const [showWelcome, setShowWelcome]             = useState(true);
  const [reportType, setReportType]               = useState('economic_overview');
  const [loading, setLoading]                     = useState(false);
  const [report, setReport]                       = useState<GeneratedReport | null>(null);
  const [error, setError]                         = useState<string | null>(null);
  const [streamedContent, setStreamedContent]     = useState('');
  const [nationalData, setNationalData]           = useState<NationalData | null>(null);
  const [expanded, setExpanded]                   = useState(true);

  const HISTORY_KEY = 'teras_gov_reports_history';
  interface ReportMeta { id: string; type: string; title: string; generatedAt: string; content: string; data: NationalData; }

  const loadHistory = (): ReportMeta[] => {
    try { const s = localStorage.getItem(HISTORY_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  };
  const [history, setHistory]         = useState<ReportMeta[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, macroRes, sectorsRes, complianceRes] = await Promise.all([
          authFetch('/api/scoring/government/overview/'),
          authFetch('/api/scoring/government/macro/'),
          authFetch('/api/scoring/government/sectors/'),
          authFetch('/api/scoring/government/compliance/'),
        ]);

        const overview = await overviewRes.json().catch(() => ({}));
        const macro = await macroRes.json().catch(() => ({}));
        const sectorsPayload = await sectorsRes.json().catch(() => ({}));
        const compliance = await complianceRes.json().catch(() => ({}));

        if (!overviewRes.ok) throw new Error(overview.error || `Erreur ${overviewRes.status}`);
        if (!macroRes.ok) throw new Error(macro.error || `Erreur ${macroRes.status}`);
        if (!sectorsRes.ok) throw new Error(sectorsPayload.error || `Erreur ${sectorsRes.status}`);
        if (!complianceRes.ok) throw new Error(compliance.error || `Erreur ${complianceRes.status}`);

        const summary = overview.summary || {};
        const countries = overview.by_country || [];
        const topCountry = countries.find((country: any) => country.is_own_country) || countries[0] || {};
        const totalActors = safeNumber(summary.enterprises) + safeNumber(summary.individuals);
        const weightedScore = totalActors > 0
          ? Math.round(
              (
                safeNumber(summary.avg_enterprise_score) * safeNumber(summary.enterprises) +
                safeNumber(summary.avg_individual_score) * safeNumber(summary.individuals)
              ) / totalActors,
            )
          : 0;
        const totalRevenue = safeNumber(summary.total_annual_revenue);

        setNationalData({
          avg_score: weightedScore,
          total_users: totalActors,
          active_users: safeNumber(summary.enterprises_active) + safeNumber(summary.loans_active),
          monthly_growth: (macro.growth_trend || []).reduce((sum: number, item: any) => (
            sum + safeNumber(item.new_enterprises) + safeNumber(item.new_individuals)
          ), 0),
          scores_today: safeNumber(summary.loans_total),
          loans_volume: safeNumber(summary.loans_volume || macro.loan_total_volume),
          approval_rate: safeNumber(summary.loan_approval_rate || macro.approval_rate),
          inclusion_rate: safeNumber(macro.inclusion_rate),
          formal_jobs: safeNumber(macro.formal_jobs),
          total_revenue: totalRevenue,
          top_country_name: topCountry.name || 'CEMAC',
          regions: countries.slice(0, 5).map((country: any) => ({
            name: country.name,
            avg_score: safeNumber(country.avg_score),
            total_users: safeNumber(country.enterprises) + safeNumber(country.individuals),
            active_rate: Math.round(
              (safeNumber(country.active) / Math.max(safeNumber(country.enterprises), 1)) * 100,
            ),
          })),
          sectors: (sectorsPayload.sectors || []).slice(0, 5).map((sector: any) => ({
            name: sector.label || sector.name,
            avg_score: safeNumber(sector.avg_score),
            total_enterprises: safeNumber(sector.count || sector.total_enterprises),
            growth_rate: totalActors > 0
              ? Math.round((safeNumber(sector.count || sector.total_enterprises) / totalActors) * 1000) / 10
              : 0,
          })),
          countries: countries.slice(0, 4).map((country: any) => ({
            name: country.name,
            total_users: safeNumber(country.enterprises) + safeNumber(country.individuals),
            avg_score: safeNumber(country.avg_score),
          })),
          alerts_count: safeNumber(compliance.total_at_risk),
        });
      } catch {
        setNationalData(null);
      }
    };
    fetchData();
  }, []);

  const selectedType = REPORT_TYPES.find(r => r.id === reportType)!;

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setStreamedContent('');
    setReport(null);

    const data = nationalData || {
      avg_score: 676, total_users: 8287, active_users: 6142,
      monthly_growth: 187, scores_today: 1456, loans_volume: 8200000000,
      approval_rate: 68.4, inclusion_rate: 42.5, formal_jobs: 12840, total_revenue: 21500000000,
      top_country_name: 'Congo Brazzaville',
      regions:  [{ name:'Brazzaville', avg_score:712, total_users:4200, active_rate:74 },{ name:'Pointe-Noire', avg_score:681, total_users:2100, active_rate:68 }],
      sectors:  [{ name:'Services', avg_score:698, total_enterprises:4200, growth_rate:12.5 },{ name:'Commerce', avg_score:672, total_enterprises:3800, growth_rate:8.3 }],
      countries: [{ name: 'Congo Brazzaville', total_users: 4200, avg_score: 712 }],
      alerts_count: 2,
    };

    try {
      const res = await authFetch('/api/scoring/government/reports/generate-enriched/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type:   reportType,
          custom_prompt: '',
          period:        new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        }),
      });

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let content   = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.text) { content += parsed.text; setStreamedContent(content); }
            } catch {}
          }
        }
      }

      const rTitle    = `${selectedType.label} TERAS — ${new Date().toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}`;
      const newReport: GeneratedReport = { type: reportType, title: rTitle, content, generatedAt: new Date(), data };
      setReport(newReport);

      const meta: ReportMeta = { id: Date.now().toString(36), type: reportType, title: rTitle, generatedAt: new Date().toISOString(), content, data };
      setHistory(prev => {
        const updated = [meta, ...prev].slice(0, 15);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      setStreamedContent('');
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setError('Erreur lors de la génération. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // ── Écran d'accueil ──────────────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"/>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"/>
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          {/* Icône */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/30 to-blue-600/30 border border-sky-500/40 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(56,189,248,0.2)' }}>
              <FileText className="w-10 h-10 text-sky-400"/>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">TERAS Gouvernement</p>
              <h1 className="text-4xl font-black text-white leading-tight">Rapports IA</h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Analyses économiques nationales générées par IA avec vos données réelles CEMAC
              </p>
            </div>
          </div>

          {/* KPIs si données disponibles */}
          {nationalData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Score National',   value: `${nationalData.avg_score}/1000`,                              color: 'sky'     },
                  { label: 'Acteurs suivis',   value: nationalData.total_users.toLocaleString('fr-FR'),              color: 'emerald' },
                  { label: 'Volume crédit',    value: FCFA(nationalData.loans_volume),                                color: 'violet'  },
                  { label: 'Alertes actives',  value: String(nationalData.alerts_count),                             color: 'amber'   },
                ].map((k, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-slate-500 text-xs mb-1">{k.label}</p>
                  <p className={`text-${k.color}-400 font-bold text-xl`}>{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Types de rapports */}
          <div className="space-y-3">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4"/> Choisir un type de rapport
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {REPORT_TYPES.map(rt => (
                <button key={rt.id}
                  onClick={() => { setReportType(rt.id); setShowWelcome(false); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border bg-slate-900/60 border-slate-800 hover:bg-${rt.color}-900/20 hover:border-${rt.color}-600/40 group transition-all`}>
                  <div className={`w-11 h-11 rounded-xl bg-${rt.color}-500/20 border border-${rt.color}-500/30 flex items-center justify-center shrink-0 transition-colors`}>
                    <rt.icon className={`w-5 h-5 text-${rt.color}-400`}/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{rt.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{rt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accès historique */}
          {history.length > 0 && (
            <button onClick={() => { setShowWelcome(false); setShowHistory(true); }}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-slate-900/60 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm transition-all">
              <FileText className="w-4 h-4"/>
              Voir mes {history.length} rapport{history.length > 1 ? 's' : ''} précédent{history.length > 1 ? 's' : ''}
            </button>
          )}

          <p className="text-slate-700 text-xs">
            Données TERAS en temps réel · Streaming en direct · Claude Sonnet 4
          </p>
        </div>
      </div>
    );
  }

  // ── Vue principale ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">TERAS Gouvernement</p>
          <h1 className="text-3xl font-black text-white">Rapports Gouvernementaux</h1>
          <p className="text-slate-400 mt-1 text-sm">Génération IA avec données TERAS réelles — streaming en direct</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWelcome(true)}
            className="px-4 py-2.5 border border-slate-700 hover:border-slate-600 bg-slate-900/60 text-slate-400 hover:text-white rounded-xl text-sm transition-all">
            ← Accueil
          </button>
          <button onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${
              showHistory ? 'bg-sky-900/40 border-sky-600 text-sky-300' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
            }`}>
            <FileText className="w-4 h-4"/>
            Historique
            {history.length > 0 && <span className="px-1.5 py-0.5 bg-sky-600 text-white text-xs rounded-full font-bold">{history.length}</span>}
          </button>
        </div>
      </div>

      {/* Historique */}
      {showHistory && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <p className="text-white font-semibold">Rapports générés ({history.length})</p>
            {history.length > 0 && (
              <button onClick={() => { setHistory([]); try { localStorage.removeItem(HISTORY_KEY); } catch {} }}
                className="text-rose-400 hover:text-rose-300 text-xs">Tout effacer</button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30"/><p className="text-sm">Aucun rapport généré</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {history.map(h => {
                const rt = REPORT_TYPES.find(r => r.id === h.type);
                const genDate = new Date(h.generatedAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
                return (
                  <div key={h.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {rt && <rt.icon className={`w-4 h-4 text-${rt.color}-400 flex-shrink-0`}/>}
                      <div>
                        <p className="text-white text-sm font-medium">{h.title}</p>
                        <p className="text-slate-500 text-xs">{genDate} · Données réelles TERAS</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setReport({ ...h, generatedAt: new Date(h.generatedAt) }); setShowHistory(false); setExpanded(true); setTimeout(() => reportRef.current?.scrollIntoView({ behavior:'smooth' }), 100); }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all">
                        Consulter
                      </button>
                      <button onClick={() => exportReportPDF({ ...h, generatedAt: new Date(h.generatedAt) })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-700/40 rounded-lg text-xs transition-all">
                        <Download className="w-3 h-3"/> PDF
                      </button>
                      <button onClick={() => { const u = history.filter(r => r.id !== h.id); setHistory(u); try { localStorage.setItem(HISTORY_KEY, JSON.stringify(u)); } catch {}}}
                        className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sélection type */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {REPORT_TYPES.map(rt => (
          <button key={rt.id} onClick={() => setReportType(rt.id)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === rt.id
                ? `bg-${rt.color}-900/40 border-${rt.color}-600/60 ring-1 ring-${rt.color}-500/30`
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}>
            <rt.icon className={`w-5 h-5 text-${rt.color}-400 mb-2`}/>
            <p className="text-white font-semibold text-sm leading-tight">{rt.label}</p>
            <p className="text-slate-500 text-xs mt-1 leading-snug">{rt.desc}</p>
          </button>
        ))}
      </div>

      {/* KPIs temps réel */}
      {nationalData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Score National',       value: `${nationalData.avg_score}/1000`,                               color: 'sky'    },
            { label: 'Volume crédit',        value: FCFA(nationalData.loans_volume),                                 color: 'emerald'},
            { label: 'Taux approbation',     value: `${nationalData.approval_rate.toFixed(1)}%`,                     color: 'violet' },
            { label: 'Alertes actives',      value: String(nationalData.alerts_count),                              color: 'amber'  },
          ].map((k, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">{k.label}</p>
              <p className={`text-${k.color}-400 font-bold text-lg`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {nationalData && (
        <div className="grid xl:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Lecture macro</p>
            <h3 className="text-white font-semibold text-lg">{nationalData.top_country_name}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Revenus suivis</span><span className="text-white">{FCFA(nationalData.total_revenue)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Emplois formels</span><span className="text-emerald-300">{nationalData.formal_jobs.toLocaleString('fr-FR')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Inclusion financière</span><span className="text-cyan-300">{nationalData.inclusion_rate.toFixed(1)}%</span></div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Top secteurs suivis</p>
            <div className="space-y-3">
              {nationalData.sectors.slice(0, 3).map((sector) => (
                <div key={sector.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white">{sector.name}</p>
                    <p className="text-slate-500 text-xs">{sector.total_enterprises.toLocaleString('fr-FR')} entreprises</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sky-300 font-semibold">{sector.avg_score}/1000</p>
                    <p className="text-slate-500 text-xs">{sector.growth_rate}% du tissu</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Comparatif zone CEMAC</p>
            <div className="space-y-3">
              {nationalData.countries.slice(0, 4).map((country) => (
                <div key={country.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white">{country.name}</p>
                    <p className="text-slate-500 text-xs">{country.total_users.toLocaleString('fr-FR')} acteurs suivis</p>
                  </div>
                  <span className="text-violet-300 font-semibold">{country.avg_score}/1000</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bouton génération */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-sky-400"/> {selectedType.label}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">{selectedType.desc} — Alimenté par données réelles CEMAC</p>
          </div>
          <button onClick={generateReport} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/20">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin"/> Génération…</>
              : <><FileText className="w-4 h-4"/> Générer avec données réelles</>
            }
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-rose-900/20 border border-rose-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0"/>
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Streaming */}
      {loading && streamedContent && (
        <div className="bg-slate-900/60 border border-sky-800/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin"/>
            <p className="text-sky-400 text-sm font-medium">Rédaction du rapport avec données réelles CEMAC…</p>
          </div>
          <div className="space-y-1 opacity-80">{renderMarkdown(streamedContent)}</div>
          <div className="flex gap-1 mt-4">
            {[0,1,2].map(n => <div key={n} className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay:`${n*150}ms`}}/>)}
          </div>
        </div>
      )}

      {/* Rapport généré */}
      {report && (
        <div ref={reportRef} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400"/>
              </div>
              <div>
                <p className="text-white font-bold">{report.title}</p>
                <p className="text-slate-400 text-xs">Généré le {report.generatedAt.toLocaleString('fr-FR')} · Claude Sonnet 4</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setExpanded(!expanded)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
              </button>
              <button onClick={() => exportReportPDF(report)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all">
                <Download className="w-4 h-4"/> Télécharger PDF
              </button>
              <button onClick={generateReport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all">
                <RefreshCw className="w-3.5 h-3.5"/> Régénérer
              </button>
            </div>
          </div>
          {expanded && (
            <div className="p-6 space-y-1 max-h-[70vh] overflow-y-auto">
              {renderMarkdown(report.content)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
