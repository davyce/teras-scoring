// frontend/src/utils/api-user.ts
/**
 * Client API pour l'interface User (Individual) TERAS
 * ✅ VERSION COMPLÈTE - Fusionné avec toutes les nouvelles fonctions
 * Endpoints: /api/scoring/user/* + /api/chat/* + /api/documents/*
 */

import { authFetch } from './authFetch';

// ============================================
// TYPES
// ============================================

export interface TerasScore {
  score: number;
  level: string;
  breakdown: {
    T: number; // Transactions
    E: number; // Épargne
    R: number; // Revenus
    A: number; // Actifs
    S: number; // Social
  };
  created_at?: string;
}

export interface Stats30Days {
  transactions_count: number;
  total_volume: number;
  documents_uploaded: number;
  recommendations_completed: number;
}

export interface ScoreEvolution {
  date: string;
  score: number;
}

export interface Recommendation {
  id: number;
  category: 'transactions' | 'epargne' | 'revenus' | 'actifs' | 'social';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  completed: boolean;
}

export interface CreditCapacity {
  monthly_capacity: number;
  max_loan_amount: number;
  eligible: boolean;
}

export interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  kyc_status?: string;
}

export interface UserDashboardData {
  user: UserInfo;
  score: TerasScore;
  stats_30j: Stats30Days;
  evolution: ScoreEvolution[];
  recommendations: Recommendation[];
  credit_capacity: CreditCapacity;
}

export interface UserStats {
  total_transactions: number;
  total_volume: number;
  avg_transaction: number;
  documents_count: number;
}

// ✅ NOUVEAUX TYPES

export interface Document {
  id: string;
  doc_type: string;
  file_path: string;
  file_url?: string;
  status: string;
  uploaded_at: string;
  file_size?: number;
  category?: string;
  tags?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  response: string;
  conversation_id?: number;
  message_id?: number;
  tokens_used?: number;
  response_time_ms?: number;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  is_archived: boolean;
}

export interface ScoreHistoryItem {
  id: number;
  score: number;
  level: string;
  breakdown: {
    T: number;
    E: number;
    R: number;
    A: number;
    S: number;
  };
  created_at: string;
  profile_type?: string;
}

export interface LoanSimulation {
  amount: number;
  duration: number;
  purpose?: string;
}

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
export async function getUserDashboard(): Promise<UserDashboardData> {
  const response = await authFetch(`${API_BASE}/user/dashboard/`);
  if (!response.ok) throw new Error(`Dashboard error: ${response.status}`);
  return response.json();
}

/**
 * GET /api/scoring/user/recommendations/
 * Récupérer les recommandations personnalisées
 */
export async function getUserRecommendations(): Promise<Recommendation[]> {
  const response = await authFetch(`${API_BASE}/user/recommendations/`);
  if (!response.ok) throw new Error(`Recommendations error: ${response.status}`);
  return response.json();
}

/**
 * GET /api/scoring/user/stats/
 * Récupérer les statistiques utilisateur
 */
export async function getUserStats(): Promise<UserStats> {
  const response = await authFetch(`${API_BASE}/user/stats/`);
  if (!response.ok) throw new Error(`Stats error: ${response.status}`);
  return response.json();
}

// ============================================
// HISTORIQUE - ✅ NOUVEAU
// ============================================

/**
 * GET /api/scoring/user/history/
 * Récupérer l'historique des scores
 */
export async function getUserHistory(): Promise<ScoreHistoryItem[]> {
  const response = await authFetch(`${API_BASE}/user/history/`);
  if (!response.ok) throw new Error('Erreur historique');
  return response.json();
}

// ============================================
// PROFIL
// ============================================

/**
 * GET /api/scoring/user/profile/
 * Récupérer le profil utilisateur
 */
export async function getUserProfile(): Promise<UserInfo> {
  const response = await authFetch(`${API_BASE}/user/profile/`);
  if (!response.ok) throw new Error('Erreur profil');
  return response.json();
}

/**
 * PUT /api/scoring/user/profile/
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(data: Partial<UserInfo>): Promise<UserInfo> {
  const response = await authFetch(`${API_BASE}/user/profile/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Erreur mise à jour profil');
  return response.json();
}

// ============================================
// CALCUL SCORE - ✅ NOUVEAU
// ============================================

/**
 * POST /api/scoring/calculate/
 * Calculer et sauvegarder un nouveau score
 */
export async function calculateScore(pillars: {
  T: number;
  E: number;
  R: number;
  A: number;
  S: number;
}): Promise<any> {
  const response = await authFetch(`${API_BASE}/calculate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pillars)
  });
  if (!response.ok) throw new Error('Erreur calcul score');
  return response.json();
}

// ============================================
// DOCUMENTS - ✅ NOUVEAU
// ============================================

/**
 * GET /api/scoring/user/documents/
 * Récupérer la liste des documents
 */
export async function getUserDocuments(): Promise<Document[]> {
  const response = await authFetch(`${API_BASE}/user/documents/`);
  if (!response.ok) throw new Error('Erreur documents');
  return response.json();
}

/**
 * POST /api/documents/upload/
 * Upload un nouveau document
 */
export async function uploadDocument(file: File, category: string = 'general'): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await authFetch(`${DOCS_BASE}/upload/`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Erreur upload');
  return response.json();
}

/**
 * DELETE /api/scoring/documents/{id}/
 * Supprimer un document
 */
export async function deleteDocument(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/documents/${id}/`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Erreur suppression document');
}

/**
 * GET /api/scoring/documents/{id}/download/
 * Télécharger un document
 */
export async function downloadDocument(id: string): Promise<Blob> {
  const response = await authFetch(`${API_BASE}/documents/${id}/download/`);
  if (!response.ok) throw new Error('Erreur téléchargement document');
  return response.blob();
}

// ============================================
// CHAT IA - ✅ NOUVEAU
// ============================================

/**
 * POST /api/chat/messages/
 * Envoyer un message au chatbot
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: number
): Promise<ChatResponse> {
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

  if (!response.ok) throw new Error('Erreur chat');
  return response.json();
}

/**
 * GET /api/chat/conversations/
 * Récupérer la liste des conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  const response = await authFetch(`${CHAT_BASE}/conversations/`);
  if (!response.ok) throw new Error('Erreur conversations');
  return response.json();
}

/**
 * GET /api/chat/conversations/{id}/
 * Récupérer une conversation spécifique
 */
export async function getConversation(id: number): Promise<Conversation> {
  const response = await authFetch(`${CHAT_BASE}/conversations/${id}/`);
  if (!response.ok) throw new Error('Erreur conversation');
  return response.json();
}

/**
 * DELETE /api/chat/conversations/{id}/
 * Supprimer une conversation
 */
export async function deleteConversation(id: number): Promise<void> {
  const response = await authFetch(`${CHAT_BASE}/conversations/${id}/`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Erreur suppression conversation');
}

// ============================================
// SETTINGS
// ============================================

/**
 * GET /api/users/settings/
 * Récupérer les paramètres utilisateur
 */
export async function getUserSettings(): Promise<any> {
  const response = await authFetch('/api/users/settings/');
  if (!response.ok) throw new Error('Erreur settings');
  return response.json();
}

/**
 * PUT /api/users/settings/
 * Mettre à jour les paramètres
 */
export async function updateUserSettings(settings: any): Promise<any> {
  const response = await authFetch('/api/users/settings/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) throw new Error('Erreur mise à jour settings');
  return response.json();
}

// ============================================
// SIMULATION PRÊT
// ============================================

/**
 * POST /api/scoring/simulate-loan/
 * Simuler un prêt
 */
export async function simulateLoan(data: LoanSimulation): Promise<any> {
  const response = await authFetch(`${API_BASE}/simulate-loan/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Erreur simulation');
  return response.json();
}

// ============================================
// HELPERS
// ============================================

/**
 * Convertir le niveau en couleur
 */
export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
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
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Calculer la couleur du score
 */
export function getScoreColor(score: number): string {
  if (score >= 900) return '#E5E4E2'; // Platine
  if (score >= 750) return '#FFD700'; // Or
  if (score >= 600) return '#C0C0C0'; // Argent
  if (score >= 500) return '#CD7F32'; // Bronze
  return '#64748b'; // Débutant
}

/**
 * Obtenir le label du niveau de score
 */
export function getScoreLabel(score: number): string {
  if (score >= 900) return 'Platine';
  if (score >= 750) return 'Or';
  if (score >= 600) return 'Argent';
  if (score >= 500) return 'Bronze';
  return 'Débutant';
}

/**
 * Formater une date
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formater une date avec heure
 */
export function formatDateTime(dateString: string): string {
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
