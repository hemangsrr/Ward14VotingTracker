"""
Production settings for Ward 14 Voting Tracker
"""
from .settings import *
import os

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*', 'hemangsrr-voting-tracker-2mmez.ondigitalocean.app', 'localhost', '127.0.0.1']

# Add WhiteNoise middleware for static file serving
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Add WhiteNoise here
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

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

# Static files with WhiteNoise
STATIC_ROOT = '/app/backend/staticfiles'
STATIC_URL = '/static/'
STATICFILES_DIRS = []

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files
MEDIA_ROOT = '/app/media'
MEDIA_URL = '/media/'

# CORS settings for production - Allow all origins
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for production
CSRF_TRUSTED_ORIGINS = [
    'https://hemangsrr-voting-tracker-2mmez.ondigitalocean.app',
    'http://localhost',
    'http://127.0.0.1',
]

# Session and Cookie settings for production
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Must be False for JavaScript to read it

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = False  # Nginx handles SSL
    SESSION_COOKIE_SECURE = False  # Set to True if using HTTPS
    CSRF_COOKIE_SECURE = False  # Set to True if using HTTPS
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'SAMEORIGIN'

# Logging - Enhanced for debugging
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
            'filename': '/var/log/supervisor/django_app.log',
            'formatter': 'verbose',
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
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
