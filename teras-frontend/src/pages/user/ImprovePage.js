import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/user/ImprovePage.tsx
import { CheckSquare, TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
export default function ImprovePage({ onNavigate }) {
    const actions = [
        { icon: CheckSquare, title: 'Compléter votre profil', points: '+15 pts', priority: 'high' },
        { icon: DollarSign, title: 'Ajouter vos relevés bancaires', points: '+25 pts', priority: 'high' },
        { icon: FileText, title: 'Uploader vos justificatifs de revenus', points: '+20 pts', priority: 'medium' },
        { icon: Users, title: 'Connecter votre réseau professionnel', points: '+10 pts', priority: 'low' },
        { icon: TrendingUp, title: 'Maintenir une épargne régulière', points: '+30 pts', priority: 'medium' }
    ];
    const priorityColors = {
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#9CB5DD'
    };
    const priorityLabels = {
        high: 'Priorité haute',
        medium: 'Priorité moyenne',
        low: 'Priorité basse'
    };
    return (_jsx("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "Actions recommand\u00E9es" }), _jsx("p", { className: "text-slate-400", children: "Conseils personnalis\u00E9s pour gagner des points rapidement et am\u00E9liorer votre score TERAS." })] }), _jsx("div", { className: "space-y-4", children: actions.map((action, i) => {
                        const Icon = action.icon;
                        return (_jsxs("div", { className: "p-6 rounded-xl border border-[#223556] bg-[#0F172A] flex items-center justify-between hover:border-[#9BD2FF] transition-all cursor-pointer", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-lg flex items-center justify-center bg-[#121A2C]", children: _jsx(Icon, { className: "w-6 h-6 text-[#9BD2FF]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "mb-1 text-[#EAF2FF] font-medium", children: action.title }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm text-[#4ADE80] font-semibold", children: action.points }), _jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-white/5", style: {
                                                                color: priorityColors[action.priority]
                                                            }, children: priorityLabels[action.priority] })] })] })] }), _jsx("button", { className: "px-4 py-2 rounded-lg bg-[#9BD2FF] text-[#0B1220] font-medium hover:bg-[#7ec5f5] transition-colors", onClick: () => onNavigate?.(action.title), children: "Commencer" })] }, i));
                    }) }), _jsxs("div", { className: "mt-8 p-6 rounded-xl border border-sky-500/30 bg-sky-500/10", children: [_jsx("h3", { className: "text-lg font-semibold text-sky-300 mb-2", children: "\uD83D\uDCA1 Astuce" }), _jsx("p", { className: "text-sm text-slate-300", children: "Concentrez-vous d'abord sur les actions \u00E0 haute priorit\u00E9 pour maximiser l'impact sur votre score TERAS. Chaque action compl\u00E9t\u00E9e am\u00E9liore votre profil et augmente vos chances d'obtenir de meilleures conditions de cr\u00E9dit." })] })] }) }));
}
