# backend/celery.py
"""
Configuration Celery pour TERAS
Structure flat: backend/ contient à la fois config et apps
"""

import os
import sys
from pathlib import Path
from celery import Celery
from celery.schedules import crontab

# ✅ CORRECTION: Ajouter backend/ au sys.path pour trouver les apps
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('teras')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ============================================================
# CELERY BEAT - TÂCHES PÉRIODIQUES
# ============================================================

app.conf.beat_schedule = {
    # Analyser documents en attente toutes les 10 minutes
    'batch-analyze-documents': {
        'task': 'validation.tasks.batch_analyze_documents',
        'schedule': crontab(minute='*/10'),
    },
    
    # Nettoyer anciennes analyses tous les jours à 3h
    'cleanup-old-analysis': {
        'task': 'validation.tasks.cleanup_old_analysis',
        'schedule': crontab(hour=3, minute=0),
    },
}

@app.task(bind=True)
def debug_task(self):
    """Tâche de debug pour tester Celery"""
    print(f'Request: {self.request!r}')
    return 'Debug task executed successfully'
