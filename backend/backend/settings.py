# backend/backend/settings.py
"""
TERAS Settings - Version Python 3.14 Compatible
Sans ChromaDB, utilise Cohere + DB Django pour embeddings
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"] if DEBUG else os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd-party
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "simple_history",

    # Apps TERAS
    "users",
    "scoring",
    "chat",
    "validation",
    "legislation",
    "ai",  # App AI (Cohere + RAG)
    "credit",
    "support",
    "rest_framework_simplejwt.token_blacklist",

]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    # CSRF activé — les endpoints API JWT sont exemptés via @csrf_exempt (voir auth views)
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "users.CustomUser"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ========================================
# SÉCURITÉ PRODUCTION
# ========================================
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Brazzaville"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ========================================
# CONFIGURATION MEDIA (UPLOADS)
# ========================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Créer automatiquement les dossiers
os.makedirs(MEDIA_ROOT / 'documents', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'legislation', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'chat_exports', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'kyc', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'support', exist_ok=True)

# ========================================
# CONFIGURATION CORS
# ========================================
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOWED_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "https://teras.cg").split(",") if o.strip()
    ]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
]

# ========================================
# REST FRAMEWORK & JWT
# ========================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # IsAuthenticated par défaut — les endpoints publics déclarent explicitement AllowAny
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "200/minute",
        "login": "5/minute",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "TERAS API",
    "VERSION": "v1",
}

# ========================================
# CONFIGURATION AI - ANTHROPIC (CLAUDE)
# ========================================
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

CLAUDE_CONFIG = {
    'model': 'claude-sonnet-4-20250514',
    'max_tokens': 1000,
    'temperature': 0.7,
    'timeout': 30,
}

# ========================================
# CONFIGURATION AI - COHERE
# ========================================
COHERE_API_KEY = os.getenv('COHERE_API_KEY', '')

COHERE_CONFIG = {
    'embed_model': 'embed-multilingual-v3.0',
    'chat_model': 'command-r-plus',
    'rerank_model': 'rerank-multilingual-v3.0',
}

# ========================================
# CONFIGURATION RAG (sans ChromaDB)
# ========================================
RAG_CONFIG = {
    'chunk_size': 500,
    'chunk_overlap': 50,
    'top_k_results': 5,
    'use_cohere': True,  # Utiliser Cohere pour embeddings
}

# ========================================
# CONFIGURATION CHATBOT
# ========================================
CHATBOT_CONFIG = {
    'rate_limit': {
        'messages_per_minute': 20,
        'messages_per_hour': 100,
        'messages_per_day': 500,
    },
    'max_message_length': 2000,
    'context_messages': 10,
    'session_timeout_minutes': 30,
    'enable_logging': True,
    'enable_analytics': True,
}

# ========================================
# CONFIGURATION EMAIL
# ========================================
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend'
)

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'TERAS <noreply@teras.com>')

# ========================================
# LOGGING CONFIGURATION
# ========================================
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'teras.log'),
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'ai': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'ai.vector_store': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'ai.cohere_service': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'scoring': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}