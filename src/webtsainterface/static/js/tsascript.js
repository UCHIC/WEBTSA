var TsaApplication = TsaApplication || {};

TsaApplication.bindEvents = function() {
    document.addEventListener("facetsloaded", function(){
        TsaApplication.UiHelper.renderFacets($("#leftPanel"));
    });
    document.addEventListener("dataloaded", function(){
        TsaApplication.DataManager.populateFilterItems();
        TsaApplication.UiHelper.renderFilters();
    });
};


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
    self.dataLoaded = new CustomEvent("dataloaded", { bubbles:true, cancelable:false });
    self.dataseriesLoaded = new CustomEvent("dataseriesloaded", { bubbles:true, cancelable:false });
    self.sitesLoaded = new CustomEvent("sitesloaded", { bubbles:true, cancelable:false });
    self.facetsLoaded = new CustomEvent("facetsloaded", { bubbles:true, cancelable:false });

    self.populateFilterItems = function() {
        var keys = _.pluck(self.facets, "keyfield");

        self.facets.forEach(function(facet) {
            var filters = _.uniq(self.dataseries, function(item){ return item[facet.keyfield]; });
            filters.forEach(function(filter){
                _.extend(filter, {  key: facet.keyfield, value: facet.namefield });
                self.filterItems.push(_.pick(filter, "key", "value", facet.keyfield, facet.namefield));
            });
        });
    }

    self.loadData = function(){
        self.watch("loadedData", function(id, oldval, newval){
            if (newval === dataToLoad.length) {
                document.dispatchEvent(self.dataLoaded);
            }
            return newval;
        });

        $.getJSON("/api/v1/dataseries")
            .done(function(data){
                              self.dataseries = data.objects;
                              self.loadedData++;
                              document.dispatchEvent(self.dataseriesLoaded);
                          });
        $.getJSON("/api/v1/sites")
            .done(function(data){
                              self.sites = data.objects;
                              self.loadedData++;
                              document.dispatchEvent(self.sitesLoaded);
                          });
        $.getJSON("/api/v1/facets")
            .done(function(data){
                              self.facets = data.objects;
                              self.loadedData++;
                              document.dispatchEvent(self.facetsLoaded);
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

    self.addFilter = function(property, value) {
        if (!_.has(self.currentFilters, property)) {
            self.currentFilters[property] = [];
        }
        self.currentFilters[property].push(value);
    }

    self.removeFilter = function(property, value) {
        if (!_.has(self.currentFilters, property)) {
            return;
        }
        self.currentFilters[property] = _.without(self.currentFilters[property], value);
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
            <input type='checkbox' value='<%= id %>'><%= name %>\
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
            $("#" + item.key + " ul").append(self.filterTemplate({id: item[item.key], name: item[item.value]}));
        });
    }

	return self;
}(TsaApplication.UiHelper || {}));




$(document).ready(function(){
    TsaApplication.bindEvents();
    TsaApplication.DataManager.loadData();
});


