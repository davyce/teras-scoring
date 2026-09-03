/**
 * ComputeScore - CALCULATEUR SCORE TERAS
 * ✅ Connecté backend /api/scoring/compute/
 * ✅ Sauvegarde automatique historique
 * ✅ Recommandations IA personnalisées
 */

import { useState, useEffect } from 'react';
import { 
  Calculator, TrendingUp, Lightbulb, Save, RotateCcw, 
  Info, AlertCircle, CheckCircle, ArrowRight,
  Target, Award
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

interface PilierConfig {
  key: 'transactions' | 'epargne' | 'revenus' | 'actifs' | 'social';
  label: string;
  max: number;
  color: string;
  icon: string;
  help: string;
}

const PILIERS: PilierConfig[] = [
  {
    key: 'transactions',
    label: 'Transactions',
    max: 300,
    color: 'sky',
    icon: 'T',
    help: 'Fréquence et régularité de tes opérations (max 300)'
  },
  {
    key: 'epargne',
    label: 'Épargne',
    max: 150,
    color: 'green',
    icon: 'E',
    help: 'Argent mis de côté régulièrement (max 150)'
  },
  {
    key: 'revenus',
    label: 'Revenus',
    max: 200,
    color: 'yellow',
    icon: 'R',
    help: 'Stabilité et montant de tes revenus (max 200)'
  },
  {
    key: 'actifs',
    label: 'Actifs',
    max: 150,
    color: 'orange',
    icon: 'A',
    help: 'Biens que tu possèdes (max 150)'
  },
  {
    key: 'social',
    label: 'Social',
    max: 200,
    color: 'purple',
    icon: 'S',
    help: 'Ta réputation et ancienneté (max 200)'
  }
];

const NIVEAUX = [
  { level: 'A', min: 900, max: 1000, label: 'Or', taux: '5-7%' },
  { level: 'B', min: 750, max: 899, label: 'Argent', taux: '8-10%' },
  { level: 'C', min: 600, max: 749, label: 'Bronze', taux: '10-12%' },
  { level: 'D', min: 400, max: 599, label: 'Cuivre', taux: '12-15%' },
  { level: 'E', min: 0, max: 399, label: 'Fer', taux: '15%+' }
];

export default function ComputeScore() {
  const [piliers, setPiliers] = useState({
    transactions: 150,
    epargne: 75,
    revenus: 100,
    actifs: 75,
    social: 100
  });

  const [scoreCalcule, setScoreCalcule] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [niveau, setNiveau] = useState<any>(null);
  const [scoreActuel, setScoreActuel] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCurrentScore();
  }, []);

  const loadCurrentScore = async () => {
    try {
      const response = await authFetch('/api/scoring/user/dashboard/');
      if (response.ok) {
        const data = await response.json();
        setScoreActuel(data.teras_score?.score || null);
      }
    } catch (err) {
      console.error('Erreur chargement score:', err);
    }
  };

  const scoreTotal = Object.values(piliers).reduce((sum, val) => sum + val, 0);

  const getNiveau = (score: number) => {
    return NIVEAUX.find(n => score >= n.min && score <= n.max) || NIVEAUX[4];
  };

  const calculerScore = async () => {
    setLoading(true);
    setSuccessMessage('');

    try {
      const response = await authFetch('/api/scoring/user/compute/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(piliers)
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      setScoreCalcule(data.score);
      setBreakdown(data.breakdown || {});
      setNiveau(getNiveau(data.score));
      
      // ✅ NOUVEAU - Générer recommandations IA
      await generateAIRecommendations(data.score, data.breakdown);
      
      setShowDetails(true);
      setSuccessMessage('✅ Score calculé et sauvegardé !');
      
    } catch (err) {
      console.error('Erreur calcul:', err);
      alert('Erreur lors du calcul. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU - Générer recommandations avec IA
  const generateAIRecommendations = async (score: number, breakdown: any) => {
    try {
      setRecommendations(['⏳ Génération des recommandations par IA...']);
      
      const response = await authFetch('/api/scoring/user/recommendations/generate-from-simulation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          breakdown,
          piliers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        // Fallback si IA indisponible
        generateRecommendationsFallback(score, breakdown);
      }
    } catch (err) {
      console.error('Erreur génération IA:', err);
      // Fallback
      generateRecommendationsFallback(score, breakdown);
    }
  };

  // Fallback si IA indisponible
  const generateRecommendationsFallback = (score: number, breakdown: any) => {
    const recs: string[] = [];
    if (!breakdown) return;

    const piliersArray = [
      { key: 'T', value: breakdown.T || 0, label: 'Transactions', max: 300 },
      { key: 'E', value: breakdown.E || 0, label: 'Épargne', max: 150 },
      { key: 'R', value: breakdown.R || 0, label: 'Revenus', max: 200 },
      { key: 'A', value: breakdown.A || 0, label: 'Actifs', max: 150 },
      { key: 'S', value: breakdown.S || 0, label: 'Social', max: 200 }
    ];

    const faibles = piliersArray
      .filter(p => (p.value / p.max) < 0.6)
      .sort((a, b) => (a.value / a.max) - (b.value / b.max))
      .slice(0, 2);

    faibles.forEach(p => {
      const gain = Math.round((p.max - p.value) * 0.5);
      switch (p.key) {
        case 'T':
          recs.push(`Transactions : Utilise ZOLA tous les jours pour +${gain} points`);
          break;
        case 'E':
          recs.push(`Épargne : Mets 10,000 FCFA de côté chaque mois pour +${gain} points`);
          break;
        case 'R':
          recs.push(`Revenus : Diversifie tes sources de revenus pour +${gain} points`);
          break;
        case 'A':
          recs.push(`Actifs : Déclare tes biens (moto, terrain) pour +${gain} points`);
          break;
        case 'S':
          recs.push(`Social : Améliore ta réputation sur ZONE pour +${gain} points`);
          break;
      }
    });

    if (score < 750) {
      const prochain = getNiveau(score + 50);
      recs.push(`Objectif : Atteindre ${prochain.label} (${prochain.min}+) pour meilleurs taux`);
    }

    setRecommendations(recs);
  };

  const reinitialiser = () => {
    setPiliers({
      transactions: 150,
      epargne: 75,
      revenus: 100,
      actifs: 75,
      social: 100
    });
    setScoreCalcule(null);
    setBreakdown(null);
    setNiveau(null);
    setRecommendations([]);
    setShowDetails(false);
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-sky-400" />
              Calculer mon Score
            </h1>
            <p className="text-slate-400 mt-2">
              Ajuste les piliers TERAS pour simuler ton score
            </p>
          </div>

          {scoreActuel && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-6 py-3">
              <div className="text-xs text-slate-400">Score actuel</div>
              <div className="text-2xl font-bold text-white">{scoreActuel}</div>
              <div className="text-xs text-slate-400">{getNiveau(scoreActuel).label}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-sky-300">
                <p className="font-medium mb-1">Comment ça marche ?</p>
                <p className="text-sky-300/80">
                  Ajuste les curseurs pour simuler différents scénarios. Le score maximum est de 1000 points.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-white/10 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                Ajuster les piliers
              </h2>

              {PILIERS.map((pilier) => (
                <div key={pilier.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${pilier.color}-500/20 border border-${pilier.color}-500/30 flex items-center justify-center`}>
                        <span className={`text-${pilier.color}-400 font-bold`}>{pilier.icon}</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{pilier.label}</div>
                        <div className="text-xs text-slate-500">{pilier.help}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {piliers[pilier.key]}
                      </div>
                      <div className="text-xs text-slate-500">/ {pilier.max}</div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={pilier.max}
                    value={piliers[pilier.key]}
                    onChange={(e) => setPiliers(prev => ({
                      ...prev,
                      [pilier.key]: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={calculerScore}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calcul...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Calculer
                  </>
                )}
              </button>

              <button
                onClick={reinitialiser}
                className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="space-y-4">
            
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-80 mb-2">Score simulé</div>
              <div className="text-5xl font-bold mb-4">{scoreTotal}</div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                  {getNiveau(scoreTotal).label}
                </div>
                <div className="text-sm opacity-80">
                  Taux: {getNiveau(scoreTotal).taux}
                </div>
              </div>
            </div>

            {scoreCalcule !== null && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Score calculé
                  </h3>
                  {scoreActuel && (
                    <div className="text-sm">
                      {scoreCalcule > scoreActuel ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          +{scoreCalcule - scoreActuel}
                        </span>
                      ) : scoreCalcule < scoreActuel ? (
                        <span className="text-red-400">
                          {scoreCalcule - scoreActuel}
                        </span>
                      ) : (
                        <span className="text-slate-400">=</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-4xl font-bold text-white">{scoreCalcule}</div>
                
                {niveau && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">Niveau {niveau.label}</span>
                    <span className="text-slate-400">• Taux {niveau.taux}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1">
                  {showDetails ? 'Masquer' : 'Voir'} détails
                  <ArrowRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </button>

                {showDetails && breakdown && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-sm text-slate-400 font-medium">Détail par pilier :</div>
                    {Object.entries(breakdown).map(([key, value]: [string, any]) => {
                      const pilier = PILIERS.find(p => p.icon === key);
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{pilier?.label || key}</span>
                          <span className="font-mono text-white">{Math.round(value)}/{pilier?.max}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Recommandations
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-yellow-200/90 flex gap-2">
                      <Target className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-2 animate-in fade-in duration-200">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300">{successMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #38bdf8;
          cursor: pointer;
          border: 3px solid #0b1220;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #38bdf8;
          cursor: pointer;
          border: 3px solid #0b1220;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
        }
      `}</style>
    </div>
  );
}
