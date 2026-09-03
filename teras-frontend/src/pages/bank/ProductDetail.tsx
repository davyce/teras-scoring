import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calculator,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';

export default function ProductDetail() {
  const navigate = useNavigate();
  const { productId } = useParams();

  // Mock product data (en production, fetch depuis API)
  const product = {
    id: productId,
    name: 'Crédit Personnel Express',
    category: 'credit_personal',
    description: 'Crédit rapide pour vos besoins urgents',
    minScore: 650,
    maxAmount: 2000000,
    interestRate: { min: 12, max: 18 },
    duration: { min: 6, max: 36 },
    requirements: [
      'Score TERAS ≥ 650',
      'Revenus réguliers justifiables',
      'Pièce d\'identité valide',
      'Justificatif de domicile récent',
      'Relevé bancaire 3 derniers mois'
    ],
    features: [
      'Décaissement sous 48h',
      'Pas de garantie matérielle requise',
      'Remboursement flexible',
      'Possibilité de remboursement anticipé sans pénalité',
      'Assurance emprunteur incluse',
      'Accompagnement personnalisé'
    ],
    isActive: true,
    totalCustomers: 245,
    totalVolume: 185000000,
    createdAt: '2024-01-15',
    updatedAt: '2024-12-10',
  };

  const stats = [
    {
      label: 'Clients Actifs',
      value: product.totalCustomers.toString(),
      icon: Users,
      color: 'blue',
      trend: '+12%',
    },
    {
      label: 'Volume Total',
      value: `${(product.totalVolume / 1000000).toFixed(1)}M CFA`,
      icon: TrendingUp,
      color: 'green',
      trend: '+18%',
    },
    {
      label: 'Taux d\'Approbation',
      value: '68.5%',
      icon: CheckCircle,
      color: 'cyan',
      trend: '+5%',
    },
    {
      label: 'Délai Moyen',
      value: '1.8 jours',
      icon: Clock,
      color: 'purple',
      trend: '-15%',
    },
  ];

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{product.name}</h1>
              {product.isActive && (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Actif
                </span>
              )}
            </div>
            <p className="text-slate-400">{product.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/bank/simulator")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            Simuler
          </button>
          <button
            onClick={() => navigate("/bank/products")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Modifier
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <span className="text-green-400 text-sm font-medium">{stat.trend}</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Détails du Produit</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Score TERAS Minimum</p>
                <p className="text-white text-lg font-semibold">{product.minScore}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Montant Maximum</p>
                <p className="text-white text-lg font-semibold">
                  {(product.maxAmount / 1000000).toFixed(1)}M CFA
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Taux d'Intérêt</p>
                <p className="text-white text-lg font-semibold">
                  {product.interestRate.min === product.interestRate.max
                    ? `${product.interestRate.min}%`
                    : `${product.interestRate.min}-${product.interestRate.max}%`} /an
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Durée</p>
                <p className="text-white text-lg font-semibold">
                  {product.duration.min === product.duration.max
                    ? `${product.duration.max} mois`
                    : `${product.duration.min}-${product.duration.max} mois`}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Conditions d'Éligibilité
            </h2>

            <ul className="space-y-3">
              {product.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Avantages & Caractéristiques
            </h2>

            <ul className="grid md:grid-cols-2 gap-3">
              {product.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Performance Analytics */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Performance du Produit
              </h2>
              <button
                onClick={() => navigate("/bank/analytics")}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Voir détails →
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Taux de Défaut</p>
                <p className="text-white text-2xl font-bold">2.3%</p>
                <p className="text-green-400 text-xs mt-1">↓ -0.8% vs mois dernier</p>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">NPS Client</p>
                <p className="text-white text-2xl font-bold">85/100</p>
                <p className="text-green-400 text-xs mt-1">↑ +3 pts vs mois dernier</p>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">ROI Moyen</p>
                <p className="text-white text-2xl font-bold">18.4%</p>
                <p className="text-green-400 text-xs mt-1">↑ +1.2% vs mois dernier</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Informations</h3>

            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">ID Produit</p>
                <p className="text-white font-mono text-sm">{product.id}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Catégorie</p>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                  Crédit Particulier
                </span>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Date de Création</p>
                <p className="text-white text-sm">
                  {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Dernière Modification</p>
                <p className="text-white text-sm">
                  {new Date(product.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Actions Rapides</h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/bank/simulator")}
                className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors flex items-center gap-3"
              >
                <Calculator className="w-5 h-5" />
                Lancer Simulation
              </button>

              <button
                onClick={() => navigate("/bank/products")}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-3"
              >
                <Edit className="w-5 h-5" />
                Modifier Produit
              </button>

              <button
                onClick={() => navigate("/bank/analytics")}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-3"
              >
                <BarChart3 className="w-5 h-5" />
                Voir Analytics
              </button>

              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir désactiver ce produit ?')) {
                    // Logique de désactivation
                  }
                }}
                className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-5 h-5" />
                Désactiver Produit
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-orange-400 font-semibold text-sm mb-1">
                  Attention
                </p>
                <p className="text-orange-300 text-xs">
                  Toute modification des conditions du produit affectera les nouvelles demandes uniquement. Les crédits en cours ne sont pas impactés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}