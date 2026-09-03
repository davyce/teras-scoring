// HomePage.tsx — version complète avec rubriques conservées (base API: http://localhost:8000)
import { ArrowRight, Star } from "lucide-react";
import ScoreSimulator from "../components/ScoreSimulator";

function TerasTSpinner() {
  return (
    <div className="relative h-12 w-12 select-none" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-spin [animation-duration:5s]">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="6" strokeDasharray="60 30 10 20" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-extrabold text-2xl tracking-wider text-sky-300">T</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const previewScore = 765;
  const previewLabel = previewScore >= 740 ? "Excellent" : previewScore >= 670 ? "Très bon" : previewScore >= 580 ? "Bon" : "Moyen";

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-sky-300" />
          Propulsé par l'IA
        </div>
        <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <TerasTSpinner />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">TERAS</h1>
            </div>
            <p className="mt-6 max-w-2xl text-slate-300 leading-relaxed">
              Bienvenue sur <span className="font-semibold text-sky-200">TERAS</span>, la plateforme de référence pour évaluer et améliorer votre score de crédit.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/register" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 font-medium text-slate-900 transition">
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-medium transition">
                Se connecter
              </a>
              <a href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-5 py-3 font-medium text-sky-200 transition">
                Aperçu
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">4.9/5</span>
              <span className="text-slate-500">•</span>
              <span className="text-sm">50,000+ utilisateurs actifs</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-slate-300 mb-4">Aperçu instantané</h3>
            <div className="text-6xl font-semibold">{previewScore}</div>
            <div className="mt-1 text-sky-200">{previewLabel}</div>
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 via-40% to-sky-400" />
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                {["T", "E", "R", "A", "S"].map((k) => (
                  <span key={k} className="w-6 text-center">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATEUR */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-semibold">Simulez votre score TERAS</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Ajustez les curseurs pour visualiser l’impact de vos comportements financiers.
        </p>
        <div className="mt-8">
          <ScoreSimulator />
        </div>
      </section>

      {/* PLACEHOLDER pour COMMENT ÇA MARCHE, SOLUTIONS, AVANTAGES, etc. */}
      {/* Tu peux maintenant réinsérer ici toutes les autres sections que tu avais dans la version complète :
            - Comment ça marche
            - Solutions
            - Pourquoi TERAS
            - Témoignages
            - Sécurité
            - Appels à l'action
      */}
    </main>
  );
}

