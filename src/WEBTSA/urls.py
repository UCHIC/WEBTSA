from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings

from webtsainterface.views import TsaView
from webtsainterface.api import v1_api

admin.autodiscover()

BASE_URL = settings.SITE_URL[1:]

urlpatterns = [
    url(r'^' + BASE_URL  + '$', TsaView.as_view(), name='tsa-application'),
    url(r'^' + BASE_URL  + 'api/', include(v1_api.urls)),
    url(r'^' + BASE_URL  + 'admin/', include(admin.site.urls)),
    url(r'^' + BASE_URL  + 'select2/', include('select2.urls')),
]