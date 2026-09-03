import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/user/AIAssistantButton.tsx
/**
 * Bouton flottant pour ouvrir l'assistant IA
 */
import { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import UserAIAssistant from './UserAIAssistant';
const AIAssistantButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [!isOpen && (_jsxs("button", { onClick: () => setIsOpen(true), className: "fixed right-6 bottom-6 z-40 group", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" }), _jsxs("div", { className: "relative w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform", children: [_jsx(MessageCircle, { className: "w-7 h-7 text-white" }), _jsx("div", { className: "absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-slate-900 flex items-center justify-center", children: _jsx(Sparkles, { className: "w-3 h-3 text-white" }) })] })] })), _jsx(UserAIAssistant, { isOpen: isOpen, onClose: () => setIsOpen(false) })] }));
};
export default AIAssistantButton;
