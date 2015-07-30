# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DataSeriesField',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('field_name', models.CharField(max_length=255, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='SearchFacet',
            fields=[
                ('name', models.CharField(max_length=255, serialize=False, primary_key=True)),
                ('selected', models.CharField(max_length=255)),
                ('keyfield', models.ForeignKey(related_name='key', to='webtsainterface.DataSeriesField')),
                ('namefields', models.ManyToManyField(related_name='names', to='webtsainterface.DataSeriesField')),
            ],
        ),
    ]
