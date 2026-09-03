// src/utils/userHelpers.ts
/**
 * Helpers pour accéder aux données utilisateur de manière sécurisée
 */
/**
 * Accès sécurisé au profil utilisateur
 */
export function getUserProfile(user) {
    if (!user)
        return null;
    // Vérifier si le profil existe
    return user.profile || null;
}
/**
 * Accès sécurisé à la bio du profil
 */
export function getUserBio(user) {
    const profile = getUserProfile(user);
    return profile?.bio || '';
}
/**
 * Accès sécurisé à la date de création du profil
 */
export function getUserCreatedAt(user) {
    const profile = getUserProfile(user);
    return profile?.created_at || new Date().toISOString();
}
/**
 * Vérifier si le profil existe
 */
export function hasProfile(user) {
    return !!getUserProfile(user);
}
/**
 * Accès sécurisé au nom complet
 */
export function getUserFullName(user) {
    if (!user)
        return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    }
    return firstName || lastName || user.username || user.email || '';
}
/**
 * Accès sécurisé aux initiales
 */
export function getUserInitials(user) {
    if (!user)
        return '??';
    const firstName = user.first_name?.[0]?.toUpperCase() || '';
    const lastName = user.last_name?.[0]?.toUpperCase() || '';
    if (firstName && lastName) {
        return `${firstName}${lastName}`;
    }
    if (firstName)
        return firstName;
    if (lastName)
        return lastName;
    return user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}
/**
 * Accès sécurisé à l'email
 */
export function getUserEmail(user) {
    return user?.email || '';
}
/**
 * Accès sécurisé au username
 */
export function getUserUsername(user) {
    return user?.username || '';
}
/**
 * Accès sécurisé au type d'utilisateur
 */
export function getUserType(user) {
    return user?.user_type || 'individual';
}
/**
 * Accès sécurisé au rôle
 */
export function getUserRole(user) {
    return user?.role || 'USER_BASIC';
}
/**
 * Vérifier si l'utilisateur est actif
 */
export function isUserActive(user) {
    return user?.is_active ?? false;
}
/**
 * Vérifier si l'utilisateur est vérifié
 */
export function isUserVerified(user) {
    return user?.is_verified ?? false;
}
/**
 * Obtenir le statut KYC
 */
export function getUserKYCStatus(user) {
    return user?.kyc_status || 'not_started';
}
