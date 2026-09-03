import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function BankEnterpriseNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    legalName: '',
    taxId: '',
    sector: '',
    employees: '',
    monthlyRevenue: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    country: 'CG',
  });

  const [estimatedScore, setEstimatedScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const sectors = [
    'Commerce',
    'Transport',
    'Artisanat',
    'Restauration',
    'Immobilier',
    'Santé',
    'Services',
    'Alimentation',
    'Éducation',
    'Construction',
    'Agriculture',
    'Technologie',
  ];

  const countries = [
    { code: 'CG', name: 'Congo-Brazzaville' },
    { code: 'CD', name: 'RD Congo' },
    { code: 'GA', name: 'Gabon' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'TD', name: 'Tchad' },
    { code: 'CF', name: 'Centrafrique' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateScore = () => {
    setIsCalculating(true);

    // Simulation calcul score TERAS Entreprise (2 secondes)
    setTimeout(() => {
      const baseScore = 600;
      const revenueBonus = parseInt(formData.monthlyRevenue) > 5000000 ? 100 : 50;
      const employeesBonus = parseInt(formData.employees) > 10 ? 80 : 40;
      const sectorBonus = ['Commerce', 'Transport', 'Santé'].includes(formData.sector) ? 60 : 30;
      const randomBonus = Math.random() * 50;

      const score = Math.min(1000, baseScore + revenueBonus + employeesBonus + sectorBonus + randomBonus);
      setEstimatedScore(Math.round(score));
      setIsCalculating(false);
    }, 2000);
  };

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await authFetch('/api/scoring/bank/enterprises/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `Erreur ${res.status}`);
      }
      navigate('/bank/enterprises');
    } catch (e: any) {
      setSubmitError(e.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBandColor = (score: number) => {
    if (score >= 900) return 'emerald';
    if (score >= 800) return 'green';
    if (score >= 700) return 'blue';
    if (score >= 600) return 'amber';
    if (score >= 500) return 'orange';
    return 'red';
  };

  const getBand = (score: number) => {
    if (score >= 900) return 'A+';
    if (score >= 800) return 'A';
    if (score >= 700) return 'B';
    if (score >= 600) return 'C';
    if (score >= 500) return 'D';
    return 'E';
  };

  const canCalculate = formData.legalName && formData.sector && formData.employees && formData.monthlyRevenue;
  const canSubmit = estimatedScore !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bank/enterprises')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouvelle Entreprise</h1>
          <p className="text-slate-400 mt-1">Créer un profil entreprise et calculer le score TERAS</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations Entreprise */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Informations Entreprise</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-medium mb-2">
                    Raison Sociale *
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="Ex: SARL TransCongo"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Numéro Fiscal *
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="A0012345678"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Secteur d'Activité *
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Nombre d'Employés *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="employees"
                      value={formData.employees}
                      onChange={handleChange}
                      placeholder="Ex: 15"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Chiffre d'Affaires Mensuel (CFA) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="monthlyRevenue"
                      value={formData.monthlyRevenue}
                      onChange={handleChange}
                      placeholder="Ex: 5000000"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Contact Principal</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Ex: Jean Mukendi"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="contact@entreprise.cd"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+243 999 123 456"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Pays
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-medium mb-2">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Avenue Lumumba, Kinshasa"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Documents (Optionnel)</h2>
              </div>

              <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center hover:border-slate-600/50 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 mb-1">
                  Cliquez pour uploader ou glissez-déposez
                </p>
                <p className="text-slate-400 text-sm">
                  Statuts, RCCM, Bilan, Relevés bancaires (PDF, JPG, PNG)
                </p>
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-sm">
                  💡 Upload des relevés bancaires → scoring TERAS automatique et analyse de viabilité
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/bank/enterprises')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={calculateScore}
                disabled={!canCalculate || isCalculating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Calculer Score TERAS
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Créer l'Entreprise
              </button>
            </div>
          </form>
        </div>

        {/* Preview Score (1/3) */}
        <div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 sticky top-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Score TERAS Entreprise
            </h3>

            {estimatedScore === null ? (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">
                  Remplissez le formulaire et cliquez sur "Calculer Score TERAS"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Jauge */}
                <div className="relative">
                  <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="rgb(51, 65, 85)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke={`rgb(${getBandColor(estimatedScore) === 'emerald' ? '16, 185, 129' : getBandColor(estimatedScore) === 'green' ? '34, 197, 94' : getBandColor(estimatedScore) === 'blue' ? '59, 130, 246' : getBandColor(estimatedScore) === 'amber' ? '245, 158, 11' : '249, 115, 22'})`}
                      strokeWidth="12"
                      strokeDasharray={`${(estimatedScore / 1000) * 565} 565`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                      className="transition-all duration-1000"
                    />
                    <text
                      x="100"
                      y="100"
                      textAnchor="middle"
                      dy=".3em"
                      className="text-4xl font-bold fill-white"
                    >
                      {estimatedScore}
                    </text>
                    <text
                      x="100"
                      y="130"
                      textAnchor="middle"
                      className="text-sm fill-slate-400"
                    >
                      / 1000
                    </text>
                  </svg>
                </div>

                {/* Bande */}
                <div className="text-center">
                  <span className={`px-4 py-2 bg-${getBandColor(estimatedScore)}-500/10 text-${getBandColor(estimatedScore)}-400 text-lg rounded-xl font-bold inline-block`}>
                    Bande {getBand(estimatedScore)}
                  </span>
                </div>

                {/* Plafond Crédit (CRM 30%) */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-2">Plafond Crédit Estimé</p>
                  <p className="text-slate-300 text-xs mb-3">
                    Basé sur CRM = 30% du CA mensuel net
                  </p>
                  {formData.monthlyRevenue && (
                    <>
                      <p className="text-2xl font-bold text-white mb-1">
                        {((parseInt(formData.monthlyRevenue) * 0.3 * 6 * 0.85) / 1000000).toFixed(1)}M CFA
                      </p>
                      <p className="text-slate-400 text-xs">
                        Sur 6 mois (mensualité: {((parseInt(formData.monthlyRevenue) * 0.3) / 1000).toFixed(0)}K CFA)
                      </p>
                    </>
                  )}
                </div>

                {/* Produits Adaptés */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-300 text-sm font-semibold mb-3">
                    Produits Éligibles
                  </p>
                  <div className="space-y-2">
                    {estimatedScore >= 700 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">Crédit PME Croissance</span>
                      </div>
                    )}
                    {estimatedScore >= 680 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">Crédit Équipement Pro</span>
                      </div>
                    )}
                    {estimatedScore >= 720 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">Fonds de Roulement</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}