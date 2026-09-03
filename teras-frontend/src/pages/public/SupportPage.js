import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { MessageCircle, Mail, HelpCircle, Clock } from 'lucide-react';
export function SupportPage({ onNavigate }) {
    const faqs = [
        { q: 'Comment est calculé mon score TERAS ?', a: 'Le score est basé sur 5 facteurs principaux...' },
        { q: 'Combien de temps pour obtenir mon score ?', a: 'Votre score est généré instantanément...' },
        { q: 'Puis-je contester mon score ?', a: 'Oui, vous pouvez soumettre une demande de révision...' }
    ];
    return (_jsxs(Hero, { title: "Support & centre d'aide", subtitle: "FAQ, tickets et assistance prioritaire. Notre \u00E9quipe est l\u00E0 pour vous aider.", buttons: _jsxs(Button, { variant: "primary", children: [_jsx(MessageCircle, { className: "w-4 h-4 mr-2 inline" }), "Ouvrir un ticket"] }), showScoreCard: false, children: [_jsx("div", { className: "mt-8 grid grid-cols-3 gap-4 max-w-[900px]", children: [
                    { icon: MessageCircle, title: 'Chat en direct', desc: 'Disponible 9h-18h' },
                    { icon: Mail, title: 'Email', desc: 'support@teras.io' },
                    { icon: Clock, title: 'Temps de réponse', desc: '< 2 heures' }
                ].map((channel, i) => {
                    const Icon = channel.icon;
                    return (_jsxs("div", { className: "p-6 rounded-xl border text-center", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx(Icon, { className: "w-8 h-8 mx-auto mb-3", style: { color: '#9BD2FF' } }), _jsx("h3", { className: "mb-1", style: { color: '#EAF2FF' }, children: channel.title }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: channel.desc })] }, i));
                }) }), _jsxs("div", { className: "mt-8 max-w-[900px]", children: [_jsx("h2", { className: "mb-4", style: { color: '#EAF2FF' }, children: "Questions fr\u00E9quentes" }), _jsx("div", { className: "space-y-3", children: faqs.map((faq, i) => (_jsxs("details", { className: "p-6 rounded-xl border cursor-pointer", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsxs("summary", { className: "flex items-center gap-3", style: { color: '#EAF2FF' }, children: [_jsx(HelpCircle, { className: "w-5 h-5 shrink-0", style: { color: '#9BD2FF' } }), _jsx("span", { children: faq.q })] }), _jsx("p", { className: "mt-3 ml-8 text-[14px]", style: { color: '#9CB5DD' }, children: faq.a })] }, i))) })] })] }));
}
