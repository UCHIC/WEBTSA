from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings

from webtsainterface.views import TsaView
from webtsainterface.api import v1_api

admin.autodiscover()

urlpatterns = [
    url(r'^' + settings.SITE_URL + '$', TsaView.as_view(), name='tsa-application'),
    url(r'^' + settings.SITE_URL + 'api/', include(v1_api.urls)),
    url(r'^' + settings.SITE_URL + 'admin/', include(admin.site.urls)),
    url(r'^' + settings.SITE_URL + 'select2/', include('select2.urls')),
]