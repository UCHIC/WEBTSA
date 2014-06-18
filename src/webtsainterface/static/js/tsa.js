define('tsa', ['data', 'map', 'table', 'ui', 'visualization', 'generalLibraries'], function(data, map, table, ui, visualization) {
    var self = {};
    self.ui = ui;
    self.map = map;
    self.data = data;
    self.table = table;
    self.visualization = visualization;
    
    var r =0, dir=false;
    var isShown = true;
    self.initialParameters = {};
    
    self.initializeApplication = function() {
        self.initialParameters = getUrlParameters();
        var selectedView = self.initialParameters['view'] || 'map';
        self.ui.loadView(selectedView);
        bindEvents();
        self.map.initializeMap();
        self.data.loadData();
    };


    function getUrlParameters() {
        var search = location.search.substring(1);
        return (search)? JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
                            function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
    }

    function bindEvents() {
        $(document).on('facetsloaded', function() {
            self.ui.renderFacets($("#leftPanel .facets-container"));
            $('.clear-filter').click(function() {
                if (!this.dataset.facet) {
                    return;
                }
                var facet = _(self.data.facets).findWhere({ keyfield: this.dataset.facet });
                self.data.clearFacetFilters(facet);
            });
        });

        $(document).on('dataloaded', function() {
            self.ui.renderFilterItems();
            checkInitialFilters();

            if (self.ui.getActiveView() !== 'datasets') {
                self.table.shouldInitialize = true;
                return;
            }

            self.table.initializeTable();
        });

        $(document).on('datafiltered', function() {
            //update map markers and dataseries table.
            self.ui.renderFilterItems();
            self.map.updateSitesMarkers();
            self.table.updateDataseries();
        });

        $(document).on('sitesloaded', function() {
            self.map.loadMarkers();
            self.map.renderLegend();
        });

        $(document).on('plotdataloading', function() {
            self.ui.startPlotAnimation();
        });

        $(document).on('plotdataready', function() {
            self.ui.endPlotAnimation();
            if (self.visualization.doPlot) {
                self.visualization.plotSeries();
            }
        });

        $(document).on('plotstarted', function() {
            self.ui.startPlotAnimation();
        });

        $(document).on('plotfinished', function() {
            self.ui.endPlotAnimation();
        });

        $(document).on('shown.bs.tab', 'a[href="#mapContent"]', function() {
            google.maps.event.trigger(self.map.map, 'resize');
        });

        $(document).on('shown.bs.tab', 'a[href="#datasetsContent"]', function() {
            if (self.table.shouldInitialize) {
                self.table.initializeTable();
            }
        });

        $(document).on('shown.bs.tab', 'a[href="#visualizationContent"]', function() {
            if (self.visualization.unplottedSeries.length || self.visualization.shouldPlot) {
                self.ui.endPlotAnimation();
                self.visualization.plotSeries();
            }
            self.visualization.doPlot = true;
        });

        $('#btnClearAllFilters').click(function() {
            self.data.facets.forEach(function(facet) {
                self.data.clearFacetFilters(facet);
            });
        });

        $("#btnAddToPlot").click(function() {
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];

            dialog.modal('hide');
            var checkbox = $('#datasetsTable').find(':checkbox[data-seriesid="' + id + '"]');
            checkbox.click();

            self.visualization.doPlot = true;
            self.ui.loadView('visualization');
        });

        $("#btnPlotDataset").click(function() {
            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];

            // Clear checkboxes
            self.visualization.plottedSeries.forEach(function(series) {
                self.table.uncheckSeries(series.seriesid);
            });

            self.visualization.unplottedSeries.forEach(function(series) {
                self.table.uncheckSeries(series.seriesid);
            });

            // Clear the plot arrays.
            self.visualization.plottedSeries.length = 0;
            self.visualization.unplottedSeries.length = 0;

            // Reset the date intervals
            self.visualization.initializeDatePickers();

            // Clear the graph
            self.visualization.clearGraph();
            self.visualization.boxWhiskerSvgs = [];

            dialog.modal('hide');
            var checkbox = $('#datasetsTable').find(':checkbox[data-seriesid="' + id + '"]');
            checkbox.click();

            self.visualization.doPlot = true;
            self.ui.loadView('visualization');
        });

        $("#btnExport").click(function() {
            $(".modal-header").find(".alert").remove();
            $(".modal-header").append(
                '<div class="alert alert-info alert-dismissable">\
                    Compiling file. Please wait... \
                </div>'
            );

            var link = document.createElement("a");

            // feature detection
            if(link.download === undefined) {
              // it needs to implement server side export
              $(".modal-header").find(".alert").empty();
              $(".modal-header").find(".alert").removeClass("alert-info");
              $(".modal-header").find(".alert").addClass("alert-danger");
              $(".modal-header").find(".alert").append("<strong>We're sorry, your browser does not support HTML5 download. </strong>" +
                                                        "<br>Please use Chrome, Firefox or Opera to download.");
              return;
            }

            var dialog = $("#InfoDialog");
            var id = +dialog.get(0).dataset['series'];
            var series = _(self.data.dataseries).where({seriesid: id}).pop();

            var csvContent = "data:text/csv;charset=utf-8,";

            // Append dataset values once the dataset is loaded
            series.loadDataset(function() {
                    // Append header
                csvContent +=   "# ------------------------------------------------------------------------------------------\n" +
                                "# WARNING: These data may be provisional and subject to revision. The data are released\n" +
                                "# on the condition that neither iUTAH may be held liable for any damages resulting from\n" +
                                "# its use. The following metadata describe the data in this file:\n" +
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
                                "# Elevation: " + series.dataset.elevation + "\n" +
                                "# VerticalDatum: " + series.dataset['verticalDatum'] + "\n" +
                                "# State: " + series['state'] + "\n" +
                                "# County: " + series['county'] + "\n" +
                                //"# SiteComments:" + series['sitecomments'] + "\n" +                 // Not found
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
                                "# NoDataValue:" + series.dataset['noDataValue'] + "\n" +
                                //"# IsRegular:" + series['isregular'] + "\n" +                                         // Not found
                                "# TimeSupport: " + series['timesupport'] + "\n" +
                                "# TimeSupportUnitsAbbreviation: " + series['timesupportunitsabbreviation'] + "\n" +
                                "# TimeSupportUnitsName: " + series['timesupportunitsname'] + "\n" +
                                "# TimeSupportUnitsType: " + series['timesupportunitstype'] + "\n#\n";
                                //"# Speciation:" + series['speciation'] + "\n#\n";                                     // Not found

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
                                "# NumberOfObservations: " + series['numberobservations'] + "\n" +
                                "# QualityControlLevelCode: " + series['qualitycontrollevelcode'] + "\n" +
                                "# QualityControllLevelDefinition: " + series['qualitycontrolleveldefinition'] + "\n" +
                                "# QualityControlLevelExplanation: " + series['qualitycontrollevelexplanation'] + "\n" +
                                "# GetDataUrl: " + series['getdataurl'] + "\n#\n";

                // Append Source Information
                csvContent +=   "# Source Information\n" +
                                "# ---------------------------\n" +
                                "# SourceOrganization: " + series['sourceorganization'] + "\n" +
                                "# SourceDescription: " + series['sourcedescription'] + "\n#\n";
                                //"# ContactName:" + series['contactname'] + "\n" +                   // Not found
                                //"# ContactEmail:" + series['contactemail'] + "\n" +                 // Not found
                                //"# ContactPhone:" + series['contactphone'] + "\n" +                 // Not found
                                //"# Citation:" + series['citation'] + "\n";                          // Not found

                // Append property names
                csvContent += "DateTime, ";
                csvContent += "TimeOffset, ";
                csvContent += "DateTimeUTC, ";
                csvContent += "Value, ";
                csvContent += "CensorCode";
                csvContent += "\n";

                // Append property values
                series.dataset.forEach(function(data){
                     csvContent +=data['date'] + ", "
                                + data['timeOffset']+ ", "
                                + data['dateTimeUTC'] + ", "
                                + data['value'] + ", "
                                + data['censorCode'] + "\n";
                });

                // Encode the string to avoid escape characters
                var encodedUri = encodeURI(csvContent);
                var filename = series.sitecode + " - " + series.variablename + ".csv";

                // Set HTML5 download
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", filename);
                link.className = "glyphicon glyphicon-file";
                link.innerHTML = " <span class='container-title'>" + filename + "</span>";

                $(".modal-header").find(".alert").empty();
                $(".modal-header").find(".alert").removeClass("alert-info");
                $(".modal-header").find(".alert").addClass("alert-success");
                $(".modal-header").find(".alert").append(link);
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
            self.visualization.currentPlot = self.visualization.plotTypes.multiseries;
        });

        $("#btnHistogram").click(function() {
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.visualization.currentPlot = self.visualization.plotTypes.histogram;
        });

        $("#btnBoxAndWhisker").click(function() {
            $("#visualizationDropDown").text($(this).text() + " ").append("<span class='caret'></span>");
            self.visualization.currentPlot = self.visualization.plotTypes.box;
        });

        $("#btnSetPlotOptions").click(function() {
            var dateFirst = $('#dpd1')
            var dateLast = $('#dpd2');

            $("#graphArea").find(".alert").remove();

            var a = new Date(dateFirst.val());
            var b = new Date(dateLast.val())
            if(a <= b){
                self.visualization.plotSeries();  // Dates do not overlap, proceed
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
            self.visualization.plotSeries();
        });

        function toggleLeftPanel(){
            if ($("#btnLeftPanelCollapse")[0].getAttribute("data-enabled") == "true"){
                $("#leftPanel .panel-group").toggle();
                isShown = !isShown;
                google.maps.event.trigger(self.map.map, 'resize');
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

        $("#mapTab").on("click", function() {
            toggleLeftPanelButton();
        });
    }

    function checkInitialFilters() {
        var selectedNetwork = self.initialParameters['network'];
        var selectedSite = self.initialParameters['sitecode'];
        var selectedVariable = self.initialParameters['variablecode'];
        var selectedControlLevel = self.initialParameters['qualitycontrollevelcode'];
        var shouldPlot = self.initialParameters['plot'] === 'true';
        var networkFilter = _(_(self.data.facets)
            .findWhere({name:'Network'}).filters)
            .findWhere({network:selectedNetwork});

        self.data.toggleFilter('sourcedataserviceid', (networkFilter)? networkFilter.sourcedataserviceid: undefined);
        self.data.toggleFilter('sitecode', selectedSite);
        self.data.toggleFilter('variablecode', selectedVariable);
        self.data.toggleFilter('qualitycontrollevelcode', selectedControlLevel);

        if (self.data.filteredDataseries.length === 1 && shouldPlot) {
            var dataseries = _(self.data.filteredDataseries).first();
            self.visualization.doPlot = (self.initialParameters['view'] === 'visualization')? true: false;
            self.visualization.prepareSeries(dataseries);
        }
    }

    return self;
});