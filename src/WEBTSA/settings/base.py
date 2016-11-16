"""
Django settings for WEBTSA project.

To setup the settings json file:
    1. rename settings_template.json to settings.json
    2. write all the necessary data in it

"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

try:
    with open(os.path.join(BASE_DIR, 'settings', 'settings.json')) as data_file:
        data = json.load(data_file)
except IOError:
    print("You need to setup the settings data file (see instructions in base.py file.)")


SECRET_KEY = data["secret_key"]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

TASTYPIE_DEFAULT_FORMATS = ['json']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'select2',
    'tastypie',
    'webtsaservices',
    'webtsainterface'
]

MIDDLEWARE_CLASSES = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'WEBTSA.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'WEBTSA.wsgi.application'

# Database
DATABASES = {}
for database in data['databases']:
    DATABASES[database['name']] = {
        'ENGINE': database['engine'],
        'NAME': database['schema'],
        'USER': database['user'],
        'PASSWORD': database['password'],
        'HOST': database['host'],
        'PORT': database['port'],
        'OPTIONS': database['options']
    }


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

DATABASE_ROUTERS = ['WEBTSA.db_routers.DataSeriesRouter']