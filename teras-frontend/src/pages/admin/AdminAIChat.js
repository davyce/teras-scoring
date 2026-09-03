import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// AdminAIChat.tsx — Chat RAG TERAS avec historique + export PDF
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, Download, Trash2, Sparkles, Clock, MessageSquare, ChevronRight, Search, Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
function renderMarkdown(text) {
    return text
        .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="md-pre"><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
        .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>')
        .replace(/\n\n+/g, '<br/><br/>');
}
function Bubble({ msg }) {
    const isUser = msg.role === 'user';
    return (_jsxs("div", { className: `flex items-start gap-3 mb-5 ${isUser ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: `w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-gradient-to-br from-violet-600 to-purple-700'}`, children: isUser ? _jsx(User, { className: "w-4 h-4 text-white" }) : _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: `max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`, children: [_jsx("div", { className: `px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'text-white rounded-tr-sm' : 'rounded-tl-sm text-slate-200'}`, style: isUser ? { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }, children: isUser
                            ? _jsx("p", { className: "whitespace-pre-wrap", children: msg.content })
                            : _jsx("div", { className: "prose-teras", dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }) }), msg.timestamp && (_jsx("span", { className: "text-xs text-slate-600 mt-1 px-1", children: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }))] })] }));
}
function Typing() {
    return (_jsxs("div", { className: "flex items-start gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-700", children: _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "px-4 py-3 rounded-2xl rounded-tl-sm", style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }, children: _jsx("div", { className: "flex gap-1.5 h-4 items-center", children: [0, 0.18, 0.36].map((d, i) => (_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce", style: { animationDelay: `${d}s` } }, i))) }) })] }));
}
export default function AdminAIChat() {
    const [conversations, setConversations] = useState([]);
    const [currentConv, setCurrentConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    useEffect(() => { loadConvs(); }, []);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
    const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };
    const loadConvs = async () => {
        setLoadingConvs(true);
        try {
            const r = await authFetch('/api/chat/conversations/');
            const d = await r.json();
            setConversations(Array.isArray(d) ? d : d.results || []);
        }
        finally {
            setLoadingConvs(false);
        }
    };
    const selectConv = async (conv) => {
        setCurrentConv(conv);
        setMessages([]);
        try {
            const r = await authFetch(`/api/chat/conversations/${conv.id}/`);
            const d = await r.json();
            setMessages((d.messages || []).map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })));
        }
        catch (e) { }
    };
    const newConv = async () => {
        const title = `Chat ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
        const r = await authFetch('/api/chat/conversations/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
        const conv = await r.json();
        setCurrentConv(conv);
        setMessages([]);
        setConversations(p => [conv, ...p]);
    };
    const deleteConv = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Supprimer cette conversation ?'))
            return;
        await authFetch(`/api/chat/conversations/${id}/`, { method: 'DELETE' });
        setConversations(p => p.filter(c => c.id !== id));
        if (currentConv?.id === id) {
            setCurrentConv(null);
            setMessages([]);
        }
        notify('Conversation supprimée');
    };
    const sendMsg = async () => {
        const text = input.trim();
        if (!text || loading)
            return;
        setInput('');
        const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
        setMessages(p => [...p, userMsg]);
        setLoading(true);
        try {
            let convId = currentConv?.id;
            if (!convId) {
                const r = await authFetch('/api/chat/conversations/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text.slice(0, 60) }) });
                const conv = await r.json();
                setCurrentConv(conv);
                convId = conv.id;
                setConversations(p => [conv, ...p]);
            }
            const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
            const r = await authFetch('/api/chat/message/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, conversation_id: convId }),
            });
            const d = await r.json();
            const aiContent = d.message?.content || d.answer || d.response || 'Erreur: pas de réponse';
            setMessages(p => [...p, { role: 'assistant', content: aiContent, timestamp: new Date().toISOString() }]);
            loadConvs();
        }
        catch (e) {
            setMessages(p => [...p, { role: 'assistant', content: `❌ ${e.message}`, timestamp: new Date().toISOString() }]);
        }
        finally {
            setLoading(false);
        }
    };
    const exportPDF = async () => {
        if (!currentConv || messages.length === 0)
            return;
        setExporting(true);
        try {
            const r = await authFetch(`/api/chat/conversations/${currentConv.id}/export_pdf/`, { method: 'POST' });
            if (r.ok) {
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TERAS_${currentConv.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                notify('PDF téléchargé !');
            }
            else {
                exportPDFClient();
            }
        }
        catch {
            exportPDFClient();
        }
        finally {
            setExporting(false);
        }
    };
    const exportPDFClient = () => {
        const win = window.open('', '_blank');
        if (!win)
            return;
        win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>TERAS Chat Export</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#fff;color:#1e293b;padding:40px;max-width:800px;margin:0 auto}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #0ea5e9}
.logo{width:44px;height:44px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px}
.hdr-info h1{font-size:20px;font-weight:700;color:#0f172a}.hdr-info p{font-size:12px;color:#64748b;margin-top:2px}
.meta{display:flex;gap:20px;margin-bottom:28px;padding:14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#64748b}
.msgs{display:flex;flex-direction:column;gap:18px}
.msg{display:flex;gap:12px}.msg.user{flex-direction:row-reverse}
.av{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.av.user{background:linear-gradient(135deg,#0ea5e9,#6366f1)}.av.assistant{background:linear-gradient(135deg,#7c3aed,#9333ea)}
.bubble{max-width:72%;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.7}
.bubble.user{background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;border-top-right-radius:3px}
.bubble.assistant{background:#f1f5f9;color:#1e293b;border:1px solid #e2e8f0;border-top-left-radius:3px}
.bubble h1,.bubble h2,.bubble h3{font-weight:700;margin:10px 0 4px}
.bubble h1{font-size:15px}.bubble h2{font-size:14px}.bubble h3{font-size:13px}
.bubble p{margin:5px 0}.bubble ul{margin:6px 0 6px 18px}.bubble li{margin:3px 0}
.bubble strong{font-weight:600}.bubble code{background:#e2e8f0;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:11px}
.bubble pre{background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;margin:8px 0;font-size:11px;overflow-x:auto}
.ts{font-size:11px;color:#94a3b8;margin-top:3px}
.msg.user .ts{text-align:right}
.footer{margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
@media print{body{padding:20px}.footer{page-break-inside:avoid}}
</style></head><body>
<div class="hdr"><div class="logo">T</div><div class="hdr-info"><h1>TERAS IA — Export Conversation</h1><p>${currentConv?.title || 'Conversation'} · ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
<div class="meta"><span>💬 ${messages.length} messages</span><span>🤖 Claude Sonnet 4 + RAG TERAS</span><span>📅 ${new Date().toLocaleString('fr-FR')}</span></div>
<div class="msgs">${messages.map(m => `
<div class="msg ${m.role}">
  <div class="av ${m.role}">${m.role === 'user' ? 'U' : 'IA'}</div>
  <div>
    <div class="bubble ${m.role}">${m.role === 'assistant' ? renderMarkdown(m.content) : `<p>${m.content}</p>`}</div>
    ${m.timestamp ? `<div class="ts">${new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
  </div>
</div>`).join('')}</div>
<div class="footer">Généré par TERAS IA APP · Système de scoring financier CEMAC · ${new Date().toLocaleDateString('fr-FR')}</div>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`);
        win.document.close();
        notify('Fenêtre d\'impression ouverte');
    };
    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
    } };
    const cs = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
    const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", style: { background: '#0b1220' }, children: [toast && (_jsxs("div", { className: `fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30' : 'text-red-300 bg-red-500/20 border border-red-500/30'}`, children: [toast.ok ? _jsx(CheckCircle, { className: "w-4 h-4" }) : _jsx(AlertCircle, { className: "w-4 h-4" }), " ", toast.msg] })), _jsxs("div", { className: `flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`, style: { borderRight: '1px solid rgba(255,255,255,0.07)' }, children: [_jsxs("div", { className: "p-4", style: { borderBottom: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4 text-sky-400" }), _jsx("span", { className: "text-white text-sm font-semibold", children: "Historique" })] }), _jsx("span", { className: "text-xs text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded-full", children: conversations.length })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: search, onChange: e => setSearch(e.target.value), className: "w-full pl-8 pr-3 py-2 rounded-lg text-xs text-slate-300 outline-none", style: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' } })] })] }), _jsx("div", { className: "p-3", children: _jsxs("button", { onClick: newConv, className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouvelle conversation"] }) }), _jsx("div", { className: "flex-1 overflow-y-auto px-2 pb-4 space-y-1", children: loadingConvs ? _jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { className: "w-5 h-5 text-sky-400 animate-spin" }) })
                            : filtered.length === 0 ? _jsx("p", { className: "text-center py-8 text-slate-600 text-xs", children: "Aucune conversation" })
                                : filtered.map(conv => (_jsxs("div", { onClick: () => selectConv(conv), className: `group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentConv?.id === conv.id ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-white/5'}`, children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", style: { background: currentConv?.id === conv.id ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)' }, children: _jsx(MessageSquare, { className: "w-3.5 h-3.5 text-sky-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium truncate ${currentConv?.id === conv.id ? 'text-sky-300' : 'text-slate-300'}`, children: conv.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(Clock, { className: "w-3 h-3 text-slate-600" }), _jsxs("span", { className: "text-xs text-slate-600", children: [new Date(conv.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), " \u00B7 ", conv.message_count, " msg"] })] })] }), _jsx("button", { onClick: e => deleteConv(conv.id, e), className: "opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] }, conv.id))) })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-3 flex-shrink-0", style: { borderBottom: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setSidebarOpen(v => !v), className: "p-2 rounded-lg text-slate-400 hover:text-white transition-colors", style: { background: 'rgba(255,255,255,0.05)' }, children: _jsx(ChevronRight, { className: `w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}` }) }), _jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }, children: _jsx(Sparkles, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-white font-semibold text-sm", children: currentConv?.title || 'Chat RAG TERAS' }), _jsx("p", { className: "text-slate-500 text-xs", children: "Claude Sonnet 4 \u00B7 RAG enrichi \u00B7 Contexte CEMAC" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [currentConv && messages.length > 0 && (_jsxs("button", { onClick: exportPDF, disabled: exporting, className: "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40", style: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }, children: [exporting ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Download, { className: "w-4 h-4" }), exporting ? 'Export...' : 'Export PDF'] })), _jsxs("button", { onClick: newConv, className: "flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouveau"] })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-5", children: !currentConv && messages.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl flex items-center justify-center mb-4", style: { background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }, children: _jsx(Sparkles, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Chat RAG TERAS" }), _jsx("p", { className: "text-slate-400 text-sm mb-6 max-w-sm", children: "Questions sur TERAS, scores, cr\u00E9dit ZOLA ou l\u00E9gislation CEMAC." }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-w-md w-full", children: ['📊 Explique la formule du score TERAS', '💰 Comment calculer le CRM de crédit ?', '🏢 TERAS Basic vs Entreprise ?', '📈 Comment améliorer mon score ?'].map(q => (_jsx("button", { onClick: () => { setInput(q.slice(2).trim()); inputRef.current?.focus(); }, className: "p-3 rounded-xl text-left text-sm text-slate-300 hover:text-white transition-all", style: cs, children: q }, q))) })] })) : (_jsxs(_Fragment, { children: [messages.map((m, i) => _jsx(Bubble, { msg: m }, i)), loading && _jsx(Typing, {}), _jsx("div", { ref: bottomRef })] })) }), _jsxs("div", { className: "px-5 pb-5 flex-shrink-0", children: [_jsxs("div", { className: "flex items-end gap-3 p-3 rounded-2xl", style: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }, children: [_jsx("textarea", { ref: inputRef, value: input, onChange: e => setInput(e.target.value), onKeyDown: handleKey, placeholder: "Posez votre question... (Entr\u00E9e pour envoyer)", rows: 1, className: "flex-1 text-sm placeholder-slate-600 py-1 resize-none outline-none", style: { background: 'transparent', color: '#e2e8f0', maxHeight: '120px' }, onInput: e => { const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; } }), _jsx("button", { onClick: sendMsg, disabled: !input.trim() || loading, className: "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: loading ? _jsx(Loader2, { className: "w-4 h-4 text-white animate-spin" }) : _jsx(Send, { className: "w-4 h-4 text-white" }) })] }), _jsx("p", { className: "text-center text-slate-700 text-xs mt-2", children: "Claude Sonnet 4 \u00B7 RAG enrichi \u00B7 Contexte CEMAC" })] })] }), _jsx("style", { children: `
        .prose-teras h1,.prose-teras h2,.prose-teras h3{color:#e2e8f0;font-weight:700;margin:10px 0 5px}
        .prose-teras h1{font-size:16px}.prose-teras h2{font-size:15px}.prose-teras h3{font-size:14px}
        .prose-teras p{margin:4px 0;color:#cbd5e1}
        .prose-teras ul{margin:8px 0 8px 16px}.prose-teras li{margin:3px 0;color:#cbd5e1;list-style:disc}
        .prose-teras strong{color:#f1f5f9;font-weight:600}
        .prose-teras code{background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:12px;color:#38bdf8;font-family:monospace}
        .prose-teras pre{background:rgba(0,0,0,0.4);padding:12px;border-radius:10px;margin:10px 0;overflow-x:auto;border:1px solid rgba(255,255,255,0.08)}
        .prose-teras pre code{background:none;padding:0;color:#e2e8f0}
      ` })] }));
}
