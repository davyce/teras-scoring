import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ChatHistory - Page historique conversations avec export PDF
 * ✅ Liste toutes les conversations
 * ✅ Affiche messages de chaque conversation
 * ✅ Export PDF par conversation
 * ✅ Archiver conversations
 * ✅ Recherche/filtres
 */
import { useState, useEffect } from 'react';
import { MessageSquare, Download, Archive, Search, Calendar, ChevronRight, FileText, Trash2, X, Bot, User, Clock, CheckCircle } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
export default function ChatHistory() {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [exporting, setExporting] = useState(null);
    // Charger conversations
    useEffect(() => {
        loadConversations();
    }, [showArchived]);
    const loadConversations = async () => {
        setLoading(true);
        try {
            const url = `/api/chat/conversations/${showArchived ? '?archived=true' : ''}`;
            const response = await authFetch(url);
            if (!response.ok)
                throw new Error('Erreur chargement');
            const data = await response.json();
            setConversations(data.results || data);
        }
        catch (err) {
            console.error('Erreur:', err);
        }
        finally {
            setLoading(false);
        }
    };
    // Charger messages d'une conversation
    const loadMessages = async (convId) => {
        setLoadingMessages(true);
        try {
            const response = await authFetch(`/api/chat/conversations/${convId}/`);
            if (!response.ok)
                throw new Error('Erreur chargement messages');
            const data = await response.json();
            setMessages(data.messages || []);
        }
        catch (err) {
            console.error('Erreur:', err);
            setMessages([]);
        }
        finally {
            setLoadingMessages(false);
        }
    };
    // Sélectionner conversation
    const selectConversation = async (conv) => {
        setSelectedConv(conv);
        await loadMessages(conv.id);
    };
    // Export PDF
    const exportPDF = async (convId) => {
        setExporting(convId);
        try {
            const response = await authFetch(`/api/chat/conversations/${convId}/export_pdf/`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Erreur export');
            // Télécharger le PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${convId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert('✅ PDF téléchargé !');
        }
        catch (err) {
            console.error('Erreur export:', err);
            alert('❌ Erreur lors de l\'export PDF');
        }
        finally {
            setExporting(null);
        }
    };
    // Archiver conversation
    const archiveConversation = async (convId) => {
        try {
            const response = await authFetch(`/api/chat/conversations/${convId}/archive/`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Erreur archivage');
            await loadConversations();
            if (selectedConv?.id === convId) {
                setSelectedConv(null);
                setMessages([]);
            }
            alert('✅ Conversation archivée');
        }
        catch (err) {
            console.error('Erreur:', err);
            alert('❌ Erreur lors de l\'archivage');
        }
    };
    // Supprimer conversation
    const deleteConversation = async (convId) => {
        if (!confirm('Supprimer cette conversation ?'))
            return;
        try {
            const response = await authFetch(`/api/chat/conversations/${convId}/`, {
                method: 'DELETE'
            });
            if (!response.ok)
                throw new Error('Erreur suppression');
            await loadConversations();
            if (selectedConv?.id === convId) {
                setSelectedConv(null);
                setMessages([]);
            }
            alert('✅ Conversation supprimée');
        }
        catch (err) {
            console.error('Erreur:', err);
            alert('❌ Erreur lors de la suppression');
        }
    };
    // Filtrer conversations
    const filteredConversations = conversations.filter(conv => conv.title.toLowerCase().includes(search.toLowerCase()) ||
        conv.last_message?.content.toLowerCase().includes(search.toLowerCase()));
    return (_jsx("div", { className: "min-h-screen bg-[#0b1220] p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-white flex items-center gap-3", children: [_jsx(MessageSquare, { className: "w-8 h-8 text-purple-400" }), "Historique Conversations IA"] }), _jsx("p", { className: "text-slate-400 mt-2", children: "Consultez et exportez vos conversations avec l'assistant TERAS" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl px-6 py-3", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: conversations.length }), _jsx("div", { className: "text-xs text-slate-400", children: "Conversations" })] }), _jsxs("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl px-6 py-3", children: [_jsx("div", { className: "text-2xl font-bold text-purple-400", children: conversations.reduce((sum, c) => sum + c.message_count, 0) }), _jsx("div", { className: "text-xs text-slate-400", children: "Messages" })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Rechercher une conversation...", className: "w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" })] }), _jsxs("button", { onClick: () => setShowArchived(!showArchived), className: `px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${showArchived
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-800/50 border border-white/10 text-slate-300'}`, children: [_jsx(Archive, { className: "w-5 h-5" }), showArchived ? 'Actives' : 'Archivées'] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-6", children: [_jsx("div", { className: "col-span-1 space-y-3", children: loading ? (_jsx("div", { className: "text-center py-12 text-slate-400", children: "Chargement..." })) : filteredConversations.length === 0 ? (_jsx("div", { className: "text-center py-12 text-slate-400", children: "Aucune conversation trouv\u00E9e" })) : (filteredConversations.map(conv => (_jsxs("div", { onClick: () => selectConversation(conv), className: `bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition hover:border-purple-500/50 ${selectedConv?.id === conv.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-white/10'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-white text-sm flex-1 line-clamp-2", children: conv.title }), _jsx(ChevronRight, { className: `w-5 h-5 text-slate-500 flex-shrink-0 ${selectedConv?.id === conv.id ? 'text-purple-400' : ''}` })] }), conv.last_message && (_jsx("p", { className: "text-xs text-slate-400 line-clamp-2 mb-3", children: conv.last_message.content })), _jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-3 h-3" }), _jsxs("span", { children: [conv.message_count, " msgs"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: new Date(conv.updated_at).toLocaleDateString('fr-FR') })] })] })] }, conv.id)))) }), _jsx("div", { className: "col-span-2", children: !selectedConv ? (_jsxs("div", { className: "bg-slate-800/30 border border-white/10 rounded-xl p-12 text-center", children: [_jsx(MessageSquare, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "S\u00E9lectionnez une conversation pour voir les d\u00E9tails" })] })) : (_jsxs("div", { className: "bg-slate-800/30 border border-white/10 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-pink-600 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-1", children: selectedConv.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-purple-100", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), new Date(selectedConv.created_at).toLocaleDateString('fr-FR')] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), selectedConv.message_count, " messages"] })] })] }), _jsx("button", { onClick: () => {
                                                            setSelectedConv(null);
                                                            setMessages([]);
                                                        }, className: "w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition", children: _jsx(X, { className: "w-5 h-5 text-white" }) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => exportPDF(selectedConv.id), disabled: exporting === selectedConv.id, className: "flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50", children: exporting === selectedConv.id ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Export..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4" }), "T\u00E9l\u00E9charger PDF"] })) }), _jsxs("button", { onClick: () => archiveConversation(selectedConv.id), className: "bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2", children: [_jsx(Archive, { className: "w-4 h-4" }), "Archiver"] }), _jsxs("button", { onClick: () => deleteConversation(selectedConv.id), className: "bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-red-300 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Supprimer"] })] })] }), _jsx("div", { className: "p-6 space-y-4 max-h-[600px] overflow-y-auto", children: loadingMessages ? (_jsx("div", { className: "text-center py-8 text-slate-400", children: "Chargement des messages..." })) : messages.length === 0 ? (_jsx("div", { className: "text-center py-8 text-slate-400", children: "Aucun message" })) : (messages.map((msg, idx) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: `flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: [msg.role === 'assistant' && (_jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) })), _jsxs("div", { className: `max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                                ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                                                                : 'bg-slate-700/50 text-slate-100'}`, children: [_jsx("div", { className: "text-sm leading-relaxed whitespace-pre-wrap", children: msg.content }), _jsx("div", { className: `text-xs mt-2 ${msg.role === 'user' ? 'text-sky-100' : 'text-slate-500'}`, children: new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) })] }), msg.role === 'user' && (_jsx("div", { className: "w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0", children: _jsx(User, { className: "w-5 h-5 text-white" }) }))] }), msg.role === 'assistant' && msg.metadata?.used_rag && (_jsxs("div", { className: "ml-11", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-green-400 mb-2", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "R\u00E9ponse bas\u00E9e sur la documentation"] }), msg.metadata.sources && msg.metadata.sources.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Sources :" }), msg.metadata.sources.map((src, sidx) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400", children: [_jsx(FileText, { className: "w-3 h-3" }), src.title || `Document ${sidx + 1}`] }, sidx)))] }))] }))] }, idx)))) })] })) })] })] }) }));
}
