from tastypie.resources import ModelResource
from tastypie import fields

from webtsaservices.api import v1_api
from webtsainterface.models import SearchFacet, DataSeriesField


class DataSeriesFieldResource(ModelResource):
    field_name = fields.CharField('field_name')

    class Meta:
        queryset = DataSeriesField.fields.all()


class SearchFacetsResource(ModelResource):
    namefields = fields.ToManyField(DataSeriesFieldResource, 'namefields', full=True)
    keyfield = fields.ForeignKey(DataSeriesFieldResource, 'keyfield', full=True)

    def dehydrate_keyfield(self, bundle):
        return bundle.data['keyfield'].data['field_name']

    def dehydrate_namefields(self, bundle):
        namefields = []
        for field_bundle in bundle.data['namefields']:
            namefields.append(field_bundle.data['field_name'])

        return namefields

    class Meta:
        queryset = SearchFacet.objects.all()
        resource_name = 'facets'
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {}

v1_api.register(SearchFacetsResource())