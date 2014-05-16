var TsaApplication = (function(self){
    var r =0, dir=false;

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
        var renderTable = _.once(self.TableController.reDrawTable);

        $(document).on('facetsloaded', function() {
            self.UiHelper.renderFacets($("#leftPanel"));
        });

        $(document).on('dataloaded', function() {
            self.UiHelper.renderFilterItems();
            self.TableController.initializeTable();
        });

        $(document).on('datafiltered', function() {
            //update map markers and dataseries table.
            self.UiHelper.updateSeriesCount();
            self.MapController.updateSitesMarkers();
            self.TableController.updateDataseries();
        });

        $(document).on('sitesloaded', function() {
            self.MapController.loadMarkers();
        });

        $(document).on('plotdataloading', function() {
            self.UiHelper.loadView('visualization');
            self.UiHelper.startPlotAnimation();
        });

        $(document).on('plotdataready', function() {
            self.UiHelper.endPlotAnimation();
            self.VisualizationController.plotSeries();
        });

        $(document).on('plotstarted', function() {
            self.UiHelper.loadView('visualization');
            self.UiHelper.startPlotAnimation();
        });

        $(document).on('plotfinished', function() {
            self.UiHelper.endPlotAnimation();
        });

        google.maps.event.addDomListener(window, "load", function() {
            self.MapController.initializeMap();
            google.maps.event.trigger(self.MapController.map, 'resize');
        });

        $(document).on('shown.bs.tab', 'a[href="#mapContent"]', function() {
            google.maps.event.trigger(self.MapController.map, 'resize');
        });

        $(document).on('shown.bs.tab', 'a[href="#datasetsContent"]', function() {
            renderTable();
        });

        $("#btnAddToPlot").click(function() {
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];
            var method = self.VisualizationController.plottingMethods.addPlot;
            var series = _(self.DataManager.dataseries).where({seriesid: id}).pop();
            self.VisualizationController.prepareSeries(series, method);
            dialog.modal('hide');
        });

        $("#btnPlotDataset").click(function() {
            self.VisualizationController.svgs = [];
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];
            var method = self.VisualizationController.plottingMethods.newPlot;
            var series = _(self.DataManager.dataseries).where({seriesid: id}).pop();

            // Reset the date intervals
            self.VisualizationController.initializeDatePickers();

            // Clear the graph
            self.VisualizationController.clearGraph();
            self.VisualizationController.boxWhiskerSvgs = [];

            self.VisualizationController.prepareSeries(series, method);

            dialog.modal('hide');
        });

        $("#btnTimeSeries").click(function() {
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.multiseries;
        });

        $("#btnHistogram").click(function() {
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.histogram;
        });

        $("#btnBoxAndWhisker").click(function() {
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.VisualizationController.currentPlot = self.VisualizationController.plotTypes.box;
        });

        $("#btnSetPlotOptions").click(function() {
            var dateFirst = $('#dpd1')
            var dateLast = $('#dpd2');

            $("#graphArea").find(".alert").remove();

            var a = new Date(dateFirst.val());
            var b = new Date(dateLast.val())
            if(a < b){
                self.VisualizationController.plotSeries();  // Dates do not overlap, proceed
            }
            else{
                // Dates overlap, display an error.
                $("#graphArea").prepend(
                    '<div class="alert alert-danger alert-dismissable">\
                      <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>\
                      <strong></strong> Dates cannot overlap. \
                    </div>'
                );
            }
        });
        $("#btnCollapseToggle").click(function() {
            dir = !dir;
            var slideDistance = 307;
            r = dir? -slideDistance : 0;
            $("#panel-right").stop().animate({right: r+'px'}, 0);
            $("#btnCollapseToggle span").removeClass();
            if (!dir){
                //$("#graphContainer").animate({width:$("#graphContainer").width() - 280}, 800);    // animation
                $("#graphContainer").width($("#graphContainer").width() - slideDistance);                     // no animation
                $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-right");
            }
            else{
                //$("#graphContainer").animate({width:$("#graphContainer").width() + 280}, 800);    // animation
                $("#graphContainer").width($("#graphContainer").width() + slideDistance);                     // no animation
                $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-left");
            }
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
