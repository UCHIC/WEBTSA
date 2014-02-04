from __future__ import unicode_literals
from django.db import models


class SourcesDataService(models.Model):
    sourcedataserviceid = models.IntegerField(db_column='SourceDataServiceID')
    servicename = models.CharField(db_column='ServiceName', max_length=255)
    servicedescription = models.CharField(db_column='ServiceDescription', max_length=500)
    serviceurl = models.CharField(db_column='ServiceURL', max_length=500)
    class Meta:
        managed = False
        db_table = 'SourceDataServices'


class DataSeries(models.Model):
    seriesid = models.IntegerField(db_column='SeriesID', primary_key=True)
    sourcedataserviceid = models.ForeignKey('SourcesDataService', db_column='SourceDataServiceID')
    sitecode = models.CharField(db_column='SiteCode', max_length=50)
    sitename = models.CharField(db_column='SiteName', max_length=500)
    latitude = models.FloatField(db_column='Latitude')
    longitude = models.FloatField(db_column='Longitude')
    state = models.CharField(db_column='State', max_length=50, blank=True)
    county = models.CharField(db_column='County', max_length=50, blank=True)
    sitetype = models.CharField(db_column='SiteType', max_length=50)
    variablecode = models.CharField(db_column='VariableCode', max_length=50)
    variablecode = models.CharField(db_column='VariableCode', max_length=50)
    variablename = models.CharField(db_column='VariableName', max_length=255)
    methoddescription = models.CharField(db_column='MethodDescription', max_length=500)
    variableunitsname = models.CharField(db_column='VariableUnitsName', max_length=255)
    variableunitstype = models.CharField(db_column='VariableUnitsType', max_length=50)
    variableunitsabbreviation = models.CharField(db_column='VariableUnitsAbbreviation', max_length=50)
    samplemedium = models.CharField(db_column='SampleMedium', max_length=50)
    valuetype = models.CharField(db_column='ValueType', max_length=50)
    datatype = models.CharField(db_column='DataType', max_length=50)
    generalcategory = models.CharField(db_column='GeneralCategory', max_length=50)
    timesupport = models.FloatField(db_column='TimeSupport')
    timesupportunitsname = models.CharField(db_column='TimeSupportUnitsName', max_length=500)
    timesupportunitstype = models.CharField(db_column='TimeSupportUnitsType', max_length=50)
    timesupportunitsabbreviation = models.CharField(db_column='TimeSupportUnitsAbbreviation', max_length=50)
    qualitycontrollevelcode = models.CharField(db_column='QualityControlLevelCode', max_length=50)
    qualitycontrolleveldefinition = models.CharField(db_column='QualityControlLevelDefinition', max_length=500)
    qualitycontrollevelexplanation = models.CharField(db_column='QualityControlLevelExplanation', max_length=500, blank=True)
    sourceorganization = models.CharField(db_column='SourceOrganization', max_length=255)
    souredescription = models.CharField(db_column='SoureDescription', max_length=500)
    begindatetime = models.DateTimeField(db_column='BeginDateTime')
    enddatetime = models.DateTimeField(db_column='EndDateTime')
    utcoffset = models.IntegerField(db_column='UTCOffset')
    numberobservations = models.IntegerField(db_column='NumberObservations')
    datelastupdated = models.DateTimeField(db_column='DateLastUpdated')
    isactive = models.BigIntegerField(db_column='IsActive')
    getdataurl = models.CharField(db_column='GetDataURL', max_length=500)
    class Meta:
        managed = False
        db_table = 'DataSeries'