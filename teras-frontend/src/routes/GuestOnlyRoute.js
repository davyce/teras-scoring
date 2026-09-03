import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Route pour visiteurs non authentifiés uniquement
 * @module routes/GuestOnlyRoute
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
/**
 * Helper pour déterminer le dashboard selon le type d'utilisateur
 */
function getDashboardPath(userType) {
    const normalizedType = (userType || 'individual').toLowerCase();
    switch (normalizedType) {
        case 'admin':
            return '/admin/dashboard';
        case 'government':
        case 'regional':
            return '/government/dashboard';
        case 'enterprise':
        case 'entreprise':
            return '/enterprise/dashboard';
        case 'bank':
        case 'banque':
            return '/bank/dashboard';
        case 'individual':
        case 'standard':
        default:
            return '/mon-espace';
    }
}
/**
 * Route accessible uniquement aux visiteurs non authentifiés
 * Redirige vers le dashboard approprié si l'utilisateur est déjà connecté
 */
export default function GuestOnlyRoute({ children }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    // Attendre que le chargement soit terminé
    if (isLoading) {
        return null; // ou un spinner
    }
    // Si déjà authentifié, rediriger vers le dashboard
    if (isAuthenticated && user) {
        console.log("👤 GuestOnlyRoute : Déjà authentifié, redirection dashboard");
        const dashboardPath = getDashboardPath(user.user_type);
        return _jsx(Navigate, { to: dashboardPath, replace: true });
    }
    console.log("👋 GuestOnlyRoute : Visiteur non authentifié, accès autorisé");
    return children;
}
