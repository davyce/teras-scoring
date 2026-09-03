# backend/support/serializers.py
from rest_framework import serializers
from .models import SupportTicket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'content', 'is_admin_message', 'sender_name',
                  'attachment', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class TicketMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField()
    attachment = serializers.FileField(required=False)


class SupportTicketListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SupportTicket
        fields = ['id', 'ticket_number', 'subject', 'category', 'category_display',
                  'priority', 'priority_display', 'status', 'status_display',
                  'message_count', 'is_read_by_user', 'created_at', 'updated_at']


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = ['id', 'ticket_number', 'subject', 'description', 'category',
                  'category_display', 'priority', 'priority_display', 'status',
                  'status_display', 'attachment', 'messages', 'message_count',
                  'assigned_to', 'assigned_to_name', 'is_read_by_user',
                  'created_at', 'updated_at', 'resolved_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['subject', 'description', 'category', 'priority', 'attachment']

    def create(self, validated_data):
        user = self.context['request'].user
        return SupportTicket.objects.create(user=user, **validated_data)


class SupportTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['status', 'priority', 'assigned_to']


class TicketStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    open = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    waiting_user = serializers.IntegerField()
    resolved = serializers.IntegerField()
    closed = serializers.IntegerField()
    by_category = serializers.DictField()
    by_priority = serializers.DictField()
    avg_resolution_time_hours = serializers.FloatField()
    avg_response_time_hours = serializers.FloatField()
