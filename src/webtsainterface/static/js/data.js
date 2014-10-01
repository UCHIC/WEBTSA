/**
 * Created by Juan on 4/6/14.
 */

define('data', ['jquery'], function() {
    var self = {};
    var dataLoader = { loadedData: 0, dataToLoad: ['facets', 'dataseries', 'sites'] };

    //data
    self.filteredDataseries = [];
    self.filteredSites = [];
    self.dataseries = [];
    self.facets = [];
    self.sites = [];


    //events
    var dataLoaded = jQuery.Event("dataloaded");
    var dataFiltered = jQuery.Event("datafiltered");
    var dataseriesLoaded = jQuery.Event("dataseriesloaded");
    var facetsLoaded = jQuery.Event("facetsloaded");
    var sitesLoaded = jQuery.Event("sitesloaded");

    self.loadData = function() {
        dataLoader.watch("loadedData", function(id, oldval, newval) {
            var pb = document.getElementById("progressBar");
            pb.setAttribute("style", "width:" + ((newval * 33) + 1) +"%");
            if (newval === dataLoader.dataToLoad.length) {
                $(document).trigger(dataLoaded);
                $("#loadingScreen").delay(500).fadeOut(); // delay to see the bar reach 100%
            }
            return newval;
        });

		$.getJSON(window.location.pathname + "api/v1/facets?limit=0").done(function(data) {
            self.facets = data.objects;
            extendFacets();
            dataLoader.loadedData++;
            $(document).trigger(facetsLoaded);
        });

		$.getJSON(window.location.pathname + "api/v1/sites?limit=0").done(function(data) {
            self.sites = data.objects;
            dataLoader.loadedData++;
            $(document).trigger(sitesLoaded);
        });

        $.getJSON(window.location.pathname + "api/v1/dataseries?limit=0").done(function(data) {
            self.dataseries = data.objects;
            extendDataseries();
            extendFilters();
            var facets = _(self.facets).filter(function(facet) { return facet.selected !== ""; });
            facets.forEach(function(facet) {
                updateFilteredData(facet);
            });
            dataLoader.loadedData++;
            $(document).trigger(dataseriesLoaded);
        });
    };

    self.toggleFilter = function(property, value) {
        var facet = _.find(self.facets, function(facet){ return facet.keyfield === property; });
        var filter = _.find(facet.filters, function(filter){ return filter[facet.keyfield] == value; });
        if (!facet || !filter) {
            return;
        } else if (!filter.dataseriesCount) {
            return;
        }

        filter.applied = !filter.applied;
        updateFilteredData(facet);
    };

    self.clearAllFilters = function() {
        self.filteredSites = self.sites;
        self.filteredDataseries = self.dataseries;

        self.facets.forEach(function(facet) {
            if (!facet.isFiltered()) {
                return;
            }
            facet.filters.forEach(function(filter) {
                filter.applied = false;
                filter.dataseriesCount = filter.filteredSeries.length;
           });
           facet.updateFacetSeries();
        });
        $(document).trigger(dataFiltered);
    };

    self.clearFacetFilters = function(facet) {
       facet.filters.forEach(function(filter) {
            filter.applied = false;
       });
       updateFilteredData(facet);
    };

    self.selectOnlyFilter = function(facet, savedFilter) {
        var keyfield = facet.keyfield;
        facet.filters.forEach(function(filter) {
            filter.applied = (filter[keyfield] === savedFilter);
        });
        updateFilteredData(facet);
    };

    function updateFilteredData(facetFiltered) {
        self.filteredSites = [];
        var filteredFacetSeries = {};
        self.filteredDataseries = self.dataseries;

        // update dataseries
        self.facets.forEach(function(facet) {
            var facetSeries = (facet === facetFiltered)? facet.updateFacetSeries(): facet.filteredFacetSeries;
            filteredFacetSeries[facet.keyfield] = facetSeries;
            self.filteredDataseries = _.intersection(self.filteredDataseries, facetSeries);
        });

        // update sites
        self.sites.forEach(function(site) {
            if (_(self.filteredDataseries).findWhere({ sitecode: site.sitecode, sourcedataserviceid: site.sourcedataserviceid })) {
                self.filteredSites.push(site);
            }
        });

        // update filters and filters count
        self.facets.forEach(function(facet) {
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

    function extendDataseries() {
        var dateRegex = /^(\d{4}\-\d\d\-\d\d([tT][\d:]*)?)/;

        self.dataseries.forEach(function(series) {
            series.dataset = [];
            series.sitecode = (+series.sitecode)? [+series.sitecode].join(''): series.sitecode;
            series.loadDataset = function(callback) {
                if (series.dataset.length !== 0) {
                    callback && callback();
                    return;
                }

                $.ajax({
                    url: series.getdataurl
                }).done(function(data) {
                    var values = data.getElementsByTagName('value');
                    if (values.length === 0) {
                        values = data.getElementsByTagName('ns1:value');
                    }
                    var index = 0;
                    var node;

                    var verticalDatumNode = data.getElementsByTagName('verticalDatum').item(0);
                    var elevationNode = data.getElementsByTagName('elevation_m').item(0);
                    var noDataValueNode = data.getElementsByTagName('noDataValue').item(0);

                    series.dataset.noDataValue = noDataValueNode && +noDataValueNode.textContent;
                    series.dataset.verticalDatum = verticalDatumNode && verticalDatumNode.textContent;
                    series.dataset.elevation = elevationNode && +elevationNode.textContent;

                    while (node = values[index++]) {
                        var seriesData = {};
                        seriesData.date = node.getAttribute('dateTime').match(dateRegex).shift();
                        seriesData.value = node.textContent;
                        seriesData.variable = series.variablename;
                        seriesData.dateTimeUTC = node.getAttribute('dateTimeUTC');
                        seriesData.timeOffset = node.getAttribute('timeOffset');
                        seriesData.censorCode = node.getAttribute('censorCode');
                        series.dataset.push(seriesData);
                    }})
                    .done(function() {
                        callback && callback();
                    }
                );
            };
        });
    }

    function extendFacets() {
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
            };
        });
    }

    function extendFilters() {
        self.facets.forEach(function(facet) {
            var filters = _.uniq(self.dataseries, function(item){ return item[facet.keyfield]; });

            filters.forEach(function(filter){
                filter = _.clone(filter);
                filter = _.pick(filter, facet.keyfield, facet.namefields);

                var series = _.filter(self.dataseries, function(series){ return filter[facet.keyfield] === series[facet.keyfield]; });
                _.extend(filter, {
                    filteredSeries: series,
                    dataseriesCount: series.length,
                    applied: ((filter[facet.keyfield] === facet.selected)? true: false)
                });
                facet.filters.push(filter);
            });

            facet.updateFacetSeries();
        });
    }
	return self;
});
