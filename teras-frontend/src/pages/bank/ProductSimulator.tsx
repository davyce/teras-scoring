import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
} from 'lucide-react';

export default function ProductSimulator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');

  const [formData, setFormData] = useState({
    amount: '1000000',
    duration: '24',
    interestRate: '14',
    productType: productId || 'PROD-001',
    clientScore: '720',
    downPayment: '0',
  });

  // Calculs
  const amount = parseFloat(formData.amount) || 0;
  const duration = parseInt(formData.duration) || 1;
  const rate = parseFloat(formData.interestRate) / 100 / 12;
  const downPayment = parseFloat(formData.downPayment) || 0;
  const loanAmount = amount - downPayment;

  // Calcul mensualité (formule standard)
  const monthlyPayment = rate > 0
    ? (loanAmount * rate * Math.pow(1 + rate, duration)) / (Math.pow(1 + rate, duration) - 1)
    : loanAmount / duration;

  const totalPaid = monthlyPayment * duration;
  const totalInterest = totalPaid - loanAmount;
  const costOfCredit = (totalInterest / loanAmount) * 100;

  // Produits disponibles
  const products = [
    { id: 'PROD-001', name: 'Crédit Personnel Express', rate: { min: 12, max: 18 } },
    { id: 'PROD-002', name: 'Crédit Auto Premium', rate: { min: 10, max: 14 } },
    { id: 'PROD-003', name: 'Crédit Immobilier', rate: { min: 8, max: 12 } },
    { id: 'PROD-004', name: 'Crédit PME Croissance', rate: { min: 11, max: 16 } },
    { id: 'PROD-005', name: 'Crédit Équipement Pro', rate: { min: 12, max: 17 } },
  ];

  const selectedProduct = products.find(p => p.id === formData.productType);

  // Calendrier d'amortissement (premiers 12 mois)
  const amortizationSchedule = Array.from({ length: Math.min(duration, 12) }, (_, i) => {
    const month = i + 1;
    const interestPayment = loanAmount * rate * Math.pow(1 + rate, month - 1) - 
                            (monthlyPayment * Math.pow(1 + rate, month - 1) - monthlyPayment);
    const principalPayment = monthlyPayment - interestPayment;
    const remainingBalance = loanAmount * Math.pow(1 + rate, month) - 
                            monthlyPayment * ((Math.pow(1 + rate, month) - 1) / rate);

    return {
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, remainingBalance),
    };
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    // Logique d'export PDF (à implémenter)
    alert('Export PDF en cours...');
  };

  const handleSendToClient = () => {
    // Logique d'envoi au client (à implémenter)
    alert('Simulation envoyée au client');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bank/products')}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-400" />
              Simulateur de Crédit
            </h1>
            <p className="text-slate-400 mt-1">
              Calculez les mensualités et le coût total du crédit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter PDF
          </button>
          <button
            onClick={handleSendToClient}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Envoyer au Client
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Paramètres de Simulation</h2>

            <div className="space-y-5">
              {/* Product Selection */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Produit
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Montant Souhaité (CFA)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    min="100000"
                    step="100000"
                  />
                </div>
                <input
                  type="range"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="100000"
                  max="10000000"
                  step="100000"
                  className="w-full mt-2"
                />
              </div>

              {/* Down Payment */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Apport Initial (CFA)
                </label>
                <input
                  type="number"
                  name="downPayment"
                  value={formData.downPayment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  min="0"
                  step="50000"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Durée (mois)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    min="6"
                    max="240"
                  />
                </div>
                <input
                  type="range"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="6"
                  max="240"
                  className="w-full mt-2"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Taux d'Intérêt (% annuel)
                </label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    min={selectedProduct?.rate.min || 5}
                    max={selectedProduct?.rate.max || 25}
                    step="0.5"
                  />
                </div>
                {selectedProduct && (
                  <p className="text-xs text-slate-500 mt-1">
                    Taux pour ce produit: {selectedProduct.rate.min}% - {selectedProduct.rate.max}%
                  </p>
                )}
              </div>

              {/* Client Score */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Score TERAS Client
                </label>
                <input
                  type="number"
                  name="clientScore"
                  value={formData.clientScore}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  min="0"
                  max="1000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Mensualité</p>
              <p className="text-white text-3xl font-bold">
                {monthlyPayment.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CFA
              </p>
              <p className="text-blue-400 text-xs mt-2">
                × {duration} mois
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Total à Rembourser</p>
              <p className="text-white text-3xl font-bold">
                {totalPaid.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CFA
              </p>
              <p className="text-purple-400 text-xs mt-2">
                Capital + Intérêts
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Coût du Crédit</p>
              <p className="text-white text-3xl font-bold">
                {totalInterest.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CFA
              </p>
              <p className="text-orange-400 text-xs mt-2">
                {costOfCredit.toFixed(1)}% du montant
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Répartition du Crédit</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Montant Demandé</span>
                <span className="text-white font-semibold">
                  {amount.toLocaleString('fr-FR')} CFA
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Apport Initial</span>
                <span className="text-white font-semibold">
                  {downPayment.toLocaleString('fr-FR')} CFA
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Montant Financé</span>
                <span className="text-white font-semibold">
                  {loanAmount.toLocaleString('fr-FR')} CFA
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Total des Intérêts</span>
                <span className="text-orange-400 font-semibold">
                  {totalInterest.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CFA
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-white font-semibold">TOTAL À REMBOURSER</span>
                <span className="text-white text-xl font-bold">
                  {totalPaid.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CFA
                </span>
              </div>
            </div>
          </div>

          {/* Amortization Schedule */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Tableau d'Amortissement
              </h2>
              <span className="text-slate-400 text-sm">
                {Math.min(duration, 12)} premiers mois
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-400 text-sm font-medium pb-3">Mois</th>
                    <th className="text-right text-slate-400 text-sm font-medium pb-3">Mensualité</th>
                    <th className="text-right text-slate-400 text-sm font-medium pb-3">Capital</th>
                    <th className="text-right text-slate-400 text-sm font-medium pb-3">Intérêts</th>
                    <th className="text-right text-slate-400 text-sm font-medium pb-3">Restant Dû</th>
                  </tr>
                </thead>
                <tbody>
                  {amortizationSchedule.map((row) => (
                    <tr key={row.month} className="border-b border-slate-800/50">
                      <td className="text-white text-sm py-3">{row.month}</td>
                      <td className="text-right text-white text-sm">
                        {row.payment.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right text-blue-400 text-sm">
                        {row.principal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right text-orange-400 text-sm">
                        {row.interest.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right text-slate-300 text-sm">
                        {row.balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {duration > 12 && (
              <p className="text-slate-500 text-xs mt-4 text-center">
                + {duration - 12} mois supplémentaires
              </p>
            )}
          </div>

          {/* Eligibility Check */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Éligibilité</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {parseInt(formData.clientScore) >= 650 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-slate-300">
                  Score TERAS: {formData.clientScore} {parseInt(formData.clientScore) >= 650 ? '✓' : '(minimum 650 requis)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {monthlyPayment < 500000 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                )}
                <span className="text-slate-300">
                  Mensualité raisonnable (&lt; 30% revenus estimés)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {downPayment >= amount * 0.1 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                )}
                <span className="text-slate-300">
                  Apport: {((downPayment/amount)*100).toFixed(1)}% (recommandé: 10%+)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
