# backend/users/managers.py
"""
Custom User Manager pour TERAS
Gère la création d'utilisateurs avec user_type
"""

from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    """
    Custom manager pour CustomUser
    Permet de créer des utilisateurs avec email comme identifiant principal
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        Crée et sauvegarde un utilisateur standard
        
        Args:
            email: Email de l'utilisateur (identifiant principal)
            password: Mot de passe
            **extra_fields: Champs additionnels (user_type, first_name, etc.)
        """
        if not email:
            raise ValueError("L'email est obligatoire")

        # Normaliser l'email
        email = self.normalize_email(email)

        # Si pas de username fourni, utiliser l'email
        if 'username' not in extra_fields or not extra_fields['username']:
            extra_fields['username'] = email.split('@')[0]

        # Définir user_type par défaut si non fourni
        if 'user_type' not in extra_fields:
            extra_fields['user_type'] = 'individual'

        # Valider le user_type
        valid_types = ['individual', 'admin', 'enterprise', 'government', 'bank']
        if extra_fields['user_type'] not in valid_types:
            extra_fields['user_type'] = 'individual'

        # Créer l'instance utilisateur
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crée et sauvegarde un superutilisateur
        
        Args:
            email: Email du superuser
            password: Mot de passe
            **extra_fields: Champs additionnels
        """
        # Forcer les permissions de superuser
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser doit avoir is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser doit avoir is_superuser=True')

        return self.create_user(email, password, **extra_fields)

    def create_admin(self, email, password=None, **extra_fields):
        """
        Crée un utilisateur admin (non-superuser)
        
        Args:
            email: Email de l'admin
            password: Mot de passe
            **extra_fields: Champs additionnels
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin')

        return self.create_user(email, password, **extra_fields)

    def create_enterprise(self, email, password=None, **extra_fields):
        """
        Crée un compte entreprise
        
        Args:
            email: Email de l'entreprise
            password: Mot de passe
            **extra_fields: Champs additionnels
        """
        extra_fields.setdefault('user_type', 'enterprise')
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)

    def create_government(self, email, password=None, **extra_fields):
        """
        Crée un compte gouvernement
        
        Args:
            email: Email gouvernemental
            password: Mot de passe
            **extra_fields: Champs additionnels
        """
        extra_fields.setdefault('user_type', 'government')
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)

    def create_bank(self, email, password=None, **extra_fields):
        """
        Crée un compte banque
        
        Args:
            email: Email de la banque
            password: Mot de passe
            **extra_fields: Champs additionnels
        """
        extra_fields.setdefault('user_type', 'bank')
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)

    # ========================================
    # MÉTHODES DE REQUÊTE PERSONNALISÉES
    # ========================================

    def get_admins(self):
        """Retourne tous les administrateurs"""
        return self.filter(user_type='admin')

    def get_individuals(self):
        """Retourne tous les utilisateurs individuels"""
        return self.filter(user_type='individual')

    def get_enterprises(self):
        """Retourne toutes les entreprises"""
        return self.filter(user_type='enterprise')

    def get_governments(self):
        """Retourne tous les comptes gouvernementaux"""
        return self.filter(user_type='government')

    def get_banks(self):
        """Retourne tous les comptes bancaires"""
        return self.filter(user_type='bank')

    def get_active_users(self):
        """Retourne tous les utilisateurs actifs"""
        return self.filter(is_active=True)

    def get_inactive_users(self):
        """Retourne tous les utilisateurs inactifs"""
        return self.filter(is_active=False)

    def get_users_by_type(self, user_type):
        """
        Retourne les utilisateurs d'un type spécifique
        
        Args:
            user_type: Type d'utilisateur (individual, admin, etc.)
        """
        return self.filter(user_type=user_type)

    def get_pending_validation(self):
        """
        Retourne les utilisateurs en attente de validation
        (is_active=False)
        """
        return self.filter(is_active=False).order_by('date_joined')
