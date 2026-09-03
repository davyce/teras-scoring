// teras-frontend/src/services/governmentApi.ts
/**
 * API Client pour l'interface Government TERAS
 * Gère tous les appels API avec types TypeScript
 */
import apiClient from './api';
// ============================================================================
// API CLIENT
// ============================================================================
export const governmentApi = {
    /**
     * Dashboard principal
     */
    async getDashboard() {
        return apiClient.get("/scoring/government/dashboard/");
    },
    /**
     * Liste des régions
     */
    async getRegions() {
        return apiClient.get('/scoring/government/regions/');
    },
    /**
     * Détails d'une région
     */
    async getRegion(id) {
        return apiClient.get(`/scoring/government/regions/${id}/`);
    },
    /**
     * Liste des secteurs
     */
    async getSectors() {
        return apiClient.get('/scoring/government/sectors/');
    },
    /**
     * Détails d'un secteur
     */
    async getSector(id) {
        return apiClient.get(`/scoring/government/sectors/${id}/`);
    },
    /**
     * Liste des alertes
     */
    async getAlerts() {
        return apiClient.get('/scoring/government/alerts/');
    },
    /**
     * Carte des utilisateurs géolocalisés CEMAC
     */
    async getUsersMap(params) {
        const qp = new URLSearchParams();
        if (params?.country)
            qp.append('country', params.country);
        if (params?.type)
            qp.append('type', params.type);
        if (params?.status)
            qp.append('status', params.status);
        if (params?.source)
            qp.append('source', params.source);
        const url = `/scoring/government/users/map/${qp.toString() ? `?${qp.toString()}` : ''}`;
        return apiClient.get(url);
    },
    /**
     * Détails d'une alerte
     */
    async getAlert(id) {
        return apiClient.get(`/scoring/government/alerts/${id}/`);
    },
    /**
     * Liste des rapports
     */
    async getReports() {
        return apiClient.get('/scoring/government/reports/');
    },
    /**
     * Générer un rapport gouvernemental persistant
     */
    async generateReport(type = 'monthly') {
        return apiClient.post('/scoring/government/reports/generate/', { report_type: type });
    },
    /**
     * Télécharger un rapport
     */
    async downloadReport(id) {
        window.open(`/api/scoring/government/reports/${id}/download/`, '_blank');
    },
    /**
     * Récupérer les paramètres
     */
    async getSettings() {
        return apiClient.get('/scoring/government/settings/');
    },
    /**
     * Mettre à jour les paramètres
     */
    async updateSettings(settings) {
        return apiClient.patch('/scoring/government/settings/update/', settings);
    },
};
// ============================================================================
// HELPERS
// ============================================================================
export const formatPopulation = (pop) => {
    if (pop >= 1000000)
        return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000)
        return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
};
export const formatGrowth = (growth) => {
    return growth >= 0 ? `+${growth}%` : `${growth}%`;
};
export const getAlertColor = (severity) => {
    switch (severity) {
        case 'critical': return 'rose';
        case 'high': return 'orange';
        case 'medium': return 'amber';
        case 'low': return 'sky';
        default: return 'slate';
    }
};
export default governmentApi;
