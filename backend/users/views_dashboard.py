# users/views_dashboard.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    user = request.user
    data = {
        "username": user.username,
        "email": user.email,
        "user_type": getattr(user, "user_type", "standard"),
        "documents": [],  # futur : ajouter logique upload ou analyse documents
        "score": 682,      # exemple : calcul ou import scoring réel
    }
    return Response(data)
