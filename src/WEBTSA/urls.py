from django.conf.urls import patterns, include, url

from django.contrib import admin
from tastypie.api import Api

from webtsaservices.api import DataSeriesResource, SitesResource, SourcesDataServicesResource, \
    VariableCategoriesResource, VariablesResource, QualityControlLevelsResource, SearchFacetsResource

from webtsainterface.views import TsaView


admin.autodiscover()

v1_api = Api(api_name='v1')
v1_api.register(SourcesDataServicesResource())
v1_api.register(DataSeriesResource())
v1_api.register(SitesResource())
v1_api.register(VariableCategoriesResource())
v1_api.register(VariablesResource())
v1_api.register(QualityControlLevelsResource())
v1_api.register(SearchFacetsResource())

urlpatterns = patterns('',
    url(r'^$', TsaView.as_view(), name='index'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include(v1_api.urls)),
)