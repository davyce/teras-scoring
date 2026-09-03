// src/utils/userHelpers.ts
/**
 * Helpers pour accéder aux données utilisateur de manière sécurisée
 */

import type { User } from '../types/auth.types';

/**
 * Accès sécurisé au profil utilisateur
 */
export function getUserProfile(user: User | null) {
  if (!user) return null;
  
  // Vérifier si le profil existe
  return (user as any).profile || null;
}

/**
 * Accès sécurisé à la bio du profil
 */
export function getUserBio(user: User | null): string {
  const profile = getUserProfile(user);
  return profile?.bio || '';
}

/**
 * Accès sécurisé à la date de création du profil
 */
export function getUserCreatedAt(user: User | null): string {
  const profile = getUserProfile(user);
  return profile?.created_at || new Date().toISOString();
}

/**
 * Vérifier si le profil existe
 */
export function hasProfile(user: User | null): boolean {
  return !!getUserProfile(user);
}

/**
 * Accès sécurisé au nom complet
 */
export function getUserFullName(user: User | null): string {
  if (!user) return '';
  
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
export function getUserInitials(user: User | null): string {
  if (!user) return '??';
  
  const firstName = user.first_name?.[0]?.toUpperCase() || '';
  const lastName = user.last_name?.[0]?.toUpperCase() || '';
  
  if (firstName && lastName) {
    return `${firstName}${lastName}`;
  }
  
  if (firstName) return firstName;
  if (lastName) return lastName;
  
  return user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}

/**
 * Accès sécurisé à l'email
 */
export function getUserEmail(user: User | null): string {
  return user?.email || '';
}

/**
 * Accès sécurisé au username
 */
export function getUserUsername(user: User | null): string {
  return user?.username || '';
}

/**
 * Accès sécurisé au type d'utilisateur
 */
export function getUserType(user: User | null): string {
  return user?.user_type || 'individual';
}

/**
 * Accès sécurisé au rôle
 */
export function getUserRole(user: User | null): string {
  return user?.role || 'USER_BASIC';
}

/**
 * Vérifier si l'utilisateur est actif
 */
export function isUserActive(user: User | null): boolean {
  return user?.is_active ?? false;
}

/**
 * Vérifier si l'utilisateur est vérifié
 */
export function isUserVerified(user: User | null): boolean {
  return (user as any)?.is_verified ?? false;
}

/**
 * Obtenir le statut KYC
 */
export function getUserKYCStatus(user: User | null): string {
  return (user as any)?.kyc_status || 'not_started';
}
