// @ts-nocheck
/**
 * API Functions pour la gestion du profil utilisateur
 * @module utils/profileApi
 */

import { apiRequest } from "./api";
import type { User, IndividualUser, EnterpriseUser } from "../types/auth.types";

// ============================================================================
// TYPES
// ============================================================================

export interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  national_id?: string;
}

export interface UpdateEnterpriseProfileData {
  company_name?: string;
  sector?: string;
  employee_count?: number;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
}

// ============================================================================
// FONCTIONS API
// ============================================================================

/**
 * Récupère le profil complet de l'utilisateur connecté
 */
export async function getCurrentUserProfile(): Promise<User> {
  const response = await apiRequest<User>({
    endpoint: "/api/users/me/",
    method: "GET",
  });
  
  return response;
}

/**
 * Met à jour le profil de l'utilisateur individuel
 */
export async function updateIndividualProfile(
  data: UpdateUserProfileData
): Promise<IndividualUser> {
  const response = await apiRequest<IndividualUser>({
    endpoint: "/api/users/me/",
    method: "PATCH",
    data,
  });
  
  return response;
}

/**
 * Met à jour le profil d'une entreprise
 */
export async function updateEnterpriseProfile(
  data: UpdateEnterpriseProfileData
): Promise<EnterpriseUser> {
  const response = await apiRequest<EnterpriseUser>({
    endpoint: "/api/enterprises/me/",
    method: "PATCH",
    data,
  });
  
  return response;
}

/**
 * Upload de l'avatar utilisateur
 */
export async function uploadUserAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch("/api/users/me/avatar/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("teras_access_token")}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'upload de l'avatar");
  }

  return response.json();
}

/**
 * Change le mot de passe de l'utilisateur
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await apiRequest<{ message: string }>({
    endpoint: "/api/users/me/change-password/",
    method: "POST",
    data: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
  
  return response;
}

/**
 * Active l'authentification à deux facteurs
 */
export async function enable2FA(): Promise<{ qr_code: string; secret: string }> {
  const response = await apiRequest<{ qr_code: string; secret: string }>({
    endpoint: "/api/users/me/2fa/enable/",
    method: "POST",
  });
  
  return response;
}

/**
 * Vérifie et confirme l'activation 2FA
 */
export async function verify2FA(code: string): Promise<{ backup_codes: string[] }> {
  const response = await apiRequest<{ backup_codes: string[] }>({
    endpoint: "/api/users/me/2fa/verify/",
    method: "POST",
    data: { code },
  });
  
  return response;
}

/**
 * Désactive l'authentification à deux facteurs
 */
export async function disable2FA(password: string): Promise<{ message: string }> {
  const response = await apiRequest<{ message: string }>({
    endpoint: "/api/users/me/2fa/disable/",
    method: "POST",
    data: { password },
  });
  
  return response;
}

/**
 * Met à jour les préférences de notifications
 */
export async function updateNotificationPreferences(preferences: {
  email_score_updates?: boolean;
  email_documents?: boolean;
  email_compliance?: boolean;
  email_offers?: boolean;
  email_newsletter?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
}): Promise<{ message: string }> {
  const response = await apiRequest<{ message: string }>({
    endpoint: "/api/users/me/notification-preferences/",
    method: "PATCH",
    data: preferences,
  });
  
  return response;
}

/**
 * Récupère les statistiques du profil (complétion, dernière activité, etc.)
 */
export async function getProfileStats(): Promise<{
  completion_percentage: number;
  last_activity: string;
  documents_count: number;
  kyc_status: string;
  teras_score: number;
  teras_level: string;
}> {
  const response = await apiRequest<{
    completion_percentage: number;
    last_activity: string;
    documents_count: number;
    kyc_status: string;
    teras_score: number;
    teras_level: string;
  }>({
    endpoint: "/api/users/me/stats/",
    method: "GET",
  });
  
  return response;
}

/**
 * Supprime le compte utilisateur
 */
export async function deleteUserAccount(password: string): Promise<{ message: string }> {
  const response = await apiRequest<{ message: string }>({
    endpoint: "/api/users/me/",
    method: "DELETE",
    data: { password },
  });
  
  return response;
}
