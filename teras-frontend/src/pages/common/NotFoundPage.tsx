// src/pages/common/NotFoundPage.tsx

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-sky-400 mb-2">TERAS</p>
        <h1 className="text-4xl font-bold mb-3">404</h1>
        <p className="text-lg font-semibold mb-2">
          Page introuvable
        </p>
        <p className="text-sm text-slate-400 mb-6">
          La ressource que vous cherchez n&apos;existe pas ou plus.
          Vérifiez l&apos;URL ou revenez à l&apos;accueil.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#38BDF8", color: "#020617" }}
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "#223556", color: "#EAF2FF" }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
