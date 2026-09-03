// frontend/src/utils/api-user.ts
/**
 * Client API pour l'interface User (Individual) TERAS
 * ✅ VERSION COMPLÈTE - Fusionné avec toutes les nouvelles fonctions
 * Endpoints: /api/scoring/user/* + /api/chat/* + /api/documents/*
 */
import { authFetch } from './authFetch';
// ============================================
// CONSTANTES
// ============================================
const API_BASE = '/api/scoring';
const CHAT_BASE = '/api/chat';
const DOCS_BASE = '/api/documents';
// ============================================
// DASHBOARD & CORE
// ============================================
/**
 * GET /api/scoring/user/dashboard/
 * Récupérer le dashboard complet User
 */
export async function getUserDashboard() {
    const response = await authFetch(`${API_BASE}/user/dashboard/`);
    if (!response.ok)
        throw new Error(`Dashboard error: ${response.status}`);
    return response.json();
}
/**
 * GET /api/scoring/user/recommendations/
 * Récupérer les recommandations personnalisées
 */
export async function getUserRecommendations() {
    const response = await authFetch(`${API_BASE}/user/recommendations/`);
    if (!response.ok)
        throw new Error(`Recommendations error: ${response.status}`);
    return response.json();
}
/**
 * GET /api/scoring/user/stats/
 * Récupérer les statistiques utilisateur
 */
export async function getUserStats() {
    const response = await authFetch(`${API_BASE}/user/stats/`);
    if (!response.ok)
        throw new Error(`Stats error: ${response.status}`);
    return response.json();
}
// ============================================
// HISTORIQUE - ✅ NOUVEAU
// ============================================
/**
 * GET /api/scoring/user/history/
 * Récupérer l'historique des scores
 */
export async function getUserHistory() {
    const response = await authFetch(`${API_BASE}/user/history/`);
    if (!response.ok)
        throw new Error('Erreur historique');
    return response.json();
}
// ============================================
// PROFIL
// ============================================
/**
 * GET /api/scoring/user/profile/
 * Récupérer le profil utilisateur
 */
export async function getUserProfile() {
    const response = await authFetch(`${API_BASE}/user/profile/`);
    if (!response.ok)
        throw new Error('Erreur profil');
    return response.json();
}
/**
 * PUT /api/scoring/user/profile/
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(data) {
    const response = await authFetch(`${API_BASE}/user/profile/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok)
        throw new Error('Erreur mise à jour profil');
    return response.json();
}
// ============================================
// CALCUL SCORE - ✅ NOUVEAU
// ============================================
/**
 * POST /api/scoring/calculate/
 * Calculer et sauvegarder un nouveau score
 */
export async function calculateScore(pillars) {
    const response = await authFetch(`${API_BASE}/calculate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillars)
    });
    if (!response.ok)
        throw new Error('Erreur calcul score');
    return response.json();
}
// ============================================
// DOCUMENTS - ✅ NOUVEAU
// ============================================
/**
 * GET /api/scoring/user/documents/
 * Récupérer la liste des documents
 */
export async function getUserDocuments() {
    const response = await authFetch(`${API_BASE}/user/documents/`);
    if (!response.ok)
        throw new Error('Erreur documents');
    return response.json();
}
/**
 * POST /api/documents/upload/
 * Upload un nouveau document
 */
export async function uploadDocument(file, category = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const response = await authFetch(`${DOCS_BASE}/upload/`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok)
        throw new Error('Erreur upload');
    return response.json();
}
/**
 * DELETE /api/scoring/documents/{id}/
 * Supprimer un document
 */
export async function deleteDocument(id) {
    const response = await authFetch(`${API_BASE}/documents/${id}/`, {
        method: 'DELETE'
    });
    if (!response.ok)
        throw new Error('Erreur suppression document');
}
/**
 * GET /api/scoring/documents/{id}/download/
 * Télécharger un document
 */
export async function downloadDocument(id) {
    const response = await authFetch(`${API_BASE}/documents/${id}/download/`);
    if (!response.ok)
        throw new Error('Erreur téléchargement document');
    return response.blob();
}
// ============================================
// CHAT IA - ✅ NOUVEAU
// ============================================
/**
 * POST /api/chat/messages/
 * Envoyer un message au chatbot
 */
export async function sendChatMessage(messages, conversationId) {
    const response = await authFetch(`${CHAT_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages,
            conversation_id: conversationId,
            use_rag: true,
            save_conversation: true
        })
    });
    if (!response.ok)
        throw new Error('Erreur chat');
    return response.json();
}
/**
 * GET /api/chat/conversations/
 * Récupérer la liste des conversations
 */
export async function getConversations() {
    const response = await authFetch(`${CHAT_BASE}/conversations/`);
    if (!response.ok)
        throw new Error('Erreur conversations');
    return response.json();
}
/**
 * GET /api/chat/conversations/{id}/
 * Récupérer une conversation spécifique
 */
export async function getConversation(id) {
    const response = await authFetch(`${CHAT_BASE}/conversations/${id}/`);
    if (!response.ok)
        throw new Error('Erreur conversation');
    return response.json();
}
/**
 * DELETE /api/chat/conversations/{id}/
 * Supprimer une conversation
 */
export async function deleteConversation(id) {
    const response = await authFetch(`${CHAT_BASE}/conversations/${id}/`, {
        method: 'DELETE'
    });
    if (!response.ok)
        throw new Error('Erreur suppression conversation');
}
// ============================================
// SETTINGS
// ============================================
/**
 * GET /api/users/settings/
 * Récupérer les paramètres utilisateur
 */
export async function getUserSettings() {
    const response = await authFetch('/api/users/settings/');
    if (!response.ok)
        throw new Error('Erreur settings');
    return response.json();
}
/**
 * PUT /api/users/settings/
 * Mettre à jour les paramètres
 */
export async function updateUserSettings(settings) {
    const response = await authFetch('/api/users/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    if (!response.ok)
        throw new Error('Erreur mise à jour settings');
    return response.json();
}
// ============================================
// SIMULATION PRÊT
// ============================================
/**
 * POST /api/scoring/simulate-loan/
 * Simuler un prêt
 */
export async function simulateLoan(data) {
    const response = await authFetch(`${API_BASE}/simulate-loan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok)
        throw new Error('Erreur simulation');
    return response.json();
}
// ============================================
// HELPERS
// ============================================
/**
 * Convertir le niveau en couleur
 */
export function getLevelColor(level) {
    const colors = {
        'Diamant': '#9333ea',
        'Platine': '#E5E4E2',
        'Or': '#FFD700',
        'Argent': '#C0C0C0',
        'Bronze': '#CD7F32',
        'Débutant': '#64748b',
    };
    return colors[level] || '#64748b';
}
/**
 * Formater un montant en FCFA
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}
/**
 * Calculer la couleur du score
 */
export function getScoreColor(score) {
    if (score >= 900)
        return '#E5E4E2'; // Platine
    if (score >= 750)
        return '#FFD700'; // Or
    if (score >= 600)
        return '#C0C0C0'; // Argent
    if (score >= 500)
        return '#CD7F32'; // Bronze
    return '#64748b'; // Débutant
}
/**
 * Obtenir le label du niveau de score
 */
export function getScoreLabel(score) {
    if (score >= 900)
        return 'Platine';
    if (score >= 750)
        return 'Or';
    if (score >= 600)
        return 'Argent';
    if (score >= 500)
        return 'Bronze';
    return 'Débutant';
}
/**
 * Formater une date
 */
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
/**
 * Formater une date avec heure
 */
export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// ============================================
// EXPORT DEFAULT
// ============================================
export default {
    // Dashboard & Core
    getUserDashboard,
    getUserRecommendations,
    getUserStats,
    // Historique
    getUserHistory,
    // Profil
    getUserProfile,
    updateUserProfile,
    // Score
    calculateScore,
    // Documents
    getUserDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    // Chat IA
    sendChatMessage,
    getConversations,
    getConversation,
    deleteConversation,
    // Settings
    getUserSettings,
    updateUserSettings,
    // Simulation
    simulateLoan,
    // Helpers
    getLevelColor,
    formatCurrency,
    getScoreColor,
    getScoreLabel,
    formatDate,
    formatDateTime
};
