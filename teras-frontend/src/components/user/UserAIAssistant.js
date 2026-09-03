import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * UserAIAssistant - VERSION CORRIGÉE ✅
 * ✅ Accepte isOpen et onClose
 * ✅ Modal popup centre écran
 * ✅ POST /api/chat/message/ (endpoint consolidé)
 * ✅ Toggle RAG activable/désactivable
 * ✅ FIX: Extraction correcte de data.message.content
 */
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, Sparkles, FileText, Zap, CheckCircle } from "lucide-react";
import { authFetch } from "../../utils/authFetch";
const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: `flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`, children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`, children: isUser ? _jsx(User, { className: "w-6 h-6 text-white" }) : _jsx(Bot, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { className: `flex-1 max-w-[75%] rounded-2xl px-5 py-4 ${isUser
                            ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                            : 'bg-slate-800/80 border border-white/10 text-slate-100'}`, children: [_jsx("div", { className: "text-sm leading-relaxed whitespace-pre-wrap", children: msg.content }), _jsx("div", { className: `text-xs mt-2 ${isUser ? 'text-sky-100' : 'text-slate-500'}`, children: msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })] })] }), !isUser && msg.metadata?.used_rag && (_jsxs("div", { className: "flex items-center gap-2 ml-14 animate-in fade-in duration-200", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-xs text-green-400", children: "R\u00E9ponse bas\u00E9e sur la documentation TERAS" })] })), !isUser && msg.metadata?.sources && msg.metadata.sources.length > 0 && (_jsxs("div", { className: "ml-14 space-y-1 animate-in fade-in duration-200", children: [_jsx("p", { className: "text-xs text-slate-500 font-medium", children: "\uD83D\uDCDA Sources :" }), msg.metadata.sources.map((source, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400", children: [_jsx(FileText, { className: "w-3 h-3" }), _jsx("span", { children: source.title || `Document ${idx + 1}` })] }, idx)))] }))] }));
};
export default function UserAIAssistant({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Bonjour ! Je suis votre assistant TERAS. Comment puis-je vous aider aujourd'hui ? 😊", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    // ✅ État toggle RAG (OFF par défaut)
    const [useRAG, setUseRAG] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const sendMessage = async () => {
        if (!input.trim() || loading)
            return;
        const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            // ✅ Appel endpoint consolidé avec toggle RAG
            const response = await authFetch('/api/chat/message/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    conversation_id: conversationId,
                    use_rag: useRAG, // ✅ Envoyer état toggle
                    save_conversation: true
                })
            });
            if (!response.ok)
                throw new Error(`Erreur ${response.status}`);
            const data = await response.json();
            // 🔍 Debug - Voir ce qui est reçu
            console.log('📦 Response du backend:', data);
            console.log('💬 Message reçu:', data.message);
            if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
            }
            // ✅ FIX: Extraire correctement le content
            // Le backend renvoie data.message qui est un objet {id, role, content, timestamp, metadata}
            // Il faut extraire data.message.content
            const assistantMsg = {
                role: 'assistant',
                content: data.message?.content || data.message || data.response || "Pas de réponse",
                timestamp: new Date(),
                metadata: {
                    sources: data.sources || [],
                    used_rag: data.used_rag || false
                }
            };
            setMessages(prev => [...prev, assistantMsg]);
        }
        catch (err) {
            console.error('Erreur chat:', err);
            const errorMsg = {
                role: 'assistant',
                content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200", children: _jsxs("div", { className: "bg-slate-900 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300", children: [_jsxs("div", { className: "relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 rounded-t-3xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center", children: _jsx(Bot, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-white flex items-center gap-2", children: ["Assistant IA TERAS", _jsx(Sparkles, { className: "w-5 h-5 text-yellow-300 animate-pulse" })] }), _jsx("p", { className: "text-purple-100 text-sm", children: "Conseils personnalis\u00E9s \u2022 Disponible 24/7" })] })] }), _jsx("button", { onClick: onClose, className: "w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition", children: _jsx(X, { className: "w-6 h-6 text-white" }) })] }), _jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20", children: [_jsx("button", { onClick: () => setUseRAG(!useRAG), className: `relative w-14 h-7 rounded-full transition-colors ${useRAG ? 'bg-green-500' : 'bg-slate-700'}`, children: _jsx("div", { className: `absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${useRAG ? 'translate-x-7' : 'translate-x-0'}` }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: `w-4 h-4 ${useRAG ? 'text-white' : 'text-purple-200'}` }), _jsx("span", { className: `text-sm font-medium ${useRAG ? 'text-white' : 'text-purple-100'}`, children: "Recherche documents" })] }), _jsx("p", { className: "text-xs text-purple-200", children: useRAG
                                                ? '✅ IA cherchera dans la documentation TERAS'
                                                : '⚡ IA répondra directement (plus rapide)' })] }), useRAG && (_jsxs("div", { className: "flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30", children: [_jsx(Sparkles, { className: "w-3 h-3 text-green-300" }), _jsx("span", { className: "text-xs text-green-200 font-medium", children: "RAG actif" })] }))] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6 bg-[#0b1220]", children: [messages.map((msg, i) => (_jsx(MessageBubble, { msg: msg }, i))), loading && (_jsxs("div", { className: "flex gap-4 animate-in slide-in-from-bottom-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center", children: _jsx(Bot, { className: "w-6 h-6 text-white animate-pulse" }) }), _jsx("div", { className: "bg-slate-800/80 border border-white/10 rounded-2xl px-5 py-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-slate-400 animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-2 h-2 rounded-full bg-slate-400 animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-2 h-2 rounded-full bg-slate-400 animate-bounce", style: { animationDelay: '300ms' } })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm rounded-b-3xl", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && !e.shiftKey && sendMessage(), placeholder: "Posez votre question...", disabled: loading, className: "flex-1 bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition disabled:opacity-50" }), _jsxs("button", { onClick: sendMessage, disabled: !input.trim() || loading, className: "px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: [loading ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsx(Send, { className: "w-5 h-5" })), _jsx("span", { children: "Envoyer" })] })] }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: "\uD83D\uDCA1 Tip: Appuyez sur Entr\u00E9e pour envoyer" }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsx(Zap, { className: "w-3 h-3" }), _jsx("span", { children: useRAG ? 'Mode recherche actif' : 'Mode rapide actif' })] })] })] })] }) }));
}
