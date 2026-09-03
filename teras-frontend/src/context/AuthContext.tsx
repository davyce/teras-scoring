// teras-frontend/src/context/AuthContext.tsx
/**
 * Contexte d'authentification TERAS - VERSION FINALE SANS BOUCLE
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  user_type: 'individual' | 'enterprise' | 'government' | 'admin' | 'bank';
  is_active: boolean;
}

interface LoginData {
  access: string;
  refresh: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrData: string | LoginData, password?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clés de stockage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'teras_access_token',
  REFRESH_TOKEN: 'teras_refresh_token',
  USER: 'teras_user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Charger les données du localStorage au démarrage
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        console.log('📦 Chargement depuis localStorage:', {
          hasToken: !!storedAccessToken,
          hasRefresh: !!storedRefreshToken,
          hasUser: !!storedUser
        });

        if (storedAccessToken && storedRefreshToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(userData);
          
          console.log('✅ Utilisateur restauré:', {
            email: userData.email,
            user_type: userData.user_type,
            isAuthenticated: true
          });
        }
      } catch (error) {
        console.error('❌ Erreur chargement auth:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Sauvegarder dans localStorage ET mettre à jour l'état immédiatement
  const saveAuth = (access: string, refresh: string, userData: User) => {
    console.log('💾 Sauvegarde auth:', {
      email: userData.email,
      user_type: userData.user_type
    });

    // Sauvegarder dans localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    
    // ✅ IMPORTANT : Mettre à jour l'état IMMÉDIATEMENT de manière synchrone
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(userData);

    console.log('✅ Auth sauvegardé, isAuthenticated sera true');
  };

  // Nettoyer l'authentification
  const clearAuth = () => {
    console.log('🗑️ Nettoyage auth');
    
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Login - Support 2 signatures
  const login = async (emailOrData: string | LoginData, password?: string) => {
    try {
      setIsLoading(true);

      // Si on reçoit un objet LoginData, sauvegarder directement
      if (typeof emailOrData === 'object') {
        console.log('✅ Login avec données existantes');
        const data = emailOrData as LoginData;
        
        // Sauvegarder AVANT de retourner
        saveAuth(data.access, data.refresh, data.user);
        
        // ✅ IMPORTANT: Ne PAS rediriger ici, laisser Login.tsx le faire
        return;
      }

      // Sinon, faire l'appel API
      console.log('📡 Login avec appel API');
      const email = emailOrData as string;
      
      if (!password) {
        throw new Error('Le mot de passe est requis');
      }

      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.error || 'Échec de connexion');
      }

      const data: LoginData = await response.json();
      saveAuth(data.access, data.refresh, data.user);

    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout sécurisé
  const logout = () => {
    try {
      if (accessToken) {
        fetch(`${API_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }).catch(err => console.error('Erreur logout API:', err));
      }
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  // Rafraîchir le access token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      clearAuth();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh token invalide');
      }

      const data = await response.json();
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access);
      setAccessToken(data.access);
      
    } catch (error) {
      console.error('Erreur refresh token:', error);
      clearAuth();
      window.location.href = '/login';
    }
  };

  // ✅ isAuthenticated dépend directement de l'état
  const isAuthenticated = !!accessToken && !!user;

  console.log('🔐 Auth state:', {
    isAuthenticated,
    isLoading,
    hasToken: !!accessToken,
    hasUser: !!user,
    userType: user?.user_type
  });

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
