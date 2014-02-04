from tastypie.resources import ModelResource
from odmtsaservices.models import DataSeries


class DataSeriesResource(ModelResource):
    class Meta:
        queryset = DataSeries.objects.using("tsa").all()
        resource_name = "dataseries"
        list_allowed_methods = ['get']
        max_limit = 0
        filtering = {
        }