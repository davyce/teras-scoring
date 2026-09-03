# backend/chat/serializers.py
from rest_framework import serializers
from .models import ChatConversation, ChatMessage, ChatExport


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'metadata', 'timestamp']
        read_only_fields = ['id', 'created_at']


class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'message_count', 'messages', 'last_message',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'message_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        if last:
            return {'content': last.content[:100], 'role': last.role,
                    'created_at': last.timestamp.isoformat()}
        return None


class ChatConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'message_count', 'last_message',
                  'created_at', 'updated_at']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        if last:
            return {'content': last.content[:100], 'role': last.role,
                    'created_at': last.timestamp.isoformat()}
        return None


class ChatExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatExport
        fields = ['id', 'conversation', 'file_path', 'created_at']
        read_only_fields = ['id', 'created_at']
