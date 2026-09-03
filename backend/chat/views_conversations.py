# backend/chat/views_conversations.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChatConversation, ChatMessage
from .serializers import ChatConversationSerializer, ChatConversationListSerializer


class ChatConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ChatConversationListSerializer
        return ChatConversationSerializer

    def get_queryset(self):
        return ChatConversation.objects.filter(
            user=self.request.user
        ).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        msgs = conversation.messages.order_by('created_at')
        from .serializers import ChatMessageSerializer
        return Response(ChatMessageSerializer(msgs, many=True).data)

    @action(detail=True, methods=['delete'])
    def clear(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.all().delete()
        conversation.message_count = 0
        conversation.save(update_fields=['message_count'])
        return Response({'message': 'Conversation vidée'})
