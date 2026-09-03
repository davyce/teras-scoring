import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/routes/ProtectedRoute.tsx
/**
 * Composant de route protégée avec vérification d'authentification et de type d'utilisateur
 * Supporte tous les types: individual, enterprise, government, admin, bank
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
/**
 * Route protégée standard - vérifie l'authentification et le type d'utilisateur
 */
export default function ProtectedRoute({ children, allowedTypes }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    // Attendre que le chargement soit terminé
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto" }), _jsx("p", { className: "text-white mt-4", children: "Chargement..." })] }) }));
    }
    // Si pas authentifié, rediriger vers login
    if (!isAuthenticated || !user) {
        console.log('🔒 ProtectedRoute: Non authentifié, redirection vers /login');
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Si allowedTypes spécifié, vérifier le type d'utilisateur
    if (allowedTypes && allowedTypes.length > 0) {
        const userType = (user.user_type || 'individual').toLowerCase();
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
            return _jsx(Navigate, { to: redirectPath, replace: true });
        }
    }
    return _jsx(_Fragment, { children: children });
}
/**
 * Route protégée ADMIN uniquement
 */
export function AdminRoute({ children }) {
    return (_jsx(ProtectedRoute, { allowedTypes: ['admin'], children: children }));
}
/**
 * Route protégée ENTERPRISE uniquement
 */
export function EnterpriseRoute({ children }) {
    return (_jsx(ProtectedRoute, { allowedTypes: ['enterprise', 'entreprise'], children: children }));
}
/**
 * Route protégée GOVERNMENT uniquement
 */
export function GovernmentRoute({ children }) {
    return (_jsx(ProtectedRoute, { allowedTypes: ['government', 'regional'], children: children }));
}
/**
 * Route protégée BANK uniquement
 */
export function BankRoute({ children }) {
    return (_jsx(ProtectedRoute, { allowedTypes: ['bank', 'banque'], children: children }));
}
/**
 * Obtenir le chemin de redirection selon le type de compte
 */
function getRedirectPath(accountType) {
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
