var TsaApplication = TsaApplication || {};

TsaApplication.bindEvents = function() {
    document.addEventListener("facetsloaded", function(event)  {
        TsaApplication.UiHelper.renderFacets($("#leftPanel"));
    });

    document.addEventListener("dataloaded", function(event) {
        TsaApplication.Search.filteredDataseries = TsaApplication.DataManager.dataseries;
        TsaApplication.Search.filteredSites = TsaApplication.DataManager.sites;
        TsaApplication.DataManager.populateFilterItems();
        TsaApplication.UiHelper.renderFilters();
    });

    document.addEventListener('datafiltered', function(event) {
        //update map markers and dataseries table.
    });
};


/**
 *  Data Manager
 */
TsaApplication.DataManager = (function (self) {
    var dataToLoad = ['facets', 'dataseries', 'sites'];
    self.loadedData = 0;

    //data
    self.filterItems = [];
    self.dataseries = [];
    self.facets = [];
    self.sites = [];

    //events
    var dataLoaded = new CustomEvent("dataloaded", { bubbles:true, cancelable:false });
    var dataseriesLoaded = new CustomEvent("dataseriesloaded", { bubbles:true, cancelable:false });
    var sitesLoaded = new CustomEvent("sitesloaded", { bubbles:true, cancelable:false });
    var facetsLoaded = new CustomEvent("facetsloaded", { bubbles:true, cancelable:false });

    self.populateFilterItems = function() {
        var keys = _.pluck(self.facets, "keyfield");

        self.facets.forEach(function(facet) {
            var filters = _.uniq(self.dataseries, function(item){ return item[facet.keyfield]; });
            filters.forEach(function(filter){
                filter = _.clone(filter);
                _.extend(filter, {  key: facet.keyfield, value: facet.namefields });
                self.filterItems.push(_.pick(filter, "key", "value", facet.keyfield, facet.namefields));
            });
        });
    }

    self.loadData = function() {
        self.watch("loadedData", function(id, oldval, newval) {
            if (newval === dataToLoad.length) {
                document.dispatchEvent(dataLoaded);
            }
            return newval;
        });

        $.getJSON("/api/v1/dataseries")
            .done(function(data) {
                              self.dataseries = data.objects;
                              self.loadedData++;
                              document.dispatchEvent(dataseriesLoaded);
                          });
        $.getJSON("/api/v1/sites")
            .done(function(data) {
                              self.sites = data.objects;
                              self.loadedData++;
                              document.dispatchEvent(sitesLoaded);
                          });
        $.getJSON("/api/v1/facets")
            .done(function(data) {
                              self.facets = data.objects;
                              self.facets.forEach(function(facet){
                                  facet.namefields = facet.namefields.split(',');
                              });
                              self.loadedData++;
                              document.dispatchEvent(facetsLoaded);
                          });
    };

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
    self.currentFilters = {};
    var dataFiltered = new CustomEvent("datafiltered", { bubbles:true, cancelable:false });


    self.toggleFilter = function(property, value) {
        self.currentFilters[property] = self.currentFilters[property] || [];
        if (_.contains(self.currentFilters[property], value)) {
            //remove it
            self.currentFilters[property] = _.without(self.currentFilters[property], value);
        } else {
            //add the filter
            self.currentFilters[property].push(value);
        }
        updateFilteredData();
        document.dispatchEvent(dataFiltered);
    }

    var updateFilteredData = function() {
        self.filteredDataseries = TsaApplication.DataManager.dataseries;
        self.filteredSites = TsaApplication.DataManager.sites;

        for (var property in self.currentFilters) {
            if (self.currentFilters[property].length === 0) {
                continue;
            }
            self.filteredDataseries = _.filter(self.filteredDataseries, function(series) {
                var value = "" + series[property];
                return _.contains(self.currentFilters[property], value);
            });
        }

        var uniqueSites = _.uniq(self.filteredDataseries, function(series){ return series["sitecode"]; });
        var siteCodes = _.pluck(uniqueSites, 'sitecode');
        self.filteredSites = _.filter(self.filteredSites, function(site) {
            return _.contains(siteCodes, site.sitecode);
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

    self.filterTemplate = _.template("<li class='list-group-item'>\
        <span class='badge'></span>\
        <label class='checkbox'>\
            <input type='checkbox' data-facet='<%= facet %>' value='<%= id %>'><%= name %>\
        </label>\
    </li>");

    self.renderFacets = function(parent){
        var facets = [];
        var facetsHtml = "";

        TsaApplication.DataManager.facets.forEach(function(facet){
            facets = facets.concat(self.facetsTemplate({facetid: facet.keyfield, facettitle: facet.name}));
        });
        facetsHtml = facets.join('');
        parent.append($(facetsHtml));
    };

    self.renderFilters = function() {
        TsaApplication.DataManager.filterItems.forEach(function(item){
            var filterName = "";
            item.value.forEach(function(field, index){
                filterName += (index === 0)? item[field]: (", " + item[field]);
            });
            var filter = $(self.filterTemplate({id: item[item.key], facet: item.key, name: filterName}))
                .appendTo($("#" + item.key + " ul"))
                .find("input:checkbox");

            filter.on('change', function(filter){
                TsaApplication.Search.toggleFilter(this.dataset.facet, this.value);
            });
        });
    }

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
