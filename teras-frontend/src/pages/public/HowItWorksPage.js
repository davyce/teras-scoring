import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
export function HowItWorksPage({ onNavigate }) {
    return (_jsx(Hero, { title: "Comment fonctionne le score TERAS", subtitle: "Transferts, \u00C9pargne, Revenus, Actifs & Social \u2014 tout est pond\u00E9r\u00E9 pour vous offrir un score pr\u00E9cis et \u00E9quitable.", buttons: _jsx(Button, { variant: "primary", onClick: () => onNavigate?.('register'), children: "Commencer" }), showScoreCard: false, children: _jsx("div", { className: "grid grid-cols-2 gap-6 mt-8 max-w-[700px]", children: [
                { letter: 'T', title: 'Transferts', desc: 'Analyse de vos transactions régulières' },
                { letter: 'E', title: 'Épargne', desc: 'Capacité d\'épargne et stabilité' },
                { letter: 'R', title: 'Revenus', desc: 'Sources et régularité des revenus' },
                { letter: 'A', title: 'Actifs', desc: 'Patrimoine et actifs financiers' },
                { letter: 'S', title: 'Social', desc: 'Réputation et réseau professionnel' }
            ].map((item, i) => (_jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-lg flex items-center justify-center text-[20px]", style: { backgroundColor: '#9BD2FF', color: '#0B1220', fontWeight: '700' }, children: item.letter }), _jsx("h3", { style: { color: '#EAF2FF' }, children: item.title })] }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: item.desc })] }, i))) }) }));
}
