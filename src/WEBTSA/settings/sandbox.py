from WEBTSA.settings.base import *

DATABASE_PATH = os.path.join(BASE_DIR, os.pardir, 'Internal')
DATABASES['default']['NAME'] = DATABASE_PATH;

DEBUG = True
TEMPLATE_DEBUG = True

SITE_ROOT = os.environ['APPL_PHYSICAL_PATH']
SITE_URL = os.environ['APPL_VIRTUAL_PATH'] + "/"

STATIC_ROOT = os.path.join(SITE_ROOT, 'static')
STATIC_URL = SITE_URL + 'static/'