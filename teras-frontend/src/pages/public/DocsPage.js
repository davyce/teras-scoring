import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { BookOpen, Code, Zap, Shield } from 'lucide-react';
export function DocsPage({ onNavigate }) {
    const sections = [
        { icon: BookOpen, title: 'Guide de démarrage', desc: 'Premiers pas avec l\'API TERAS' },
        { icon: Code, title: 'Référence API', desc: 'Tous les endpoints et paramètres' },
        { icon: Zap, title: 'SDK & Librairies', desc: 'JavaScript, Python, PHP, Ruby' },
        { icon: Shield, title: 'Sécurité', desc: 'Bonnes pratiques et authentification' }
    ];
    return (_jsx(Hero, { title: "Documentation technique", subtitle: "Guides, sch\u00E9mas, webhooks et exemples pour int\u00E9grer TERAS rapidement et en toute s\u00E9curit\u00E9.", buttons: _jsx(Button, { variant: "primary", onClick: () => onNavigate?.('api'), children: "Voir l'API" }), showScoreCard: false, children: _jsx("div", { className: "mt-8 grid grid-cols-2 gap-4 max-w-[800px]", children: sections.map((section, i) => {
                const Icon = section.icon;
                return (_jsxs("div", { className: "p-6 rounded-xl border hover:border-[#9BD2FF] transition-all cursor-pointer", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx(Icon, { className: "w-8 h-8 mb-3", style: { color: '#9BD2FF' } }), _jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: section.title }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: section.desc })] }, i));
            }) }) }));
}
