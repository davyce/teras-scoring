import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/components/user/ScoreImpactSimulator.tsx
/**
 * Simulateur d'Impact sur le Score TERAS
 * Simule l'effet des actions sur le score
 */
import { useState, useEffect } from 'react';
import { Target, TrendingUp, Check, Zap } from 'lucide-react';
import { getUserDashboard } from '../../utils/api-user';
const availableActions = [
    {
        id: 'a1',
        pillar: 'T',
        label: 'Augmenter la fréquence de transactions',
        description: 'Passer à 10 transactions/semaine',
        impact: 12,
        difficulty: 'easy',
        timeframe: '1 mois'
    },
    {
        id: 'a2',
        pillar: 'E',
        label: 'Épargne automatique mensuelle',
        description: 'Mettre en place 50,000 FCFA/mois',
        impact: 18,
        difficulty: 'medium',
        timeframe: '3 mois'
    },
    {
        id: 'a3',
        pillar: 'R',
        label: 'Certifier les revenus',
        description: 'Téléverser justificatifs de revenus',
        impact: 8,
        difficulty: 'easy',
        timeframe: 'Immédiat'
    },
    {
        id: 'a4',
        pillar: 'A',
        label: 'Déclarer un véhicule',
        description: 'Ajouter véhicule avec carte grise',
        impact: 22,
        difficulty: 'easy',
        timeframe: 'Immédiat'
    },
    {
        id: 'a5',
        pillar: 'A',
        label: 'Formaliser un terrain',
        description: 'Document de propriété + attestation',
        impact: 28,
        difficulty: 'hard',
        timeframe: '1-3 mois'
    },
    {
        id: 'a6',
        pillar: 'S',
        label: 'Obtenir 5 recommandations',
        description: 'Demander avis positifs sur ZONE',
        impact: 10,
        difficulty: 'medium',
        timeframe: '2 semaines'
    },
    {
        id: 'a7',
        pillar: 'E',
        label: 'Épargne bloquée 6 mois',
        description: 'Bloquer 200,000 FCFA pendant 6 mois',
        impact: 15,
        difficulty: 'hard',
        timeframe: '6 mois'
    },
    {
        id: 'a8',
        pillar: 'T',
        label: 'Diversifier les canaux',
        description: 'Utiliser wallet + POS + transferts',
        impact: 8,
        difficulty: 'easy',
        timeframe: '2 semaines'
    }
];
export default function ScoreImpactSimulator() {
    const [currentScore, setCurrentScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedActions, setSelectedActions] = useState([]);
    // ✅ CHARGER LE SCORE RÉEL DEPUIS L'API
    useEffect(() => {
        async function loadScore() {
            try {
                const data = await getUserDashboard();
                setCurrentScore(data.score.score);
            }
            catch (error) {
                console.error('Erreur chargement score:', error);
                setCurrentScore(812); // Fallback
            }
            finally {
                setLoading(false);
            }
        }
        loadScore();
    }, []);
    const toggleAction = (actionId) => {
        setSelectedActions(prev => prev.includes(actionId)
            ? prev.filter(id => id !== actionId)
            : [...prev, actionId]);
    };
    // Calculs
    const selectedActionsData = availableActions.filter(a => selectedActions.includes(a.id));
    const totalImpact = selectedActionsData.reduce((sum, a) => sum + a.impact, 0);
    const projectedScore = Math.min(1000, currentScore + totalImpact);
    const improvement = projectedScore - currentScore;
    const getScoreLevel = (score) => {
        if (score >= 900)
            return { level: 'A', label: 'Or', color: '#fbbf24' };
        if (score >= 750)
            return { level: 'B', label: 'Argent', color: '#94a3b8' };
        if (score >= 600)
            return { level: 'C', label: 'Bronze', color: '#fb923c' };
        if (score >= 400)
            return { level: 'D', label: 'Cuivre', color: '#f87171' };
        return { level: 'E', label: 'Fer', color: '#64748b' };
    };
    const currentLevel = getScoreLevel(currentScore);
    const projectedLevel = getScoreLevel(projectedScore);
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-emerald-400';
            case 'medium': return 'text-orange-400';
            case 'hard': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };
    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'Facile';
            case 'medium': return 'Moyen';
            case 'hard': return 'Difficile';
            default: return '';
        }
    };
    const getPillarColor = (pillar) => {
        const colors = {
            'T': '#0ea5e9',
            'E': '#22c55e',
            'R': '#eab308',
            'A': '#f97316',
            'S': '#a855f7'
        };
        return colors[pillar] || '#64748b';
    };
    return (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "p-2 bg-purple-500/20 rounded-lg", children: _jsx(Target, { className: "w-6 h-6 text-purple-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Simulateur d'Impact sur le Score" }), _jsx("p", { className: "text-sm text-slate-400", children: "Visualisez l'effet de vos actions sur votre score TERAS" })] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4 border border-white/10", children: [_jsx("div", { className: "text-sm text-slate-400 mb-2", children: "Score actuel" }), _jsxs("div", { className: "flex items-end gap-3", children: [_jsx("div", { className: "text-3xl font-bold text-white", children: currentScore }), _jsx("div", { className: "px-2 py-1 rounded text-xs font-semibold mb-1", style: { backgroundColor: `${currentLevel.color}20`, color: currentLevel.color }, children: currentLevel.level })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-4 border border-purple-500/30", children: [_jsx("div", { className: "text-sm text-slate-400 mb-2", children: "Am\u00E9lioration potentielle" }), _jsxs("div", { className: "flex items-end gap-2", children: [_jsx(TrendingUp, { className: "w-6 h-6 text-purple-400 mb-1" }), _jsxs("div", { className: "text-3xl font-bold text-purple-400", children: ["+", improvement] }), _jsx("div", { className: "text-sm text-slate-400 mb-1", children: "points" })] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4 border border-white/10", children: [_jsx("div", { className: "text-sm text-slate-400 mb-2", children: "Score projet\u00E9" }), _jsxs("div", { className: "flex items-end gap-3", children: [_jsx("div", { className: "text-3xl font-bold text-white", children: projectedScore }), _jsx("div", { className: "px-2 py-1 rounded text-xs font-semibold mb-1", style: { backgroundColor: `${projectedLevel.color}20`, color: projectedLevel.color }, children: projectedLevel.level })] })] })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-slate-300", children: "Progression vers 1000" }), _jsxs("span", { className: "text-white font-medium", children: [projectedScore, "/1000"] })] }), _jsx("div", { className: "h-3 bg-slate-700/50 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500", style: { width: `${(projectedScore / 1000) * 100}%` } }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Actions disponibles" }), _jsxs("span", { className: "text-sm text-slate-400", children: [selectedActions.length, " s\u00E9lectionn\u00E9e", selectedActions.length > 1 ? 's' : ''] })] }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: availableActions.map((action) => {
                                    const isSelected = selectedActions.includes(action.id);
                                    return (_jsx("button", { onClick: () => toggleAction(action.id), className: `p-4 rounded-lg border text-left transition-all ${isSelected
                                            ? 'bg-purple-500/10 border-purple-500/50'
                                            : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isSelected
                                                        ? 'bg-purple-500 border-purple-500'
                                                        : 'border-slate-600'}`, children: isSelected && _jsx(Check, { className: "w-3 h-3 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-medium text-white", children: action.label }), _jsxs("span", { className: "px-2 py-0.5 rounded text-xs font-semibold", style: {
                                                                                backgroundColor: `${getPillarColor(action.pillar)}20`,
                                                                                color: getPillarColor(action.pillar)
                                                                            }, children: ["Pilier ", action.pillar] })] }), _jsxs("span", { className: "text-lg font-bold text-purple-400 flex-shrink-0", children: ["+", action.impact] })] }), _jsx("p", { className: "text-sm text-slate-400 mb-2", children: action.description }), _jsxs("div", { className: "flex items-center gap-4 text-xs", children: [_jsx("span", { className: getDifficultyColor(action.difficulty), children: getDifficultyLabel(action.difficulty) }), _jsxs("span", { className: "text-slate-500", children: ["\u23F1\uFE0F ", action.timeframe] })] })] })] }) }, action.id));
                                }) })] }), selectedActions.length > 0 && (_jsx("div", { className: "mt-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/30", children: _jsxs("div", { className: "flex items-start gap-3 mb-4", children: [_jsx(Zap, { className: "w-6 h-6 text-purple-400 flex-shrink-0 mt-1" }), _jsxs("div", { children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-2", children: "Plan d'action" }), _jsxs("p", { className: "text-sm text-slate-300 mb-4", children: ["En compl\u00E9tant les ", selectedActions.length, " action", selectedActions.length > 1 ? 's' : '', " s\u00E9lectionn\u00E9e", selectedActions.length > 1 ? 's' : '', ", votre score passera de ", _jsx("strong", { children: currentScore }), " \u00E0 ", _jsx("strong", { className: "text-purple-400", children: projectedScore }), "(+", improvement, " points)."] }), currentLevel.level !== projectedLevel.level && (_jsx("div", { className: "bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4", children: _jsxs("p", { className: "text-sm text-purple-300", children: ["\uD83C\uDF89 Vous passerez du niveau ", _jsx("strong", { children: currentLevel.label }), " au niveau ", _jsx("strong", { children: projectedLevel.label }), " !"] }) })), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-slate-400 font-semibold mb-2", children: "Actions \u00E0 r\u00E9aliser :" }), selectedActionsData.map((action, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-300", children: [_jsxs("span", { className: "text-purple-400", children: [idx + 1, "."] }), _jsx("span", { children: action.label }), _jsxs("span", { className: "text-slate-500", children: ["(", action.timeframe, ")"] })] }, action.id)))] })] })] }) }))] }))] }));
}
