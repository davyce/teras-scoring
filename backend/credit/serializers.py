# backend/credit/serializers.py
from rest_framework import serializers
from .models import CreditProduct, CreditRequest, CreditPaymentSchedule


class CreditProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditProduct
        fields = "__all__"

class CreditProductWithEligibilitySerializer(CreditProductSerializer):
    eligibility = serializers.SerializerMethodField()
    def get_eligibility(self, obj):
        return {"eligible": True, "eligibility_type": "conditional"}

class CreditRequestSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = CreditRequest
        fields = "__all__"

class CreditRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditRequest
        fields = ["product", "amount", "duration_months", "purpose"]
    def create(self, validated_data):
        return CreditRequest.objects.create(user=self.context["request"].user, **validated_data)

class CreditSimulationSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=CreditProduct.objects.all())
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    duration_months = serializers.IntegerField()

class CRMCalculatorSerializer(serializers.Serializer):
    transaction_days = serializers.IntegerField(default=90)

class PaymentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditPaymentSchedule
        fields = "__all__"

class CreditHistorySerializer(serializers.Serializer):
    pass
