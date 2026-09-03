// frontend/src/components/user/ScoreImpactSimulator.tsx
/**
 * Simulateur d'Impact sur le Score TERAS
 * Simule l'effet des actions sur le score
 */

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Check, Zap } from 'lucide-react';
import { getUserDashboard } from '../../utils/api-user';

interface Action {
  id: string;
  pillar: 'T' | 'E' | 'R' | 'A' | 'S';
  label: string;
  description: string;
  impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
}

const availableActions: Action[] = [
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
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // ✅ CHARGER LE SCORE RÉEL DEPUIS L'API
  useEffect(() => {
    async function loadScore() {
      try {
        const data = await getUserDashboard();
        setCurrentScore(data.score.score);
      } catch (error) {
        console.error('Erreur chargement score:', error);
        setCurrentScore(812); // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadScore();
  }, []);

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  // Calculs
  const selectedActionsData = availableActions.filter(a => selectedActions.includes(a.id));
  const totalImpact = selectedActionsData.reduce((sum, a) => sum + a.impact, 0);
  const projectedScore = Math.min(1000, currentScore + totalImpact);
  const improvement = projectedScore - currentScore;

  const getScoreLevel = (score: number) => {
    if (score >= 900) return { level: 'A', label: 'Or', color: '#fbbf24' };
    if (score >= 750) return { level: 'B', label: 'Argent', color: '#94a3b8' };
    if (score >= 600) return { level: 'C', label: 'Bronze', color: '#fb923c' };
    if (score >= 400) return { level: 'D', label: 'Cuivre', color: '#f87171' };
    return { level: 'E', label: 'Fer', color: '#64748b' };
  };

  const currentLevel = getScoreLevel(currentScore);
  const projectedLevel = getScoreLevel(projectedScore);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-orange-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return '';
    }
  };

  const getPillarColor = (pillar: string) => {
    const colors: Record<string, string> = {
      'T': '#0ea5e9',
      'E': '#22c55e',
      'R': '#eab308',
      'A': '#f97316',
      'S': '#a855f7'
    };
    return colors[pillar] || '#64748b';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Target className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Simulateur d'Impact sur le Score</h2>
          <p className="text-sm text-slate-400">Visualisez l'effet de vos actions sur votre score TERAS</p>
        </div>
      </div>

      {/* ✅ LOADER */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Score actuel */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
          <div className="text-sm text-slate-400 mb-2">Score actuel</div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-white">{currentScore}</div>
            <div
              className="px-2 py-1 rounded text-xs font-semibold mb-1"
              style={{ backgroundColor: `${currentLevel.color}20`, color: currentLevel.color }}
            >
              {currentLevel.level}
            </div>
          </div>
        </div>

        {/* Amélioration */}
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-4 border border-purple-500/30">
          <div className="text-sm text-slate-400 mb-2">Amélioration potentielle</div>
          <div className="flex items-end gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400 mb-1" />
            <div className="text-3xl font-bold text-purple-400">+{improvement}</div>
            <div className="text-sm text-slate-400 mb-1">points</div>
          </div>
        </div>

        {/* Score projeté */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
          <div className="text-sm text-slate-400 mb-2">Score projeté</div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-white">{projectedScore}</div>
            <div
              className="px-2 py-1 rounded text-xs font-semibold mb-1"
              style={{ backgroundColor: `${projectedLevel.color}20`, color: projectedLevel.color }}
            >
              {projectedLevel.level}
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-300">Progression vers 1000</span>
          <span className="text-white font-medium">{projectedScore}/1000</span>
        </div>
        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(projectedScore / 1000) * 100}%` }}
          />
        </div>
      </div>

      {/* Actions disponibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Actions disponibles</h3>
          <span className="text-sm text-slate-400">
            {selectedActions.length} sélectionnée{selectedActions.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {availableActions.map((action) => {
            const isSelected = selectedActions.includes(action.id);

            return (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-slate-800/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{action.label}</span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: `${getPillarColor(action.pillar)}20`,
                            color: getPillarColor(action.pillar)
                          }}
                        >
                          Pilier {action.pillar}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-purple-400 flex-shrink-0">
                        +{action.impact}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-2">{action.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className={getDifficultyColor(action.difficulty)}>
                        {getDifficultyLabel(action.difficulty)}
                      </span>
                      <span className="text-slate-500">⏱️ {action.timeframe}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Résumé */}
      {selectedActions.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-start gap-3 mb-4">
            <Zap className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Plan d'action</h4>
              <p className="text-sm text-slate-300 mb-4">
                En complétant les {selectedActions.length} action{selectedActions.length > 1 ? 's' : ''} sélectionnée{selectedActions.length > 1 ? 's' : ''}, 
                votre score passera de <strong>{currentScore}</strong> à <strong className="text-purple-400">{projectedScore}</strong> 
                (+{improvement} points).
              </p>

              {currentLevel.level !== projectedLevel.level && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-300">
                    🎉 Vous passerez du niveau <strong>{currentLevel.label}</strong> au niveau <strong>{projectedLevel.label}</strong> !
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-semibold mb-2">Actions à réaliser :</p>
                {selectedActionsData.map((action, idx) => (
                  <div key={action.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-purple-400">{idx + 1}.</span>
                    <span>{action.label}</span>
                    <span className="text-slate-500">({action.timeframe})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  );
}
