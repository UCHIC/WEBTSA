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

       google.maps.event.addDomListener(window, "load", function() {
           self.MapController.initializeMap();
           google.maps.event.trigger(self.MapController.map, 'resize');
       });

       $('a[href="#mapContent"]').on('shown', function() {
           google.maps.event.trigger(self.MapController.map, 'resize');
       });
    }

    return self;
}(TsaApplication || {}));

/**
 *  Data Manager
 */
TsaApplication.DataManager = (function (self) {
    var dataLoader = { loadedData: 0, dataToLoad: ['facets', 'dataseries', 'sites'] };

    //data
    self.dataseries = [];
    self.facets = [];
    self.sites = [];

    //events
    var dataLoaded = new CustomEvent("dataloaded", { bubbles:true, cancelable:false });
    var dataseriesLoaded = new CustomEvent("dataseriesloaded", { bubbles:true, cancelable:false });
    var sitesLoaded = new CustomEvent("sitesloaded", { bubbles:true, cancelable:false });
    var facetsLoaded = new CustomEvent("facetsloaded", { bubbles:true, cancelable:false });

    self.loadData = function() {
        dataLoader.watch("loadedData", function(id, oldval, newval) {
            if (newval === dataLoader.dataToLoad.length) {
                document.dispatchEvent(dataLoaded);
            }
            return newval;
        });

        $.getJSON("/api/v1/dataseries").done(function(data) {
            self.dataseries = data.objects;
            defineFilters();
            dataLoader.loadedData++;
            document.dispatchEvent(dataseriesLoaded);
        });

        $.getJSON("/api/v1/sites").done(function(data) {
            self.sites = data.objects;
            dataLoader.loadedData++;
            document.dispatchEvent(sitesLoaded);
        });

        $.getJSON("/api/v1/facets").done(function(data) {
            self.facets = data.objects;
            defineFacets();
            dataLoader.loadedData++;
            document.dispatchEvent(facetsLoaded);
        });
    };

    function defineFacets() {
        self.facets.forEach(function(facet) {
            facet.namefields = facet.namefields.split(',');
            facet.filteredFacetSeries = [];
            facet.filters = [];

            facet.isFiltered = function() {
                return _.some(this.filters, function(filter) {
                    return filter.applied;
                });
            };

            facet.updateFacetSeries = function() {
                var series = [];
                var isFiltered = this.isFiltered();

                this.filters.forEach(function(filter) {
                    if (!isFiltered || filter.applied) {
                        series = _.union(series, filter.filteredSeries);
                    }
                });

                return this.filteredFacetSeries = series;
            }
        });
    }

    function defineFilters() {
        self.facets.forEach(function(facet) {
            var filters = _.uniq(self.dataseries, function(item){ return item[facet.keyfield]; });

            filters.forEach(function(filter){
                filter = _.clone(filter);
                filter = _.pick(filter, facet.keyfield, facet.namefields);

                var series = _.filter(self.dataseries, function(series){ return filter[facet.keyfield] === series[facet.keyfield]; });
                _.extend(filter, {
                    filteredSeries: series,
                    dataseriesCount: series.length,
                    applied: false
                });
                facet.filters.push(filter);
            });

            facet.updateFacetSeries();
        });
    }
	return self;
}(TsaApplication.DataManager || {}));


/**
 *  Map Controller
 */
TsaApplication.MapController = (function (self) {
    self.map = {};
    var settings = {};
    var markersManagers = {};

    self.initializeMap = function() {
        settings = {
            center: new google.maps.LatLng(41.0648701, -111.4622151),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoom: 7
        };
        self.map = new google.maps.Map(document.getElementById("map_canvas"), settings);
    };

    self.loadMarkers = function() {
        loadMarkerManagers();
        TsaApplication.DataManager.sites.forEach(function(site) {
            var marker = createMarker(site);
            markersManagers[site.sourcedataserviceid].addMarker(marker);
            var markerInfoWindow = new google.maps.InfoWindow({ content: TsaApplication.UiHelper.siteInfoWindowTemplate({
                sitecode: site.sitecode, sitename: site.sitename, network: site.network, sitetype: site.sitetype,
                latitude: site.latitude, longitude: site.longitude, state: site.state, county: site.county})
            });
            google.maps.event.addListener(marker, 'click', function() { markerInfoWindow.open(self.map, marker); });
        });
    };

    self.updateSitesMarkers = function() {
        for (var property in markersManagers) {
            if (markersManagers.hasOwnProperty(property)) {
                var markersManager = markersManagers[property];
                markersManager.getMarkers().forEach(function(marker) {
                    var siteMarker = _.find(TsaApplication.Search.filteredSites, function(site) {
                        return site.sitename === marker.title;
                    });
                    marker.setVisible(( (siteMarker)? true: false ));
                });
                markersManager.repaint();
            }
        }
    };

    function loadMarkerManagers() {
        var uniqueNetworks = _.uniq(TsaApplication.DataManager.sites, function(site) { return site.sourcedataserviceid; });
        var networkIds = _.pluck(uniqueNetworks, 'sourcedataserviceid');
        var networkNames = _.pluck(uniqueNetworks, 'network');
        var networks = _.object(networkIds, networkNames);

        networkIds.forEach(function(networkId) {
            var networkMarkersManager = new MarkerClusterer(self.map);
            var cssClass = 'network' + networkId;
            networkMarkersManager.setIgnoreHidden(true);
            networkMarkersManager.setMinimumClusterSize(4);
            networkMarkersManager.setClusterClass("network-cluster " + cssClass);
            networkMarkersManager.setStyles([{
                url: '', width: 30, height: 30, textSize: 12, anchorText: [0, -1],
                fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light",\
                    "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'
            }]);
            networkMarkersManager.setCalculator(function (markers) {
              return { text: markers.length.toString(), index: 1, title: networks[networkId] };
            });
            TsaApplication.UiHelper.addColorToClass(cssClass, getMarkerColorMapping(networkId));

            markersManagers[networkId] = networkMarkersManager;
        });
    }

    function createMarker(site) {
        var color = getMarkerColorMapping(site.sourcedataserviceid).hex;
        var pinImage = new google.maps.MarkerImage('https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%20|' + color);
        var marker = new google.maps.Marker({
            title: site.sitename,
            position: new google.maps.LatLng(site.latitude, site.longitude),
            icon: pinImage
        });
        google.maps.event.addDomListener(marker, "visible_changed", function() {
            if (marker.getVisible()) {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.setAnimation(null); }, 2000);
            }
        });

        return marker;
    }

    function getMarkerColorMapping(number) {
        var red = Math.floor(Math.exp(number) * 255 * ((Math.sin(number) + 2))) % 255;
        var green = Math.floor(Math.exp(number) * 255 * ((Math.cos(number) + 2))) % 255;
        var blue = Math.floor(Math.exp(number) * 255 * ((Math.sin(2 * number) + 2))) % 255;
        return {
            rgb: { red: red, green: green, blue: blue },
            hex: ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
        };
    }

	return self;
}(TsaApplication.MapController || {}));


TsaApplication.TableController = (function(self) {
    self.dataseriesTable = {};
    var tableOffsetY = 115;

    self.initializeTable = function() {
        self.dataseriesTable = $('#datasetsTable').DataTable({
            "sDom": 'RCfrtiS', "bDestroy": true,
            "aaData": TsaApplication.DataManager.dataseries,
            "sScrollY": ($('div#datasetsContent').height() - tableOffsetY),
            "sScrollX": "100%", "bScrollCollapse": true, "bProcessing": true,
            "bFilter": true, "bDeferRender": true, "bAutoWidth": true, "bStateSave": true,
            "oColReorder": { "iFixedColumns": 1 }, "oColVis": { "aiExclude": [0, 1] },
            "aoColumns": [
                {
                    "mDataProp": 'seriesid', "bSearchable": false, "bSortable": false, "sType": "html",
                    "mRender": function(data, type) { return '<input type="checkbox" data-seriesid="' + data + '">'; }
                },
                { "sTitle": "Series",  "mDataProp": 'seriesid' },
                { "sTitle": "Network",  "mDataProp": 'network' },
                { "sTitle": "Site Code", "mDataProp": 'sitecode' },
                { "sTitle": "Site Name", "mDataProp": 'sitename', "bVisible": false },
                { "sTitle": "Latitude", "mDataProp": 'latitude', "bVisible": false },
                { "sTitle": "Longitude", "mDataProp": 'longitude', "bVisible": false },
                { "sTitle": "State", "mDataProp": 'state', "bVisible": false },
                { "sTitle": "County", "mDataProp": 'county', "bVisible": false },
                { "sTitle": "Site Type", "mDataProp": 'sitetype', "bVisible": false },
                { "sTitle": "Variable Code", "mDataProp": 'variablecode', "bVisible": false },
                { "sTitle": "Variable Name", "mDataProp": 'variablename' },
                { "sTitle": "Method", "mDataProp": 'methoddescription', "bVisible": false },
                { "sTitle": "Units", "mDataProp": 'variableunitsname', "bVisible": false },
                { "sTitle": "Units Type", "mDataProp": 'variableunitstype', "bVisible": false },
                { "sTitle": "Units Abreviation", "mDataProp": 'variableunitsabbreviation', "bVisible": false },
                { "sTitle": "Sample Medium", "mDataProp": 'samplemedium', "bVisible": false },
                { "sTitle": "Value Type", "mDataProp": 'valuetype', "bVisible": false },
                { "sTitle": "Data Type", "mDataProp": 'datatype', "bVisible": false },
                { "sTitle": "Category", "mDataProp": 'generalcategory', "bVisible": false },
                { "sTitle": "Time Support", "mDataProp": 'timesupport', "bVisible": false },
                { "sTitle": "Time Support Units Name", "mDataProp": 'timesupportunitsname', "bVisible": false },
                { "sTitle": "Time Support Units Type", "mDataProp": 'timesupportunitstype', "bVisible": false },
                { "sTitle": "Time Support Units Abbreviation", "mDataProp": 'timesupportunitsabbreviation', "bVisible": false },
                { "sTitle": "Quality Control Level", "mDataProp": 'qualitycontrolleveldefinition', "bVisible": false },
                { "sTitle": "Source Organization", "mDataProp": 'sourceorganization', "bVisible": false },
                { "sTitle": "Source Description", "mDataProp": 'souredescription', "bVisible": false },
                { "sTitle": "Begin DateTime", "mDataProp": 'begindatetime', "bVisible": false },
                { "sTitle": "End DateTime", "mDataProp": 'enddatetime', "bVisible": false },
                { "sTitle": "UTC Offset", "mDataProp": 'utcoffset', "bVisible": false },
                { "sTitle": "Number Observations", "mDataProp": 'numberobservations' },
                { "sTitle": "Date Last Updated", "mDataProp": 'datelastupdated' },
                { "sTitle": "Active", "mDataProp": 'isactive' }
            ]
        });

        window.addEventListener('resize', function() {
            var oSettings = self.dataseriesTable.fnSettings();
            oSettings.oScroll.sY = ($('div#datasetsContent').height() - tableOffsetY);
            self.dataseriesTable.fnDraw();
        }, false);
    };

    self.updateDataseries = function() {
        //make so it doesn't remove all data, but just the necessary.
        self.dataseriesTable.fnClearTable();
        self.dataseriesTable.fnAddData(TsaApplication.Search.filteredDataseries);
    };



    return self;
}(TsaApplication.TableController || {}));

/**
 *  Visualization Manager
 */
TsaApplication.VisualizationManager = (function (self) {

	return self;
}(TsaApplication.VisualizationManager || {}));


/**
 *  Search
 */
TsaApplication.Search = (function (self) {
    self.filteredDataseries = [];
    self.filteredSites = [];

    var dataFiltered = new CustomEvent("datafiltered", { bubbles:true, cancelable:false });

    self.toggleFilter = function(property, value) {
        var facet = _.find(TsaApplication.DataManager.facets, function(facet){ return facet.keyfield === property; });
        var filter = _.find(facet.filters, function(filter){ return filter[facet.keyfield] == value; });
        filter.applied = !filter.applied;
        updateFilteredData(facet);

        document.dispatchEvent(dataFiltered);
    };

    function updateFilteredData(facetFiltered) {
        self.filteredDataseries = TsaApplication.DataManager.dataseries;
        self.filteredSites = TsaApplication.DataManager.sites;
        var filteredFacetSeries = {};

        // update dataseries
        TsaApplication.DataManager.facets.forEach(function(facet) {
            var facetSeries = (facet === facetFiltered)? facet.updateFacetSeries(): facet.filteredFacetSeries;
            filteredFacetSeries[facet.keyfield] = facetSeries;
            self.filteredDataseries = _.intersection(self.filteredDataseries, facetSeries);
        });

        // update sites
        var uniqueSites = _.uniq(self.filteredDataseries, function(series) { return series["sitecode"]; });
        var siteCodes = _.pluck(uniqueSites, 'sitecode');
        self.filteredSites = _.filter(self.filteredSites, function(site) {
            return _.contains(siteCodes, site.sitecode);
        });

        // update filters count
        TsaApplication.DataManager.facets.forEach(function(facet) {
            if (!facet.isFiltered()) {
                facet.filters.forEach(function(filter) {
                    filter.dataseriesCount = _.intersection(filter.filteredSeries, self.filteredDataseries).length;
                });
                return;
            }

            var outerFacets = _.values(_.omit(filteredFacetSeries, facet.keyfield));
            var outerFacetsJoin = _.reduce(outerFacets, function(a, b) { return _.intersection(a, b); });
            facet.filters.forEach(function(filter) {
                filter.dataseriesCount = _.intersection(filter.filteredSeries, outerFacetsJoin).length;
            });
        });
    }

	return self;
}(TsaApplication.Search || {}));


/**
 *  Ui Handler
 */
TsaApplication.UiHelper = (function (self) {
    var visibleViewClass = 'active';
    var defaultTabElementId = '#mapTab';
    var defaultContentElementId = '#mapContent';

    self.loadView = function(view) {
        var tabElement = $('[id="' + (view + 'Tab') + '"');
        var contentElement = $('[id="' + (view + 'Content') + '"');
        tabElement = (tabElement.length == 0)? $(defaultTabElementId): tabElement;
        contentElement = (contentElement.length == 0)? $(defaultContentElementId): contentElement;

        tabElement.addClass(visibleViewClass);
        contentElement.addClass(visibleViewClass);
    };

    self.facetsTemplate = _.template("<div class='panel panel-default'>\
        <div class='panel-heading'>\
            <h4 class='panel-title'>\
                <a data-toggle='collapse' class='accordion-toggle' data-parent='#accordion' href='#<%= facetid %>'>\
                    <%= facettitle %> \
                </a>\
            </h4>\
        </div>\
        <div id='<%= facetid %>' class='panel-collapse collapse in'>\
            <div class='panel-body'>\
                <div class='list-group'>\
                    <ul class='list-group inputs-group'>\
                    </ul>\
                </div>\
            </div>\
        </div>\
    </div>");

    self.filterTemplate = _.template("<li class='list-group-item' id='<%= id %>'>\
        <span class='badge'><%= count %></span>\
        <label class='checkbox'>\
            <input type='checkbox' data-facet='<%= facet %>' value='<%= id %>'><%= name %>\
        </label>\
    </li>");

    self.siteInfoWindowTemplate = _.template("<section class='site-infowindow'>\
        <header><h5><%= sitename %></h5> <h6><%= sitecode %></h6></header>\
        <div class='siteDetails'>\
            <div class='column'>\
                <span class='detailItem'><span>Network:</span> <%= network %></span>\
                <span class='detailItem'><span>State:</span> <%= state %></span>\
                <span class='detailItem'><span>Site Type:</span> <%= sitetype %></span>\
            </div>\
            <div class='column'>\
                <span class='detailItem'><span>County:</span> <%= county %></span>\
                <span class='detailItem'><span>Latitude:</span> <%= latitude %></span>\
                <span class='detailItem'><span>Longitude:</span> <%= longitude %></span>\
            </div>\
            <div class='clearfix'></div>\
        </div>\
    </section>");

    self.renderFacets = function(parent){
        var facets = [];
        var facetsHtml;

        TsaApplication.DataManager.facets.forEach(function(facet){
            facets = facets.concat(self.facetsTemplate({facetid: facet.keyfield, facettitle: facet.name}));
        });
        facetsHtml = facets.join('');
        parent.append($(facetsHtml));
    };

    self.renderFilterItems = function() {
        TsaApplication.DataManager.facets.forEach(function(facet) {
            facet.filters.forEach(function(filter) {
                var filterName = _.map(facet.namefields, function(namefield){ return filter[namefield]; }).join(', ');
                var elementData = { facet: facet.keyfield, id: filter[facet.keyfield], name: filterName, count: filter.dataseriesCount };
                var filterElement = $(self.filterTemplate(elementData))
                    .appendTo($("#" + facet.keyfield + " ul"))
                    .find("input:checkbox");
                filterElement.on('change', function(){
                    TsaApplication.Search.toggleFilter(this.dataset.facet, this.value);
                });
            });
        });
    };

    self.updateSeriesCount = function() {
        TsaApplication.DataManager.facets.forEach(function(facet) {
            var filters = _.sortBy(facet.filters, function(filter) { return filter.dataseriesCount; });
            filters.forEach(function(filter) {
                var filterElement = $("#" + facet.keyfield + " [id='" + filter[facet.keyfield] + "']");
                var counterElement = filterElement.find(".badge");
                if (filter.dataseriesCount) {
                    filterElement.slideDown();
                    counterElement.text(filter.dataseriesCount);
                } else {
                    filterElement.slideUp();
                }
            });
        });
    };

    self.updateTabsFilteredCount = function() {
        var sitesCount = TsaApplication.Search.filteredSites.length;
        var seriesCount = TsaApplication.Search.filteredDataseries.length;
        $("#datasetsTab .badge").text(seriesCount);
        $("#mapTab .badge").text(sitesCount);
    }

    self.addColorToClass = function(cssClass, color) {
        var rgbaString = 'rgba(' + color.rgb.red + ', ' + color.rgb.green + ', ' + color.rgb.blue + ', 0.86)';
        var backgroundColorString = 'background-color: ' + rgbaString;
        $('<style>.' + cssClass + ' { ' + backgroundColorString + '; }</style>').appendTo('head');
    }

	return self;
}(TsaApplication.UiHelper || {}));



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