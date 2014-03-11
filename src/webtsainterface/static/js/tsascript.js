var TsaApplication = TsaApplication || {};

TsaApplication.bindEvents = function() {
    document.addEventListener("facetsloaded", function()  {
        TsaApplication.UiHelper.renderFacets($("#leftPanel"));
    });

    document.addEventListener("dataloaded", function() {
        TsaApplication.UiHelper.renderFilterItems();
    });

    document.addEventListener('datafiltered', function(event) {
        //update map markers and dataseries table.
        TsaApplication.UiHelper.updateSeriesCount();
    });
};

/**
 *  Data Manager
 */
TsaApplication.DataManager = (function (self) {
    var dataLoader = { loadedData: 0, dataToLoad: ['facets', 'dataseries', 'sites'] }

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
    self.markers = [];
    var settings = {};

    function loadMarkers() {

    }

    self.initializeMap = function() {
        settings = {
            center: new google.maps.LatLng(-34.397, 150.644),
            zoom: 8
        };
        
        self.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
        loadMarkers();
    };

	return self;
}(TsaApplication.MapController || {}));


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

    self.facetsTemplate = _.template("<div class='panel panel-default'>\
        <div class='panel-heading'>\
            <h4 class='panel-title'>\
                <a data-toggle='collapse' class='accordion-toggle' data-parent='#accordion' href='#<%= facetid %>'> \
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



	return self;
}(TsaApplication.UiHelper || {}));


$(document).ready(function(){
    TsaApplication.bindEvents();
    TsaApplication.DataManager.loadData();
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
