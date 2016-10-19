from __future__ import unicode_literals

import six
from tastypie.api import Api
from tastypie.fields import CharField
from tastypie.resources import Resource, ModelResource

from webtsaservices.models import DataSeries, Site, SourcesDataService, VariableCategory, Variable, QualityControlLevel


class UnicodeCharField(CharField):
    """
    A text field of arbitrary length, ignoring unicode errors.

    """

    def convert(self, value):
        if value is None:
            return None

        return six.text_type(value, 'utf8', 'ignore')


class PossibleValuesResource(Resource):
    def full_dehydrate(self, bundle, for_list=False):
        for field in bundle.obj:
            bundle.data[field] = bundle.obj[field]

        return super(PossibleValuesResource, self).full_dehydrate(bundle, for_list)

    def obj_get_list(self, bundle, **kwargs):
        if 'field' not in bundle.request.GET:
            return super(PossibleValuesResource, self).obj_get_list(bundle, **kwargs)

        field = bundle.request.GET['field']
        raw_data = DataSeries.objects.order_by(field).values(field).distinct()
        bundle.data['objects'] = raw_data
        return bundle.data['objects']

    class Meta:
        resource_name = 'values'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class SourcesDataServicesResource(ModelResource):
    class Meta:
        queryset = SourcesDataService.objects.all()
        resource_name = 'networks'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class DataSeriesResource(ModelResource):
    methoddescription = UnicodeCharField()

    class Meta:
        queryset = DataSeries.objects.all()
        resource_name = 'dataseries'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class SitesResource(ModelResource):
    class Meta:
        queryset = Site.objects.all()
        resource_name = 'sites'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class VariableCategoriesResource(ModelResource):
    class Meta:
        queryset = VariableCategory.objects.all()
        resource_name = 'variablecategories'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class VariablesResource(ModelResource):
    class Meta:
        queryset = Variable.objects.all()
        resource_name = 'variables'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


class QualityControlLevelsResource(ModelResource):
    class Meta:
        queryset = QualityControlLevel.objects.all()
        resource_name = 'qualitylevels'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}


v1_api = Api(api_name='v1')
v1_api.register(SourcesDataServicesResource())
v1_api.register(DataSeriesResource())
v1_api.register(SitesResource())
v1_api.register(VariableCategoriesResource())
v1_api.register(VariablesResource())
v1_api.register(QualityControlLevelsResource())
v1_api.register(PossibleValuesResource())
