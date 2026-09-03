/**
 * Store Zustand pour l'authentification multi-rôles
 * @module stores/auth
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  AccountType,
  GovernmentPermission,
  APIScope,
  AdminPermission,
  GovernmentUser,
  PartnerUser,
  AdminUser
} from "../types/auth.types";
import { getDashboardPath } from "../types/auth.types";

// ============================================================================
// INTERFACE DU STORE
// ============================================================================

interface AuthState {
  // État
  access: string | null;
  refresh: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions principales
  setTokens: (access: string, refresh?: string) => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Helpers pour le type de compte
  getAccountType: () => AccountType | null;
  getDashboardUrl: () => string;
  isIndividual: () => boolean;
  isEnterprise: () => boolean;
  isGovernment: () => boolean;
  isPartner: () => boolean;
  isAdmin: () => boolean;

  // Vérification des permissions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

// ============================================================================
// HELPER: DÉCODER LE JWT
// ============================================================================

/**
 * Décode un token JWT et extrait le payload
 */
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("❌ Erreur décodage JWT:", error);
    return null;
  }
}

// ============================================================================
// CRÉATION DU STORE
// ============================================================================

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      access: null,
      refresh: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Définir les tokens ET décoder le JWT pour extraire l'utilisateur
      setTokens: (access, refresh) => {
        console.log("🔐 Setting tokens:", {
          access: access ? "✓" : "✗",
          refresh: refresh ? "✓" : "✗"
        });

        // Sauvegarder dans localStorage pour compatibilité
        if (access) {
          localStorage.setItem("teras_access_token", access);
        }
        if (refresh) {
          localStorage.setItem("teras_refresh_token", refresh);
        }

        // 🔥 CORRECTION : Décoder le JWT pour extraire les données utilisateur
        let userData: any = null;
        if (access) {
          const payload = decodeJWT(access);
          if (payload) {
            userData = {
              id: payload.user_id,
              username: payload.username || payload.email,
              email: payload.email,
              first_name: payload.first_name || "",
              last_name: payload.last_name || "",
              user_type: payload.user_type || "standard",
              role: payload.role || "USER_BASIC",
              account_type: payload.account_type || payload.user_type || "individual",
              is_active: true,
              is_verified: payload.is_verified !== false,
              kyc_status: payload.kyc_status || "not_started",
              created_at: payload.created_at || new Date().toISOString(),
            };

            console.log("👤 User extrait du JWT:", userData);
          }
        }

        set({
          access,
          refresh: refresh || null,
          user: userData,
          isAuthenticated: !!access,
          error: null,
        });
      },

      // Définir l'utilisateur
      setUser: (user) => {
        console.log("👤 Setting user:", user);
        set({ user });
      },

      // Rafraîchir les données utilisateur depuis l'API
      refreshUser: async () => {
        const { access } = get();
        if (!access) {
          console.warn("⚠️ Cannot refresh user: no access token");
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Import dynamique pour éviter les dépendances circulaires
          const { getMe } = await import("../utils/auth");
          const userData = await getMe();

          console.log("🔄 User data refreshed:", userData);
          set({ user: userData, isLoading: false });
        } catch (err: any) {
          console.error("❌ Error refreshing user:", err);

          // Si le token est expiré, déconnecter
          if (err.message === "Token expired") {
            get().logout();
          } else {
            set({
              error: "Impossible de charger les données utilisateur",
              isLoading: false
            });
          }
        }
      },

      // Déconnexion
      logout: () => {
        console.log("🚪 Logging out");

        // Nettoyer le localStorage
        localStorage.removeItem("teras_access_token");
        localStorage.removeItem("teras_token");
        localStorage.removeItem("teras_refresh_token");

        set({
          access: null,
          refresh: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Gestion du loading
      setLoading: (loading) => set({ isLoading: loading }),

      // Gestion des erreurs
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ========================================
      // HELPERS TYPE DE COMPTE
      // ========================================

      getAccountType: () => {
        const { user } = get();
        if (!user) return null;

        // 🔥 PRIORITÉ: account_type > user_type > fallback
        const accountType =
          (user as any).account_type ||
          (user as any).user_type ||
          'individual';

        console.log("🔍 getAccountType:", {
          user_type: (user as any).user_type,
          account_type: (user as any).account_type,
          result: accountType
        });

        // Normaliser les valeurs
        if (accountType === 'standard') return 'individual';
        if (accountType === 'admin') return 'admin';
        if (accountType === 'entreprise') return 'enterprise';
        if (accountType === 'regional') return 'government';

        return accountType as AccountType;
      },

      getDashboardUrl: () => {
        const accountType = get().getAccountType();
        return getDashboardPath(accountType || 'individual');
      },

      isIndividual: () => {
        const type = get().getAccountType();
        return type === 'individual' || type === null;
      },

      isEnterprise: () => get().getAccountType() === 'enterprise',

      isGovernment: () => get().getAccountType() === 'government',

      isPartner: () => get().getAccountType() === 'partner',

      isAdmin: () => get().getAccountType() === 'admin',

      // ========================================
      // VÉRIFICATION DES PERMISSIONS
      // ========================================

      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;

        const accountType = get().getAccountType();

        // Admin super a toutes les permissions
        if (accountType === 'admin') {
          const adminUser = user as AdminUser;
          if (adminUser.admin_role === 'super_admin') return true;
          return adminUser.permissions?.includes(permission as AdminPermission) || false;
        }

        // Government permissions
        if (accountType === 'government') {
          const govUser = user as GovernmentUser;
          return govUser.permissions?.includes(permission as GovernmentPermission) || false;
        }

        // Partner permissions (scopes)
        if (accountType === 'partner') {
          const partnerUser = user as PartnerUser;
          return partnerUser.allowed_scopes?.includes(permission as APIScope) || false;
        }

        // Individuel et Entreprise n'ont pas de système de permissions granulaires
        return true;
      },

      hasAnyPermission: (permissions: string[]): boolean => {
        return permissions.some(p => get().hasPermission(p));
      },

      hasAllPermissions: (permissions: string[]): boolean => {
        return permissions.every(p => get().hasPermission(p));
      },
    }),
    {
      name: "teras-auth",
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================================================
// HOOKS UTILITAIRES
// ============================================================================

/**
 * Hook pour récupérer l'utilisateur avec le bon type
 */
export function useCurrentUser<T extends User>(): T | null {
  return useAuth((state) => state.user) as T | null;
}

/**
 * Hook pour vérifier l'accès à une route
 */
export function useRouteAccess(allowedTypes: AccountType[]): boolean {
  const getAccountType = useAuth((state) => state.getAccountType);
  const accountType = getAccountType();

  if (!accountType) return false;
  return allowedTypes.includes(accountType);
}

/**
 * Hook pour vérifier une permission
 */
export function usePermission(permission: string): boolean {
  const hasPermission = useAuth((state) => state.hasPermission);
  return hasPermission(permission);
}

/**
 * Hook pour vérifier plusieurs permissions (any)
 */
export function useAnyPermission(permissions: string[]): boolean {
  const hasAnyPermission = useAuth((state) => state.hasAnyPermission);
  return hasAnyPermission(permissions);
}

export default useAuth;