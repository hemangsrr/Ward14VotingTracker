"""
Droplet deployment settings for Ward 14 Voting Tracker
For HTTP deployment on Ubuntu droplet
"""
from .settings import *
import os
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
try:
    from decouple import config
except ImportError:
    # Fallback if python-decouple is not installed
    import os
    def config(key, default=None, cast=None):
        value = os.environ.get(key, default)
        if cast and value is not None:
            return cast(value)
        return value

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Allow all hosts for simplicity
ALLOWED_HOSTS = ['*']

# Database - PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='voting_tracker_db'),
        'USER': config('POSTGRES_USER', default='voting_admin'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='voting_secure_pass'),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static files - use absolute path relative to BASE_DIR
STATIC_ROOT = str(BASE_DIR / 'staticfiles')
STATIC_URL = '/static/'
STATICFILES_DIRS = []

# Media files
MEDIA_ROOT = str(BASE_DIR / 'media')
MEDIA_URL = '/media/'

# CORS settings - Allow all origins for HTTP deployment
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for HTTP deployment
CSRF_TRUSTED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    'http://134.209.152.3',
]

# Session and Cookie settings for HTTP
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Must be False for JavaScript to read it
SESSION_COOKIE_SECURE = False  # HTTP deployment
CSRF_COOKIE_SECURE = False  # HTTP deployment
SESSION_COOKIE_DOMAIN = None
CSRF_COOKIE_DOMAIN = None

# Security settings for HTTP deployment
SECURE_SSL_REDIRECT = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
import os
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
