import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Chatbot IA TERAS pour l'interface Entreprise
 * VERSION CONNECTÉE API avec enterpriseApi
 * Propulsé par Claude Sonnet 4
 */
import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, Bot, Sparkles, Loader2 } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi';
import terasLogoUrl from '../../assets/logo-teras.svg';
const EnterpriseChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: '👋 Bonjour ! Je suis l\'**Assistant IA TERAS Entreprise**, propulsé par Claude Sonnet 4.\n\nJe peux vous aider à :\n\n• 📊 Analyser votre score TERAS Entreprise\n• 👥 Optimiser votre score Emploi local\n• 📈 Améliorer votre transparence fiscale\n• 💼 Conseils sur la rétention clients\n• 📄 Interpréter vos rapports\n\nComment puis-je vous aider aujourd\'hui ?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
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
            // ✅ CONNEXION API
            const response = await enterpriseApi.sendChatMessage(inputMessage, {
                conversationHistory: messages,
                userType: 'enterprise',
            });
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        catch (error) {
            console.error('Erreur chat:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Une erreur est survenue. Veuillez réessayer.',
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
            .replace(/\n/g, '<br/>');
    };
    if (!isOpen) {
        return (_jsxs("button", { onClick: () => setIsOpen(true), className: "fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-110 flex items-center justify-center z-50 group", children: [_jsx(Bot, { className: "w-7 h-7" }), _jsx("span", { className: "absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full animate-pulse" }), _jsx("div", { className: "absolute bottom-full mb-2 right-0 bg-slate-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap", children: "Assistant IA TERAS" })] }));
    }
    return (_jsx("div", { className: `fixed bottom-6 right-6 z-50 transition-all duration-300`, children: _jsxs("div", { className: `bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`, children: [_jsxs("div", { className: "bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-white/20 p-2 rounded-lg backdrop-blur-sm", children: _jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: "Assistant IA TERAS" }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-cyan-100", children: [_jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" }), _jsx("span", { children: "En ligne" })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setIsMinimized(!isMinimized), className: "p-1.5 hover:bg-white/20 rounded-lg transition", children: isMinimized ? _jsx(Maximize2, { className: "w-4 h-4 text-white" }) : _jsx(Minimize2, { className: "w-4 h-4 text-white" }) }), _jsx("button", { onClick: () => setIsOpen(false), className: "p-1.5 hover:bg-white/20 rounded-lg transition", children: _jsx(X, { className: "w-4 h-4 text-white" }) })] })] }), !isMinimized && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-[440px] overflow-y-auto p-4 space-y-4 bg-slate-950", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`, children: _jsxs("div", { className: "flex items-start gap-2", children: [message.role === 'assistant' && (_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg flex-shrink-0", children: _jsx(Bot, { className: "w-4 h-4 text-white" }) })), _jsxs("div", { children: [_jsx("div", { className: `rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                                : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'}`, children: _jsx("div", { className: "text-sm leading-relaxed", dangerouslySetInnerHTML: { __html: formatMessage(message.content) } }) }), _jsx("div", { className: `text-xs mt-1 ${message.role === 'user' ? 'text-right text-slate-500' : 'text-slate-500'}`, children: message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })] }), message.role === 'user' && (_jsx("div", { className: "bg-cyan-500 p-1.5 rounded-lg flex-shrink-0", children: _jsx("span", { className: "text-white text-xs font-bold", children: "\uD83D\uDC64" }) }))] }) }) }, message.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg", children: _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-2.5", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 text-cyan-400 animate-spin" }), _jsx("span", { className: "text-slate-400 text-sm", children: "L'assistant r\u00E9fl\u00E9chit..." })] }) })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-3 bg-slate-900 border-t border-slate-800", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Posez votre question...", disabled: isLoading, rows: 1, className: "flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none", style: { minHeight: '40px', maxHeight: '100px' } }), _jsx("button", { onClick: handleSendMessage, disabled: !inputMessage.trim() || isLoading, className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: _jsx(Send, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex items-center gap-1 mt-2 text-xs text-slate-500", children: [_jsx(Sparkles, { className: "w-3 h-3" }), _jsx("span", { children: "Propuls\u00E9 par Claude Sonnet 4" })] })] })] }))] }) }));
};
export default EnterpriseChat;
