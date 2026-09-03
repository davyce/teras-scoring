// src/pages/public/PreviewDashboard.tsx

import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  BarChart3,
  Clock,
  Target,
  Lock,
} from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";

/**
 * Composant de graphique linéaire SVG pour l'évolution du score
 */
interface ChartDataPoint {
  label: string;
  score: number;
}

function ScoreLineChart({ data }: { data: ChartDataPoint[] }) {
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const width = 800;
  const height = 250;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calcul des min/max pour l'échelle
  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores) - 20;
  const maxScore = Math.max(...scores) + 20;
  const scoreRange = maxScore - minScore;

  // Génération des points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.score - minScore) / scoreRange) * chartHeight,
    score: d.score,
    label: d.label,
  }));

  // Création du path pour la ligne
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Création du path pour l'aire sous la courbe
  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${padding.top + chartHeight}
    L ${points[0].x} ${padding.top + chartHeight}
    Z
  `;

  // Lignes de grille horizontales
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = padding.top + (i / numGridLines) * chartHeight;
    const scoreValue = Math.round(maxScore - (i / numGridLines) * scoreRange);
    gridLines.push({ y, score: scoreValue });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Définition du dégradé */}
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Lignes de grille horizontales */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={width - padding.right}
            y2={line.y}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 10}
            y={line.y + 4}
            textAnchor="end"
            fill="rgba(148, 163, 184, 0.8)"
            fontSize="12"
          >
            {line.score}
          </text>
        </g>
      ))}

      {/* Aire sous la courbe */}
      <path d={areaPath} fill="url(#areaGradient)" />

      {/* Ligne principale */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Points et labels */}
      {points.map((point, i) => (
        <g key={i}>
          {/* Ligne verticale */}
          <line
            x1={point.x}
            y1={padding.top}
            x2={point.x}
            y2={padding.top + chartHeight}
            stroke="rgba(255,255,255,0.05)"
          />

          {/* Point externe (glow) */}
          <circle
            cx={point.x}
            cy={point.y}
            r="8"
            fill="rgba(56, 189, 248, 0.2)"
          />

          {/* Point principal */}
          <circle
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#0f172a"
            stroke="url(#lineGradient)"
            strokeWidth="2"
          />

          {/* Score au-dessus du point */}
          <text
            x={point.x}
            y={point.y - 15}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="13"
            fontWeight="600"
          >
            {point.score}
          </text>

          {/* Label du mois */}
          <text
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            fill="rgba(148, 163, 184, 0.8)"
            fontSize="12"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Page d'aperçu du dashboard pour les visiteurs non connectés.
 * Affiche des données fictives pour montrer les fonctionnalités.
 */
export default function PreviewDashboard() {
  const navigate = useNavigate();

  // Données fictives pour l'aperçu
  const demoScore = 742;
  const demoScoreLabel = "Très bon";
  const demoHistory: ChartDataPoint[] = [
    { label: "Jan", score: 680 },
    { label: "Fév", score: 695 },
    { label: "Mar", score: 710 },
    { label: "Avr", score: 725 },
    { label: "Mai", score: 738 },
    { label: "Juin", score: 742 },
  ];
  const demoRecommendations = [
    {
      id: 1,
      title: "Augmentez votre épargne mensuelle",
      description: "Une épargne régulière de 50,000 FCFA/mois pourrait augmenter votre score de 30 points.",
      impactLabel: "+30 pts",
    },
    {
      id: 2,
      title: "Diversifiez vos revenus",
      description: "Ajoutez une source de revenus secondaire pour améliorer votre profil.",
      impactLabel: "+25 pts",
    },
    {
      id: 3,
      title: "Maintenez vos paiements à temps",
      description: "Continuez à payer vos factures avant échéance pour maintenir un bon historique.",
      impactLabel: "+15 pts",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <PublicNavbar />

      {/* Bandeau d'info */}
      <div className="bg-sky-500/10 border-b border-sky-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sky-200">
              <Lock className="h-4 w-4" />
              <span className="text-sm">
                Ceci est un aperçu avec des données fictives. Créez un compte pour voir votre vrai score.
              </span>
            </div>
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Retour */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </button>

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Aperçu du Tableau de Bord 👋
          </h2>
          <p className="text-slate-400">
            Voici à quoi ressemble votre espace TERAS (données de démonstration)
          </p>
        </div>

        {/* Alerte démo */}
        <div className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200">
              Aucun document récent. Ajoutez des relevés et bulletins pour améliorer la précision du score.
            </p>
          </div>
        </div>

        {/* Score & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Score Principal */}
          <div className="md:col-span-2 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Overlay flou pour indiquer que c'est un aperçu */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent pointer-events-none" />
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  Votre Score TERAS
                </h3>
                <span className="text-sm text-sky-300">{demoScoreLabel}</span>
              </div>
              <div className="px-3 py-1 bg-sky-500/20 border border-sky-500/30 rounded-full text-xs text-sky-300">
                Démo
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                {demoScore}
              </div>
              <span className="text-2xl text-slate-400">/1000</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-slate-300">
                Score potentiel :{" "}
                <span className="font-semibold text-green-400">812</span>
              </span>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Utilisation crédit</div>
              <div className="text-2xl font-bold text-white">32%</div>
            </div>
            
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Paiements à temps</div>
              <div className="text-2xl font-bold text-green-400">98%</div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Ancienneté crédit</div>
              <div className="text-2xl font-bold text-white">4 ans</div>
            </div>
          </div>
        </div>

        {/* Graphique d'évolution du Score */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-sky-400" />
            Évolution du Score
            <span className="ml-auto text-sm font-normal text-green-400">
              +62 pts sur 6 mois
            </span>
          </h3>
          
          {/* Graphique SVG */}
          <div className="w-full">
            <ScoreLineChart data={demoHistory} />
          </div>
          
          {/* Légende */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-500"></div>
              <span>Score mensuel</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span>Tendance haussière</span>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-green-400" />
            Recommandations IA
          </h3>
          <div className="space-y-4">
            {demoRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-green-500 hover:bg-slate-800 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  <span className="text-xs font-semibold text-green-400 px-2 py-1 bg-green-500/20 rounded">
                    {rec.impactLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activité récente */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-blue-400" />
              Activité Récente
            </h3>
            <div className="space-y-3">
              {[
                { label: "Score recalculé", detail: "Nouveau score: 742", time: "Il y a 2h" },
                { label: "Document analysé", detail: "Relevé bancaire Mai 2025", time: "Il y a 1j" },
                { label: "Recommandation suivie", detail: "Épargne augmentée", time: "Il y a 3j" },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.label}</p>
                    <p className="text-xs text-slate-400">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents récents */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-purple-400" />
              Documents Récents
            </h3>
            <div className="space-y-3">
              {[
                { name: "releve_bancaire_mai_2025.pdf", date: "15 mai 2025" },
                { name: "bulletin_salaire_avril.pdf", date: "30 avril 2025" },
                { name: "attestation_domicile.pdf", date: "12 avril 2025" },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-xs">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-400">{doc.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-12 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Prêt à découvrir votre vrai score ?
          </h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Créez votre compte gratuitement et obtenez votre score TERAS personnalisé,
            calculé à partir de vos vraies données financières.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition"
            >
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
