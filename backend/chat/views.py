# backend/chat/views.py
# -*- coding: utf-8 -*-
"""
✅ VERSION FINALE - Gère le format "messages" (array d'historique)
"""

import json
import logging
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai.rag_service import get_rag_service
from .models import ChatConversation, ChatMessage
from .serializers import ChatMessageSerializer

logger = logging.getLogger(__name__)


class ChatMessageView(APIView):
    """
    Endpoint principal de chat TERAS
    POST /api/chat/message/

    ✅ VERSION FINALE - Gère tous les formats :
    1. Format simple : {"message": "..."}
    2. Format array : {"messages": [{"role": "user", "content": "..."}]}
    """
    permission_classes = [IsAuthenticated]

    def _extract_message_from_array(self, messages):
        """
        Extraire le dernier message utilisateur d'un array de messages
        Format attendu : [{"role": "user", "content": "..."}, ...]
        """
        if not isinstance(messages, list):
            return None

        # Parcourir de la fin vers le début pour trouver le dernier message user
        for msg in reversed(messages):
            if isinstance(msg, dict):
                role = msg.get('role', '').lower()
                content = msg.get('content') or msg.get('message') or msg.get('text')

                if role == 'user' and content:
                    return content

        return None

    def _extract_message(self, data):
        """Extraire le message de différents formats possibles"""
        # Format 1 : Array de messages (nouveau format frontend)
        if 'messages' in data:
            messages = data['messages']
            return self._extract_message_from_array(messages)

        # Format 2 : Message simple (clés variantes)
        message_keys = ['message', 'query', 'content', 'text', 'prompt', 'question', 'input']
        for key in message_keys:
            if key in data and data[key]:
                return data[key]

        return None

    def _extract_conversation_history(self, data):
        """
        Extraire l'historique de conversation pour le RAG
        Retourne une liste formatée pour le RAG service
        """
        messages = data.get('messages')
        if not isinstance(messages, list):
            return []

        history = []
        for msg in messages:
            if isinstance(msg, dict):
                role = msg.get('role', '').lower()
                content = msg.get('content') or msg.get('message')

                if role in ('user', 'assistant') and content:
                    history.append({
                        'role': role,
                        'content': content
                    })

        return history

    def _extract_use_rag(self, data):
        """Extraire use_rag de différentes clés possibles"""
        rag_keys = ['use_rag', 'useRag', 'rag_enabled', 'ragEnabled', 'rag', 'with_rag', 'withRag']

        for key in rag_keys:
            if key in data:
                value = data[key]
                if isinstance(value, str):
                    return value.lower() in ('true', '1', 'yes', 'on')
                return bool(value)

        return False

    def _extract_conversation_id(self, data):
        """Extraire conversation_id de différentes clés possibles"""
        id_keys = ['conversation_id', 'conversationId', 'chat_id', 'chatId', 'session_id', 'sessionId']

        for key in id_keys:
            if key in data and data[key]:
                return data[key]

        return None

    def post(self, request):
        user = request.user
        data = request.data

        # 🔍 Log pour debugging
        logger.info("=" * 80)
        logger.info(f"🔍 Chat request from {user.username}")
        logger.info(f"📦 Received data keys: {list(data.keys())}")
        logger.info(f"📦 Full data: {json.dumps(dict(data), indent=2, default=str)}")

        # -----------------------
        # Extraction FLEXIBLE des paramètres
        # -----------------------
        message = self._extract_message(data)
        use_rag = self._extract_use_rag(data)
        conversation_id = self._extract_conversation_id(data)
        conversation_history = self._extract_conversation_history(data)

        logger.info(f"📝 Extracted message: {message}")
        logger.info(f"🔍 Extracted use_rag: {use_rag}")
        logger.info(f"💬 Extracted conversation_id: {conversation_id}")
        logger.info(f"📚 Extracted history: {len(conversation_history)} messages")
        logger.info("=" * 80)

        # -----------------------
        # Validation
        # -----------------------
        if not message:
            error_data = {
                "error": "Message requis",
                "details": "Formats acceptés:",
                "format_1": "{'message': 'votre message'}",
                "format_2": "{'messages': [{'role': 'user', 'content': 'votre message'}]}",
                "received_keys": list(data.keys()),
                "debug": "Le dernier message 'user' n'a pas été trouvé dans 'messages'"
            }
            logger.error(f"❌ Validation failed: {error_data}")
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(message, str):
            return Response(
                {"error": f"Le message doit être une chaîne de caractères (reçu: {type(message).__name__})"},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = message.strip()

        if not message:
            return Response(
                {"error": "Le message ne peut pas être vide"},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"✅ Validation OK - message: '{message[:50]}...'")

        # -----------------------
        # Récupération ou création conversation
        # -----------------------
        if conversation_id:
            try:
                conversation = ChatConversation.objects.get(
                    id=conversation_id,
                    user=user
                )
                logger.info(f"♻️ Using existing conversation: {conversation.id}")
            except ChatConversation.DoesNotExist:
                logger.warning(f"⚠️ Conversation {conversation_id} not found, creating new one")
                conversation = ChatConversation.objects.create(
                    user=user,
                    title=message[:50]
                )
        else:
            conversation = ChatConversation.objects.create(
                user=user,
                title=message[:50]
            )
            logger.info(f"✨ Created new conversation: {conversation.id}")

        # -----------------------
        # Sauvegarde message user
        # -----------------------
        try:
            user_msg = ChatMessage.objects.create(
                conversation=conversation,
                role="user",
                content=message
            )
            logger.info(f"💾 Saved user message: {user_msg.id}")
        except Exception as e:
            logger.error(f"❌ Error saving user message: {e}")
            return Response(
                {"error": f"Erreur de sauvegarde: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # -----------------------
        # Appel IA avec RAG Service
        # -----------------------
        rag_service = get_rag_service()

        if not rag_service.is_available():
            logger.warning("⚠️ RAG Service not available")
            ai_response = "Le service IA n'est pas disponible actuellement. Veuillez vérifier la configuration (ANTHROPIC_API_KEY)."
            result = {
                "answer": ai_response,
                "response": ai_response,
                "used_rag": False,
                "sources": [],
                "tokens_used": 0
            }
        else:
            try:
                logger.info(f"🤖 Calling RAG service (use_rag={use_rag}, history={len(conversation_history)} msgs)...")

                result = rag_service.chat_with_rag(
                    query=message,
                    use_rag=use_rag,
                    user=user,
                    conversation_id=str(conversation.id),
                    conversation_history=conversation_history  # ✅ Passer l'historique
                )

                logger.info(f"✅ RAG service succeeded - tokens: {result.get('tokens_used', 0)}")

            except Exception as e:
                logger.exception(f"❌ RAG service error: {e}")
                return Response(
                    {"error": f"Erreur IA : {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Extraction de la réponse
        ai_response = result.get("answer") or result.get("response") or "Erreur: pas de réponse"

        # -----------------------
        # Sauvegarde réponse IA
        # -----------------------
        try:
            ai_message = ChatMessage.objects.create(
                conversation=conversation,
                role="assistant",
                content=ai_response,
                metadata={
                    "used_rag": result.get("used_rag", False),
                    "tokens_used": result.get("tokens_used", 0),
                    "sources_count": len(result.get("sources", []))
                }
            )
            logger.info(f"💾 Saved AI response: {ai_message.id}")
        except Exception as e:
            logger.error(f"❌ Error saving AI message: {e}")
            return Response(
                {"error": f"Erreur de sauvegarde de la réponse: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ✅ Mise à jour du compteur de messages
        try:
            conversation.message_count = conversation.messages.count()
            conversation.save(update_fields=['message_count', 'updated_at'])
            logger.info(f"📊 Updated conversation - {conversation.message_count} messages")
        except Exception as e:
            logger.warning(f"⚠️ Could not update message count: {e}")

        # -----------------------
        # Préparation de la réponse
        # -----------------------
        serializer = ChatMessageSerializer(ai_message)

        response_data = {
            "conversation_id": str(conversation.id),
            "message": serializer.data,
            "used_rag": result.get("used_rag", False),
            "sources": result.get("sources", []),
            "tokens_used": result.get("tokens_used", 0),
            "success": True
        }

        logger.info(f"✅ Response sent successfully")

        return Response(response_data, status=status.HTTP_200_OK)

    def get(self, request):
        """Endpoint GET pour information/debug"""
        return Response({
            "endpoint": "/api/chat/message/",
            "method": "POST required",
            "authenticated": request.user.is_authenticated,
            "user": request.user.username if request.user.is_authenticated else None,
            "accepted_formats": {
                "format_1_simple": {
                    "message": "Votre question",
                    "use_rag": True
                },
                "format_2_array": {
                    "messages": [
                        {"role": "assistant", "content": "Bonjour!"},
                        {"role": "user", "content": "Votre question"}
                    ],
                    "use_rag": True,
                    "conversation_id": "optional-uuid"
                }
            },
            "note": "Le dernier message avec role='user' sera extrait automatiquement"
        }, status=status.HTTP_200_OK)