# backend/scoring/user/serializers.py
from rest_framework import serializers

# ✅ CORRIGÉ : Import depuis la racine de scoring/
from scoring.models import ScoreHistory

class ScoreHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreHistory
        fields = '__all__'
