import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: 'credit_personal',
    description: '',
    minScore: '650',
    maxAmount: '2000000',
    interestRateMin: '12',
    interestRateMax: '18',
    durationMin: '6',
    durationMax: '36',
    isActive: true,
  });

  const [requirements, setRequirements] = useState<string[]>(['']);
  const [features, setFeatures] = useState<string[]>(['']);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      requirements: requirements.filter(r => r.trim()),
      features: features.filter(f => f.trim()),
    };

    console.log('Nouveau produit:', productData);
    // Ici: appel API pour créer le produit
    
    // Simuler succès
    alert('Produit créé avec succès !');
    navigate('/bank/products');
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
            <h1 className="text-3xl font-bold text-white">Créer un Nouveau Produit</h1>
            <p className="text-slate-400 mt-1">
              Configurez les paramètres du nouveau produit financier
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Informations de Base</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Nom du Produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Ex: Crédit Personnel Express"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="credit_personal">Crédit Particulier</option>
                  <option value="credit_business">Crédit PME</option>
                  <option value="savings">Épargne</option>
                  <option value="cards">Carte</option>
                  <option value="insurance">Assurance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 resize-none"
                  placeholder="Description courte du produit..."
                />
              </div>
            </div>
          </div>

          {/* Financial Parameters */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Paramètres Financiers</h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Score TERAS Minimum
                </label>
                <input
                  type="number"
                  name="minScore"
                  value={formData.minScore}
                  onChange={handleInputChange}
                  min="0"
                  max="1000"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Montant Maximum (CFA)
                </label>
                <input
                  type="number"
                  name="maxAmount"
                  value={formData.maxAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="100000"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Taux Min (% annuel)
                </label>
                <input
                  type="number"
                  name="interestRateMin"
                  value={formData.interestRateMin}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Taux Max (% annuel)
                </label>
                <input
                  type="number"
                  name="interestRateMax"
                  value={formData.interestRateMax}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Durée Min (mois)
                </label>
                <input
                  type="number"
                  name="durationMin"
                  value={formData.durationMin}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Durée Max (mois)
                </label>
                <input
                  type="number"
                  name="durationMax"
                  value={formData.durationMax}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Conditions d'Éligibilité</h2>
              <button
                type="button"
                onClick={addRequirement}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder="Ex: Score TERAS ≥ 650"
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-3 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Avantages & Caractéristiques</h2>
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Ex: Décaissement sous 48h"
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-3 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Statut</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-5 h-5 bg-slate-800 border-slate-700 rounded"
              />
              <div>
                <p className="text-white font-medium">Produit Actif</p>
                <p className="text-slate-400 text-xs">
                  Les clients pourront voir et souscrire à ce produit
                </p>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Aperçu</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Score min</span>
                <span className="text-white font-semibold">{formData.minScore}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Montant max</span>
                <span className="text-white font-semibold">
                  {(parseInt(formData.maxAmount) / 1000000).toFixed(1)}M CFA
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Taux</span>
                <span className="text-white font-semibold">
                  {formData.interestRateMin}-{formData.interestRateMax}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Durée</span>
                <span className="text-white font-semibold">
                  {formData.durationMin}-{formData.durationMax} mois
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Save className="w-5 h-5" />
                Créer le Produit
              </button>

              <button
                type="button"
                onClick={() => navigate('/bank/products')}
                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-orange-400 font-semibold text-sm mb-1">
                  Important
                </p>
                <p className="text-orange-300 text-xs">
                  Vérifiez bien tous les paramètres avant de créer le produit. Les modifications ultérieures n'affecteront que les nouvelles souscriptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}