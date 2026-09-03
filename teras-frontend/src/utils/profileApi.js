/**
 * API Functions pour la gestion du profil utilisateur
 * @module utils/profileApi
 */
import { apiRequest } from "./api";
// ============================================================================
// FONCTIONS API
// ============================================================================
/**
 * Récupère le profil complet de l'utilisateur connecté
 */
export async function getCurrentUserProfile() {
    const response = await apiRequest({
        endpoint: "/api/users/me/",
        method: "GET",
    });
    return response;
}
/**
 * Met à jour le profil de l'utilisateur individuel
 */
export async function updateIndividualProfile(data) {
    const response = await apiRequest({
        endpoint: "/api/users/me/",
        method: "PATCH",
        data,
    });
    return response;
}
/**
 * Met à jour le profil d'une entreprise
 */
export async function updateEnterpriseProfile(data) {
    const response = await apiRequest({
        endpoint: "/api/enterprises/me/",
        method: "PATCH",
        data,
    });
    return response;
}
/**
 * Upload de l'avatar utilisateur
 */
export async function uploadUserAvatar(file) {
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
export async function changePassword(currentPassword, newPassword) {
    const response = await apiRequest({
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
export async function enable2FA() {
    const response = await apiRequest({
        endpoint: "/api/users/me/2fa/enable/",
        method: "POST",
    });
    return response;
}
/**
 * Vérifie et confirme l'activation 2FA
 */
export async function verify2FA(code) {
    const response = await apiRequest({
        endpoint: "/api/users/me/2fa/verify/",
        method: "POST",
        data: { code },
    });
    return response;
}
/**
 * Désactive l'authentification à deux facteurs
 */
export async function disable2FA(password) {
    const response = await apiRequest({
        endpoint: "/api/users/me/2fa/disable/",
        method: "POST",
        data: { password },
    });
    return response;
}
/**
 * Met à jour les préférences de notifications
 */
export async function updateNotificationPreferences(preferences) {
    const response = await apiRequest({
        endpoint: "/api/users/me/notification-preferences/",
        method: "PATCH",
        data: preferences,
    });
    return response;
}
/**
 * Récupère les statistiques du profil (complétion, dernière activité, etc.)
 */
export async function getProfileStats() {
    const response = await apiRequest({
        endpoint: "/api/users/me/stats/",
        method: "GET",
    });
    return response;
}
/**
 * Supprime le compte utilisateur
 */
export async function deleteUserAccount(password) {
    const response = await apiRequest({
        endpoint: "/api/users/me/",
        method: "DELETE",
        data: { password },
    });
    return response;
}
