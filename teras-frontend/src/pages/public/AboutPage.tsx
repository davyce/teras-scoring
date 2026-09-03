// src/pages/public/AboutPage.tsx

import { Hero } from "../../components/Hero";

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

function AboutPage({ onNavigate }: AboutPageProps) {
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <Hero title="À propos de TERAS" subtitle="Comprendre le moteur de scoring moderne pour l’Afrique">
      <div className="space-y-6 text-slate-200">
        <section className="bg-slate-900/40 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Qu’est-ce que TERAS ?</h2>
          <p className="text-slate-400 leading-relaxed">
            TERAS est un moteur de crédit-scoring moderne conçu pour analyser la stabilité
            financière des particuliers, entreprises et institutions à partir de données
            simples : transactions, revenus, épargne, activité professionnelle et comportements digitaux.
          </p>
        </section>

        <section className="bg-slate-900/40 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Les 5 Piliers du score</h2>
          <ul className="text-slate-300 space-y-2 list-disc list-inside">
            <li><strong>T — Transactions :</strong> comportement de dépenses, flux d’entrée/sortie</li>
            <li><strong>E — Épargne :</strong> capacité à conserver des fonds au fil du temps</li>
            <li><strong>R — Revenus :</strong> récurrence, stabilité, source de revenus</li>
            <li><strong>A — Actifs :</strong> biens détenus, historique et sécurité financière</li>
            <li><strong>S — Social :</strong> éléments de confiance (stabilité, identité, activité)</li>
          </ul>
        </section>

        <section className="bg-slate-900/40 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Pourquoi TERAS ?</h2>
          <p className="text-slate-400 leading-relaxed">
            TERAS a été créé pour offrir une approche transparente, moderne et adaptée
            au contexte des pays africains, où les données financières classiques sont souvent
            insuffisantes pour évaluer correctement un profil. TERAS apporte une approche
            numérique, simple et efficace.
          </p>
        </section>

        <section className="pt-4">
          <button
            onClick={() => handleNavigate?.("home")}
            className="px-4 py-2 rounded-lg bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 transition"
          >
            Retour à l’accueil
          </button>
        </section>
      </div>
    </Hero>
  );
}

export default AboutPage;
