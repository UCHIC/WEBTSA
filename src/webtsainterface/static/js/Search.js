/**
 * Created by Juan on 4/6/14.
 */

define('search', ['data', 'jquery'], function(data) {
    var self = {};
    self.filteredDataseries = [];
    self.filteredSites = [];

    var dataFiltered = jQuery.Event("datafiltered");

    self.toggleFilter = function(property, value) {
        var data = require('data');
        var facet = _.find(data.facets, function(facet){ return facet.keyfield === property; });
        var filter = _.find(facet.filters, function(filter){ return filter[facet.keyfield] == value; });
        if (!facet || !filter) {
            return;
        } else if (!filter.dataseriesCount) {
            return;
        }

        filter.applied = !filter.applied;
        updateFilteredData(facet);
    };

    self.clearFacetFilters = function(facet) {
       self.selectOnlyFilter(facet);
    };

    self.selectOnlyFilter = function(facet, savedFilter) {
        var keyfield = facet.keyfield;
        facet.filters.forEach(function(filter) {
            filter.applied = (filter[keyfield] === savedFilter);
        });
        updateFilteredData(facet);
    };

    function updateFilteredData(facetFiltered) {
        var data = require('data');
        self.filteredDataseries = data.dataseries;
        self.filteredSites = data.sites;
        var filteredFacetSeries = {};

        // update dataseries
        data.facets.forEach(function(facet) {
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

        // update filters and filters count
        data.facets.forEach(function(facet) {
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

        $(document).trigger(dataFiltered);
    }

	return self;
});