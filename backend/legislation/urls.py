# backend/legislation/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LegislationViewSet

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'', LegislationViewSet, basename='legislation')

urlpatterns = [
    path('', include(router.urls)),
]

# Routes disponibles:
# GET    /api/legislation/                  - Liste des documents
# POST   /api/legislation/                  - Créer un document
# GET    /api/legislation/{id}/             - Détails d'un document
# PUT    /api/legislation/{id}/             - Modifier un document
# DELETE /api/legislation/{id}/             - Supprimer un document
# POST   /api/legislation/{id}/analyze/     - Analyser avec IA
# POST   /api/legislation/{id}/add_comment/ - Ajouter un commentaire
# GET    /api/legislation/{id}/comments/    - Liste des commentaires
# GET    /api/legislation/{id}/download/    - Télécharger le fichier
# GET    /api/legislation/stats/            - Statistiques globales
