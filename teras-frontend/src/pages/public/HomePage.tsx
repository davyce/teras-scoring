// src/pages/public/HomePage.tsx

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Star,
  CheckCircle2,
  Shield,
  Lock,
  Globe,
  Clock,
  LineChart,
  Bot,
  Building2,
  Server,
  KeyRound,
} from "lucide-react";
import ScoreSimulator from "../../components/ScoreSimulator";
import PublicNavbar from "../../components/PublicNavbar";

/** Logo animé T (anneau qui tourne) */
function TerasTSpinner() {
  return (
    <div className="relative h-12 w-12 select-none" aria-hidden="true">
      {/* Anneau extérieur animé */}
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full animate-spin [animation-duration:5s]"
      >
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="rgba(56,189,248,0.35)"
          strokeWidth="6"
          strokeDasharray="60 30 10 20"
          strokeLinecap="round"
        />
      </svg>

      {/* Anneau intérieur */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="rgba(56,189,248,0.15)"
          strokeWidth="2"
        />
      </svg>

      {/* T central */}
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-extrabold text-2xl tracking-wider text-sky-300">
          T
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const previewScore = 765;
  const previewLabel =
    previewScore >= 800
      ? "Excellent"
      : previewScore >= 740
      ? "Très bon"
      : previewScore >= 670
      ? "Bon"
      : previewScore >= 580
      ? "Moyen"
      : "Faible";

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      {/* NAVBAR PUBLIQUE */}
      <PublicNavbar />

      <main>
        {/* HERO --------------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90">
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-sky-300" />
            Propulsé par l'IA
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center">
            {/* Texte principal */}
            <div>
              <div className="flex items-center gap-3">
                <TerasTSpinner />
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  TERAS
                </h1>
              </div>

              <p className="mt-6 max-w-2xl text-slate-300 leading-relaxed">
                Bienvenue sur{" "}
                <span className="font-semibold text-sky-200">TERAS</span>, la
                plateforme de référence pour évaluer et améliorer votre score de
                crédit. Vision claire, score en temps réel, analyse IA et
                recommandations personnalisées. Simulez ci-dessous, puis créez
                votre compte pour accéder à votre analyse complète.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 font-medium text-slate-900 transition"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-medium transition"
                >
                  Se connecter
                </button>

                <button
                  onClick={() => navigate("/apercu")}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-5 py-3 font-medium text-sky-200 transition"
                  title="Voir un aperçu du tableau de bord"
                >
                  Aperçu
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm">4.9/5</span>
                <span className="text-slate-500">•</span>
                <span className="text-sm">50,000+ utilisateurs actifs</span>
              </div>
            </div>

            {/* Carte aperçu score */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-slate-300 mb-4">Aperçu instantané</h3>
              <div className="text-6xl font-semibold">{previewScore}</div>
              <div className="mt-1 text-sky-200">{previewLabel}</div>
              <div className="mt-6">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 via-40% to-sky-400" />
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  {["T", "E", "R", "A", "S"].map((k) => (
                    <span key={k} className="w-6 text-center">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIMULATEUR TERAS --------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Simulez votre score TERAS
          </h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Ajustez les curseurs pour visualiser l'impact de vos comportements
            financiers (Transactions, Épargne, Revenus, Actifs, Social). Le score
            réel s'affiche après connexion, à partir de vos données sécurisées.
          </p>
          <div className="mt-8">
            <ScoreSimulator />
          </div>
        </section>

        {/* COMMENT ÇA MARCHE -------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Comment ça fonctionne ?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Créez votre compte",
                d: "Inscription rapide et sécurisée. Aucune carte de crédit requise pour commencer.",
              },
              {
                n: "2",
                t: "Connectez vos données",
                d: "Import sécurisé de vos informations financières. Chiffrement de niveau bancaire.",
              },
              {
                n: "3",
                t: "Obtenez votre score",
                d: "Visualisez votre score et recevez des recommandations personnalisées.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 inline-flex items-center justify-center h-10 w-10 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold">
                  {step.n}
                </div>
                <h3 className="font-semibold mb-1">{step.t}</h3>
                <p className="text-slate-300">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FONCTIONNALITÉS ---------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Fonctionnalités principales
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <LineChart className="h-5 w-5" />,
                t: "Score en temps réel",
                d: "Visualisez votre score instantanément après chaque mise à jour.",
              },
              {
                icon: <Bot className="h-5 w-5" />,
                t: "Recommandations IA",
                d: "Conseils personnalisés pour améliorer votre profil financier.",
              },
              {
                icon: <Clock className="h-5 w-5" />,
                t: "Historique complet",
                d: "Suivez l'évolution de votre score dans le temps.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                t: "Sécurité maximale",
                d: "Architecture zéro confiance, audits et monitoring continu.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1">{item.t}</h3>
                <p className="text-slate-300">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SÉCURITÉ & CONFORMITÉ ----------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Sécurité & conformité
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: <Shield className="h-5 w-5" />,
                t: "ISO 27001",
                d: "Cadre de sécurité reconnu pour la gestion de l'information.",
              },
              {
                icon: <Lock className="h-5 w-5" />,
                t: "Chiffrement AES-256",
                d: "Protection de bout en bout de vos données sensibles.",
              },
              {
                icon: <KeyRound className="h-5 w-5" />,
                t: "RGPD",
                d: "Respect strict de la vie privée et gestion du consentement.",
              },
              {
                icon: <Globe className="h-5 w-5" />,
                t: "SOC 2 Type II",
                d: "Contrôles, journaux et audits réguliers.",
              },
            ].map((sec, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                  {sec.icon}
                </div>
                <h3 className="font-semibold mb-1">{sec.t}</h3>
                <p className="text-slate-300">{sec.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* API TERAS ----------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">API TERAS</h2>
          <p className="text-slate-300 max-w-3xl">
            Intégrez TERAS dans vos systèmes (ZOLA, SFEC, banques, ERP, etc).
            API REST complète, webhooks et futur SDK pour les principales
            plateformes.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Server className="h-5 w-5" />,
                t: "REST API",
                d: "Endpoints pour calculer, consulter et auditer les scores.",
              },
              {
                icon: <Globe className="h-5 w-5" />,
                t: "Webhooks",
                d: "Notifications en temps réel lorsqu'un score change.",
              },
              {
                icon: <KeyRound className="h-5 w-5" />,
                t: "Auth sécurisée",
                d: "JWT, OAuth2 et clés API avec scopes granularisés.",
              },
            ].map((api, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
                  {api.icon}
                </div>
                <h3 className="font-semibold mb-1">{api.t}</h3>
                <p className="text-slate-300">{api.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TÉMOIGNAGES -------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Ils nous font confiance
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                q: "TERAS m'a permis d'augmenter mon score de 120 points en 6 mois avec des actions concrètes.",
                a: "Sophie Lemaire — Particulier",
              },
              {
                q: "L'API TERAS s'intègre parfaitement. Nous évaluons la solvabilité de nos clients en temps réel.",
                a: "Marc Dubois — CTO, FinTech Pro",
              },
              {
                q: "Interface intuitive, données claires et support pro. Indispensable pour nos décisions.",
                a: "Alice Bernard — Dirigeante PME",
              },
            ].map((testi, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <p className="text-slate-200">"{testi.q}"</p>
                <p className="mt-4 text-sm text-slate-400">{testi.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ----------------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Questions fréquentes
          </h2>
          <div className="grid gap-6">
            {[
              {
                q: "Qu'est-ce qu'un score de crédit TERAS ?",
                a: "Une évaluation numérique (0–1000) de votre solvabilité, calculée à partir de vos données réelles via la méthode T-E-R-A-S.",
              },
              {
                q: "Comment TERAS calcule-t-il mon score ?",
                a: "Notre méthode T-E-R-A-S analyse Transactions, Épargne, Revenus, Actifs & Social. L'IA permet d'ajuster les pondérations selon le contexte.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Oui. Chiffrement de niveau bancaire, anonymisation lorsque c'est possible et stockage sur des infrastructures certifiées.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="font-semibold mb-1">{faq.q}</h3>
                <p className="text-slate-300">{faq.a}</p>
              </div>
            ))}
          </div>
          <Link
            to="/score-credit"
            className="mt-6 inline-block rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium transition"
          >
            En savoir plus sur le score de crédit
          </Link>
        </section>

        {/* CTA FINAL ----------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8">
            <h3 className="text-xl font-semibold">Prêt à démarrer ?</h3>
            <p className="text-slate-300 mt-1">
              Créez votre compte en quelques secondes et obtenez votre score
              TERAS, calculé à partir de vos vraies données.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 font-medium text-slate-900 transition"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-medium transition"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate("/apercu")}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-transparent hover:bg-sky-500/10 px-5 py-3 font-medium text-sky-200 transition"
              >
                Voir l'aperçu
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER ------------------------------------------------- */}
        <footer className="border-t border-white/10 bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h4 className="font-semibold text-white mb-4">TERAS</h4>
                <p className="text-sm text-slate-400">
                  La plateforme de référence pour évaluer et améliorer votre score de crédit en Afrique.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Produit</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link to="/score-credit" className="hover:text-white transition">Score de crédit</Link></li>
                  <li><Link to="/api-docs" className="hover:text-white transition">API</Link></li>
                  <li><Link to="/tarifs" className="hover:text-white transition">Tarifs</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Entreprise</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link to="/a-propos" className="hover:text-white transition">À propos</Link></li>
                  <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                  <li><Link to="/carrières" className="hover:text-white transition">Carrières</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Légal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link to="/confidentialite" className="hover:text-white transition">Confidentialité</Link></li>
                  <li><Link to="/conditions" className="hover:text-white transition">Conditions</Link></li>
                  <li><Link to="/securite" className="hover:text-white transition">Sécurité</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} TERAS. Tous droits réservés.
              </p>
              <div className="flex items-center gap-4 text-slate-400">
                <a href="#" className="hover:text-white transition">Twitter</a>
                <a href="#" className="hover:text-white transition">LinkedIn</a>
                <a href="#" className="hover:text-white transition">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
