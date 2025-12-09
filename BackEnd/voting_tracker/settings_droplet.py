"""
Droplet deployment settings for Ward 14 Voting Tracker
For HTTPS deployment on Ubuntu droplet with Let's Encrypt SSL
Domain: vote-tracker.in
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

# Allowed hosts for production
ALLOWED_HOSTS = [
    'vote-tracker.in',
    'www.vote-tracker.in',
    '68.183.95.232',
    'localhost',
    '127.0.0.1',
]

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

# CORS settings - Allow specific origins for HTTPS deployment
CORS_ALLOWED_ORIGINS = [
    'https://vote-tracker.in',
    'https://www.vote-tracker.in',
]
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for HTTPS deployment
CSRF_TRUSTED_ORIGINS = [
    'https://vote-tracker.in',
    'https://www.vote-tracker.in',
]

# Session and Cookie settings for HTTPS
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Must be False for JavaScript to read it
SESSION_COOKIE_SECURE = True  # HTTPS deployment - secure cookies only
CSRF_COOKIE_SECURE = True  # HTTPS deployment - secure cookies only
SESSION_COOKIE_DOMAIN = None
CSRF_COOKIE_DOMAIN = None

# Security settings for HTTPS deployment
SECURE_SSL_REDIRECT = True  # Redirect HTTP to HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # Trust nginx proxy
SECURE_HSTS_SECONDS = 31536000  # 1 year HSTS
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
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
