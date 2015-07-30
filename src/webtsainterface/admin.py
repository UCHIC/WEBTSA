from django.contrib import admin
from django import forms
from select2 import fields as select_fields

from webtsainterface.models import SearchFacet, DataSeriesField
from webtsaservices.models import DataSeries


class SearchFacetForm(forms.ModelForm):
    keyfield = select_fields.ChoiceField(choices=DataSeriesField.fields.get_field_choices(),
                                         overlay="Choose a field...")
    namefields = select_fields.MultipleChoiceField(choices=DataSeriesField.fields.get_field_choices(),
                                                   overlay="Choose the name fields...")
    selected = forms.ChoiceField(required=False)

    def get_valid_field(self, name):
        field, created = DataSeriesField.fields.get_or_create(field_name=name)
        return field

    def clean_keyfield(self):
        return self.get_valid_field(self.data[u'keyfield'])

    def clean_namefields(self):
        field_list = self.data[u'namefields']
        if not isinstance(field_list, list):
            field_list = [field_list]

        fields = []
        for field in field_list:
            fields.append(self.get_valid_field(field))
        return fields

    def is_valid(self):
        values = list(DataSeries.objects.order_by(self.data[u'keyfield']).values(self.data[u'keyfield']).distinct())
        choices = tuple([(value_object[self.data[u'keyfield']], value_object[self.data[u'keyfield']]) for value_object in values])
        self.fields[u'selected'].choices = choices
        return super(SearchFacetForm, self).is_valid()

    class Media:
        js = ('js/admin.js', )

    class Meta:
        model = SearchFacet
        fields = '__all__'


@admin.register(SearchFacet)
class SearchFacetAdmin(admin.ModelAdmin):
    form = SearchFacetForm