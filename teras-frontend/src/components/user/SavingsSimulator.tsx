// frontend/src/components/user/SavingsSimulator.tsx
/**
 * Simulateur d'Épargne
 * Calcule l'évolution de l'épargne avec intérêts
 */

import React, { useState } from 'react';
import { PiggyBank, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function SavingsSimulator() {
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(50000);
  const [duration, setDuration] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(3);
  const [initialAmount, setInitialAmount] = useState<number>(0);

  // Calculs
  const totalDeposits = initialAmount + (monthlyDeposit * duration);
  const futureValue = calculateFutureValue(initialAmount, monthlyDeposit, interestRate, duration);
  const totalInterest = futureValue - totalDeposits;
  const monthlyGrowth = futureValue / duration;

  function calculateFutureValue(pv: number, pmt: number, rate: number, months: number): number {
    const monthlyRate = rate / 100 / 12;
    
    // Valeur future du montant initial
    const fvInitial = pv * Math.pow(1 + monthlyRate, months);
    
    // Valeur future des versements mensuels
    const fvPayments = monthlyRate === 0 
      ? pmt * months 
      : pmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    return fvInitial + fvPayments;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <PiggyBank className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Simulateur d'Épargne</h2>
          <p className="text-sm text-slate-400">Planifiez votre épargne et visualisez sa croissance</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Montant initial */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Montant initial
          </label>
          <div className="relative">
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              step="10000"
              min="0"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">FCFA</span>
          </div>
        </div>

        {/* Versement mensuel */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Versement mensuel
          </label>
          <div className="relative">
            <input
              type="number"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              step="5000"
              min="0"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">FCFA</span>
          </div>
          <input
            type="range"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
            min="10000"
            max="500000"
            step="10000"
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
              min="1"
              max="120"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">mois</span>
          </div>
          <input
            type="range"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="3"
            max="60"
            className="w-full mt-2"
          />
        </div>

        {/* Taux d'intérêt */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Taux d'intérêt annuel
          </label>
          <div className="relative">
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              step="0.5"
              min="0"
              max="20"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="absolute right-4 top-3 text-slate-400">%</span>
          </div>
          <input
            type="range"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            min="0"
            max="15"
            step="0.5"
            className="w-full mt-2"
          />
        </div>
      </div>

      {/* Résultats */}
      <div className="space-y-4">
        {/* Montant final */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-lg p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Montant final estimé</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(futureValue)}</div>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-xs text-slate-400 mb-1">Total versé</div>
              <div className="text-lg font-semibold text-white">{formatCurrency(totalDeposits)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Intérêts gagnés</div>
              <div className="text-lg font-semibold text-emerald-400">{formatCurrency(totalInterest)}</div>
            </div>
          </div>
        </div>

        {/* Stats additionnelles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Calendar}
            label="Durée"
            value={`${duration} mois`}
            subvalue={`${Math.floor(duration / 12)} an${duration >= 24 ? 's' : ''}`}
          />
          <StatCard
            icon={DollarSign}
            label="Par mois"
            value={formatCurrency(monthlyDeposit)}
            subvalue="Versement"
          />
          <StatCard
            icon={TrendingUp}
            label="Croissance"
            value={`${((totalInterest / totalDeposits) * 100).toFixed(1)}%`}
            subvalue="Gain total"
          />
          <StatCard
            icon={PiggyBank}
            label="Objectif"
            value={formatCurrency(monthlyGrowth * duration)}
            subvalue={`${duration} mois`}
          />
        </div>

        {/* Barre de progression */}
        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Composition du montant final</span>
          </div>
          <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(totalDeposits / futureValue) * 100}%` }}
              title={`Versements: ${formatCurrency(totalDeposits)}`}
            />
            <div
              className="bg-green-400 transition-all duration-500"
              style={{ width: `${(totalInterest / futureValue) * 100}%` }}
              title={`Intérêts: ${formatCurrency(totalInterest)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>💰 Versements ({((totalDeposits / futureValue) * 100).toFixed(0)}%)</span>
            <span>📈 Intérêts ({((totalInterest / futureValue) * 100).toFixed(0)}%)</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            💡 <strong>Astuce :</strong> En épargnant {formatCurrency(monthlyDeposit)} par mois pendant {duration} mois avec un taux de {interestRate}%, 
            vous gagnerez <strong className="text-emerald-400">{formatCurrency(totalInterest)}</strong> d'intérêts !
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant StatCard
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subvalue: string;
}

function StatCard({ icon: Icon, label, value, subvalue }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-base font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-500">{subvalue}</div>
    </div>
  );
}
