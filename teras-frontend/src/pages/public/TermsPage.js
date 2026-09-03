import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { FileText, Scale, AlertCircle } from 'lucide-react';
export function TermsPage({ onNavigate }) {
    return (_jsx(Hero, { title: "Conditions g\u00E9n\u00E9rales d'utilisation", subtitle: "Cadre d'utilisation du service TERAS. Droits, obligations et responsabilit\u00E9s.", showScoreCard: false, children: _jsxs("div", { className: "mt-8 max-w-[900px] space-y-6", children: [_jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                        { icon: FileText, title: 'Licence', desc: 'Droit d\'utilisation non exclusif' },
                        { icon: Scale, title: 'Juridiction', desc: 'Tribunaux compétents' },
                        { icon: AlertCircle, title: 'Responsabilité', desc: 'Limites et exclusions' }
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (_jsxs("div", { className: "p-6 rounded-xl border text-center", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx(Icon, { className: "w-8 h-8 mx-auto mb-3", style: { color: '#9BD2FF' } }), _jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: item.title }), _jsx("p", { className: "text-[14px]", style: { color: '#9CB5DD' }, children: item.desc })] }, i));
                    }) }), [
                    {
                        title: '1. Objet',
                        content: 'Les présentes conditions générales ont pour objet de définir les modalités et conditions d\'utilisation du service TERAS.'
                    },
                    {
                        title: '2. Accès au service',
                        content: 'L\'accès au service est réservé aux personnes physiques et morales capables juridiquement. L\'utilisateur garantit l\'exactitude des informations fournies.'
                    },
                    {
                        title: '3. Utilisation du score',
                        content: 'Le score TERAS est fourni à titre informatif. Il ne constitue pas une garantie d\'obtention de crédit. Chaque établissement de crédit reste seul décisionnaire.'
                    },
                    {
                        title: '4. Propriété intellectuelle',
                        content: 'TERAS et tous ses éléments (marques, logos, algorithmes) sont protégés par le droit de la propriété intellectuelle.'
                    },
                    {
                        title: '5. Résiliation',
                        content: 'L\'utilisateur peut résilier son compte à tout moment. TERAS se réserve le droit de suspendre ou résilier l\'accès en cas de violation des CGU.'
                    }
                ].map((section, i) => (_jsxs("div", { className: "p-8 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx("h2", { className: "mb-3", style: { color: '#EAF2FF' }, children: section.title }), _jsx("p", { className: "text-[15px] leading-relaxed", style: { color: '#C8D5EE' }, children: section.content })] }, i))), _jsx("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'rgba(155, 210, 255, 0.05)', borderColor: '#9BD2FF' }, children: _jsxs("p", { className: "text-[14px]", style: { color: '#C8D5EE' }, children: [_jsx("strong", { style: { color: '#EAF2FF' }, children: "Derni\u00E8re mise \u00E0 jour :" }), " 23 octobre 2025"] }) })] }) }));
}
