from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
from django.views.generic.base import View


class TsaView(View):
    def get(self, request):
        return render(request, 'webtsainterface/index.html')
		
class DebugView(View):
    def get(self, request):
		from django.conf import settings
		return HttpResponse(settings.STATIC_URL)
        