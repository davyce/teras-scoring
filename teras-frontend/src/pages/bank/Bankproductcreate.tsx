import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Percent,
  Calendar,
  TrendingUp,
  CheckCircle,
  Plus,
  X,
  Target,
  Users,
  Sparkles,
} from 'lucide-react';

export default function BankProductCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    minScore: 600,
    maxAmount: 5000000,
    minRate: 10,
    maxRate: 15,
    minDuration: 6,
    maxDuration: 24,
    description: '',
    isActive: true,
  });

  const [features, setFeatures] = useState<string[]>(['']);

  const categories = [
    { id: 'credit_particulier', label: 'Crédit Particulier', color: 'blue' },
    { id: 'credit_pme', label: 'Crédit PME', color: 'green' },
    { id: 'epargne', label: 'Épargne', color: 'purple' },
    { id: 'carte', label: 'Carte Bancaire', color: 'amber' },
    { id: 'assurance', label: 'Assurance', color: 'red' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Produit créé avec succès !');
    navigate('/bank/products');
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || 'slate';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bank/products')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un Produit Financier</h1>
          <p className="text-slate-400 mt-1">Configurez les paramètres du nouveau produit</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de Base */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Informations de Base</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Nom du Produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Crédit Auto Premium"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description courte du produit..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Paramètres Financiers */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Paramètres Financiers</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Score Minimum */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Score TERAS Minimum *
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="minScore"
                      value={formData.minScore}
                      onChange={handleChange}
                      min="0"
                      max="1000"
                      step="10"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      name="minScore"
                      value={formData.minScore}
                      onChange={handleChange}
                      min="0"
                      max="1000"
                      step="10"
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0</span>
                      <span>{formData.minScore}</span>
                      <span>1000</span>
                    </div>
                  </div>
                </div>

                {/* Montant Maximum */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Montant Maximum (CFA) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="maxAmount"
                      value={formData.maxAmount}
                      onChange={handleChange}
                      min="0"
                      step="100000"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    {formatCurrency(formData.maxAmount)} CFA
                  </p>
                </div>

                {/* Taux Min */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Taux d'Intérêt Minimum (%/an) *
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="minRate"
                      value={formData.minRate}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      step="0.5"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Taux Max */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Taux d'Intérêt Maximum (%/an) *
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="maxRate"
                      value={formData.maxRate}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      step="0.5"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Durée Min */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Durée Minimum (mois) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="minDuration"
                      value={formData.minDuration}
                      onChange={handleChange}
                      min="1"
                      max="240"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Durée Max */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Durée Maximum (mois) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="maxDuration"
                      value={formData.maxDuration}
                      onChange={handleChange}
                      min="1"
                      max="240"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Avantages & Caractéristiques</h2>
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Avantage ${index + 1}`}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {features.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">
                  Aucun avantage ajouté. Cliquez sur "Ajouter" pour en créer un.
                </p>
              )}
            </div>

            {/* Activation */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 bg-slate-800 border-slate-700 rounded accent-blue-500"
                />
                <div>
                  <p className="text-white font-medium">Activer ce produit immédiatement</p>
                  <p className="text-slate-400 text-sm">Le produit sera visible et disponible pour les clients</p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/bank/products')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Créer le Produit
              </button>
            </div>
          </form>
        </div>

        {/* Preview (1/3) */}
        <div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 sticky top-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Aperçu du Produit
            </h3>

            {formData.name ? (
              <div className="space-y-4">
                {/* Card Preview */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{formData.name || 'Nom du produit'}</h4>
                        {formData.category && (
                          <span className={`px-2 py-0.5 bg-${getCategoryColor(formData.category)}-500/10 text-${getCategoryColor(formData.category)}-400 text-xs rounded`}>
                            {categories.find(c => c.id === formData.category)?.label}
                          </span>
                        )}
                      </div>
                      {formData.description && (
                        <p className="text-slate-400 text-sm">{formData.description}</p>
                      )}
                    </div>
                    {formData.isActive && (
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Score min</p>
                      <p className="text-white font-semibold">{formData.minScore}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Montant max</p>
                      <p className="text-white font-semibold">{formatCurrency(formData.maxAmount)} CFA</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Taux</p>
                      <p className="text-white font-semibold">{formData.minRate}-{formData.maxRate}%/an</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Durée</p>
                      <p className="text-white font-semibold">{formData.minDuration}-{formData.maxDuration} mois</p>
                    </div>
                  </div>

                  {features.filter(f => f.trim()).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-300 text-sm font-medium mb-2">Avantages</p>
                      <div className="space-y-2">
                        {features.filter(f => f.trim()).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="text-slate-300 text-sm font-semibold mb-3">Estimation Target</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Clients éligibles</span>
                      <span className="text-white font-semibold">~12,500</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Volume potentiel</span>
                      <span className="text-green-400 font-semibold">~62.5M CFA</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">
                  Remplissez le formulaire pour voir l'aperçu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}