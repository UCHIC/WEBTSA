var obj = this;
define('tsa', ['data', 'map', 'table', 'ui', 'visualization', 'generalLibraries', 'zipLibraries'], function(data, map, table, ui, visualization) {
    var self = {};
    self.ui = ui;
    self.map = map;
    self.data = data;
    self.table = table;
    self.visualization = visualization;
    
    var r =0, dir=false;

    var visibleFacetsPanel = true;
    self.initialParameters = {};
    
    self.initializeApplication = function() {
        self.initialParameters = getUrlParameters();
        var selectedView = self.initialParameters['view'] || 'map';
        if (selectedView === 'visualization') {
            $("#btnLeftPanelCollapse").get(0).dataset.enabled = false;
            hideFacetsPanel();
        }

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
            self.data.createFilters();
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
            $("#btnLeftPanelCollapse").get(0).dataset.enabled = true;
            google.maps.event.trigger(self.map.map, 'resize');
            if (visibleFacetsPanel) {
                showFacetsPanel();
            }
        });

        $(document).on('shown.bs.tab', 'a[href="#datasetsContent"]', function() {
            $("#btnLeftPanelCollapse").get(0).dataset.enabled = true;
            if (self.table.shouldInitialize) {
                self.table.initializeTable();
            }
            if (visibleFacetsPanel) {
                showFacetsPanel();
            }
        });

        $(document).on('shown.bs.tab', 'a[href="#visualizationContent"]', function() {
            $("#btnLeftPanelCollapse").get(0).dataset.enabled = false;
            if (self.visualization.unplottedSeries.length || self.visualization.shouldPlot) {
                self.ui.endPlotAnimation();
                self.visualization.plotSeries();
            }
            self.visualization.doPlot = true;
            hideFacetsPanel();
        });

        $('#btnClearAllFilters').click(function() {
            self.data.clearAllFilters();
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
            hideFacetsPanel();
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

        function getCSVContent(series){
            var csvContent = "";
                                // Append header
            csvContent +=   "# ------------------------------------------------------------------------------------------\n" +
                            "# WARNING: These data may be provisional and subject to revision. The data are released\n" +
                            "# on the condition that neither iUTAH nor any of its participants may be held liable for any\n" +
                            "# damages resulting from thier use. The following metadata describe the data in this file:\n" +
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
                            "# NoDataValue: " + series.dataset['noDataValue'] + "\n" +
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

            // Append Qualifier Information
            if (series['qualifierCodes']) {
                csvContent += "# Qualifier Information\n" +
                    "# ---------------------------\n";
                for (var i = 0; i < series['qualifierCodes'].length; i++) {
                    csvContent += "# " + series['qualifierCodes'][i] + " - " + series['qualifierDescriptions'][i] + "\n";
                }
                csvContent += "#\n";
            }


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
                            "# GetDataUrl: " + series['getdatainflux'] + "\n#\n";

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
            csvContent += "CensorCode, ";
            csvContent += "QualifierCode";
            csvContent += "\n";

            // Append property values
            series.dataset.forEach(function(data){
                 csvContent += data['date'].replace("T", " ") + ", "
                            + data['timeOffset'] + ", "
                            + (data['dateTimeUTC'] === undefined ? "" : data['dateTimeUTC'].replace("T", " ")) + ", "
                            + data['value'] + ", "
                            + data['censorCode'] + ", "
                            + (data['qualifiers'] === undefined ? "" : data['qualifiers']) + "\n";
            });

            return csvContent;
        }

        $("#btnExport").click(function() {
            $(".modal-header").find(".alert").remove();
            $(".modal-header").append(
                '<div class="alert alert-info alert-dismissable">\
                    Compiling file. Please wait... \
                </div>'
            );

            var link = document.createElement("a");
            link.click(function() {
                ga('send', 'event', 'CVS', 'Download', 'Dataset � CVS Download');
            });

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

            // Append dataset values once the dataset is loaded
            series.loadDataset(function() {
                var csvContent = getCSVContent(series);
                var filename = series.sitecode + " - " + series.variablename + ".csv";

                // Set HTML5 download
                var blob = new Blob(["", csvContent]);

                var url = URL.createObjectURL(blob);

                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.className = "glyphicon glyphicon-file";
                link.innerHTML = " <span class='container-title'>" + filename + "</span>";

                $(".modal-header").find(".alert").empty();
                $(".modal-header").find(".alert").removeClass("alert-info");
                $(".modal-header").find(".alert").addClass("alert-success");
                $(".modal-header").find(".alert").append(link);
            });
        });

         $("#btnExportSelected").click(function(){
            // Feature detection
            var link = document.createElement("a");

            if(link.download === undefined) {
                // Needs to implement server side download
                alert("We are sorry, your browser does not support HTML5 download. Please use Chrome, Firefox or Opera to download.")
            }

            var series = [];

            for (var i = 0; i < self.visualization.plottedSeries.length; i++){
                series.push(self.visualization.plottedSeries[i])
            }
            for (var i = 0; i < self.visualization.unplottedSeries.length; i++){
                series.push(self.visualization.unplottedSeries[i])
            }

            if (series.length == 0){
                return;
            }

            $("#btnExportSelected span").text("Compiling files...");
            $("#btnExportSelected").prop('disabled', true);

            var jobs = self.visualization.unplottedSeries.length + self.visualization.plottedSeries.length - 1;

            series.forEach(function(mSeries){
                 mSeries.loadDataset(function() {  // Needs to be changed to a callback with all series loaded
                    if (jobs > 0){
                        jobs--;
                        return;
                    }

                    var files = [];

                    for(var i = 0; i < series.length; i++){
                        var filename = series[i].sitecode + " - " + series[i].variablename + ".csv";
                        var blobFile = new Blob(["", getCSVContent(series[i])]);
                        files.push({name:filename, data:blobFile});
                    }

                     // Zip model that will compress the file
                    var model = (function() {
                        var zipFileEntry, zipWriter, writer, creationMethod, URL = obj.webkitURL || obj.mozURL || obj.URL;
                        return {
                            setCreationMethod : function(method) {
                                creationMethod = method;
                            },
                            addFiles : function addFiles(files, oninit, onadd, onprogress, onend) {
                                var addIndex = 0;

                                function nextFile() {
                                    var file = files[addIndex];
                                    onadd(file);
                                    zipWriter.add(file.name, new zip.BlobReader(file.data), function() {
                                        addIndex++;
                                        if (addIndex < files.length)
                                            nextFile();
                                        else
                                            onend();
                                    }, onprogress);
                                }

                                function createZipWriter() {
                                    zip.createWriter(writer, function(writer) {
                                        zipWriter = writer;
                                        oninit();
                                        nextFile();
                                    }, onerror);
                                }

                                if (zipWriter)
                                    nextFile();
                                else if (creationMethod == "Blob") {
                                    writer = new zip.BlobWriter();
                                    createZipWriter();
                                } else {
                                    createTempFile(function(fileEntry) {
                                        zipFileEntry = fileEntry;
                                        writer = new zip.FileWriter(zipFileEntry);
                                        createZipWriter();
                                    });
                                }
                            },
                            getBlobURL : function(callback) {
                                zipWriter.close(function(blob) {
                                    var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
                                    callback(blobURL);
                                    zipWriter = null;
                                });
                            }
                        };
                    })();

                    // Set the mode
                    model.setCreationMethod("Blob");

                    // Add the files to the zip
                    model.addFiles(files,
                        function() {
                            // Initialise Method
                            //console.log("Initialise");
                        }, function(file) {
                            // OnAdd
                            //console.log("Added file");
                        }, function(current, total) {
                            // OnProgress
                            //console.log("%s %s", current, total);
                        }, function() {
                            // OnEnd
                            // The zip is ready prepare download link
                            model.getBlobURL(function(url) {
                                // var link = document.getElementById("downloadLink");
                                link.setAttribute("href", url);
                                link.setAttribute("download", "TSA collection.zip");
                                link.innerHTML = " <span class='container-title'>" + "TSA collection.zip" + "</span>";
                                if (ui.getBrowserName.substr(0,7) == "Firefox"){    // Workaround for Firefox
                                    var myEvt = document.createEvent('MouseEvents');
                                    myEvt.initEvent(
                                       'click'      // event type
                                       ,true      // can bubble?
                                       ,true      // cancelable?
                                    );
                                    link.dispatchEvent(myEvt);
                                }
                                else{
                                    link.click();   // This is how real browsers do it, hell yeah!
                                }

                                $("#btnExportSelected span").text("Export selected (.zip)");
                                $("#btnExportSelected").prop('disabled', false);
                            });
                        });
                  });
             });
         });

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

        $("#btnCollapseToggle").click(function () {
            dir = !dir;
            var slideDistance = 307;
            r = dir ? -slideDistance : 0;
            $("#panel-right").stop().animate({right: r + 'px'}, 200,
                function () {
                    $("#btnCollapseToggle span").removeClass();
                    if (!dir) {
                        //$("#graphContainer").animate({width:$("#graphContainer").width() - 280}, 800);    // animation
                        $("#graphContainer").width($("#graphContainer").width() - slideDistance);           // no animation
                        $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-right");
                    }
                    else {
                        //$("#graphContainer").animate({width:$("#graphContainer").width() + 280}, 800);    // animation
                        $("#graphContainer").width($("#graphContainer").width() + slideDistance);           // no animation
                        $("#btnCollapseToggle span").addClass("glyphicon glyphicon-chevron-left");
                    }
                    self.visualization.plotSeries();
                }
            );
        });

        $("#btnLeftPanelCollapse").on("click", function() {
            if ($("#btnLeftPanelCollapse").get(0).dataset.enabled === 'true') {
                toggleFacetsPanel();
            }
        });

        $("#btnHideLeftToolbar").on("click", function() {
            toggleFacetsPanel();
        });
    }

    function toggleFacetsPanel() {
        $("#leftPanel .panel-group").is(':hidden') ? showFacetsPanel(): hideFacetsPanel();
        visibleFacetsPanel = !visibleFacetsPanel;
    }

    function hideFacetsPanel() {
        $("#leftPanel .panel-group").hide();
    }

    function showFacetsPanel() {
        $("#leftPanel .panel-group").show();
        google.maps.event.trigger(self.map.map, 'resize');
    }

    function onDateChange() {
         $("#dateIntervals button").removeClass("active");
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

        if (shouldPlot) {
            var facets = _(self.data.facets).filter(function(facet) { return facet.selected !== ""; });
            facets.forEach(function(facet){
                var defaultFilters = _(facet.filters).filter(function(filter){ return filter.applied });
                defaultFilters.forEach(function(filter){
                    self.data.toggleFilter(facet.keyfield, filter[facet.keyfield]);
                });
            });

            var dataseries = _(self.data.filteredDataseries).first(require('visualization').plotLimit);
            if (dataseries.length == 0) {
                return;
            }

            self.visualization.doPlot = (self.initialParameters['view'] === 'visualization')? true: false;

            self.table.toSelect = true;
            dataseries.forEach(function(series) {
                self.visualization.prepareSeries(series);
            });
        }
    }

    return self;
});

