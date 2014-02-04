from django.conf.urls import patterns, include, url

from django.contrib import admin
from tastypie.api import Api
from odmtsaservices.api import DataSeriesResource

admin.autodiscover()

v1_api = Api(api_name='v1')
v1_api.register(DataSeriesResource())

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'TimeSeriesAnalyst.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    (r'^api/', include(v1_api.urls)),
)
