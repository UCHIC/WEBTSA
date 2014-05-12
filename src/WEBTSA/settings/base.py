"""
Django settings for WEBTSA project.

"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

try:
    SECRET_KEY = os.environ['TSA_SECRET_KEY']
    DATABASE_HOST = os.environ['TSA_DATABASE_HOST']
    DATABASE_USER = os.environ['TSA_DATABASE_USER']
    DATABASE_PASSWORD = os.environ['TSA_DATABASE_PASSWORD']
except KeyError:
    print "Please set the required environment variables TSA_SECRET_KEY, TSA_DATABASE_HOST, " \
          "TSA_DATABASE_USER, TSA_DATABASE_PASSWORD"
    exit(True)

ALLOWED_HOSTS = []
TASTYPIE_DEFAULT_FORMATS = ['json']

# Application definition
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'django_pyodbc',
	'tastypie',
    'webtsaservices',
    'webtsainterface'
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'WEBTSA.urls'

WSGI_APPLICATION = 'WEBTSA.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'Internal',
    },
	'tsa': {
       'ENGINE': "django_pyodbc",
       'HOST': DATABASE_HOST,
       'USER': DATABASE_USER,
       'PASSWORD': DATABASE_PASSWORD,
       'NAME': "TSA_Catalog",
       'OPTIONS': {
		'host_is_server': False,
		'encoding': 'utf-8'
       }
   }
}

# Internationalization
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True
