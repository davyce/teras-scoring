// @ts-nocheck
// src/pages/auth/Login.tsx - AVEC LOGO TERAS OFFICIEL
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoTeras from "../../assets/logo-teras.svg";

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    user_type: 'individual' | 'enterprise' | 'government' | 'admin' | 'bank' | 'standard';
    first_name?: string;
    last_name?: string;
    is_active: boolean;
  };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const auth = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API_ENDPOINT = `${API_URL}/api/auth/login/`;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health/`, { method: "GET" });
        setBackendStatus(response.ok);
        console.log("✅ Backend health check:", response.ok ? "OK" : "FAILED");
      } catch (err) {
        console.error("❌ Backend unreachable:", err);
        setBackendStatus(false);
      }
    };
    checkBackend();
  }, [API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("\n=== TENTATIVE DE CONNEXION ===");
      console.log("Email:", email);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || 
          errorData.error || 
          errorData.non_field_errors?.[0] ||
          "Identifiants incorrects"
        );
      }

      const data: LoginResponse = await response.json();
      console.log("✅ Login réussi:", data.user.email, "Type:", data.user.user_type);

      if (!data.access || !data.refresh || !data.user) {
        throw new Error("Réponse serveur incomplète");
      }

      await auth.login(data);
      await new Promise(resolve => setTimeout(resolve, 100));

      const dashboardRoutes: Record<string, string> = {
        individual: '/mon-espace',
        standard: '/mon-espace',
        enterprise: '/enterprise/dashboard',
        entreprise: '/enterprise/dashboard',
        government: '/government/dashboard',
        regional: '/government/dashboard',
        admin: '/admin/dashboard',
        bank: '/bank/dashboard',
        banque: '/bank/dashboard',
      };

      const targetUrl = dashboardRoutes[data.user.user_type] || '/mon-espace';
      console.log("→ Redirection vers:", targetUrl);
      
      window.location.href = targetUrl;

    } catch (err: any) {
      console.error("❌ Erreur login:", err.message);
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] relative overflow-hidden">
      {/* Background animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f1829] to-[#0b1220]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      {/* Contenu */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Logo TERAS Officiel */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              {/* Glow effect autour du logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 blur-3xl opacity-40 animate-pulse" />
              
              {/* Container du logo */}
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
                {/* Logo SVG avec effet glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-2xl blur-xl" />
                  <img 
                    src={LogoTeras} 
                    alt="TERAS" 
                    className="relative w-32 h-32 mx-auto drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))' }}
                  />
                </div>
                
                {/* Texte TERAS */}
                <div className="mt-6">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-wider">
                    TERAS
                  </h1>
                  <p className="text-xs text-slate-400 font-semibold tracking-widest mt-2">
                    SYSTÈME DE NOTATION FINANCIÈRE
                  </p>
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-slate-300 font-medium text-lg">
              Connexion à votre espace sécurisé
            </p>
          </div>

          {/* Card de connexion */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20" />
            
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
              
              {/* Alerte backend */}
              {backendStatus === false && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                    </svg>
                    <div>
                      <p className="text-red-400 text-sm font-medium">Serveur non accessible</p>
                      <p className="text-red-300/70 text-xs mt-1">Vérifiez que Django est démarré sur le port 8000</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="votre@email.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connexion...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Se connecter
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Inscription */}
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Pas encore de compte ?{' '}
                  <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-slate-500 text-xs">
              Plateforme sécurisée de notation financière pour la région CEMAC
            </p>
            <p className="text-slate-600 text-xs">
              © 2025 TERAS • Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
