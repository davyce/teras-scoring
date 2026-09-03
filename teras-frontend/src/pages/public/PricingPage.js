import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { Check } from 'lucide-react';
export function PricingPage({ onNavigate }) {
    const plans = [
        {
            name: 'Basic',
            price: 'Gratuit',
            features: [
                'Score TERAS personnel',
                'Mise à jour mensuelle',
                'Historique 6 mois',
                'Support email',
                'Conseils de base'
            ]
        },
        {
            name: 'Entreprise',
            price: 'Sur devis',
            features: [
                'Score TERAS Entreprise',
                'Mise à jour en temps réel',
                'Historique illimité',
                'Support prioritaire 24/7',
                'API & Intégrations',
                'Tableau de bord avancé',
                'Analyse prédictive',
                'Accompagnement dédié'
            ],
            highlighted: true
        }
    ];
    return (_jsx(Hero, { title: "Tarifs simples et transparents", subtitle: "Commencez gratuitement avec TERAS Basic. Passez \u00E0 Entreprise pour des fonctionnalit\u00E9s avanc\u00E9es.", showScoreCard: false, children: _jsx("div", { className: "mt-8 grid grid-cols-2 gap-6 max-w-[900px]", children: plans.map((plan, i) => (_jsxs("div", { className: "p-8 rounded-2xl border", style: {
                    backgroundColor: plan.highlighted ? '#0F172A' : '#0B1220',
                    borderColor: plan.highlighted ? '#9BD2FF' : '#223556',
                    borderWidth: plan.highlighted ? '2px' : '1px'
                }, children: [_jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: plan.name }), _jsx("div", { className: "mb-6", children: _jsx("span", { className: "text-[40px]", style: { color: '#9BD2FF', fontWeight: '700' }, children: plan.price }) }), _jsx("ul", { className: "space-y-3 mb-8", children: plan.features.map((feature, j) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(Check, { className: "w-5 h-5 shrink-0 mt-0.5", style: { color: '#4ADE80' } }), _jsx("span", { className: "text-[14px]", style: { color: '#C8D5EE' }, children: feature })] }, j))) }), _jsx(Button, { variant: plan.highlighted ? 'primary' : 'secondary', className: "w-full", onClick: () => onNavigate?.(plan.highlighted ? 'contact' : 'register'), children: plan.highlighted ? 'Contacter les ventes' : 'Commencer gratuitement' })] }, i))) }) }));
}
