# backend/legislation/apps.py

from django.apps import AppConfig


class LegislationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'legislation'  # ✅ NOM SIMPLE (pas backend.legislation)
    verbose_name = 'Législation CEMAC'
