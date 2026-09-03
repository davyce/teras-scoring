// src/pages/user/CreditScoreInfo.tsx

import {
  ArrowLeft,
  Info,
  ListChecks,
  Sparkles,
  TrendingUp,
  Wand2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TerasLogo from "../../components/TerasLogo";
import GradientGauge from "../../components/GradientGauge";

const WEIGHTS = { T: 0.28, E: 0.18, R: 0.22, A: 0.2, S: 0.12 };

// Route de la page prototype / simulateur TERAS.
// 👉 adapte ici si ton routeur utilise un autre path.
const PROTOTYPE_PATH = "/prototype";

const toPublic = (score1000: number) =>
  Math.round(300 + (score1000 / 1000) * (850 - 300));
const n = (v: number) => Math.max(0, Math.min(100, v)) / 100;
const computePublicFromInputs = ({ T, E, R, A, S }: any) =>
  toPublic(
    1000 *
      (WEIGHTS.T * n(T) +
        WEIGHTS.E * n(E) +
        WEIGHTS.R * n(R) +
        WEIGHTS.A * n(A) +
        WEIGHTS.S * n(S))
  );

export default function CreditScoreInfo() {
  const nav = useNavigate();

  const ex1 = { T: 80, E: 70, R: 75, A: 60, S: 65 };
  const ex2 = { T: 55, E: 40, R: 60, A: 35, S: 50 };
  const ex3 = { T: 30, E: 25, R: 40, A: 20, S: 35 };

  const s1 = computePublicFromInputs(ex1);
  const s2 = computePublicFromInputs(ex2);
  const s3 = computePublicFromInputs(ex3);

  // 👉 Envoi vers la page prototype avec les valeurs pré-remplies
  function goToPrototypeWith(inputs: { T: number; E: number; R: number; A: number; S: number }) {
    const params = new URLSearchParams({
      T: String(inputs.T),
      E: String(inputs.E),
      R: String(inputs.R),
      A: String(inputs.A),
      S: String(inputs.S),
    });
    nav(`${PROTOTYPE_PATH}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <TerasLogo size={44} animate="hover-tilt" />
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-semibold text-white">
                Qu’est-ce que le score de crédit TERAS ?
              </h1>
              <p className="text-sm text-slate-400">
                Comprendre comment TERAS mesure la fiabilité financière (Basic, Entreprise, Régional).
              </p>
            </div>
          </div>
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 border border-sky-400/30 hover:bg-sky-400/10 rounded-md px-3 py-1 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        {/* Bloc "Comprendre" */}
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#9BD2FF]" />
            <h2 className="text-2xl font-medium text-white">Comprendre simplement</h2>
          </div>
          <p className="text-white/80 leading-relaxed mb-3">
            Le score de crédit mesure votre fiabilité financière. Plus le score est élevé, plus vous
            êtes perçu comme stable et responsable. TERAS transforme un score interne sur 1000 en une
            échelle lisible, de 300 à 850.
          </p>
          <p className="text-white/70 leading-relaxed mb-3">
            Ce score est utilisé par les banques, les fintechs et les institutions pour évaluer le
            risque de crédit, proposer des limites adaptées, et ajuster les conditions (taux,
            garanties, délais).
          </p>
          <p className="text-white/70 text-sm italic">
            Exemple : un score élevé ouvre plus facilement l’accès à un crédit, à de meilleurs
            montants et à de meilleures conditions.
          </p>
        </div>

        {/* Méthode TERAS */}
        <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-[#9BD2FF]" />
            <h2 className="text-xl font-medium">La méthode TERAS (T • E • R • A • S)</h2>
          </div>
          <p className="text-white/70 mb-5">
            Cinq piliers pondérés composent un score interne de 0 à 1000 points, ensuite converti en
            échelle publique 300–850. Chaque pilier a un poids différent dans le calcul final :
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            <Stat label="T • Transactions" w={WEIGHTS.T} descr="Fréquence, volume, régularité, incidents" />
            <Stat label="E • Épargne" w={WEIGHTS.E} descr="Capacité à conserver un coussin de sécurité" />
            <Stat label="R • Revenus" w={WEIGHTS.R} descr="Niveau, stabilité, diversité des sources" />
            <Stat label="A • Actifs" w={WEIGHTS.A} descr="Biens, liquidités, garanties mobilisables" />
            <Stat label="S • Social" w={WEIGHTS.S} descr="Stabilité, ancienneté, comportement global" />
          </div>
          <p className="text-xs text-white/40 mt-4">
            Pondérations actuelles :{" "}
            {Object.entries(WEIGHTS)
              .map(([k, v]) => `${k} ${v.toFixed(2)}`)
              .join(" • ")}
          </p>
        </section>

        {/* Échelle 300–850 */}
        <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#9BD2FF]" />
            <h2 className="text-xl font-medium">Échelle publique TERAS (300 – 850)</h2>
          </div>
          <p className="text-white/70 mb-4">
            Le score interne (0–1000) est converti en une échelle standard utilisée par les
            institutions financières. Cela permet une lecture rapide et homogène du niveau de risque.
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="text-left px-4 py-2">Tranche</th>
                  <th className="text-left px-4 py-2">Qualification</th>
                  <th className="text-left px-4 py-2">Lecture</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { r: "800 – 850", q: "Excellent", d: "Risque très faible, profils premium" },
                  { r: "740 – 799", q: "Très bon", d: "Risque faible, accès large au crédit" },
                  { r: "670 – 739", q: "Bon", d: "Risque modéré, conditions standard" },
                  { r: "580 – 669", q: "Moyen", d: "Risque accru, conditions plus prudentes" },
                  { r: "300 – 579", q: "Faible", d: "Risque élevé, accès limité" },
                ].map((row) => (
                  <tr key={row.r} className="border-t border-white/10">
                    <td className="px-4 py-2">{row.r}</td>
                    <td className="px-4 py-2">{row.q}</td>
                    <td className="px-4 py-2 text-white/70">{row.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <GradientGauge value={765} min={300} max={850} />
          </div>
        </section>

        {/* Exemples + bouton Aperçu prototype */}
        <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-[#9BD2FF]" />
            <h2 className="text-xl font-medium">Exemples de profils</h2>
          </div>
          <p className="text-white/70 mb-4">
            Ces profils sont fictifs mais permettent de visualiser comment les cinq piliers impactent
            le score. Tu peux ensuite ouvrir un <span className="text-sky-300">prototype TERAS</span>{" "}
            pré-rempli avec ces paramètres pour tester le simulateur.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <ExampleCard
              title="Profil A — Excellent"
              inputs={ex1}
              score={s1}
              description="Client très stable, historique dense de transactions et bonne épargne."
              onPreview={() => goToPrototypeWith(ex1)}
            />
            <ExampleCard
              title="Profil B — Moyen"
              inputs={ex2}
              score={s2}
              description="Revenus corrects mais épargne irrégulière et actifs limités."
              onPreview={() => goToPrototypeWith(ex2)}
            />
            <ExampleCard
              title="Profil C — Fragile"
              inputs={ex3}
              score={s3}
              description="Peu d’épargne, revenus parfois irréguliers, profil à accompagner."
              onPreview={() => goToPrototypeWith(ex3)}
            />
          </div>
        </section>

        {/* Comment améliorer son score */}
        <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-[#9BD2FF]" />
            <h2 className="text-xl font-medium">Comment améliorer son score TERAS ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-white/75">
            <ul className="space-y-2">
              <li className="font-semibold text-sky-300">Transactions (T)</li>
              <li>• Éviter les incidents (rejets, impayés).</li>
              <li>• Utiliser des canaux formels (mobile money, banque).</li>
              <li>• Maintenir une activité régulière plutôt que des pics ponctuels.</li>
            </ul>
            <ul className="space-y-2">
              <li className="font-semibold text-sky-300">Épargne & Actifs (E, A)</li>
              <li>• Mettre de côté un petit montant de façon automatique.</li>
              <li>• Centraliser l’épargne sur des comptes traçables.</li>
              <li>• Formaliser les biens (titres, documents officiels).</li>
            </ul>
            <ul className="space-y-2">
              <li className="font-semibold text-sky-300">Revenus & Social (R, S)</li>
              <li>• Stabiliser les revenus (contrats, récurrence).</li>
              <li>• Garder une adresse / numéro / compte stables dans le temps.</li>
              <li>• Éviter les ruptures fréquentes de relation bancaire.</li>
            </ul>
          </div>
        </section>

        {/* Encadré usage Pro / Institutionnel */}
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-6 md:p-8 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-medium text-emerald-100">
              TERAS Entreprise & TERAS Régional
            </h2>
          </div>
          <p className="text-sm text-emerald-100/90 mb-2">
            • <span className="font-semibold">TERAS Basic</span> : scoring individuel, intégration
            dans ZOLA / super-apps grand public.
          </p>
          <p className="text-sm text-emerald-100/90 mb-2">
            • <span className="font-semibold">TERAS Entreprise</span> : analyse de portefeuilles
            clients, scoring par segments, dashboards crédit.
          </p>
          <p className="text-sm text-emerald-100/90">
            • <span className="font-semibold">TERAS Régional</span> : vues agrégées par pays / zone
            (CEMAC, UEMOA, etc.), indicateurs macro pour banques centrales et régulateurs.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  w,
  descr,
}: {
  label: string;
  w: number;
  descr: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1426] p-4">
      <div className="text-slate-200 font-medium">{label}</div>
      <div className="text-xs text-white/50">Poids {Math.round(w * 100)}%</div>
      <div className="text-white/70 text-sm mt-2">{descr}</div>
    </div>
  );
}

function ExampleCard({
  title,
  inputs,
  score,
  description,
  onPreview,
}: {
  title: string;
  inputs: any;
  score: number;
  description: string;
  onPreview?: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1426] p-5 flex flex-col">
      <div className="text-slate-200 font-medium">{title}</div>
      <div className="text-4xl font-bold mt-2">{score}</div>
      <div className="my-3">
        <GradientGauge value={score} min={300} max={850} />
      </div>
      <p className="text-xs text-white/70 mb-3 flex-1">{description}</p>
      <div className="grid grid-cols-5 gap-2 text-xs text-white/70 mb-3">
        {(["T", "E", "R", "A", "S"] as const).map((k) => (
          <div
            key={k}
            className="rounded-lg bg-white/5 border border-white/10 p-2 text-center"
          >
            <div className="text-white/60">{k}</div>
            <div className="font-semibold">{(inputs as any)[k]}/100</div>
          </div>
        ))}
      </div>

      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className="mt-auto w-full text-xs font-medium rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400 transition-colors py-2"
        >
          Voir un aperçu dans le prototype
        </button>
      )}
    </div>
  );
}
