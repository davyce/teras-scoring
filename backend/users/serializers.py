# backend/users/serializers.py
"""
Serializers pour l'authentification TERAS - VERSION FINALE
Compatible avec le modèle CustomUser actuel
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# Import différé pour UserSettings (éviter circular import)
def get_user_settings_model():
    from .models import UserSettings
    return UserSettings


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour les données utilisateur
    IMPORTANT : Ne liste QUE les champs qui existent dans CustomUser
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'user_type',
            'is_active',
            'kyc_status',  # ← Existe dans ton modèle
            'country',
            'region',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personnalisé pour JWT
    Utilise email au lieu de username
    """
    username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ajouter des claims personnalisés
        token['email'] = user.email
        token['user_type'] = user.user_type
        token['username'] = user.username or user.email
        token['first_name'] = user.first_name or ''
        token['last_name'] = user.last_name or ''
        
        return token

    def validate(self, attrs):
        # Remplacer username par email si fourni
        if 'email' in attrs:
            attrs['username'] = attrs['email']
        
        # Validation standard
        data = super().validate(attrs)
        
        return data


# ============================================================
# ✅ NOUVEAU : USER SETTINGS SERIALIZER
# ============================================================

class UserSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer pour les paramètres utilisateur
    """
    class Meta:
        model = get_user_settings_model()
        fields = [
            'id',
            'notifications_score',
            'notifications_recommendations',
            'notifications_documents',
            'two_factor_auth',
            'data_sharing',
            'theme',
            'language',
            'currency',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']
    
    def validate(self, data):
        """
        Validation personnalisée
        """
        return data


# ============================================================
# ✅ SERIALIZERS POUR PROFILE ET DOCUMENTS
# ============================================================

class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour le profil utilisateur étendu
    """
    class Meta:
        from .models import Profile
        model = Profile
        fields = [
            'id',
            'bio',
            'phone_number',
            'address',
            'city',
            'country',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UploadedDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer pour les documents uploadés
    """
    filename = serializers.SerializerMethodField()
    
    class Meta:
        from .models import UploadedDocument
        model = UploadedDocument
        fields = [
            'id',
            'file',
            'filename',
            'category',
            'uploaded_at',
            'status',
            'analysis_summary',
        ]
        read_only_fields = ['id', 'uploaded_at', 'filename']
    
    def get_filename(self, obj):
        """Retourne le nom du fichier sans le chemin"""
        return obj.file.name.split('/')[-1] if obj.file else ''

