import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Calendar, User, ArrowRight } from 'lucide-react';
export function BlogPage({ onNavigate }) {
    const articles = [
        {
            title: 'Comment améliorer votre score en 30 jours',
            date: '15 Oct 2025',
            author: 'Marie Dupont',
            category: 'Conseils'
        },
        {
            title: 'TERAS Entreprise : Nouveautés du mois',
            date: '10 Oct 2025',
            author: 'Jean Martin',
            category: 'Produit'
        },
        {
            title: 'Tendances du crédit en Afrique francophone',
            date: '5 Oct 2025',
            author: 'Sophie Laurent',
            category: 'Analyses'
        }
    ];
    return (_jsxs(Hero, { title: "Analyses & actualit\u00E9s", subtitle: "Tendances cr\u00E9dit, guides pratiques, mises \u00E0 jour produit et insights du march\u00E9.", showScoreCard: false, children: [_jsx("div", { className: "mt-8 space-y-4 max-w-[900px]", children: articles.map((article, i) => (_jsx("div", { className: "p-6 rounded-xl border hover:border-[#9BD2FF] transition-all cursor-pointer group", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-[12px] px-2 py-1 rounded mb-2 inline-block", style: { backgroundColor: 'rgba(155, 210, 255, 0.1)', color: '#9BD2FF' }, children: article.category }), _jsx("h3", { className: "mb-2 group-hover:text-[#9BD2FF] transition-colors", style: { color: '#EAF2FF' }, children: article.title }), _jsxs("div", { className: "flex items-center gap-4 text-[13px]", style: { color: '#9CB5DD' }, children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: article.date })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: article.author })] })] })] }), _jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform", style: { color: '#9BD2FF' } })] }) }, i))) }), _jsx("div", { className: "mt-8 flex justify-center", children: _jsx("button", { className: "px-6 py-3 rounded-xl border hover:border-[#9BD2FF] transition-all", style: { backgroundColor: '#0F172A', borderColor: '#223556', color: '#C8D5EE' }, children: "Voir tous les articles" }) })] }));
}
