"""
URLs Chat TERAS – VERSION CONSOLIDÉE ET VALIDÉE

Fonctionnalités :
✅ Chat principal (avec ou sans RAG)
✅ Gestion des conversations (CRUD)
✅ Ajout de messages
✅ Export & téléchargement PDF
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ChatMessageView
from .views_conversations import ChatConversationViewSet

app_name = "chat"

# -------------------------
# Router DRF – Conversations
# -------------------------
router = DefaultRouter()
router.register(
    r"conversations",
    ChatConversationViewSet,
    basename="conversation"
)

# -------------------------
# URLs
# -------------------------
urlpatterns = [
    # 🔹 Chat principal
    # POST /api/chat/message/
    path("message/", ChatMessageView.as_view(), name="chat-message"),

    # 🔹 Conversations (ViewSet DRF)
    # /api/chat/conversations/...
    path("", include(router.urls)),
]
from .views_pdf_export import export_chat_pdf, export_conversation_pdf
urlpatterns += [
    path('export-pdf/', export_chat_pdf, name='export-chat-pdf'),
    path('conversations/<int:conversation_id>/export_pdf/', export_conversation_pdf, name='export-conv-pdf'),
]
