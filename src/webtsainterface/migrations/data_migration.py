# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


def forwards(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    new_facet = apps.get_model('webtsainterface', 'SearchFacet').objects.using(db_alias).create
    get_field = apps.get_model('webtsainterface', 'DataSeriesField').objects.using(db_alias).get_or_create

    # facet keyfield instances
    network_id = get_field(field_name='sourcedataserviceid')[0]
    sitecode = get_field(field_name='sitecode')[0]
    category_id = get_field(field_name='generalcategory')[0]
    variable_code = get_field(field_name='variablecode')[0]
    qc_level_code = get_field(field_name='qualitycontrollevelcode')[0]
    variable_level_id = get_field(field_name='variablelevel')[0]

    # facet namefield instances
    network_name = get_field(field_name='network')[0]
    site_name = get_field(field_name='sitename')[0]
    variable_name = get_field(field_name='variablename')[0]
    qc_level_definition = get_field(field_name='qualitycontrolleveldefinition')[0]

    network = new_facet(name='Network', keyfield=network_id, selected='')
    site = new_facet(name='Site', keyfield=sitecode, selected='')
    category = new_facet(name='Variable Category', keyfield=category_id, selected='')
    variable = new_facet(name='Variable', keyfield=variable_code, selected='')
    qc_level = new_facet(name='Quality Control Level', keyfield=qc_level_code, selected='')
    variable_level = new_facet(name='Variable Level', keyfield=variable_level_id, selected='Common')

    network.namefields.add(network_name)
    site.namefields.add(site_name)
    category.namefields.add(category_id)
    variable.namefields.add(variable_code)
    variable.namefields.add(variable_name)
    qc_level.namefields.add(qc_level_definition)
    variable_level.namefields.add(variable_level_id)


class Migration(migrations.Migration):

    dependencies = [
        ('webtsainterface', 'schema_migration'),
    ]

    operations = [
        migrations.RunPython(
            forwards,
        ),
    ]
