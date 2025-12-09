"""
Production settings for Ward 14 Voting Tracker
"""
from .settings import *
import os

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'voting_tracker_db'),
        'USER': os.environ.get('POSTGRES_USER', 'voting_admin'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'voting_secure_pass'),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static files
STATIC_ROOT = '/app/staticfiles'
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = '/app/media'
MEDIA_URL = '/media/'

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
]

# Add your production domain when deployed
if not DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        os.environ.get('FRONTEND_URL', 'http://localhost'),
    ])

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = False  # Nginx handles SSL
    SESSION_COOKIE_SECURE = False  # Set to True if using HTTPS
    CSRF_COOKIE_SECURE = False  # Set to True if using HTTPS
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'SAMEORIGIN'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': '/var/log/supervisor/django_app.log',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
