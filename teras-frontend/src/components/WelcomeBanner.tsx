// src/components/WelcomeBanner.tsx
export default function WelcomeBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-indigo-500/10 p-4 md:p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-sky-400/20 flex items-center justify-center text-xl">👋</div>
        <div>
          <div className="text-slate-100 text-lg md:text-xl font-medium">
            Bienvenue sur <span className="text-sky-300">TERAS</span> !
          </div>
          <p className="text-slate-400 text-sm md:text-base">
            Explorez librement la simulation de score ci-dessous. En créant votre compte,
            vous obtiendrez votre score réel et des recommandations IA adaptées à votre profil.
          </p>
        </div>
      </div>
    </div>
  );
}
