import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
// frontend/src/components/government/ChatbotDemo.tsx
/**
 * Interface de chat TERAS pleine page (style Messenger/WhatsApp)
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { sendChatMessage } from '../../utils/authFetch';
const ChatbotDemo = () => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: '👋 Bonjour ! Je suis l\'**Assistant IA TERAS**, propulsé par Claude Sonnet 4.\n\nJe peux vous aider à :\n\n• 📊 Analyser les scores TERAS nationaux\n• 🗺️ Comparer les performances régionales\n• 🏢 Évaluer les secteurs économiques\n• ⚠️ Interpréter les alertes système\n• 📄 Générer des rapports détaillés\n\nPosez-moi une question sur les données TERAS !',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading)
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        try {
            const data = await sendChatMessage(inputMessage, 'government', messages);
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        catch (error) {
            console.error('Erreur chat:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Désolé, une erreur est survenue. Veuillez réessayer.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const formatMessage = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>')
            .replace(/^• (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
            .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
            .replace(/^# (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2 text-white">$1</h3>')
            .replace(/\n/g, '<br/>');
    };
    const suggestedQuestions = [
        "Quel est le score TERAS moyen actuel ?",
        "Compare les performances de Kinshasa et Lubumbashi",
        "Quelles sont les alertes critiques ?",
        "Analyse le secteur de la santé",
        "Génère un rapport trimestriel"
    ];
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 flex", children: [_jsxs("div", { className: "w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col", children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl", children: _jsx(Bot, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-white font-bold text-lg", children: "Assistant IA" }), _jsx("p", { className: "text-slate-400 text-xs", children: "Claude Sonnet 4" })] })] }) }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50", children: [_jsx("div", { className: "text-xs text-slate-400 mb-2", children: "Donn\u00E9es TERAS" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Score moyen" }), _jsx("span", { className: "text-cyan-400 font-bold", children: "676/1000" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Utilisateurs" }), _jsx("span", { className: "text-green-400 font-bold", children: "8" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Entreprises" }), _jsx("span", { className: "text-purple-400 font-bold", children: "1,247" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-300 text-sm", children: "Alertes" }), _jsx("span", { className: "text-red-400 font-bold", children: "12" })] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Sparkles, { className: "w-4 h-4 text-yellow-400" }), _jsx("h3", { className: "text-white font-semibold text-sm", children: "Questions sugg\u00E9r\u00E9es" })] }), _jsx("div", { className: "space-y-2", children: suggestedQuestions.map((question, index) => (_jsxs("button", { onClick: () => setInputMessage(question), className: "w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg p-3 text-sm text-slate-300 hover:text-white transition-all", children: ["\uD83D\uDCAC ", question] }, index))) })] }), _jsx("div", { className: "mt-auto pt-6 border-t border-slate-800", children: _jsxs("div", { className: "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(MessageCircle, { className: "w-4 h-4 text-cyan-400" }), _jsxs("span", { className: "text-white text-xs font-semibold", children: ["Conversations : ", messages.length - 1] })] }), _jsx("p", { className: "text-slate-400 text-xs", children: "Propuls\u00E9 par Claude Sonnet 4" })] }) })] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "bg-slate-900 border-b border-slate-800 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-white text-2xl font-bold mb-1", children: "Assistant IA TERAS" }), _jsx("p", { className: "text-slate-400", children: "Posez vos questions sur les donn\u00E9es TERAS" })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-green-500 animate-pulse" }), _jsx("span", { className: "text-slate-400", children: "En ligne" })] })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-3xl ${message.role === 'user' ? 'w-auto' : 'w-full'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [message.role === 'assistant' && (_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg flex-shrink-0", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: `rounded-2xl px-5 py-4 ${message.role === 'user'
                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white ml-auto'
                                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'}`, style: { maxWidth: message.role === 'user' ? '80%' : '100%' }, children: _jsx("div", { className: "text-sm leading-relaxed", dangerouslySetInnerHTML: { __html: formatMessage(message.content) } }) }), _jsx("div", { className: `text-xs mt-2 ${message.role === 'user' ? 'text-right text-slate-500' : 'text-slate-500'}`, children: message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })] }), message.role === 'user' && (_jsx("div", { className: "bg-cyan-500 p-2 rounded-lg flex-shrink-0", children: _jsx("span", { className: "text-white font-bold", children: "\uD83D\uDC64" }) }))] }) }) }, message.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "flex items-start gap-3 max-w-3xl", children: [_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) }), _jsx("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 text-cyan-400 animate-spin" }), _jsx("span", { className: "text-slate-400 text-sm", children: "L'assistant r\u00E9fl\u00E9chit..." })] }) })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "bg-slate-900 border-t border-slate-800 p-6", children: _jsxs("div", { className: "flex gap-3 max-w-5xl mx-auto", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Posez votre question sur les donn\u00E9es TERAS...", disabled: isLoading, rows: 1, className: "flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none", style: { minHeight: '56px', maxHeight: '150px' } }), _jsxs("button", { onClick: handleSendMessage, disabled: !inputMessage.trim() || isLoading, className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold", children: [_jsx(Send, { className: "w-5 h-5" }), "Envoyer"] })] }) })] })] }));
};
export default ChatbotDemo;
