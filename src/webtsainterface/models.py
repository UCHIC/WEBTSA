from django.db import models
from webtsaservices.models import DataSeries


class DataSeriesFieldManager(models.Manager):
    def get_field_names(self):
        return DataSeries._meta.get_all_field_names()

    def get_field_choices(self):
        fields = DataSeries._meta.get_all_field_names()
        return tuple(zip(fields, fields))


class DataSeriesField(models.Model):
    fields = DataSeriesFieldManager()
    field_name = models.CharField(max_length=255, unique=True)

    def __unicode__(self):
        return self.field_name

    def __str__(self):
        return self.field_name


class SearchFacet(models.Model):
    name = models.CharField(max_length=255, primary_key=True)
    keyfield = models.ForeignKey(DataSeriesField, related_name='key')
    namefields = models.ManyToManyField(DataSeriesField, related_name='names')
    selected = models.CharField(max_length=255)

    def __unicode__(self):
        return self.name

    def __str__(self):
        return self.name