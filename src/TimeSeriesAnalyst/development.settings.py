"""
Django settings for TimeSeriesAnalyst project.
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


# Deployment Settings
SECRET_KEY = os.environ['TSA_SECRET_KEY']

DATABASE_HOST = os.environ['TSA_DATABASE_HOST']

DATABASE_USER = os.environ['TSA_DATABASE_USER']

DATABASE_PASSWORD = os.environ['TSA_DATABASE_PASSWORD']


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

TEMPLATE_DEBUG = False

ALLOWED_HOSTS = ['localhost', '127.0.0.1']


# API Settings
API_LIMIT_PER_PAGE = 0

TASTYPIE_DEFAULT_FORMATS = ['json']


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'tastypie',
    'tastycrust',
    'sqlserver_ado',
    'odmtsaservices',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'TimeSeriesAnalyst.urls'

WSGI_APPLICATION = 'TimeSeriesAnalyst.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '../Internal',
    },
    'tsa': {
        'NAME': 'TSA_Catalog',
        'ENGINE': 'sqlserver_ado',
        'HOST': DATABASE_HOST,
        'USER': DATABASE_USER,
        'PASSWORD': DATABASE_PASSWORD,
        'OPTIONS': {
            'provider': 'SQLOLEDB',
            'use_mars': True,
        }
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'
