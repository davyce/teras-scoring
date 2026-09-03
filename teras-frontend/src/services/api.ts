// @ts-nocheck
// teras-frontend/src/services/api.ts
/**
 * Service API TERAS avec gestion JWT
 * Client HTTP configuré avec intercepteurs pour l'authentification
 */

// Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  user_type: string;
  profile?: {
    id: number;
    bio: string;
    created_at: string;
  };
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token storage
const TOKEN_KEY = 'teras_access_token';
const REFRESH_KEY = 'teras_refresh_token';

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// HTTP Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = tokenStorage.getAccessToken();

    // Headers par défaut
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ajouter le token JWT si disponible
    if (accessToken && !endpoint.includes('/token/')) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Gestion du refresh token si 401
      if (response.status === 401 && !endpoint.includes('/token/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry la requête avec le nouveau token
          headers['Authorization'] = `Bearer ${tokenStorage.getAccessToken()}`;
          const retryResponse = await fetch(url, { ...options, headers });
          const data = await retryResponse.json();
          return { data };
        } else {
          // Refresh failed, logout
          tokenStorage.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expirée');
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.detail || 'Erreur serveur',
        };
      }

      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Erreur de connexion',
      };
    }
  }

  // Méthodes HTTP
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Refresh token
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        tokenStorage.setTokens(data.access, data.refresh);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Instance du client
const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  /**
   * Connexion
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<TokenResponse>> {
    const response = await apiClient.post<TokenResponse>('/token/', credentials);
    
    if (response.data) {
      tokenStorage.setTokens(response.data.access, response.data.refresh);
    }
    
    return response;
  },

  /**
   * Inscription
   */
  async register(data: RegisterData): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<UserProfile>('/register/', data);
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<ApiResponse<any>> {
    const refreshToken = tokenStorage.getRefreshToken();
    const response = await apiClient.post('/logout/', { refresh: refreshToken });
    tokenStorage.clearTokens();
    return response;
  },

  /**
   * Profil utilisateur
   */
  async me(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/me/');
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },
};

// ============================================================================
// SCORING API
// ============================================================================

export interface ScoreInput {
  transactions: number;
  epargne: number;
  revenus: number;
  actifs: number;
  social: number;
}

export interface ScoreOutput {
  score: number;
  breakdown: {
    T: number;
    E: number;
    R: number;
    A: number;
    S: number;
  };
  profile_type: string;
  details: any;
}

export const scoringApi = {
  /**
   * Calculer un score TERAS
   */
  async compute(input: ScoreInput): Promise<ApiResponse<ScoreOutput>> {
    return apiClient.post<ScoreOutput>('/v1/scoring/compute/', input);
  },

  /**
   * Récupérer l'historique des scores
   */
  async getHistory(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/v1/scoring/history/');
  },

  /**
   * Exporter les scores en CSV
   */
  async exportCSV(): Promise<void> {
    const token = tokenStorage.getAccessToken();
    const url = `${API_BASE_URL}/v1/scoring/export/`;
    
    window.open(`${url}?token=${token}`, '_blank');
  },
};

// ============================================================================
// DOCUMENTS API
// ============================================================================

export const documentsApi = {
  /**
   * Liste des documents
   */
  async list(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/documents/');
  },

  /**
   * Upload un document
   */
  async upload(file: File, category: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const token = tokenStorage.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/documents/upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return { data };
  },
};

// Export du client
export default apiClient;
