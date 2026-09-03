// @ts-nocheck
/**
 * Hook personnalisé pour la gestion du profil utilisateur
 * @module hooks/useUserProfile
 */
import { useState, useCallback } from "react";
import { useAuth } from "../stores/auth";
import { updateUserProfile, uploadAvatar, changePassword, } from "../utils/auth";
// ============================================================================
// HOOK
// ============================================================================
export function useUserProfile() {
    const { user, setUser, refreshUser, getAccountType } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const accountType = getAccountType();
    const isIndividual = accountType === "individual";
    const isEnterprise = accountType === "enterprise";
    // Calcul du taux de complétion du profil
    const calculateProfileCompletion = useCallback(() => {
        if (!user)
            return 0;
        if (isIndividual) {
            const individualUser = user;
            const fields = [
                individualUser.first_name,
                individualUser.last_name,
                individualUser.email,
                individualUser.phone,
                individualUser.date_of_birth,
                individualUser.address,
                individualUser.city,
                individualUser.country,
                individualUser.national_id,
            ];
            const filledFields = fields.filter((f) => f && String(f).trim().length > 0).length;
            return Math.round((filledFields / fields.length) * 100);
        }
        if (isEnterprise) {
            const enterpriseUser = user;
            const fields = [
                enterpriseUser.company_name,
                enterpriseUser.legal_name,
                enterpriseUser.tax_id,
                enterpriseUser.sector,
                enterpriseUser.email,
                enterpriseUser.phone,
                enterpriseUser.address,
                enterpriseUser.city,
                enterpriseUser.country,
                enterpriseUser.legal_representative?.first_name,
                enterpriseUser.legal_representative?.last_name,
            ];
            const filledFields = fields.filter((f) => f && String(f).trim().length > 0).length;
            return Math.round((filledFields / fields.length) * 100);
        }
        return 0;
    }, [user, isIndividual, isEnterprise]);
    const profileCompletion = user?.profile_completion || calculateProfileCompletion();
    // Rafraîchir le profil
    const refreshProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await refreshUser();
        }
        catch (err) {
            setError("Impossible de charger les données du profil");
            console.error("Error refreshing profile:", err);
        }
        finally {
            setIsLoading(false);
        }
    }, [refreshUser]);
    // Mettre à jour le profil
    const updateProfile = useCallback(async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedUser = await updateUserProfile(data);
            setUser(updatedUser);
        }
        catch (err) {
            setError("Erreur lors de la mise à jour du profil");
            console.error("Error updating profile:", err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [setUser]);
    // Upload avatar
    const uploadAvatarFile = useCallback(async (file) => {
        setIsLoading(true);
        setError(null);
        try {
            const { avatar_url } = await uploadAvatar(file);
            if (user) {
                setUser({ ...user, avatar_url });
            }
        }
        catch (err) {
            setError("Erreur lors de l'upload de l'avatar");
            console.error("Error uploading avatar:", err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [user, setUser]);
    // Changer le mot de passe
    const updatePassword = useCallback(async (currentPassword, newPassword) => {
        setIsLoading(true);
        setError(null);
        try {
            await changePassword(currentPassword, newPassword);
        }
        catch (err) {
            setError("Erreur lors du changement de mot de passe");
            console.error("Error changing password:", err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    return {
        user,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
        uploadAvatar: uploadAvatarFile,
        updatePassword,
        isIndividual,
        isEnterprise,
        profileCompletion,
    };
}
export default useUserProfile;
