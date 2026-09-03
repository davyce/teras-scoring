import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { Building2, Link as LinkIcon, Globe } from 'lucide-react';
export function PartnersPage({ onNavigate }) {
    const partners = [
        { name: 'ZOLA', type: 'Plateforme financière', status: 'Intégré' },
        { name: 'SFEC', type: 'Institution de crédit', status: 'Intégré' },
        { name: 'Banques locales', type: 'Réseau bancaire', status: 'Disponible' },
        { name: 'Agrégateurs', type: 'Services de données', status: 'En cours' }
    ];
    return (_jsxs(Hero, { title: "Partenaires & banques", subtitle: "Connectez vos comptes et \u00E9tablissements en un clic. R\u00E9seau \u00E9tendu de partenaires financiers.", buttons: _jsx(Button, { variant: "primary", children: "Devenir partenaire" }), showScoreCard: false, children: [_jsx("div", { className: "mt-8 grid grid-cols-2 gap-4 max-w-[800px]", children: partners.map((partner, i) => (_jsxs("div", { className: "p-6 rounded-xl border flex items-center justify-between", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-lg flex items-center justify-center", style: { backgroundColor: '#121A2C' }, children: _jsx(Building2, { className: "w-6 h-6", style: { color: '#9BD2FF' } }) }), _jsxs("div", { children: [_jsx("h3", { className: "mb-0.5", style: { color: '#EAF2FF' }, children: partner.name }), _jsx("p", { className: "text-[13px]", style: { color: '#9CB5DD' }, children: partner.type })] })] }), _jsx("span", { className: "text-[12px] px-3 py-1 rounded-full", style: {
                                backgroundColor: partner.status === 'Intégré' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(155, 210, 255, 0.1)',
                                color: partner.status === 'Intégré' ? '#4ADE80' : '#9BD2FF'
                            }, children: partner.status })] }, i))) }), _jsx("div", { className: "mt-8 flex gap-8 max-w-[800px]", children: [
                    { icon: LinkIcon, value: '50+', label: 'Partenaires actifs' },
                    { icon: Globe, value: '15', label: 'Pays couverts' }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "w-6 h-6", style: { color: '#9BD2FF' } }), _jsxs("div", { children: [_jsx("div", { className: "text-[32px]", style: { color: '#EAF2FF', fontWeight: '700' }, children: stat.value }), _jsx("p", { className: "text-[13px]", style: { color: '#9CB5DD' }, children: stat.label })] })] }, i));
                }) })] }));
}
