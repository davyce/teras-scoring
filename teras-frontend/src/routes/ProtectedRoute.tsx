// src/routes/ProtectedRoute.tsx
/**
 * Composant de route protégée avec vérification d'authentification et de type d'utilisateur
 * Supporte tous les types: individual, enterprise, government, admin, bank
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AccountType = 'individual' | 'standard' | 'enterprise' | 'entreprise' | 'government' | 'regional' | 'admin' | 'bank' | 'banque';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: AccountType[];
}

/**
 * Route protégée standard - vérifie l'authentification et le type d'utilisateur
 */
export default function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Attendre que le chargement soit terminé
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-white mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated || !user) {
    console.log('🔒 ProtectedRoute: Non authentifié, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  // Si allowedTypes spécifié, vérifier le type d'utilisateur
  if (allowedTypes && allowedTypes.length > 0) {
    const userType = (user.user_type || 'individual').toLowerCase() as AccountType;
    
    // Normaliser les types pour la comparaison
    const normalizedAllowedTypes = allowedTypes.map(t => t.toLowerCase());
    const isAllowed = normalizedAllowedTypes.includes(userType) ||
                     (userType === 'entreprise' && normalizedAllowedTypes.includes('enterprise')) ||
                     (userType === 'enterprise' && normalizedAllowedTypes.includes('entreprise')) ||
                     (userType === 'standard' && normalizedAllowedTypes.includes('individual')) ||
                     (userType === 'banque' && normalizedAllowedTypes.includes('bank'));
    
    console.log('🔐 ProtectedRoute check:', {
      userType,
      allowedTypes: normalizedAllowedTypes,
      isAllowed
    });

    if (!isAllowed) {
      console.warn('⛔ Accès refusé - Type non autorisé');
      
      // Rediriger vers le dashboard approprié
      const redirectPath = getRedirectPath(userType);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Route protégée ADMIN uniquement
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route protégée ENTERPRISE uniquement
 */
export function EnterpriseRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={['enterprise', 'entreprise']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route protégée GOVERNMENT uniquement
 */
export function GovernmentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={['government', 'regional']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route protégée BANK uniquement
 */
export function BankRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={['bank', 'banque']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Obtenir le chemin de redirection selon le type de compte
 */
function getRedirectPath(accountType: string): string {
  const normalizedType = (accountType || 'individual').toLowerCase();
  
  switch (normalizedType) {
    case 'individual':
    case 'standard':
      return '/mon-espace';
    case 'enterprise':
    case 'entreprise':
      return '/enterprise/dashboard';
    case 'government':
    case 'regional':
      return '/government/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'bank':
    case 'banque':
      return '/bank/dashboard';
    default:
      return '/login';
  }
}
