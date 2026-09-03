// src/pages/public/ScoreCreditPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  PiggyBank,
  Wallet,
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Briefcase,
  FileText,
  UserCheck,
  Handshake,
  Activity,
  Shield,
  Brain,
} from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";

type TabType = "basic" | "entreprise";

export default function ScoreCreditPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  // TERAS Basic (ZOLA) - Pour les individus - Pondérations officielles
  const terasBasicComponents = [
    {
      letter: "T",
      name: "Transactions",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "sky",
      description: "Volume, régularité et diversité des transactions financières.",
      examples: "Paiements ZOLA, transferts, factures SFEC.",
      weight: "25%",
      weightValue: 0.25,
      tips: [
        "Maintenez des transactions régulières",
        "Diversifiez vos sources de paiement",
        "Évitez les découverts fréquents",
      ],
    },
    {
      letter: "E",
      name: "Épargne",
      icon: <PiggyBank className="h-6 w-6" />,
      color: "green",
      description: "Capacité à épargner et stabilité de la réserve financière.",
      examples: "Solde moyen, historique d'épargne, retraits.",
      weight: "20%",
      weightValue: 0.20,
      tips: [
        "Épargnez régulièrement",
        "Constituez un fonds d'urgence",
        "Utilisez l'épargne automatique ZOLA",
      ],
    },
    {
      letter: "R",
      name: "Revenus",
      icon: <Wallet className="h-6 w-6" />,
      color: "yellow",
      description: "Flux entrants mensuels, stabilité et origine des revenus.",
      examples: "Revenus ZOLA, versements employeur.",
      weight: "20%",
      weightValue: 0.20,
      tips: [
        "Documentez tous vos revenus",
        "Développez des revenus complémentaires",
        "Maintenez une stabilité professionnelle",
      ],
    },
    {
      letter: "A",
      name: "Actifs",
      icon: <Building2 className="h-6 w-6" />,
      color: "purple",
      description: "Patrimoine déclaré ou détecté, équipements, biens durables.",
      examples: "Immobilier, véhicule, POS, équipements de travail.",
      weight: "20%",
      weightValue: 0.20,
      tips: [
        "Investissez dans des actifs tangibles",
        "Déclarez vos biens et équipements",
        "Entretenez et valorisez vos biens",
      ],
    },
    {
      letter: "S",
      name: "Social",
      icon: <Users className="h-6 w-6" />,
      color: "orange",
      description: "Réputation, participation communautaire, conformité civique.",
      examples: "Notes, historique Sounga, comportement réseau.",
      weight: "15%",
      weightValue: 0.15,
      tips: [
        "Payez toujours à temps",
        "Participez aux activités communautaires",
        "Maintenez un bon historique Sounga",
      ],
    },
  ];

  // TERAS Entreprise - Pondérations officielles
  const terasEntrepriseComponents = [
    {
      letter: "T",
      name: "Transparence fiscale",
      icon: <FileText className="h-6 w-6" />,
      color: "sky",
      description: "Cohérence entre ventes SFEC et déclarations fiscales.",
      examples: "Factures SFEC, TVA, audits.",
      weight: "30%",
      weightValue: 0.30,
      tips: [
        "Déclarez toutes vos factures SFEC",
        "Maintenez une cohérence TVA",
        "Préparez-vous aux audits",
      ],
    },
    {
      letter: "E",
      name: "Emploi local",
      icon: <UserCheck className="h-6 w-6" />,
      color: "green",
      description: "Création et stabilité de l'emploi.",
      examples: "Registre salarié, déclarations CNSS, turnover.",
      weight: "25%",
      weightValue: 0.25,
      tips: [
        "Créez des emplois stables",
        "Déclarez tous vos salariés à la CNSS",
        "Réduisez le turnover",
      ],
    },
    {
      letter: "R",
      name: "Rétention / Fidélité",
      icon: <Handshake className="h-6 w-6" />,
      color: "yellow",
      description: "Fidélité clients et fournisseurs.",
      examples: "Taux de récurrence, contrats, réputation.",
      weight: "15%",
      weightValue: 0.15,
      tips: [
        "Fidélisez vos clients",
        "Maintenez des relations fournisseurs stables",
        "Honorez vos contrats",
      ],
    },
    {
      letter: "A",
      name: "Activité économique",
      icon: <Activity className="h-6 w-6" />,
      color: "purple",
      description: "Volume, diversité et stabilité du chiffre d'affaires.",
      examples: "Ventes, POS, exportations.",
      weight: "20%",
      weightValue: 0.20,
      tips: [
        "Diversifiez vos sources de revenus",
        "Utilisez les POS ZOLA",
        "Développez vos exportations",
      ],
    },
    {
      letter: "S",
      name: "Stabilité sociale",
      icon: <Shield className="h-6 w-6" />,
      color: "orange",
      description: "Responsabilité sociale, conformité légale, environnement.",
      examples: "RSE, sécurité, contribution locale.",
      weight: "10%",
      weightValue: 0.10,
      tips: [
        "Investissez dans la RSE",
        "Respectez les normes de sécurité",
        "Contribuez à la communauté locale",
      ],
    },
  ];

  const activeComponents = activeTab === "basic" ? terasBasicComponents : terasEntrepriseComponents;

  const scoreRanges = [
    { range: "800-1000", label: "Excellent", color: "green", descBasic: "Accès premium, taux préférentiels", descEntreprise: "Label TERAS+, avantages fiscaux max" },
    { range: "650-799", label: "Bon", color: "sky", descBasic: "Accès complet aux services", descEntreprise: "Crédit entreprise facilité" },
    { range: "500-649", label: "Moyen", color: "yellow", descBasic: "Services standard", descEntreprise: "Accompagnement recommandé" },
    { range: "350-499", label: "Faible", color: "orange", descBasic: "Accès limité, amélioration nécessaire", descEntreprise: "Audit recommandé" },
    { range: "0-349", label: "Très faible", color: "red", descBasic: "Accompagnement prioritaire", descEntreprise: "Plan d'action requis" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      sky: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
      green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
      yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
      purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
      orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
      red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
    };
    return colors[color] || colors.sky;
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6">
              <BarChart3 className="h-4 w-4" />
              Score de crédit alternatif
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Comprendre le{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                Score TERAS
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              TERAS est un score de crédit alternatif basé sur 5 piliers fondamentaux,
              adapté aux réalités économiques africaines. Découvrez comment il fonctionne
              et comment l'améliorer.
            </p>
          </div>
        </section>

        {/* Tabs Basic / Entreprise */}
        <section className="mx-auto max-w-7xl px-6 pb-8">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setActiveTab("basic")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
                  activeTab === "basic"
                    ? "bg-sky-500 text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                TERAS Basic
              </button>
              <button
                onClick={() => setActiveTab("entreprise")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
                  activeTab === "entreprise"
                    ? "bg-purple-500 text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                TERAS Entreprise
              </button>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            {activeTab === "basic"
              ? "Score destiné aux individus et travailleurs indépendants"
              : "Score destiné aux entreprises et structures formelles"}
          </p>
        </section>

        {/* 5 Composantes TERAS */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">Les 5 Piliers TERAS</h2>
          <div className="grid gap-6">
            {activeComponents.map((comp, i) => {
              const colors = getColorClasses(comp.color);
              return (
                <div
                  key={i}
                  className={`rounded-2xl border ${colors.border} bg-white/5 p-6 transition hover:bg-white/10`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Lettre et icône */}
                    <div className="flex items-center gap-4 lg:w-48 flex-shrink-0">
                      <div className={`h-14 w-14 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <span className={`text-2xl font-bold ${colors.text}`}>{comp.letter}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{comp.name}</div>
                        <div className={`text-sm ${colors.text}`}>{comp.weight}</div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-slate-300 mb-3">{comp.description}</p>
                      <p className="text-sm text-slate-500">
                        <span className="text-slate-400">Exemples : </span>
                        {comp.examples}
                      </p>
                    </div>

                    {/* Conseils */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Conseils
                      </div>
                      <ul className="space-y-1">
                        {comp.tips.map((tip, j) => (
                          <li key={j} className="text-sm text-slate-400 flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sources de données */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">Sources de Données</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeTab === "basic" ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sky-400 font-semibold mb-2">ZOLA Wallet</div>
                  <p className="text-sm text-slate-400">Transactions, épargne, revenus mobiles.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-green-400 font-semibold mb-2">SFEC</div>
                  <p className="text-sm text-slate-400">Factures numériques, achats déclarés.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-yellow-400 font-semibold mb-2">Déclarations</div>
                  <p className="text-sm text-slate-400">Actifs, revenus complémentaires.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-purple-400 font-semibold mb-2">Sounga</div>
                  <p className="text-sm text-slate-400">Notes communautaires, micro-crédit.</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sky-400 font-semibold mb-2">SFEC Entreprise</div>
                  <p className="text-sm text-slate-400">Ventes B2B, TVA, cohérence fiscale.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-green-400 font-semibold mb-2">ZOLA Business</div>
                  <p className="text-sm text-slate-400">Flux financiers, POS, trésorerie.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-yellow-400 font-semibold mb-2">CNSS</div>
                  <p className="text-sm text-slate-400">Emploi déclaré, cotisations CNSS.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-purple-400 font-semibold mb-2">Rapports RSE</div>
                  <p className="text-sm text-slate-400">Sounga Entreprise, responsabilité sociale.</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Échelle des scores */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">Interprétation du Score</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {scoreRanges.map((range, i) => {
              const colors = getColorClasses(range.color);
              return (
                <div key={i} className={`rounded-2xl border ${colors.border} bg-white/5 p-5 text-center`}>
                  <div className={`text-2xl font-bold ${colors.text} mb-1`}>{range.range}</div>
                  <div className="font-semibold mb-2">{range.label}</div>
                  <p className="text-sm text-slate-400">{activeTab === "basic" ? range.descBasic : range.descEntreprise}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Utilisations */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">Utilisations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTab === "basic" ? (
              <>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Éligibilité au micro-crédit</div>
                    <p className="text-sm text-slate-400">Accès à l'épargne automatisée et aux prêts ZOLA.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Limites et avantages</div>
                    <p className="text-sm text-slate-400">Détermination des limites de transaction, taux d'intérêt et cashback.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Tokenisation citoyenne</div>
                    <p className="text-sm text-slate-400">Accès à la bourse simplifiée ZOLA.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Inclusion financière</div>
                    <p className="text-sm text-slate-400">Analyse comportementale via TERAS IA.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Évaluation du risque crédit</div>
                    <p className="text-sm text-slate-400">Pour le crédit entreprise ou la fiscalité dynamique.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Label TERAS+</div>
                    <p className="text-sm text-slate-400">Accès aux avantages fiscaux et ZOLA Points.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Tokenisation entreprise</div>
                    <p className="text-sm text-slate-400">Base dans la bourse simplifiée ZOLA.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Support analytique</div>
                    <p className="text-sm text-slate-400">Pour les autorités fiscales et bancaires.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* TERAS IA - Section mise à jour (anciennement OKEBO) */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 flex items-center gap-3">
            <Brain className="h-8 w-8 text-sky-400" />
            IA Prédictive (TERAS IA)
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Analyse des variations</h3>
              <p className="text-slate-400 text-sm">Suivi des variations TERAS sur 6–12 mois pour détecter les tendances.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Modèles ML</h3>
              <p className="text-slate-400 text-sm">Régression et XGBoost pour prédire défaut ou croissance.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Assistant IA</h3>
              <p className="text-slate-400 text-sm">Chat explicatif pour comprendre votre score et recevoir des recommandations.</p>
            </div>
          </div>
        </section>

        {/* Détection d'anomalies */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8">Détection d'Anomalies</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1 text-yellow-200">Écart de comportement</div>
                <p className="text-sm text-slate-400">&gt;3σ sur flux transactions ou revenus</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1 text-yellow-200">Chute brutale</div>
                <p className="text-sm text-slate-400">&gt;20% de baisse mensuelle du score</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1 text-yellow-200">Incohérence</div>
                <p className="text-sm text-slate-400">Déclaration SFEC ↔ ZOLA Wallet</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className={`rounded-2xl border p-8 text-center ${activeTab === "basic" ? "border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent" : "border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent"}`}>
            <h3 className="text-2xl font-bold mb-2">
              Prêt à découvrir votre score {activeTab === "basic" ? "TERAS Basic" : "TERAS Entreprise"} ?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Créez votre compte gratuitement et obtenez une analyse complète avec des recommandations TERAS IA personnalisées.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigate("/register")} className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${activeTab === "basic" ? "bg-sky-500 hover:bg-sky-400 text-slate-900" : "bg-purple-500 hover:bg-purple-400 text-slate-900"}`}>
                Calculer mon score gratuitement
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/apercu")} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition">
                Voir un aperçu
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} TERAS. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}