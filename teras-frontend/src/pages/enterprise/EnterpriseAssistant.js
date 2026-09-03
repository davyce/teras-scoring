import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Page Assistant IA TERAS Entreprise
 * Interface complète avec suggestions, historique et analyse contextuelle
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, TrendingUp, Users, FileText, Shield, BarChart3, Lightbulb, Clock, Trash2, MessageSquare, AlertCircle, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
const suggestedQuestions = [
    {
        id: '1',
        category: 'Score TERAS',
        icon: TrendingUp,
        question: 'Comment puis-je améliorer mon score TERAS Entreprise de 720 à 800+ ?',
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: '2',
        category: 'Emploi',
        icon: Users,
        question: 'Quelle est l\'impact du taux d\'emploi local sur mon score TERAS ?',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: '3',
        category: 'Transparence',
        icon: FileText,
        question: 'Quels documents dois-je fournir pour maximiser ma transparence fiscale ?',
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: '4',
        category: 'Conformité',
        icon: Shield,
        question: 'Comment corriger mon statut de conformité qui est à 72% ?',
        color: 'from-amber-500 to-orange-500',
    },
    {
        id: '5',
        category: 'Analyse',
        icon: BarChart3,
        question: 'Analyse mes performances par rapport aux entreprises similaires dans mon secteur',
        color: 'from-red-500 to-rose-500',
    },
    {
        id: '6',
        category: 'Conseils',
        icon: Lightbulb,
        question: 'Quelles sont les 3 actions prioritaires pour améliorer ma rétention clients ?',
        color: 'from-indigo-500 to-purple-500',
    },
];
const EnterpriseAssistant = () => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: '👋 **Bienvenue dans l\'Assistant IA TERAS Entreprise**\n\nJe suis votre conseiller intelligent propulsé par **Claude Sonnet 4**. Je peux vous aider à :\n\n• 📊 **Analyser** votre score TERAS en détail\n• 🎯 **Optimiser** chacun des 5 piliers (T.E.R.A.S)\n• 📈 **Comparer** vos performances sectorielles\n• 💡 **Recommander** des actions concrètes\n• 📄 **Interpréter** vos rapports et données\n\nChoisissez une question suggérée ci-dessous ou posez-moi directement votre question !',
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleSendMessage = async (text) => {
        const messageText = text || inputMessage;
        if (!messageText.trim() || isLoading)
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        // Ajouter à l'historique
        setConversationHistory(prev => [...prev, messageText]);
        try {
            const res = await authFetch('/api/scoring/enterprise/ai/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            // Extraire la réponse selon le format du backend
            const replyContent = data?.response || data?.message?.content || data?.message ||
                'Désolé, je n\'ai pas pu traiter votre demande.';
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: typeof replyContent === 'string' ? replyContent : JSON.stringify(replyContent),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        catch (error) {
            console.error('Erreur chat:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Une erreur est survenue. Veuillez réessayer dans quelques instants.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSuggestedQuestion = (question) => {
        handleSendMessage(question);
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const clearConversation = () => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: '👋 Conversation réinitialisée. Comment puis-je vous aider ?',
                timestamp: new Date(),
            },
        ]);
        setConversationHistory([]);
    };
    const formatMessage = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>')
            .replace(/^• (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
            .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
            .replace(/\n/g, '<br/>');
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl", children: _jsx(Bot, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Assistant IA TERAS" }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-400 mt-1", children: [_jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" }), _jsx("span", { children: "Propuls\u00E9 par Claude Sonnet 4" })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]", children: [_jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [message.role === 'assistant' && (_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl flex-shrink-0", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: `rounded-2xl px-5 py-4 ${message.role === 'user'
                                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'}`, children: _jsx("div", { className: "text-sm leading-relaxed", dangerouslySetInnerHTML: { __html: formatMessage(message.content) } }) }), _jsxs("div", { className: `text-xs mt-2 flex items-center gap-2 ${message.role === 'user' ? 'justify-end text-slate-500' : 'text-slate-500'}`, children: [_jsx(Clock, { className: "w-3 h-3" }), message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })] })] }), message.role === 'user' && (_jsx("div", { className: "bg-cyan-500 p-2 rounded-xl flex-shrink-0", children: _jsx("span", { className: "text-white text-sm font-bold", children: "\uD83D\uDC64" }) }))] }) }) }, message.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) }), _jsx("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Loader2, { className: "w-5 h-5 text-cyan-400 animate-spin" }), _jsx("span", { className: "text-slate-400", children: "L'assistant analyse votre demande..." })] }) })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 bg-slate-900 border-t border-slate-800", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Posez votre question \u00E0 l'assistant IA...", disabled: isLoading, rows: 2, className: "flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none" }), _jsxs("button", { onClick: () => handleSendMessage(), disabled: !inputMessage.trim() || isLoading, className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium", children: [_jsx(Send, { className: "w-5 h-5" }), "Envoyer"] })] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Sparkles, { className: "w-5 h-5 text-cyan-400" }), _jsx("h3", { className: "font-semibold text-white", children: "Questions sugg\u00E9r\u00E9es" })] }), _jsx("div", { className: "space-y-3", children: suggestedQuestions.map((item) => {
                                                const Icon = item.icon;
                                                return (_jsx("button", { onClick: () => handleSuggestedQuestion(item.question), disabled: isLoading, className: "w-full text-left p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 group", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `bg-gradient-to-r ${item.color} p-2 rounded-lg flex-shrink-0`, children: _jsx(Icon, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-slate-500 mb-1", children: item.category }), _jsx("p", { className: "text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2", children: item.question })] })] }) }, item.id));
                                            }) })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-cyan-400" }), _jsx("h3", { className: "font-semibold text-white", children: "Historique" })] }), conversationHistory.length > 0 && (_jsxs("button", { onClick: clearConversation, className: "text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1", children: [_jsx(Trash2, { className: "w-3 h-3" }), "Effacer"] }))] }), conversationHistory.length === 0 ? (_jsxs("div", { className: "text-center py-6", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-slate-600 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-slate-500", children: "Aucune conversation" })] })) : (_jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: conversationHistory.slice(-5).reverse().map((question, index) => (_jsx("div", { className: "p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg", children: _jsx("p", { className: "text-xs text-slate-400 line-clamp-2", children: question }) }, index))) }))] }), _jsx("div", { className: "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-2xl p-5", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Lightbulb, { className: "w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-cyan-300 mb-2", children: "\uD83D\uDCA1 Astuce" }), _jsx("p", { className: "text-sm text-slate-300 leading-relaxed", children: "Pour de meilleurs r\u00E9sultats, soyez pr\u00E9cis dans vos questions et mentionnez les piliers TERAS concern\u00E9s (Transparence, Emploi, R\u00E9tention, Activit\u00E9, Stabilit\u00E9)." })] })] }) })] })] })] }) }));
};
export default EnterpriseAssistant;
