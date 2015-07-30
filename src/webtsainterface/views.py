from django.views.generic.base import TemplateView


class TsaView(TemplateView):
    template_name = 'webtsainterface/index.html'