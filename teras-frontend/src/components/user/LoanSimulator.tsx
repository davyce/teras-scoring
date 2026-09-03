// frontend/src/components/user/LoanSimulator.tsx
/**
 * Simulateur de Crédit Interactif
 * Calcule la mensualité et affiche des scénarios alternatifs
 */

import React, { useState } from 'react';
import { Calculator, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

interface SimulationResult {
  is_feasible: boolean;
  amount: number;
  duration: number;
  monthly_payment: number;
  total_cost: number;
  total_interest: number;
  interest_rate: string;
  score_level: string;
  score_value: number;
  crm_available: number;
  crm_used: number;
  crm_used_percent: number;
  max_loan_for_duration: number;
  avg_income: number;
  alternative_scenarios: Array<{
    label: string;
    duration: number;
    amount: number;
    monthly_payment: number;
    total_cost: number;
    is_feasible: boolean;
  }>;
  warnings: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

export default function LoanSimulator() {
  const [amount, setAmount] = useState<number>(500000);
  const [duration, setDuration] = useState<number>(12);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    setIsLoading(true);
    
    try {
      const response = await authFetch('/api/scoring/simulate-loan/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, duration })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Erreur simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  const getWarningBg = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-orange-500/10 border-orange-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      default: return '';
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-sky-500/20 rounded-lg">
          <Calculator className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Simulateur de Crédit</h2>
          <p className="text-sm text-slate-400">Calculez votre capacité d'emprunt</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Montant */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Montant souhaité
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              step="50000"
              min="50000"
              max="10000000"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">FCFA</span>
          </div>
          <input
            type="range"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="50000"
            max="3000000"
            step="50000"
            className="w-full mt-2"
          />
        </div>

        {/* Durée */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Durée (mois)
          </label>
          <div className="relative">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="3"
              max="24"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">mois</span>
          </div>
          <input
            type="range"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="3"
            max="24"
            className="w-full mt-2"
          />
        </div>
      </div>

      {/* Bouton Simuler */}
      <button
        onClick={handleSimulate}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calcul en cours...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5" />
            Simuler
          </>
        )}
      </button>

      {/* Résultats */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Status */}
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${
            result.is_feasible 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            {result.is_feasible ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.is_feasible ? 'text-emerald-300' : 'text-red-300'}`}>
                {result.is_feasible 
                  ? '✓ Prêt réalisable avec votre profil' 
                  : '✗ Montant trop élevé pour votre capacité actuelle'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Score : {result.score_value}/1000 (Niveau {result.score_level}) • Taux : {result.interest_rate}
              </p>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Mensualité</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(result.monthly_payment)}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Coût total</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(result.total_cost)}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Intérêts</p>
              <p className="text-lg font-semibold text-orange-400">{formatCurrency(result.total_interest)}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">CRM utilisé</p>
              <p className="text-lg font-semibold text-sky-400">{result.crm_used_percent}%</p>
            </div>
          </div>

          {/* Jauge CRM */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Utilisation du CRM</span>
              <span className="text-white font-medium">
                {formatCurrency(result.crm_used)} / {formatCurrency(result.crm_available)}
              </span>
            </div>
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  result.crm_used_percent > 80 ? 'bg-red-500' :
                  result.crm_used_percent > 50 ? 'bg-orange-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(result.crm_used_percent, 100)}%` }}
              />
            </div>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((warning, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getWarningBg(warning.type)}`}
                >
                  {getWarningIcon(warning.type)}
                  <p className="text-sm text-slate-200 flex-1">{warning.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scénarios alternatifs */}
          {result.alternative_scenarios && result.alternative_scenarios.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Scénarios alternatifs
              </h3>
              <div className="space-y-2">
                {result.alternative_scenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setAmount(scenario.amount);
                      setDuration(scenario.duration);
                    }}
                    className="bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{scenario.label}</span>
                      {scenario.is_feasible && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="block">Montant</span>
                        <span className="text-white font-medium">{formatCurrency(scenario.amount)}</span>
                      </div>
                      <div>
                        <span className="block">Mensualité</span>
                        <span className="text-white font-medium">{formatCurrency(scenario.monthly_payment)}</span>
                      </div>
                      <div>
                        <span className="block">Durée</span>
                        <span className="text-white font-medium">{scenario.duration} mois</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
