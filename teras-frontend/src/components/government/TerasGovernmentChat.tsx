// src/components/government/TerasGovernmentChat.tsx
// v5 — Streaming SSE réel · Mode pédagogique adaptatif · Rendu amélioré

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, Brain, RefreshCw, Zap,
  Download, FileText, ChevronDown, BookOpen,
  BarChart3, Globe, Shield, TrendingUp, Sparkles,
  Trash2, Plus, X, MessageSquare,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pedagogic?: boolean;
}

interface GovernmentData {
  avgScore?: number;
  totalUsers?: number;
  activeUsers?: number;
  activeAlerts?: number;
  inclusionRate?: number;
  creditPotential?: number;
  taxPotential?: number;
  gdpEstimate?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FCFA = (n: number) => {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)} Billions FCFA`;
  if (n >= 1_000_000_000)     return `${(n / 1_000_000_000).toFixed(1)} Md FCFA`;
  if (n >= 1_000_000)         return `${(n / 1_000_000).toFixed(1)} M FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};

// ─── Rendu Markdown enrichi ───────────────────────────────────────────────────

const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
};

const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-base font-black text-white mt-5 mb-2 pb-1.5 border-b border-slate-700/60 flex items-center gap-2">
          <span className="w-0.5 h-4 bg-sky-400 rounded-full shrink-0"/>
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-sky-300 mt-4 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0"/>
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-amber-300 mt-3 mb-1 uppercase tracking-wide">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('═') || line.startsWith('─') || line === '---') {
      elements.push(<div key={i} className="border-t border-slate-700/40 my-3"/>);
    } else if (line.match(/^[-•*]\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-•*]\s/)) {
        items.push(
          <li key={i} className="flex gap-2 text-sm text-slate-200 leading-relaxed">
            <span className="text-sky-400 mt-1.5 shrink-0 text-xs">◆</span>
            <span>{renderInline(lines[i].slice(2))}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="space-y-1.5 my-2 ml-1">{items}</ul>);
      continue;
    } else if (line.match(/^\d+\.\s/)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(
          <li key={i} className="flex gap-2.5 text-sm text-slate-200 leading-relaxed">
            <span className="text-emerald-400 font-bold shrink-0 w-5 text-xs mt-0.5">{num}.</span>
            <span>{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</span>
          </li>
        );
        i++; num++;
      }
      elements.push(<ol key={`ol-${i}`} className="space-y-2 my-2 ml-1">{items}</ol>);
      continue;
    } else if (line.match(/^\*\*.*\*\*$/) && line.length < 80) {
      elements.push(
        <p key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5"/>);
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm text-slate-200 leading-relaxed">{renderInline(line)}</p>
      );
    }
    i++;
  }
  return elements;
};

// ─── Export PDF ───────────────────────────────────────────────────────────────

const exportToPDF = (messages: Message[], govData: GovernmentData) => {
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const conversation = messages.filter(m => m.id !== '1').map(m => {
    const isUser = m.role === 'user';
    const content = m.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#{1,3}\s(.+)$/gm, '<div style="font-weight:700;font-size:13px;margin:8px 0 4px;color:#0f172a;">$1</div>')
      .replace(/^[-•]\s(.+)$/gm, '<div style="margin-left:16px;margin-bottom:4px;">◆ $1</div>')
      .replace(/^\d+\.\s(.+)$/gm, '<div style="margin-left:16px;margin-bottom:4px;">$&</div>')
      .replace(/\n/g, '<br/>');
    const t = m.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const b = isUser ? '#3b82f6' : '#0ea5e9';
    const bg = isUser ? '#eff6ff' : '#f8fafc';
    return `<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid ${b}30;">
      <div style="background:${b};padding:8px 16px;display:flex;justify-content:space-between;">
        <span style="color:white;font-weight:700;font-size:10px;">${isUser ? '👤 SON EXCELLENCE' : '🤖 CONSEILLER IA TERAS'}${m.pedagogic ? ' · Mode pédagogique' : ''}</span>
        <span style="color:rgba(255,255,255,.7);font-size:10px;">${t}</span>
      </div>
      <div style="background:${bg};padding:16px;font-size:12px;line-height:1.7;color:${isUser ? '#1e40af' : '#0f172a'};">${content}</div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>TERAS Chat IA — ${date}</title>
<style>@page{margin:20mm 15mm;size:A4}*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;color:#0f172a;background:white}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
@media screen{body{max-width:860px;margin:0 auto;padding:20px}.btn{position:fixed;top:20px;right:20px;background:#0369a1;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;z-index:1000}}
</style></head><body>
<button class="btn no-print" onclick="window.print()">⬇️ Télécharger PDF</button>
<div style="background:linear-gradient(135deg,#0c1445,#1e3a8a 50%,#0369a1);color:white;padding:36px;margin-bottom:24px;border-radius:0 0 16px 16px;">
  <div style="font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;font-weight:700;">République du Congo · Système TERAS</div>
  <div style="font-size:22px;font-weight:900;margin-bottom:4px;">Rapport d'Analyse — Session IA</div>
  <div style="font-size:12px;color:#bfdbfe;margin-bottom:20px;">${date} à ${time} · Claude Sonnet 4</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
    ${[['Score',`${govData.avgScore||676}/1000`],['Fiscal/an',FCFA(govData.taxPotential||9_490_000_000)],['Inclusion',`${govData.inclusionRate||57.5}%`],['Alertes',String(govData.activeAlerts||2)]].map(([l,v])=>`<div style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:10px 14px;"><div style="font-size:9px;color:#93c5fd;text-transform:uppercase;margin-bottom:4px;">${l}</div><div style="font-size:14px;font-weight:800;">${v}</div></div>`).join('')}
  </div>
</div>
${conversation}
<div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:24px;display:flex;justify-content:space-between;">
  <div style="font-size:10px;color:#94a3b8;line-height:1.6;"><strong style="color:#0f172a;">Système TERAS</strong> · Scoring financier CEMAC<br/>Document confidentiel · Usage gouvernemental exclusif</div>
  <div style="text-align:right;font-size:10px;"><strong style="color:#0f172a;font-size:14px;">TERAS IA</strong><br/><span style="color:#0ea5e9;">Claude Sonnet 4</span></div>
</div>
</body></html>`;

  // Ouvrir dans un nouvel onglet → l'utilisateur imprime en PDF (Ctrl+P)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const tab  = window.open(url, '_blank');
  if (tab) {
    tab.onload = () => {
      setTimeout(() => { tab.print(); }, 800);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    };
  } else {
    // Fallback si popup bloqué : téléchargement direct
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TERAS_Rapport.html';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
};

// ─── Questions suggérées ──────────────────────────────────────────────────────

const GROUPS = [
  {
    icon: BarChart3, color: 'sky', label: 'Analyse',
    questions: [
      "Que révèle notre score TERAS sur l'état réel de l'économie nationale ?",
      "Quel est le potentiel fiscal non capté et comment le mobiliser ?",
      "Comment notre score impacte notre accès aux marchés de capitaux ?",
    ],
  },
  {
    icon: Globe, color: 'emerald', label: 'Régions & Secteurs',
    questions: [
      "Quelles régions nécessitent une intervention économique urgente ?",
      "Quel secteur offre le meilleur retour sur investissement public ?",
      "Comparez les performances régionales et identifiez les priorités.",
    ],
  },
  {
    icon: TrendingUp, color: 'violet', label: 'Stratégie',
    questions: [
      "Quelle politique permettrait d'atteindre 750/1000 en 18 mois ?",
      "Comment accélérer l'inclusion financière des zones rurales ?",
      "Plan d'action pour formaliser 10% de l'économie informelle.",
    ],
  },
  {
    icon: Shield, color: 'amber', label: 'Risques',
    questions: [
      "Quels sont les risques systémiques identifiés par TERAS ?",
      "Comment interpréter les alertes économiques actives ?",
      "Plan de contingence face à une dégradation du score national.",
    ],
  },
];

// ─── Bulle de message ─────────────────────────────────────────────────────────

const ChatMessage = ({ msg }: { msg: Message }) => (
  <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    {msg.role === 'assistant' && (
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
        msg.pedagogic
          ? 'bg-amber-500/20 border border-amber-500/40'
          : 'bg-sky-500/20 border border-sky-500/30'
      }`}>
        {msg.pedagogic
          ? <BookOpen className="w-4 h-4 text-amber-400"/>
          : <Brain className="w-4 h-4 text-sky-400"/>}
      </div>
    )}

    <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
      {/* Badge pédagogique */}
      {msg.pedagogic && msg.role === 'assistant' && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs text-amber-400">
          <BookOpen className="w-2.5 h-2.5"/> Mode explication simplifiée
        </div>
      )}

      <div className={`rounded-2xl px-4 py-3 ${
        msg.role === 'user'
          ? 'bg-sky-600 rounded-br-sm shadow-lg shadow-sky-900/30'
          : msg.pedagogic
            ? 'bg-amber-500/5 border border-amber-500/20 rounded-bl-sm'
            : 'bg-slate-900 border border-slate-800 rounded-bl-sm'
      }`}>
        {msg.role === 'assistant'
          ? <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
          : <p className="text-sm text-white leading-relaxed">{msg.content}</p>
        }
        <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-sky-200/50 text-right' : 'text-slate-600'}`}>
          {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props { data?: GovernmentData; }

const TerasGovernmentChat: React.FC<Props> = ({ data: externalData = {} }) => {
  const govData: GovernmentData = {
    avgScore: 676, totalUsers: 8287, activeUsers: 6142,
    activeAlerts: 2, inclusionRate: 57.5,
    creditPotential: 61_000_000_000, taxPotential: 9_490_000_000,
    gdpEstimate: 52_700_000_000, ...externalData,
  };

  const welcome = `Bonjour Excellence. Je suis votre **Assistant IA TERAS**, conseiller économique d'État propulsé par Claude Sonnet 4.

J'ai accès aux données TERAS en temps réel :
- Score national : **${govData.avgScore}/1000**
- Potentiel fiscal : **${FCFA(govData.taxPotential!)}**/an
- Inclusion financière : **${govData.inclusionRate}%**
- Alertes actives : **${govData.activeAlerts}**

Posez vos questions d'analyse économique, de politique publique ou d'interprétation des données TERAS. Si vous souhaitez une explication plus accessible, dites simplement "expliquez plus simplement" — je m'adapterai immédiatement.`;

  const CONV_LIST_KEY = 'teras_gov_conversations';
  const CONV_PREFIX   = 'teras_gov_conv_';

  interface ConvMeta { id: string; title: string; date: string; count: number; }

  const loadConvList = (): ConvMeta[] => {
    try { const s = localStorage.getItem(CONV_LIST_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  };
  const loadConv = (id: string): Message[] => {
    try {
      const s = localStorage.getItem(CONV_PREFIX + id);
      if (s) return JSON.parse(s).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {}
    return [{ id: '1', role: 'assistant' as const, content: welcome, timestamp: new Date() }];
  };
  const saveConv = (id: string, msgs: Message[]) => {
    try { localStorage.setItem(CONV_PREFIX + id, JSON.stringify(msgs.slice(-60))); } catch {}
  };
  const genId = () => Date.now().toString(36);

  const initSession = () => {
    const list = loadConvList();
    if (list.length > 0) return { id: list[0].id, msgs: loadConv(list[0].id) };
    const id = genId();
    return { id, msgs: [{ id: '1', role: 'assistant' as const, content: welcome, timestamp: new Date() }] };
  };

  const init = initSession();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [currentId, setCurrentId]     = useState<string>(init.id);
  const [messages, setMessages]       = useState<Message[]>(init.msgs);
  const [convList, setConvList]       = useState<ConvMeta[]>(loadConvList);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [streamText, setStreamText]   = useState('');
  const [isPedagogic, setIsPedagogic] = useState(false);
  const [showGroups, setShowGroups]   = useState(true);
  const [activeGroup, setActiveGroup] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length <= 1) return;
    saveConv(currentId, messages);
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'Nouvelle session';
    const date  = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const newMeta: ConvMeta = { id: currentId, title, date, count: messages.length };
    setConvList(prev => {
      const updated = [newMeta, ...prev.filter(c => c.id !== currentId)].slice(0, 20);
      try { localStorage.setItem(CONV_LIST_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [messages, currentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowGroups(false);
    setShowHistory(false);
    setIsPedagogic(false);
    setStreamText('');
    setShowWelcomeScreen(false);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setLoading(true);

    const history = updatedMsgs.slice(-12).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await authFetch('/api/scoring/government/ai-chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, stream: true }),
      });

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let pedagogicMode = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text)           { fullText += parsed.text; setStreamText(fullText); }
              if (parsed.pedagogic_mode)   pedagogicMode = true;
            } catch {}
          }
        }
      }

      setIsPedagogic(pedagogicMode);
      setStreamText('');
      setMessages(prev => [...prev, {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   fullText || 'Aucune réponse reçue.',
        pedagogic: pedagogicMode,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   'Erreur de connexion. Vérifiez que le backend est démarré et réessayez.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setStreamText('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const reset = () => {
    const id   = genId();
    const fresh = [{ id: '1', role: 'assistant' as const, content: welcome, timestamp: new Date() }];
    setCurrentId(id); setMessages(fresh);
    setShowGroups(true); setShowHistory(false);
    setShowWelcomeScreen(true);
  };

  const loadSession = (id: string) => {
    setCurrentId(id); setMessages(loadConv(id));
    setShowHistory(false); setShowGroups(false);
    setShowWelcomeScreen(false);
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { localStorage.removeItem(CONV_PREFIX + id); } catch {}
    setConvList(prev => {
      const updated = prev.filter(c => c.id !== id);
      try { localStorage.setItem(CONV_LIST_KEY, JSON.stringify(updated)); } catch {}
      if (id === currentId && updated.length > 0) loadSession(updated[0].id);
      else if (id === currentId) reset();
      return updated;
    });
  };

  const group = GROUPS[activeGroup];

  // ── Écran d'accueil chat ─────────────────────────────────────────────────
  if (showWelcomeScreen) return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-50 items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"/>
      </div>

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Icône */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/30 to-blue-600/30 border border-sky-500/40 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(56,189,248,0.2)' }}>
            <Brain className="w-10 h-10 text-sky-400"/>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
              <span className="text-emerald-400 text-xs font-semibold">En ligne · Claude Sonnet 4</span>
            </div>
            <h1 className="text-3xl font-black text-white">Assistant IA TERAS</h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Conseiller économique d'État · Données TERAS réelles · Mode pédagogique adaptatif
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Score National',    value: `${govData.avgScore}/1000`,    color: 'sky'    },
            { label: 'Potentiel fiscal',  value: FCFA(govData.taxPotential!),   color: 'violet' },
            { label: 'Inclusion financ.', value: `${govData.inclusionRate}%`,   color: 'emerald'},
            { label: 'Alertes actives',   value: `${govData.activeAlerts}`,     color: 'amber'  },
          ].map((k, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">{k.label}</p>
              <p className={`text-${k.color}-400 font-bold text-xl`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={() => { setShowWelcomeScreen(false); setShowGroups(true); }}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-semibold text-base transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2">
            <Send className="w-5 h-5"/> Nouvelle conversation
          </button>

          {convList.length > 0 && (
            <button onClick={() => { setShowWelcomeScreen(false); setShowHistory(true); }}
              className="w-full py-3 bg-slate-900/60 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2">
              <FileText className="w-4 h-4"/>
              Reprendre une conversation ({convList.length})
            </button>
          )}
        </div>

        {/* Questions rapides */}
        <div className="space-y-2">
          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Ou commencez directement</p>
          {[
            "Quel est l'état économique de notre pays aujourd'hui ?",
            "Quelles entreprises sont à risque dans notre économie ?",
            "Expliquez-moi simplement ce qu'est le score TERAS",
          ].map(q => (
            <button key={q} onClick={() => { setShowWelcomeScreen(false); send(q); }}
              className="w-full text-left px-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-sky-500/30 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white text-sm transition-all leading-snug">
              {q}
            </button>
          ))}
        </div>

        <p className="text-slate-700 text-xs">
          💡 Dites "expliquez plus simplement" à tout moment pour activer le mode pédagogique
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-50">

      {/* ── Panneau historique latéral ───────────────────────── */}
      {showHistory && (
        <div className="w-72 flex-shrink-0 border-r border-slate-800/60 bg-slate-900/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400"/> Conversations
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={reset}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs transition-all">
                <Plus className="w-3 h-3"/> Nouvelle
              </button>
              <button onClick={() => setShowHistory(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {convList.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
                <p className="text-slate-500 text-xs">Aucune conversation</p>
              </div>
            ) : convList.map(conv => (
              <div key={conv.id} onClick={() => loadSession(conv.id)}
                className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                  conv.id === currentId
                    ? 'bg-sky-900/30 border-sky-700/50 text-white'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-snug line-clamp-2 flex-1">{conv.title}</p>
                  <button onClick={e => deleteConv(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all flex-shrink-0 mt-0.5">
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 text-xs">{conv.date}</span>
                  <span className="text-slate-600 text-xs">{conv.count} msg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone chat principale ─────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* En-tête */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800/60 bg-slate-900/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/30 to-blue-600/30 border border-sky-500/40 flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(56,189,248,0.2)' }}>
                <Brain className="w-6 h-6 text-sky-400"/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Assistant IA TERAS</h2>
                  {isPedagogic && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-xs text-amber-400">
                      <BookOpen className="w-2.5 h-2.5"/> Pédagogique
                    </span>
                  )}
                </div>
                <p className="text-sky-400/70 text-xs">Claude Sonnet 4 · Conseiller économique d'État</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/40 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                <span className="text-emerald-400 text-xs font-medium">En ligne</span>
              </div>
              {messages.length > 1 && (
                <button onClick={() => exportToPDF(messages, govData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-sky-900/30 border border-slate-700 hover:border-sky-600/50 text-slate-300 hover:text-sky-300 rounded-xl text-xs transition-all">
                  <Download className="w-3 h-3"/> PDF
                </button>
              )}
              <button onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs transition-all ${
                  showHistory ? 'bg-sky-900/40 border-sky-600/60 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}>
                <FileText className="w-3 h-3"/>
                Historique
                {convList.length > 0 && (
                  <span className="bg-sky-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none">{convList.length}</span>
                )}
              </button>
              <button onClick={reset} title="Nouvelle session"
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <RefreshCw className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              { label: 'Score',     value: `${govData.avgScore}/1000`,            color: 'sky'    },
              { label: 'Fiscal/an', value: FCFA(govData.taxPotential!),           color: 'violet' },
              { label: 'Inclusion', value: `${govData.inclusionRate}%`,           color: 'emerald'},
              { label: 'Alertes',   value: `${govData.activeAlerts} active${(govData.activeAlerts||0)>1?'s':''}`, color: 'amber'},
            ].map((k, i) => (
              <div key={i} className="flex-shrink-0 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-slate-500 text-xs leading-none mb-0.5">{k.label}</p>
                <p className={`text-${k.color}-400 font-bold text-sm leading-none`}>{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map(msg => <ChatMessage key={msg.id} msg={msg}/>)}

          {/* Streaming */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="w-4 h-4 text-sky-400"/>
              </div>
              {streamText ? (
                <div className="max-w-[82%] bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="space-y-0.5">{renderMarkdown(streamText)}</div>
                  <span className="inline-block w-1.5 h-3.5 bg-sky-400 ml-1 animate-pulse rounded-sm mt-1"/>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin"/>
                  <span className="text-slate-400 text-sm">Son Excellence, j'analyse vos données…</span>
                  <div className="flex gap-1 ml-1">
                    {[0,1,2].map(n => (
                      <div key={n} className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${n*150}ms` }}/>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Suggestions */}
        {showGroups && messages.length <= 2 && (
          <div className="flex-shrink-0 px-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3"/> Questions suggérées
              </p>
              <button onClick={() => setShowGroups(false)} className="text-slate-600 hover:text-slate-400 text-xs">Masquer</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {GROUPS.map((g, i) => (
                <button key={i} onClick={() => setActiveGroup(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    activeGroup === i
                      ? `bg-${g.color}-900/40 text-${g.color}-400 border-${g.color}-600/40`
                      : 'bg-slate-800/50 text-slate-400 hover:text-white border-slate-700/50'
                  }`}>
                  <g.icon className="w-3 h-3"/>{g.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {group.questions.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="w-full text-left px-4 py-2.5 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white text-sm transition-all leading-snug">
                  {q}
                </button>
              ))}
            </div>
            <button onClick={() => send("Expliquez-moi plus simplement le score TERAS et ce qu'il signifie concrètement pour notre pays")}
              className="w-full text-left px-4 py-2.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-amber-400/80 hover:text-amber-400 text-xs transition-all flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 shrink-0"/>
              💡 Demander une explication simplifiée (mode pédagogique auto-adaptatif)
            </button>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800/60 bg-slate-900/50">
          {!showGroups && (
            <button onClick={() => setShowGroups(true)}
              className="mb-2 flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs transition-colors">
              <Zap className="w-3 h-3"/> Suggestions <ChevronDown className="w-3 h-3"/>
            </button>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder='Posez votre question… Dites "expliquez simplement" pour le mode pédagogique'
              className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all"
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="px-4 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
          <p className="text-slate-700 text-xs mt-2 text-center">
            Claude Sonnet 4 · Données TERAS réelles · Mode pédagogique auto-adaptatif
          </p>
        </div>

      </div>
    </div>
  );
};

export default TerasGovernmentChat;