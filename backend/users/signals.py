#users/signals

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile, UserSettings  # ✅ UserSettings ajouté

User = get_user_model()

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created and not hasattr(instance, "profile"):
        Profile.objects.create(user=instance)


# ✅ NOUVEAU : Créer automatiquement les settings utilisateur
@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Crée automatiquement les paramètres lors de la création d'un utilisateur"""
    if created:
        UserSettings.objects.get_or_create(user=instance)
