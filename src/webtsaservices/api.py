from tastypie.resources import ModelResource
from webtsaservices.models import DataSeries, Site, SourcesDataService, VariableCategory, Variable, QualityControlLevel, SearchFacet


class SourcesDataServicesResource(ModelResource):
    class Meta:
        queryset = SourcesDataService.objects.using('tsa').all()
        resource_name = 'networks'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class SearchFacetsResource(ModelResource):
    class Meta:
        queryset = SearchFacet.objects.all()
        resource_name = 'facets'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}

class DataSeriesResource(ModelResource):
    class Meta:
        queryset = DataSeries.objects.using('tsa').all()
        resource_name = 'dataseries'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class SitesResource(ModelResource):
    class Meta:
        queryset = Site.objects.using('tsa').all()
        resource_name = 'sites'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class VariableCategoriesResource(ModelResource):
    class Meta:
        queryset = VariableCategory.objects.using('tsa').all()
        resource_name = 'variablecategories'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class VariablesResource(ModelResource):
    class Meta:
        queryset = Variable.objects.using('tsa').all()
        resource_name = 'variables'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class QualityControlLevelsResource(ModelResource):
    class Meta:
        queryset = QualityControlLevel.objects.using('tsa').all()
        resource_name = 'qualitylevels'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}