import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Shield, Eye, Lock, Database } from 'lucide-react';
export function PrivacyPage({ onNavigate }) {
    return (_jsx(Hero, { title: "Politique de confidentialit\u00E9", subtitle: "Vos donn\u00E9es, vos r\u00E8gles. Transparence totale sur la collecte, l'utilisation et la protection de vos informations.", showScoreCard: false, children: _jsxs("div", { className: "mt-8 max-w-[900px] space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 gap-4", children: [
                        { icon: Database, title: 'Données collectées', desc: 'Informations financières nécessaires au calcul du score' },
                        { icon: Shield, title: 'Protection', desc: 'Chiffrement et sécurité de niveau bancaire' },
                        { icon: Eye, title: 'Transparence', desc: 'Accès complet à toutes vos données' },
                        { icon: Lock, title: 'Vos droits', desc: 'Accès, rectification, suppression à tout moment' }
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (_jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx(Icon, { className: "w-6 h-6 mb-3", style: { color: '#9BD2FF' } }), _jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: item.title }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: item.desc })] }, i));
                    }) }), _jsxs("div", { className: "p-8 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx("h2", { className: "mb-4", style: { color: '#EAF2FF' }, children: "Finalit\u00E9s du traitement" }), _jsx("ul", { className: "space-y-2", children: [
                                'Calcul et mise à jour de votre score TERAS',
                                'Amélioration de nos services',
                                'Communication et support client',
                                'Conformité réglementaire'
                            ].map((item, i) => (_jsxs("li", { className: "flex items-start gap-2 text-[15px]", style: { color: '#C8D5EE' }, children: [_jsx("span", { style: { color: '#9BD2FF' }, children: "\u2022" }), _jsx("span", { children: item })] }, i))) })] }), _jsxs("div", { className: "p-8 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx("h2", { className: "mb-4", style: { color: '#EAF2FF' }, children: "Dur\u00E9e de conservation" }), _jsx("p", { className: "text-[15px] leading-relaxed", style: { color: '#C8D5EE' }, children: "Vos donn\u00E9es sont conserv\u00E9es pendant toute la dur\u00E9e de votre utilisation du service, plus 5 ans pour des raisons l\u00E9gales. Vous pouvez demander la suppression de vos donn\u00E9es \u00E0 tout moment." })] }), _jsxs("div", { className: "p-8 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx("h2", { className: "mb-4", style: { color: '#EAF2FF' }, children: "Contact DPO" }), _jsxs("p", { className: "text-[15px]", style: { color: '#C8D5EE' }, children: ["Pour toute question sur vos donn\u00E9es : ", _jsx("a", { href: "mailto:dpo@teras.io", className: "underline hover:no-underline", style: { color: '#9BD2FF' }, children: "dpo@teras.io" })] })] })] }) }));
}
