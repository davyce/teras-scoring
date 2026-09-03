// src/components/PublicNavbar.tsx

import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";  // ✅ CORRIGÉ : context au lieu de stores

import terasLogoUrl from "../assets/logo-teras.svg";

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();  // ✅ CORRIGÉ : utilise isAuthenticated au lieu de accessToken
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Accueil", to: "/" },
    { label: "Score de crédit", to: "/score-credit" },
    { label: "API", to: "/api-docs" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={terasLogoUrl}
            alt="TERAS"
            className="h-10 w-auto rounded-xl bg-[#020617] border border-sky-500/40 shadow-[0_0_18px_rgba(56,189,248,0.45)] p-1.5"
          />
          <span className="text-xl font-bold text-white">TERAS</span>
        </Link>

        {/* Nav Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-slate-300 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/mon-espace")}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition"
            >
              Mon Espace
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-slate-300 hover:text-white transition px-3 py-2"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition"
              >
                Créer un compte
              </button>
            </>
          )}
        </div>

        {/* Menu Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 px-6 py-4">
          <div className="space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block text-slate-300 hover:text-white py-2 transition"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/mon-espace");
                  }}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-medium text-slate-900 transition"
                >
                  Mon Espace
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/login");
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white transition"
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/register");
                    }}
                    className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-medium text-slate-900 transition"
                  >
                    Créer un compte
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
