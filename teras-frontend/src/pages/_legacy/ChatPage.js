import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Send, Sparkles, TrendingUp, FileText, Bot, User, Lightbulb } from 'lucide-react';
export function ChatPage({ onNavigate }) {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: "Bonjour ! Je suis votre assistant TERAS IA. Comment puis-je vous aider aujourd'hui ?"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const quickActions = [
        { label: 'Analyser mon score', icon: TrendingUp, prompt: 'Analyser mon score' },
        { label: 'Comment améliorer', icon: Lightbulb, prompt: 'Comment améliorer mon score ?' },
        { label: 'Documents manquants', icon: FileText, prompt: 'Quels documents manquent ?' }
    ];
    useEffect(() => {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [messages]);
    const handleSendMessage = (content) => {
        const messageContent = content || inputValue.trim();
        if (!messageContent)
            return;
        setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: messageContent
            }]);
        setInputValue('');
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Votre score TERAS de 765 est excellent ! Continuez vos bons comportements financiers."
                }]);
            setIsTyping(false);
        }, 1500);
    };
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: '#0B1220' }, children: [_jsx("div", { className: "border-b", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: _jsx("div", { className: "max-w-[1400px] mx-auto px-6 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-xl", style: { backgroundColor: '#223556' }, children: _jsx(Sparkles, { className: "w-6 h-6", style: { color: '#9BD2FF' } }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-[24px] mb-1", style: { color: '#EAF2FF', fontWeight: '700' }, children: "Assistant TERAS IA" }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: "Conseils personnalis\u00E9s pour am\u00E9liorer votre score" })] })] }), _jsx(Button, { variant: "secondary", onClick: () => onNavigate?.('dashboard'), children: "Retour au dashboard" })] }) }) }), _jsx("div", { className: "max-w-[1200px] mx-auto px-6 py-8", children: _jsxs("div", { className: "rounded-xl border flex flex-col", style: { backgroundColor: '#0F172A', borderColor: '#223556', height: 'calc(100vh - 280px)' }, children: [_jsx("div", { id: "chat-messages", className: "flex-1 p-6 overflow-y-auto", children: _jsxs("div", { className: "space-y-6", children: [messages.map((message) => (_jsxs("div", { className: `flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`, children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0", style: {
                                                    backgroundColor: message.role === 'assistant' ? '#223556' : '#9BD2FF15',
                                                    border: `2px solid ${message.role === 'assistant' ? '#9BD2FF' : '#9BD2FF50'}`
                                                }, children: message.role === 'assistant' ? (_jsx(Bot, { className: "w-5 h-5", style: { color: '#9BD2FF' } })) : (_jsx(User, { className: "w-5 h-5", style: { color: '#9BD2FF' } })) }), _jsx("div", { className: "p-4 rounded-xl max-w-[70%]", style: {
                                                    backgroundColor: message.role === 'assistant' ? '#223556' : '#9BD2FF15',
                                                    border: `1px solid ${message.role === 'assistant' ? '#9BD2FF30' : '#9BD2FF50'}`
                                                }, children: _jsx("p", { className: "text-[15px]", style: { color: '#EAF2FF' }, children: message.content }) })] }, message.id))), isTyping && (_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-full", style: { backgroundColor: '#223556', border: '2px solid #9BD2FF' }, children: _jsx(Bot, { className: "w-5 h-5", style: { color: '#9BD2FF' } }) }), _jsx("div", { className: "p-4 rounded-xl", style: { backgroundColor: '#223556', border: '1px solid #9BD2FF30' }, children: _jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-2 h-2 rounded-full animate-bounce", style: { backgroundColor: '#9BD2FF' } }), _jsx("div", { className: "w-2 h-2 rounded-full animate-bounce", style: { backgroundColor: '#9BD2FF', animationDelay: '150ms' } }), _jsx("div", { className: "w-2 h-2 rounded-full animate-bounce", style: { backgroundColor: '#9BD2FF', animationDelay: '300ms' } })] }) })] }))] }) }), _jsxs("div", { className: "px-6 py-4 border-t", style: { borderColor: '#223556' }, children: [_jsx("div", { className: "flex gap-2 overflow-x-auto pb-2 mb-4", children: quickActions.map((action, i) => {
                                        const IconComponent = action.icon;
                                        return (_jsxs("button", { className: "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] whitespace-nowrap hover:opacity-80 transition-opacity", style: { backgroundColor: '#223556', color: '#9BD2FF', border: '1px solid #9BD2FF30' }, onClick: () => handleSendMessage(action.prompt), children: [_jsx(IconComponent, { className: "w-4 h-4" }), action.label] }, i));
                                    }) }), _jsx("div", { className: "flex gap-3", children: _jsxs("div", { className: "flex-1 relative", children: [_jsx("textarea", { value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }, placeholder: "Posez votre question sur votre score TERAS...", className: "w-full min-h-[56px] max-h-[120px] resize-none pr-12 p-4 rounded-xl border outline-none", style: {
                                                    backgroundColor: '#223556',
                                                    borderColor: '#9BD2FF30',
                                                    color: '#EAF2FF'
                                                } }), _jsx("button", { className: "absolute right-3 bottom-3 p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40", style: { backgroundColor: '#9BD2FF', color: '#0B1220' }, onClick: () => handleSendMessage(), disabled: !inputValue.trim() || isTyping, children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] })] }) })] }));
}
