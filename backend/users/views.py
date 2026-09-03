# users/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status  # ✅ AJOUTÉ

from django.conf import settings
from .serializers import ProfileSerializer, UploadedDocumentSerializer
from .models import Profile, UploadedDocument


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint
    GET /api/health/
    """
    return Response({
        'status': 'ok',
        'message': 'Backend Django accessible',
        'version': '1.0.0'
    })


class TerasModeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        prof, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(instance=prof, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=200)


class MeView(APIView):
    """
    Endpoint pour récupérer les informations de l'utilisateur connecté
    GET /api/users/me/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        prof, _ = Profile.objects.get_or_create(user=user)
        
        # ✅ Construction de la réponse compatible avec le frontend
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "user_type": getattr(user, "user_type", "individual"),  # ✅ Clé attendue par le frontend
            "role": getattr(user, "role", "USER_BASIC"),  # Compatibilité
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "date_joined": user.date_joined.isoformat() if hasattr(user, 'date_joined') else None,
            "profile": {
                "id": prof.id,
                "bio": prof.bio or "",
                "created_at": prof.created_at.isoformat() if hasattr(prof, 'created_at') else None,
                # Ajoutez d'autres champs si nécessaire
            },
        }
        return Response(data, status=200)
    
    def patch(self, request):
        """
        Mettre à jour le profil de l'utilisateur
        PATCH /api/users/me/
        """
        user = request.user
        prof, _ = Profile.objects.get_or_create(user=user)
        
        # Whitelist stricte — empêche la modification de champs système
        ALLOWED_PROFILE_FIELDS = {
            'bio', 'phone_number', 'address', 'city', 'country',
            'latitude', 'longitude', 'location_source',
        }

        profile_data = request.data.get('profile', {})

        if profile_data:
            for key, value in profile_data.items():
                if key in ALLOWED_PROFILE_FIELDS:
                    setattr(prof, key, value)
            prof.save()
        
        # Retourner les données mises à jour
        return self.get(request)


class DocumentListView(APIView):
    """
    GET /api/documents/
    Liste tous les documents de l'utilisateur connecté.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            documents = UploadedDocument.objects.filter(
                user=request.user
            ).order_by("-uploaded_at")

            serializer = UploadedDocumentSerializer(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Si le modèle n'existe pas ou table vide
            print(f"Error loading documents: {e}")
            return Response([])


# ============================================================
# ✅ NOUVEAU : USER SETTINGS VIEW
# ============================================================

class UserSettingsView(APIView):
    """
    GET : Récupérer les paramètres utilisateur
    PUT : Mettre à jour les paramètres
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Récupérer les paramètres de l'utilisateur connecté
        Créer automatiquement si inexistant
        """
        from .models import UserSettings
        from .serializers import UserSettingsSerializer
        
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        serializer = UserSettingsSerializer(settings)
        
        return Response({
            'settings': serializer.data,
            'is_new': created
        })
    
    def put(self, request):
        """
        Mettre à jour les paramètres
        """
        from .models import UserSettings
        from .serializers import UserSettingsSerializer
        
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'message': 'Paramètres mis à jour avec succès',
                'settings': serializer.data
            })
        
        return Response({
            'error': 'Données invalides',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

