var TsaApplication = (function(self){
    var r =0, dir=false;
    var isShown = true;
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
        $(document).on('facetsloaded', function() {
            self.UiHelper.renderFacets($("#leftPanel .facets-container"));
        });

        $(document).on('dataloaded', function() {
            self.UiHelper.renderFilterItems();
            checkInitialFilters();

            if (self.UiHelper.getActiveView() !== 'datasets') {
                self.TableController.shouldInitialize = true;
                return;
            }

            self.TableController.initializeTable();
        });

        $(document).on('datafiltered', function() {
            //update map markers and dataseries table.
            self.UiHelper.renderFilterItems();
            self.MapController.updateSitesMarkers();
            self.TableController.updateDataseries();
        });

        $(document).on('sitesloaded', function() {
            self.MapController.loadMarkers();
        });

        $(document).on('plotdataloading', function() {
            self.UiHelper.startPlotAnimation();
        });

        $(document).on('plotdataready', function() {
            self.UiHelper.endPlotAnimation();
            if (self.VisualizationController.doPlot) {
                self.VisualizationController.plotSeries();
            }
        });

        $(document).on('plotstarted', function() {
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
            if (self.TableController.shouldInitialize) {
                self.TableController.initializeTable();
            }
        });

        $(document).on('shown.bs.tab', 'a[href="#visualizationContent"]', function() {
            if (self.VisualizationController.unplottedSeries.length || self.VisualizationController.shouldPlot) {
                self.UiHelper.endPlotAnimation();
                self.VisualizationController.plotSeries();
            }
            self.VisualizationController.doPlot = true;
        });

        $("#btnAddToPlot").click(function() {
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];

            dialog.modal('hide');
            var checkbox = $('#datasetsTable').find(':checkbox[data-seriesid="' + id + '"]');
            checkbox.click();

            self.VisualizationController.doPlot = true;
            self.UiHelper.loadView('visualization');
        });

        $("#btnPlotDataset").click(function() {
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];

            // Clear checkboxes
            self.VisualizationController.plottedSeries.forEach(function(series) {
                self.TableController.uncheckSeries(series.seriesid);
            });

            self.VisualizationController.unplottedSeries.forEach(function(series) {
                self.TableController.uncheckSeries(series.seriesid);
            });

            // Clear the plot arrays.
            self.VisualizationController.plottedSeries.length = 0;
            self.VisualizationController.unplottedSeries.length = 0;

            // Reset the date intervals
            self.VisualizationController.initializeDatePickers();

            // Clear the graph
            self.VisualizationController.clearGraph();
            self.VisualizationController.boxWhiskerSvgs = [];

            dialog.modal('hide');
            var checkbox = $('#datasetsTable').find(':checkbox[data-seriesid="' + id + '"]');
            checkbox.click();

            self.VisualizationController.doPlot = true;
            self.UiHelper.loadView('visualization');
        });



        $("#btnExport").click(function() {
            $(".modal-header").find(".alert").remove();
            $(".modal-header").append(
                '<div class="alert alert-info alert-dismissable">\
                    Compiling file. Please wait... \
                </div>'
            );
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];
            var series = _(self.DataManager.dataseries).where({seriesid: id}).pop();

            var csvContent = "data:text/csv;charset=utf-8,";

            // Append header
            csvContent +=   "# ------------------------------------------------------------------------------------------\n" +
                            "# WARNING: These data may be provisional and subject to revision. The data are released\n" +
                            "# on the condition that neither iUTAH may be held liable for any damages resulting\n" +
                            "# from its use. The following metadata describe the data in this file:\n" +
                            "# ------------------------------------------------------------------------------------------\n#\n";

            // Append Site Information
            csvContent +=   "# Site Information\n" +
                            "# ---------------------------\n" +
                            "# Network: " + series['network'] + "\n" +
                            "# SiteCode: " + series['sitecode'] + "\n" +
                            "# SiteName: " + series['sitename'] + "\n" +
                            "# IsActive: " + series['isactive'] + "\n" +
                            "# Latitude: " + series['latitude'] + "\n" +
                            "# Longitude: " + series['longitude'] + "\n" +
                            //"# Elevation: " + series['elevation'] + "\n" +                       // Not here
                            //"# VerticalDatum: " + series['verticaldatum'] + "\n" +               // Not here
                            "# State: " + series['state'] + "\n" +
                            "# County: " + series['county'] + "\n" +
                            //"# SiteComments:" + series['sitecomments'] + "\n" +                 // Not here
                            "# SiteType: " + series['sitetype'] + "\n#\n";

            // Append Variable Information
            csvContent +=   "# Variable Information\n" +
                            "# ---------------------------\n" +
                            "# VariableCode: " + series['variablecode'] + "\n" +
                            "# VariableName: " + series['variablename'] + "\n" +
                            "# ValueType: " + series['valuetype'] + "\n" +
                            "# DataType: " + series['datatype'] + "\n" +
                            "# GeneralCategory: " + series['generalcategory'] + "\n" +
                            "# SampleMedium: " + series['samplemedium'] + "\n" +
                            "# VariableUnitsName: " + series['variableunitsname'] + "\n" +
                            "# VariableUnitsType: " + series['variableunitstype'] + "\n" +
                            "# VariableUnitsAbbreviation: " + series['variableunitsabbreviation'] + "\n" +
                            //"# NoDataValue:" + series['county'] + "\n" +                                        // Not here
                            //"# IsRegular:" + series['isregular'] + "\n" +                                       // Not here
                            "# TimeSupport: " + series['timesupport'] + "\n" +
                            "# TimeSupportUnitsAbbreviation: " + series['timesupportunitsabbreviation'] + "\n" +
                            "# TimeSupportUnitsName: " + series['timesupportunitsname'] + "\n" +
                            "# TimeSupportUnitsType: " + series['timesupportunitstype'] + "\n#\n";
                            //"# Speciation:" + series['speciation'] + "\n#\n";                                     // Not here

            // Append Method Information
            csvContent +=   "# Method Information\n" +
                            "# ---------------------------\n" +
                            "# MethodDescription: " + series['methoddescription'] + "\n" +
                            "# MethodLink: " + series['sitecode'] + "\n#\n";


            // Append Series Information
            csvContent +=   "# Series Information\n" +
                            "# ---------------------------\n" +
                            "# BeginDateTime: " + series['begindatetime'] + "\n" +
                            "# EndDateTime: " + series['enddatetime'] + "\n" +
                            "# DateLastUpdated: " + series['datelastupdated'] + "\n" +
                            "# NumberOfObservations: " + series['numberofobservations'] + "\n" +
                            "# QualityControlLevel: " + series['qualitycontrollevel'] + "\n" +
                            "# QualityControllLevelDefinition: " + series['qualitycontrolleveldefinition'] + "\n" +
                            "# QualityControlLevelExplanation: " + series['qualitycontrollevelexplanation'] + "\n" +
                            "# GetDataUrl: " + series['getdataurl'] + "\n#\n";

            // Append Source Information
            csvContent +=   "# Source Information\n" +
                            "# ---------------------------\n" +
                            "# SourceOrganization: " + series['sourceorganization'] + "\n" +
                            "# SourceDescription: " + series['sourcedescription'] + "\n#\n";
                            //"# ContactName:" + series['contactname'] + "\n" +                   // Not here
                            //"# ContactEmail:" + series['contactemail'] + "\n" +                 // Not here
                            //"# ContactPhone:" + series['contactphone'] + "\n" +                 // Not here
                            //"# Citation:" + series['citation'] + "\n";                          // Not here


            // Append dataset values once the dataset is loaded
            series.loadDataset(function() {
                // Append property names
                csvContent += "DateTime, ";
                //csvContent += "TimeOffset, ";
                //csvContent += "DateTimeUTC, ";
                csvContent += "Value";
                //csvContent += "CensorCode";
                csvContent += "\n";

                // Append property values
                series.dataset.forEach(function(data){
                     csvContent += data['date'] + ", " + data['value'] + "\n";
                });

                // Encode the string to avoid escape characters
                var encodedUri = encodeURI(csvContent);

                var link = document.createElement("a");
                var filename = series.sitecode + " - " + series.variablename + ".csv";

                if(link.download !== undefined) { // feature detection
                  // Browsers that support HTML5 download attribute
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", filename);
                  link.className = "glyphicon glyphicon-file";
                  link.innerHTML = " <span class='container-title'>" + filename + "</span>";

                  $(".modal-header").find(".alert").empty();
                  $(".modal-header").find(".alert").append(link);
                }
                else if(navigator.msSaveBlob) { // IE 10+ and Safari
                  $(".modal-header").find(".alert").empty();
                  $(".modal-header").find(".alert").append("We're sorry. Your browser does not support HTML5 download.");
                  /*link.addEventListener("click", function(event) {

                  }, false);*/
                }
                else {
                  // it needs to implement server side export
                  $(".modal-header").find(".alert").empty();
                  $(".modal-header").find(".alert").append("We're sorry. Your browser does not support HTML5 download.");
                }
            });
        });

        function onDateChange() {
             $("#dateIntervals button").removeClass("active");
        }

        $('#dpd1').bind('changeDate', onDateChange);
        $('#dpd2').bind('changeDate', onDateChange);
        $('#dpd1').bind('input', onDateChange);
        $('#dpd2').bind('input', onDateChange);

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
            } else {
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
                $("#graphContainer").width($("#graphContainer").width() - slideDistance);           // no animation
                $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-right");
            }
            else{
                //$("#graphContainer").animate({width:$("#graphContainer").width() + 280}, 800);    // animation
                $("#graphContainer").width($("#graphContainer").width() + slideDistance);           // no animation
                $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-left");
            }
            self.VisualizationController.plotSeries();
        });

        function toggleLeftPanel(){
            if ($("#btnLeftPanelCollapse")[0].getAttribute("data-enabled") == "true"){
                $("#leftPanel .panel-group").toggle();
                isShown = !isShown;
            }
        }

        function toggleLeftPanelButton(){
            var btn = $("#btnLeftPanelCollapse")[0];
            btn.setAttribute("data-enabled", "true");

            if (isShown){
                $("#leftPanel .panel-group").show();
            }
        }

        $("#btnLeftPanelCollapse").on("click", toggleLeftPanel);

        $("#btnHideLeftToolbar").on("click", toggleLeftPanel);

        $("#visualizationTab").on("click", function(){
            $("#leftPanel .panel-group").hide();

            var btn = $("#btnLeftPanelCollapse")[0];
            btn.setAttribute("data-enabled", "false");
        });

        $("#datasetsTab").on("click", function(){
            toggleLeftPanelButton();
        });

        $("#mapTab").on("click", function(){
            toggleLeftPanelButton();
        });
    }

    function checkInitialFilters() {
        var selectedNetwork = self.initialParameters['network'];
        var selectedSite = self.initialParameters['sitecode'];
        var selectedVariable = self.initialParameters['variablecode'];
        var selectedControlLevel = self.initialParameters['qualitycontrollevelcode'];
        var networkFilter = _(_(self.DataManager.facets)
            .findWhere({name:'Network'}).filters)
            .findWhere({network:selectedNetwork});

        self.Search.toggleFilter('sourcedataserviceid', (networkFilter)? networkFilter.sourcedataserviceid: undefined);
        self.Search.toggleFilter('sitecode', selectedSite);
        self.Search.toggleFilter('variablecode', selectedVariable);
        self.Search.toggleFilter('qualitycontrollevelcode', selectedControlLevel);
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
