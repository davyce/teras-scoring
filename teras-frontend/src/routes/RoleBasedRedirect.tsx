// src/routes/RoleBasedRedirect.tsx
/**
 * RoleBasedRedirect — Redirige selon user_type après login
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REDIRECT_MAP: Record<string, string> = {
  individual:           '/mon-espace',
  standard:             '/mon-espace',
  user:                 '/mon-espace',
  client:               '/mon-espace',
  enterprise:           '/enterprise/dashboard',
  entreprise:           '/enterprise/dashboard',
  company:              '/enterprise/dashboard',
  government:           '/government/dashboard',
  regional:             '/government/dashboard',
  admin:                '/admin/dashboard',
  bank:                 '/bank/dashboard',
  banque:               '/bank/dashboard',
  banking:              '/bank/dashboard',
  financial_institution:'/bank/dashboard',
};

const TYPE_LABELS: Record<string, string> = {
  individual:  'Utilisateur',
  enterprise:  'Entreprise',
  government:  'Gouvernement',
  admin:       'Administrateur',
  bank:        'Banque',
};

const RoleBasedRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      console.log('🔒 Non authentifié → /login');
      navigate('/login', { replace: true });
      return;
    }

    const userType = (user.user_type || 'individual').toLowerCase();
    const destination = REDIRECT_MAP[userType] ?? '/mon-espace';

    console.log(`🔀 user_type="${userType}" → ${destination}`);
    window.location.href = destination;

  }, [isAuthenticated, user, isLoading, navigate]);

  const label = user?.user_type
    ? (TYPE_LABELS[user.user_type.toLowerCase()] ?? user.user_type)
    : '';

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl animate-pulse opacity-80" />
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold text-xl">Redirection en cours...</p>
          {label && <p className="text-sky-400 text-sm">Compte {label} détecté</p>}
          <div className="flex items-center justify-center gap-1 mt-4">
            {[0, 150, 300].map((delay) => (
              <div key={delay} className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;