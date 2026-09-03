from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ScoreHistory(models.Model):
    """
    Historise les calculs de score TERAS.
    Optionnellement lié à un utilisateur (si tu gères l'auth plus tard).
    """
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    transactions = models.FloatField()
    epargne = models.FloatField()
    revenus = models.FloatField()
    actifs = models.FloatField()
    social = models.FloatField()
    score_total = models.FloatField()
    detail = models.JSONField(default=dict)  # pour stocker les pondérations détaillées
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"TERAS score {self.score_total:.2f} @ {self.created_at:%Y-%m-%d %H:%M}"
