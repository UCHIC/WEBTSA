# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DataSeries',
            fields=[
                ('seriesid', models.IntegerField(serialize=False, primary_key=True, db_column='SeriesID')),
                ('sourcedataserviceid', models.IntegerField(db_column='SourceDataServiceID')),
                ('network', models.CharField(max_length=50, db_column='Network')),
                ('sitecode', models.CharField(max_length=50, db_column='SiteCode')),
                ('sitename', models.CharField(max_length=500, db_column='SiteName')),
                ('latitude', models.FloatField(null=True, db_column='Latitude', blank=True)),
                ('longitude', models.FloatField(null=True, db_column='Longitude', blank=True)),
                ('state', models.CharField(max_length=50, null=True, db_column='State', blank=True)),
                ('county', models.CharField(max_length=50, null=True, db_column='County', blank=True)),
                ('sitetype', models.CharField(max_length=50, db_column='SiteType')),
                ('variablecode', models.CharField(max_length=50, db_column='VariableCode')),
                ('variablename', models.CharField(max_length=255, db_column='VariableName')),
                ('variablelevel', models.CharField(max_length=50, db_column='VariableLevel')),
                ('methoddescription', models.CharField(max_length=500, db_column='MethodDescription')),
                ('variableunitsname', models.CharField(max_length=255, null=True, db_column='VariableUnitsName', blank=True)),
                ('variableunitstype', models.CharField(max_length=50, null=True, db_column='VariableUnitsType', blank=True)),
                ('variableunitsabbreviation', models.CharField(max_length=50, db_column='VariableUnitsAbbreviation')),
                ('samplemedium', models.CharField(max_length=50, db_column='SampleMedium')),
                ('valuetype', models.CharField(max_length=50, null=True, db_column='ValueType', blank=True)),
                ('datatype', models.CharField(max_length=50, null=True, db_column='DataType', blank=True)),
                ('generalcategory', models.CharField(max_length=50, null=True, db_column='GeneralCategory', blank=True)),
                ('timesupport', models.FloatField(null=True, db_column='TimeSupport', blank=True)),
                ('timesupportunitsname', models.CharField(max_length=500, null=True, db_column='TimeSupportUnitsName', blank=True)),
                ('timesupportunitstype', models.CharField(max_length=50, null=True, db_column='TimeSupportUnitsType', blank=True)),
                ('timesupportunitsabbreviation', models.CharField(max_length=50, null=True, db_column='TimeSupportUnitsAbbreviation', blank=True)),
                ('qualitycontrollevelcode', models.CharField(max_length=50, null=True, db_column='QualityControlLevelCode', blank=True)),
                ('qualitycontrolleveldefinition', models.CharField(max_length=500, db_column='QualityControlLevelDefinition')),
                ('qualitycontrollevelexplanation', models.CharField(max_length=500, null=True, db_column='QualityControlLevelExplanation', blank=True)),
                ('sourceorganization', models.CharField(max_length=255, db_column='SourceOrganization')),
                ('sourcedescription', models.CharField(max_length=500, db_column='SourceDescription')),
                ('begindatetime', models.DateTimeField(db_column='BeginDateTime')),
                ('enddatetime', models.DateTimeField(db_column='EndDateTime')),
                ('utcoffset', models.IntegerField(null=True, db_column='UTCOffset', blank=True)),
                ('numberobservations', models.IntegerField(db_column='NumberObservations')),
                ('datelastupdated', models.DateTimeField(db_column='DateLastUpdated')),
                ('isactive', models.BigIntegerField(db_column='IsActive')),
                ('getdataurl', models.CharField(max_length=500, db_column='GetDataURL')),
            ],
            options={
                'db_table': 'DataSeries',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='QualityControlLevel',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=50, null=True, db_column='QualityControlLevelCode', blank=True)),
                ('definition', models.CharField(max_length=500, db_column='QualityControlLevelDefinition')),
                ('explanation', models.CharField(max_length=500, null=True, db_column='QualityControlLevelExplanation', blank=True)),
            ],
            options={
                'db_table': 'QualityControlLevels',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='Site',
            fields=[
                ('sourcedataserviceid', models.IntegerField(db_column='SourceDataServiceID')),
                ('network', models.CharField(max_length=50, db_column='Network')),
                ('sitecode', models.CharField(max_length=50, serialize=False, primary_key=True, db_column='SiteCode')),
                ('sitename', models.CharField(max_length=500, db_column='SiteName')),
                ('latitude', models.FloatField(null=True, db_column='Latitude', blank=True)),
                ('longitude', models.FloatField(null=True, db_column='Longitude', blank=True)),
                ('state', models.CharField(max_length=50, null=True, db_column='State', blank=True)),
                ('county', models.CharField(max_length=50, null=True, db_column='County', blank=True)),
                ('sitetype', models.CharField(max_length=50, db_column='SiteType')),
            ],
            options={
                'db_table': 'Sites',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SourcesDataService',
            fields=[
                ('sourcedataserviceid', models.IntegerField(serialize=False, primary_key=True, db_column='SourceDataServiceID')),
                ('servicename', models.CharField(max_length=255, db_column='ServiceName')),
                ('servicedescription', models.CharField(max_length=500, db_column='ServiceDescription')),
                ('serviceurl', models.CharField(max_length=500, db_column='ServiceURL')),
                ('sourcenetworkname', models.CharField(max_length=255, null=True, db_column='SourceNetworkName', blank=True)),
            ],
            options={
                'db_table': 'SourceDataServices',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='Variable',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('variablecode', models.CharField(max_length=50, db_column='VariableCode')),
                ('variablename', models.CharField(max_length=255, db_column='VariableName')),
            ],
            options={
                'db_table': 'Variable',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='VariableCategory',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('generalcategory', models.CharField(max_length=50, null=True, db_column='GeneralCategory', blank=True)),
            ],
            options={
                'db_table': 'VariableCategories',
                'managed': False,
            },
        ),
    ]
