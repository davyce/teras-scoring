// teras-frontend/src/services/governmentApi.ts
/**
 * API Client pour l'interface Government TERAS
 * Gère tous les appels API avec types TypeScript
 */

import apiClient, { ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardData {
  metrics: {
    total_population: number;
    active_users: number;
    average_score: number;
    scores_today: number;
    monthly_growth: number;
  };
  users_by_type: Array<{
    user_type: string;
    count: number;
  }>;
  recent_activity: Array<{
    id: number;
    user: string;
    type: string;
    score: number;
    timestamp: string;
  }>;
}

export interface Region {
  id: number;
  name: string;
  code: string;
  population: number;
  avg_score: number;
  active_rate: number;
}

export interface RegionsData {
  total_users: number;
  regions: Region[];
}

export interface Sector {
  id: number;
  name: string;
  code: string;
  businesses: number;
  avg_score: number;
  growth: number;
}

export interface SectorsData {
  total_enterprises: number;
  sectors: Sector[];
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  timestamp: string;
}

export interface AlertsData {
  count: number;
  alerts: Alert[];
}

export interface GovernmentMapMarker {
  id: string;
  marker_type: 'user' | 'country';
  restricted: boolean;
  country: string;
  country_name: string;
  latitude: number;
  longitude: number;
  city?: string;
  detail_scope?: string;
  location_source?: string;
  full_name?: string;
  user_type?: string;
  address?: string;
  is_active?: boolean;
  score?: number | null;
  risk_level?: 'low' | 'medium' | 'high' | null;
  location_updated_at?: string | null;
  total_users?: number;
  active_users?: number;
  avg_score?: number | null;
  type_breakdown?: Array<{
    user_type: string;
    count: number;
  }>;
  message?: string;
}

export interface GovernmentUsersMapData {
  viewer_country: string | null;
  viewer_country_name: string;
  access_mode: string;
  filters: {
    country?: string | null;
    type?: string | null;
    status?: string | null;
    source?: string | null;
  };
  summary: {
    detailed_users: number;
    aggregated_markers: number;
    total_geolocated: number;
  };
  markers: GovernmentMapMarker[];
  generated_at: string;
}

export interface Report {
  id: string;
  type: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_users: number;
    new_users: number;
    avg_score: number;
    scores_calculated: number;
  };
  generated_at: string;
  download_url: string;
}

export interface Settings {
  system: {
    version: string;
    environment: string;
    maintenance_mode: boolean;
  };
  scoring: {
    active_profile: string;
    region: string;
    country: string;
  };
  alerts: {
    enabled: boolean;
    email_notifications: boolean;
    threshold_low_score: number;
    threshold_high_risk: number;
  };
}

// ============================================================================
// API CLIENT
// ============================================================================

export const governmentApi = {
  /**
   * Dashboard principal
   */
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return apiClient.get<DashboardData>("/scoring/government/dashboard/");
  },

  /**
   * Liste des régions
   */
  async getRegions(): Promise<ApiResponse<RegionsData>> {
    return apiClient.get<RegionsData>('/scoring/government/regions/');
  },

  /**
   * Détails d'une région
   */
  async getRegion(id: number): Promise<ApiResponse<Region>> {
    return apiClient.get<Region>(`/scoring/government/regions/${id}/`);
  },

  /**
   * Liste des secteurs
   */
  async getSectors(): Promise<ApiResponse<SectorsData>> {
    return apiClient.get<SectorsData>('/scoring/government/sectors/');
  },

  /**
   * Détails d'un secteur
   */
  async getSector(id: number): Promise<ApiResponse<Sector>> {
    return apiClient.get<Sector>(`/scoring/government/sectors/${id}/`);
  },

  /**
   * Liste des alertes
   */
  async getAlerts(): Promise<ApiResponse<AlertsData>> {
    return apiClient.get<AlertsData>('/scoring/government/alerts/');
  },

  /**
   * Carte des utilisateurs géolocalisés CEMAC
   */
  async getUsersMap(params?: {
    country?: string;
    type?: string;
    status?: string;
    source?: string;
  }): Promise<ApiResponse<GovernmentUsersMapData>> {
    const qp = new URLSearchParams();
    if (params?.country) qp.append('country', params.country);
    if (params?.type) qp.append('type', params.type);
    if (params?.status) qp.append('status', params.status);
    if (params?.source) qp.append('source', params.source);

    const url = `/scoring/government/users/map/${qp.toString() ? `?${qp.toString()}` : ''}`;
    return apiClient.get<GovernmentUsersMapData>(url);
  },

  /**
   * Détails d'une alerte
   */
  async getAlert(id: number): Promise<ApiResponse<Alert>> {
    return apiClient.get<Alert>(`/scoring/government/alerts/${id}/`);
  },

  /**
   * Liste des rapports
   */
  async getReports(): Promise<ApiResponse<{ count: number; reports: Report[] }>> {
    return apiClient.get<{ count: number; reports: Report[] }>('/scoring/government/reports/');
  },

  /**
   * Générer un rapport gouvernemental persistant
   */
  async generateReport(type = 'monthly'): Promise<ApiResponse<Report>> {
    return apiClient.post<Report>('/scoring/government/reports/generate/', { report_type: type });
  },

  /**
   * Télécharger un rapport
   */
  async downloadReport(id: number): Promise<void> {
    window.open(`/api/scoring/government/reports/${id}/download/`, '_blank');
  },

  /**
   * Récupérer les paramètres
   */
  async getSettings(): Promise<ApiResponse<Settings>> {
    return apiClient.get<Settings>('/scoring/government/settings/');
  },

  /**
   * Mettre à jour les paramètres
   */
  async updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    return apiClient.patch<Settings>('/scoring/government/settings/update/', settings);
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export const formatPopulation = (pop: number): string => {
  if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
  if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
  return pop.toString();
};

export const formatGrowth = (growth: number): string => {
  return growth >= 0 ? `+${growth}%` : `${growth}%`;
};

export const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'rose';
    case 'high': return 'orange';
    case 'medium': return 'amber';
    case 'low': return 'sky';
    default: return 'slate';
  }
};

export default governmentApi;
