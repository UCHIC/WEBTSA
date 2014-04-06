var TsaApplication = (function(self){
    self.initialParameters = {};

    self.initializeApplication = function() {
        self.initialParameters = getUrlParameters();
        var selectedView = self.initialParameters['view'] || 'map';
        self.UiHelper.loadView(selectedView);
        bindEvents();
        self.DataManager.loadData();
    };


    function getUrlParameters() {
        var search = location.search.substring(1);
        return (search)? JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
                            function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
    }

    function bindEvents() {
        document.addEventListener("facetsloaded", function()  {
            self.UiHelper.renderFacets($("#leftPanel"));
        });

        document.addEventListener("dataloaded", function() {
            self.UiHelper.renderFilterItems();
            self.TableController.initializeTable();
        });

        document.addEventListener('datafiltered', function() {
            //update map markers and dataseries table.
            self.UiHelper.updateSeriesCount();
            self.MapController.updateSitesMarkers();
            self.TableController.updateDataseries();
        });

        document.addEventListener('sitesloaded', function() {
            self.MapController.loadMarkers();
        });

        document.addEventListener('plotdataloading', function() {
            self.UiHelper.startPlotAnimation();
        });

        document.addEventListener('plotdataready', function() {
            self.UiHelper.endPlotAnimation();
            self.VisualizationController.plotSeries();
        });

        document.addEventListener('plotstarted', function() {
            self.UiHelper.startPlotAnimation();
        });

        document.addEventListener('plotfinished', function() {
            self.UiHelper.endPlotAnimation();
        });

        google.maps.event.addDomListener(window, "load", function() {
            self.MapController.initializeMap();
            google.maps.event.trigger(self.MapController.map, 'resize');
        });

        $('a[href="#mapContent"]').on('shown', function() {
            google.maps.event.trigger(self.MapController.map, 'resize');
        });

        $("#btnAddToPlot").click(function() {
            var id = +$("#InfoDialog").get(0).dataset['series'];
            var method = self.VisualizationController.plottingMethods.addPlot;
            var series = _(self.DataManager.dataseries).where({seriesid: id}).pop();
            self.VisualizationController.prepareSeries(series, method);
            self.UiHelper.loadView('visualization');
            $("#InfoDialog").modal('hide');
        });

        $("#btnPlotDataset").click(function() {
            var id = +$("#InfoDialog").get(0).dataset['series'];
            var method = self.VisualizationController.plottingMethods.newPlot;
            var series = _(self.DataManager.dataseries).where({seriesid: id}).pop();
            self.VisualizationController.prepareSeries(series, method);
            self.UiHelper.loadView('visualization');
            $("#InfoDialog").modal('hide');
        });

        $("#btnTimeSeries").click(function() {
            if (self.VisualizationController.currentPlot === self.VisualizationController.plotTypes.multiseries) {
                return;
            }
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.multiseries;
            self.VisualizationController.plotSeries();
        });

        $("#btnHistogram").click(function() {
            if (self.VisualizationController.currentPlot === self.VisualizationController.plotTypes.histogram) {
                return;
            }
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.histogram;
            self.VisualizationController.plotSeries();
        });

        $("#btnBoxAndWhisker").click(function() {
            if (self.VisualizationController.currentPlot === self.VisualizationController.plotTypes.box) {
                return;
            }
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.box;
            self.VisualizationController.plotSeries();
        });
    }

    return self;
}(TsaApplication || {}));


$(document).ready(function(){
    TsaApplication.initializeApplication();
});

/*
 * object.watch polyfill
 * By Eli Grey, http://eligrey.com
 */
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}