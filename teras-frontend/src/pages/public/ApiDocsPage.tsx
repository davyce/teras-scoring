// src/pages/public/ApiDocsPage.tsx

import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Server,
  Key,
  Globe,
  Code,
  Shield,
  Zap,
  BookOpen,
  Terminal,
  Copy,
  CheckCircle,
  Users,
  Building2,
  Landmark,
  User,
  Sparkles,
  TrendingUp,
  BarChart3,
  FileText,
  Clock,
  Database,
} from "lucide-react";
import { useState } from "react";
import PublicNavbar from "../../components/PublicNavbar";

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/scoring/score/",
      description: "Calculer un nouveau score TERAS",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/v1/scoring/history/",
      description: "Récupérer l'historique des scores",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/token/",
      description: "Obtenir un token JWT (authentification)",
      auth: false,
    },
    {
      method: "POST",
      path: "/api/token/refresh/",
      description: "Rafraîchir un token JWT",
      auth: false,
    },
    {
      method: "GET",
      path: "/api/me/",
      description: "Informations de l'utilisateur connecté",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/teras/dashboard/",
      description: "Données complètes du dashboard",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/v1/enterprise/score/",
      description: "Calculer score TERAS Entreprise",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/v1/ai/analyze/",
      description: "Analyse IA avec recommandations",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/v1/documents/upload/",
      description: "Upload de documents (PDF, Excel)",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/v1/analytics/portfolio/",
      description: "Analytics portefeuille (Banque)",
      auth: true,
    },
  ];

  const codeExamples = [
    {
      title: "Authentification",
      language: "bash",
      code: `curl -X POST https://api.teras.io/api/token/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "votre@email.com",
    "password": "votre_mot_de_passe"
  }'`,
    },
    {
      title: "Calculer un score",
      language: "bash",
      code: `curl -X POST https://api.teras.io/api/v1/scoring/score/ \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactions": 150000,
    "epargne": 500000,
    "revenus": 1200000,
    "actifs": 2500000,
    "social": 70
  }'`,
    },
    {
      title: "Analyse IA",
      language: "bash",
      code: `curl -X POST https://api.teras.io/api/v1/ai/analyze/ \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "score": 742,
    "context": "demande_credit",
    "amount": 5000000
  }'`,
    },
  ];

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Haute performance",
      description: "Temps de réponse < 100ms pour le calcul de score.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurisé",
      description: "Authentification JWT, HTTPS obligatoire, rate limiting.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "RESTful",
      description: "API REST standard avec JSON, facile à intégrer.",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "IA Intégrée",
      description: "Assistant Claude Sonnet 4 pour analyses avancées.",
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Multi-format",
      description: "Supporte PDF, Excel, OFX, MT940, CAMT.053.",
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Documenté",
      description: "Documentation OpenAPI/Swagger complète disponible.",
    },
  ];

  // Prix adaptés par type d'utilisateur
  const pricing = [
    {
      name: "Individuel",
      icon: <User className="h-6 w-6" />,
      monthlyPrice: "10 000",
      annualPrice: "100 000",
      requests: "50 requêtes/mois",
      color: "blue",
      features: [
        "Calcul score TERAS Basic",
        "Historique 3 mois",
        "Dashboard personnel",
        "Support communauté",
        "Export PDF",
      ],
      popular: false,
    },
    {
      name: "Entreprise",
      icon: <Building2 className="h-6 w-6" />,
      monthlyPrice: "700 000",
      annualPrice: "7 000 000",
      requests: "1 000 requêtes/mois",
      color: "purple",
      features: [
        "Score TERAS Entreprise",
        "Historique illimité",
        "Gestion employés",
        "Analytics avancés",
        "Assistant IA inclus",
        "Rapports personnalisés",
        "API complète",
        "Support prioritaire",
      ],
      popular: true,
    },
    {
      name: "Gouvernement",
      icon: <Landmark className="h-6 w-6" />,
      monthlyPrice: "50 000 000",
      annualPrice: "500 000 000",
      requests: "Illimité",
      color: "green",
      features: [
        "Données agrégées régionales",
        "Analytics sectoriels",
        "Tableaux de bord macro",
        "Alertes économiques",
        "Assistant IA stratégique",
        "Exports massifs",
        "API temps réel",
        "SLA 99.9%",
        "Account manager dédié",
      ],
      popular: false,
    },
    {
      name: "Banque",
      icon: <Landmark className="h-6 w-6" />,
      monthlyPrice: "20 000 000",
      annualPrice: "200 000 000",
      requests: "Illimité",
      color: "cyan",
      features: [
        "✨ Toutes fonctionnalités",
        "Scoring individuel & entreprise",
        "Gestion portefeuille complet",
        "Analytics temps réel",
        "Assistant IA Claude Sonnet 4",
        "Simulateur de crédit avancé",
        "Gestion risques & provisions",
        "Détection fraude IA",
        "Webhooks personnalisés",
        "White label disponible",
        "API illimitée",
        "SLA 99.99%",
        "Support 24/7",
        "Intégration dédiée",
        "Formation équipe incluse",
      ],
      premium: true,
    },
  ];

  // Calculer l'économie annuelle
  const getSavings = (monthly: string, annual: string) => {
    const monthlyTotal = parseInt(monthly.replace(/\s/g, '')) * 12;
    const annualTotal = parseInt(annual.replace(/\s/g, ''));
    const savings = monthlyTotal - annualTotal;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6">
              <Server className="h-4 w-4" />
              API REST + IA
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              API{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                TERAS
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Intégrez le scoring TERAS dans vos applications. API REST complète avec IA intégrée,
              sécurisée et performante pour calculer et gérer les scores de crédit.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => window.open("/api/docs/", "_blank")}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition"
              >
                <BookOpen className="h-4 w-4" />
                Documentation Swagger
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition"
              >
                Obtenir une clé API
              </button>
            </div>
          </div>
        </section>

        {/* Caractéristiques */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Endpoints */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">
            Endpoints Disponibles
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                      Méthode
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                      Endpoint
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                      Description
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                      Auth
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {endpoints.map((endpoint, i) => (
                    <tr key={i} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            endpoint.method === "GET"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-sky-500/20 text-sky-400"
                          }`}
                        >
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-sky-300 bg-slate-800/50 px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {endpoint.description}
                      </td>
                      <td className="px-6 py-4">
                        {endpoint.auth ? (
                          <Key className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Exemples de code */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">
            Exemples de Code
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {codeExamples.map((example, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{example.title}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(example.code, i)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                  >
                    {copiedIndex === i ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-slate-300">{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* Tarifs API */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
            Tarifs API par Type d'Utilisateur
          </h2>
          <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">
            Choisissez le plan adapté à votre profil. Économisez jusqu'à 17% avec la facturation annuelle.
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annuel
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {pricing.map((plan, i) => {
              const savings = getSavings(plan.monthlyPrice, plan.annualPrice);
              const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              const priceLabel = billingCycle === 'monthly' ? '/mois' : '/an';

              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-6 relative ${
                    plan.premium
                      ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 to-blue-500/10'
                      : plan.popular
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 bg-white/5'
                  } hover:scale-105 transition-transform`}
                >
                  {(plan.popular || plan.premium) && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full ${
                      plan.premium 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                    }`}>
                      {plan.premium ? '⭐ PREMIUM' : '⭐ POPULAIRE'}
                    </div>
                  )}

                  <div className={`mb-4 inline-flex items-center justify-center rounded-lg border p-2 ${
                    plan.premium
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      : `border-${plan.color}-500/30 bg-${plan.color}-500/10 text-${plan.color}-300`
                  }`}>
                    {plan.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{displayPrice}</span>
                    <span className="text-slate-400"> FCFA{priceLabel}</span>
                    {billingCycle === 'annual' && savings.percentage > 0 && (
                      <div className="text-xs text-green-400 mt-1">
                        Économie de {savings.savings.toLocaleString()} FCFA ({savings.percentage}%)
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {plan.requests}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate("/register")}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      plan.premium
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30'
                        : plan.popular
                        ? 'bg-purple-500 hover:bg-purple-400 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    Commencer
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              💳 Paiement sécurisé • 📞 Support client • 🔄 Annulation à tout moment
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">
              Prêt à intégrer TERAS ?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Créez votre compte développeur et obtenez votre clé API gratuite
              en quelques minutes. Essai gratuit 14 jours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition"
              >
                Obtenir ma clé API
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition"
              >
                Contacter l'équipe
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} TERAS. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
