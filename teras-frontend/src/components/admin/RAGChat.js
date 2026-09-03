import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/components/admin/RAGChat.tsx
// Design TERAS dark + historique localStorage + export PDF backend ReportLab
import { useState, useRef, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';
import { Send, Download, Trash2, Loader, Database, Clock, Plus, MessageSquare, ChevronRight, Bot, User, AlertCircle, CheckCircle, Zap, FileText } from 'lucide-react';
const STORAGE_KEY = 'teras_rag_conversations';
const MAX_CONVS = 20;
function renderMarkdown(text) {
    return text
        .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre style="background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;margin:8px 0;font-size:11px;overflow-x:auto;white-space:pre-wrap;border:1px solid rgba(255,255,255,0.08)"><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(56,189,248,0.15);padding:1px 5px;border-radius:3px;font-size:11px;color:#38bdf8">$1</code>')
        .replace(/^### (.+)$/gm, '<div style="font-weight:700;font-size:13px;color:#e2e8f0;margin:10px 0 4px">$1</div>')
        .replace(/^## (.+)$/gm, '<div style="font-weight:800;font-size:14px;color:#f1f5f9;margin:12px 0 5px;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,0.08)">$1</div>')
        .replace(/^# (.+)$/gm, '<div style="font-weight:800;font-size:15px;color:#f8fafc;margin:14px 0 6px">$1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9;font-weight:700">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em style="color:#94a3b8">$1</em>')
        .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#38bdf8;flex-shrink:0">•</span><span>$1</span></div>')
        .replace(/\n\n+/g, '<br/><br/>')
        .replace(/\n(?!<)/g, '<br/>');
}
export default function RAGChat() {
    const [conversations, setConversations] = useState([]);
    const [currentConvId, setCurrentConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalQueries, setTotalQueries] = useState(0);
    const [toast, setToast] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    useEffect(() => { loadConversations(); loadStats(); }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
    const notify = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };
    const loadStats = async () => {
        try {
            const r = await authFetch('/api/ai/documents/stats/');
            const d = await r.json();
            setTotalDocs(d.total || d.total_documents || d.indexed || 0);
            setTotalQueries(d.total_queries || 0);
        }
        catch { }
    };
    const loadConversations = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw)
                setConversations(JSON.parse(raw));
        }
        catch { }
    };
    const saveConversations = (convs) => {
        const limited = convs.slice(0, MAX_CONVS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        setConversations(limited);
    };
    const newConversation = () => { setCurrentConvId(null); setMessages([]); };
    const selectConversation = (conv) => {
        setCurrentConvId(conv.id);
        setMessages(conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    };
    const deleteConversation = (id, e) => {
        e.stopPropagation();
        saveConversations(conversations.filter(c => c.id !== id));
        if (currentConvId === id) {
            setCurrentConvId(null);
            setMessages([]);
        }
        notify('Conversation supprimée');
    };
    const persistMessages = (msgs, convId, firstMsg) => {
        const id = convId || Date.now().toString();
        const existing = conversations.find(c => c.id === id);
        const conv = {
            id,
            title: existing?.title || firstMsg.slice(0, 55) + (firstMsg.length > 55 ? '…' : ''),
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            messages: msgs.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
        };
        saveConversations([conv, ...conversations.filter(c => c.id !== id)]);
        return id;
    };
    const handleSend = async () => {
        if (!inputMessage.trim() || isLoading)
            return;
        const text = inputMessage.trim();
        setInputMessage('');
        const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setIsLoading(true);
        try {
            const r = await authFetch('/api/ai/rag/chat/', {
                method: 'POST',
                body: JSON.stringify({ query: text, n_results: 5 }),
            });
            const d = await r.json();
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: d.response || d.answer || 'Pas de réponse',
                timestamp: new Date(),
                sources: d.sources || [],
            };
            const finalMsgs = [...newMsgs, aiMsg];
            setMessages(finalMsgs);
            const newId = persistMessages(finalMsgs, currentConvId, text);
            if (!currentConvId)
                setCurrentConvId(newId);
            setTotalQueries(q => q + 1);
        }
        catch (e) {
            setMessages(p => [...p, { id: Date.now().toString(), role: 'assistant', content: `❌ Erreur: ${e.message}`, timestamp: new Date() }]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleExport = async () => {
        if (messages.length === 0)
            return;
        setIsExporting(true);
        try {
            const title = conversations.find(c => c.id === currentConvId)?.title || 'Chat RAG TERAS';
            const r = await authFetch('/api/chat/export-pdf/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp.toISOString(),
                        sources: m.sources || [],
                    })),
                    title,
                    doc_count: totalDocs,
                    model: 'Claude Sonnet 4',
                }),
            });
            if (r.ok) {
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TERAS_${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                notify('PDF téléchargé !');
            }
            else {
                const err = await r.json().catch(() => ({}));
                notify(err.error || 'Erreur export PDF', false);
            }
        }
        catch (e) {
            notify('Erreur: ' + e.message, false);
        }
        finally {
            setIsExporting(false);
        }
    };
    const clearConv = () => {
        if (!confirm('Effacer la conversation ?'))
            return;
        setMessages([]);
        if (currentConvId) {
            saveConversations(conversations.filter(c => c.id !== currentConvId));
            setCurrentConvId(null);
        }
    };
    const cs = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", style: { background: '#0b1220' }, children: [toast && (_jsxs("div", { className: `fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30' : 'text-red-300 bg-red-500/20 border border-red-500/30'}`, children: [toast.ok ? _jsx(CheckCircle, { className: "w-4 h-4" }) : _jsx(AlertCircle, { className: "w-4 h-4" }), toast.msg] })), _jsxs("div", { className: `flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`, style: { borderRight: '1px solid rgba(255,255,255,0.07)' }, children: [_jsxs("div", { className: "p-4", style: { borderBottom: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4 text-sky-400" }), _jsx("span", { className: "text-white text-sm font-semibold", children: "Historique RAG" })] }), _jsx("span", { className: "text-xs text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded-full", children: conversations.length })] }), _jsxs("button", { onClick: newConversation, className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouvelle conversation"] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-2 py-3 space-y-1", children: conversations.length === 0 ? (_jsx("p", { className: "text-center py-8 text-slate-600 text-xs", children: "Aucune conversation" })) : conversations.map(conv => (_jsxs("div", { onClick: () => selectConversation(conv), className: `group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentConvId === conv.id ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-white/5'}`, children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", style: { background: currentConvId === conv.id ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)' }, children: _jsx(Database, { className: "w-3.5 h-3.5 text-sky-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium truncate ${currentConvId === conv.id ? 'text-sky-300' : 'text-slate-300'}`, children: conv.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(Clock, { className: "w-3 h-3 text-slate-600" }), _jsxs("span", { className: "text-xs text-slate-600", children: [new Date(conv.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), " \u00B7 ", conv.messageCount, " msg"] })] })] }), _jsx("button", { onClick: e => deleteConversation(conv.id, e), className: "opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] }, conv.id))) }), _jsx("div", { className: "p-4", style: { borderTop: '1px solid rgba(255,255,255,0.06)' }, children: _jsxs("div", { className: "rounded-xl p-3 space-y-2", style: { background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)' }, children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400", children: [_jsx(FileText, { className: "w-3 h-3 text-sky-400" }), _jsxs("span", { children: [totalDocs, " documents index\u00E9s"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400", children: [_jsx(Zap, { className: "w-3 h-3 text-sky-400" }), _jsxs("span", { children: [totalQueries, " requ\u00EAtes"] })] })] }) })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-3 flex-shrink-0", style: { borderBottom: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setSidebarOpen(v => !v), className: "p-2 rounded-lg text-slate-400 hover:text-white transition-colors", style: { background: 'rgba(255,255,255,0.05)' }, children: _jsx(ChevronRight, { className: `w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}` }) }), _jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: _jsx(Database, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-white font-semibold text-sm", children: "Chat RAG TERAS" }), _jsxs("p", { className: "text-slate-500 text-xs", children: [totalDocs, " documents \u00B7 Claude Sonnet 4"] })] })] }), _jsx("div", { className: "flex items-center gap-2", children: messages.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: handleExport, disabled: isExporting, className: "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40", style: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }, children: [isExporting ? _jsx(Loader, { className: "w-4 h-4 animate-spin" }) : _jsx(Download, { className: "w-4 h-4" }), isExporting ? 'Export…' : 'PDF'] }), _jsx("button", { onClick: clearConv, className: "p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })) })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-5", children: messages.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl flex items-center justify-center mb-4", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: _jsx(Database, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Chat RAG TERAS" }), _jsxs("p", { className: "text-slate-400 text-sm mb-6 max-w-sm", children: [totalDocs, " documents index\u00E9s \u00B7 Questions sur TERAS, scores, l\u00E9gislation CEMAC"] }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-w-md w-full", children: [
                                        '📊 Formule du score TERAS Basic',
                                        '💰 Comment calculer le CRM ?',
                                        '📜 Législation fiscale Congo 2018',
                                        '🏢 TERAS Basic vs Entreprise',
                                    ].map(q => (_jsx("button", { onClick: () => { setInputMessage(q.slice(2).trim()); inputRef.current?.focus(); }, className: "p-3 rounded-xl text-left text-sm text-slate-300 hover:text-white transition-all", style: cs, children: q }, q))) })] })) : (_jsxs(_Fragment, { children: [messages.map(msg => (_jsxs("div", { className: `flex items-start gap-3 mb-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: `w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-gradient-to-br from-sky-600 to-blue-700'}`, children: msg.role === 'user' ? _jsx(User, { className: "w-4 h-4 text-white" }) : _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: `max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`, children: [_jsx("div", { className: `px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'text-white rounded-tr-sm' : 'rounded-tl-sm text-slate-200'}`, style: msg.role === 'user'
                                                        ? { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }
                                                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }, children: msg.role === 'user'
                                                        ? _jsx("p", { className: "whitespace-pre-wrap", children: msg.content })
                                                        : _jsx("div", { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }) }), msg.sources && msg.sources.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mt-1.5 px-1", children: msg.sources.slice(0, 4).map((s, i) => (_jsx("span", { className: "text-xs px-2 py-0.5 rounded-full text-sky-400", style: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }, children: s.title?.slice(0, 25) }, i))) })), _jsx("span", { className: "text-xs text-slate-600 mt-1 px-1", children: msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })] })] }, msg.id))), isLoading && (_jsxs("div", { className: "flex items-start gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-600 to-blue-700", children: _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "px-4 py-3 rounded-2xl rounded-tl-sm", style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }, children: _jsx("div", { className: "flex gap-1.5 items-center h-4", children: [0, 0.18, 0.36].map((d, i) => (_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce", style: { animationDelay: `${d}s` } }, i))) }) })] })), _jsx("div", { ref: messagesEndRef })] })) }), _jsxs("div", { className: "px-5 pb-5 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 rounded-2xl", style: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }, children: [_jsx("input", { ref: inputRef, type: "text", value: inputMessage, onChange: e => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Posez votre question sur la base documentaire TERAS...", disabled: isLoading, className: "flex-1 text-sm text-slate-200 placeholder-slate-600 outline-none", style: { background: 'transparent' } }), _jsx("button", { onClick: handleSend, disabled: isLoading || !inputMessage.trim(), className: "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30", style: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }, children: isLoading ? _jsx(Loader, { className: "w-4 h-4 text-white animate-spin" }) : _jsx(Send, { className: "w-4 h-4 text-white" }) })] }), _jsxs("p", { className: "text-center text-slate-700 text-xs mt-2", children: ["RAG \u00B7 ", totalDocs, " documents \u00B7 Claude Sonnet 4"] })] })] })] }));
}
