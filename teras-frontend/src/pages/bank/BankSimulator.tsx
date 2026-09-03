import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  Download,
  BarChart3,
} from 'lucide-react';

interface SimulationResult {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  effectiveRate: number;
  amortizationSchedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }[];
}

export default function BankSimulator() {
  const [productType, setProductType] = useState('personal_credit');
  const [amount, setAmount] = useState(1000000);
  const [duration, setDuration] = useState(12);
  const [clientScore, setClientScore] = useState(720);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const productTypes = [
    { value: 'personal_credit', label: 'Crédit Personnel', minScore: 650, maxAmount: 2000000, rateMin: 12, rateMax: 18 },
    { value: 'auto_credit', label: 'Crédit Auto', minScore: 720, maxAmount: 5000000, rateMin: 10, rateMax: 14 },
    { value: 'housing_credit', label: 'Crédit Immobilier', minScore: 750, maxAmount: 15000000, rateMin: 8, rateMax: 12 },
    { value: 'business_credit', label: 'Crédit PME', minScore: 700, maxAmount: 10000000, rateMin: 11, rateMax: 16 },
    { value: 'equipment_credit', label: 'Crédit Équipement', minScore: 680, maxAmount: 8000000, rateMin: 12, rateMax: 17 },
  ];

  const selectedProduct = productTypes.find((p) => p.value === productType)!;

  const calculateInterestRate = (score: number): number => {
    const { rateMin, rateMax, minScore } = selectedProduct;

    if (score < minScore) return rateMax;
    if (score >= 900) return rateMin;

    // Linear interpolation
    const scoreDiff = 900 - minScore;
    const rateDiff = rateMax - rateMin;
    const adjustedScore = score - minScore;

    return rateMax - (adjustedScore / scoreDiff) * rateDiff;
  };

  const calculateSimulation = () => {
    const annualRate = calculateInterestRate(clientScore);
    const monthlyRate = annualRate / 100 / 12;

    // Monthly payment calculation (PMT formula)
    const monthlyPayment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
      (Math.pow(1 + monthlyRate, duration) - 1);

    const totalCost = monthlyPayment * duration;
    const totalInterest = totalCost - amount;

    // Amortization schedule
    const amortizationSchedule = [];
    let remainingBalance = amount;

    for (let month = 1; month <= duration; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      amortizationSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
    }

    setResult({
      monthlyPayment,
      totalCost,
      totalInterest,
      effectiveRate: annualRate,
      amortizationSchedule,
    });
  };

  useEffect(() => {
    calculateSimulation();
  }, [productType, amount, duration, clientScore]);

  const isEligible = clientScore >= selectedProduct.minScore;
  const currentRate = calculateInterestRate(clientScore);
  const bestRate = selectedProduct.rateMin;
  const potentialSavings = result
    ? ((currentRate - bestRate) / 100 / 12) * amount * duration
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Simulateur de Crédit</h1>
        <p className="text-slate-400 mt-1">
          Estimez vos mensualités et coûts en temps réel
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eligibility Check */}
          {!isEligible && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-2">
                    Score insuffisant
                  </h3>
                  <p className="text-red-300/80 text-sm">
                    Le score TERAS minimum requis pour ce produit est{' '}
                    <strong>{selectedProduct.minScore}</strong>. Score actuel:{' '}
                    <strong>{clientScore}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Form */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Paramètres de Simulation
            </h2>

            <div className="space-y-6">
              {/* Product Type */}
              <div>
                <label className="block text-slate-300 font-medium mb-3">
                  Type de Crédit
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                >
                  {productTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} (Score min: {type.minScore})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">
                    Montant du Crédit
                  </label>
                  <span className="text-white font-bold text-lg">
                    {amount.toLocaleString()} CFA
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max={selectedProduct.maxAmount}
                  step="100000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      ((amount - 100000) /
                        (selectedProduct.maxAmount - 100000)) *
                      100
                    }%, #334155 ${
                      ((amount - 100000) /
                        (selectedProduct.maxAmount - 100000)) *
                      100
                    }%, #334155 100%)`,
                  }}
                />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>100K CFA</span>
                  <span>
                    {(selectedProduct.maxAmount / 1000000).toFixed(1)}M CFA
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">Durée</label>
                  <span className="text-white font-bold text-lg">
                    {duration} mois
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="3"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                      ((duration - 3) / (60 - 3)) * 100
                    }%, #334155 ${((duration - 3) / (60 - 3)) * 100}%, #334155 100%)`,
                  }}
                />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>3 mois</span>
                  <span>60 mois</span>
                </div>
              </div>

              {/* Client Score */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">
                    Score TERAS Client
                  </label>
                  <span className="text-white font-bold text-lg">
                    {clientScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1000"
                  step="10"
                  value={clientScore}
                  onChange={(e) => setClientScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                      ((clientScore - 300) / (1000 - 300)) * 100
                    }%, #334155 ${
                      ((clientScore - 300) / (1000 - 300)) * 100
                    }%, #334155 100%)`,
                  }}
                />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>300</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateSimulation}
                disabled={!isEligible}
                className={`w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isEligible
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Calculator className="w-5 h-5" />
                Recalculer
              </button>
            </div>
          </div>

          {/* Amortization Table */}
          {result && isEligible && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Tableau d'Amortissement
                </h2>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Exporter PDF
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">
                        Mois
                      </th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">
                        Mensualité
                      </th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">
                        Capital
                      </th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">
                        Intérêts
                      </th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">
                        Restant Dû
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {result.amortizationSchedule.map((row) => (
                      <tr
                        key={row.month}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {row.month}
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {row.payment.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">
                          {row.principal.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-400">
                          {row.interest.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {row.remainingBalance.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Results (1/3) */}
        <div className="space-y-6">
          {/* Monthly Payment */}
          {result && isEligible && (
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Mensualité</p>
              <p className="text-4xl font-bold text-white mb-1">
                {result.monthlyPayment.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-blue-400 text-sm">CFA / mois</p>
            </div>
          )}

          {/* Summary */}
          {result && isEligible && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Résumé</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Taux effectif</span>
                  <span className="text-white font-semibold">
                    {result.effectiveRate.toFixed(2)}% /an
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Coût total</span>
                  <span className="text-white font-semibold">
                    {result.totalCost.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    CFA
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Dont intérêts</span>
                  <span className="text-amber-400 font-semibold">
                    {result.totalInterest.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    CFA
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">
                      Ratio intérêts/capital
                    </span>
                    <span className="text-white font-semibold">
                      {((result.totalInterest / amount) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {result && isEligible && (
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold">Recommandations IA</h3>
              </div>

              <div className="space-y-3">
                {clientScore < 900 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-purple-300 text-sm mb-2">
                      💡 Amélioration possible
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Un score de <strong>900+</strong> permettrait un taux de{' '}
                      <strong>{bestRate}%</strong> au lieu de{' '}
                      <strong>{currentRate.toFixed(2)}%</strong>
                    </p>
                    <p className="text-green-400 text-xs mt-2">
                      Économie potentielle:{' '}
                      <strong>
                        {potentialSavings.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{' '}
                        CFA
                      </strong>
                    </p>
                  </div>
                )}

                {duration > 24 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-blue-300 text-sm mb-2">
                      ⚡ Optimisation durée
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Réduire la durée à <strong>24 mois</strong> diminuerait les
                      intérêts de{' '}
                      <strong>
                        {(
                          result.totalInterest -
                          (amount *
                            (currentRate / 100 / 12) *
                            Math.pow(1 + currentRate / 100 / 12, 24)) /
                            (Math.pow(1 + currentRate / 100 / 12, 24) - 1)
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                        CFA
                      </strong>
                    </p>
                  </div>
                )}

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-amber-300 text-sm mb-2">
                    📊 Capacité de remboursement
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Mensualité recommandée ≤ <strong>30%</strong> des revenus.
                    Pour cette mensualité, revenus min:{' '}
                    <strong>
                      {((result.monthlyPayment / 0.3) * 1).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 }
                      )}{' '}
                      CFA/mois
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Info */}
          {!isEligible && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">
                Comment devenir éligible ?
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">
                    Améliorez votre score TERAS en maintenant une épargne régulière
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">
                    Diversifiez vos canaux de transactions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">
                    Déclarez vos actifs pour augmenter votre score
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}