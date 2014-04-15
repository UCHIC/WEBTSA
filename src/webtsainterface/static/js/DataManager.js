/**
 * Created by Juan on 4/6/14.
 */

TsaApplication.DataManager = (function (self) {
    var dataLoader = { loadedData: 0, dataToLoad: ['facets', 'dataseries', 'sites'] };

    //data
    self.dataseries = [];
    self.facets = [];
    self.sites = [];

    //events
    var dataLoaded = jQuery.Event("dataloaded");
    var dataseriesLoaded = jQuery.Event("dataseriesloaded");
    var sitesLoaded = jQuery.Event("sitesloaded");
    var facetsLoaded = jQuery.Event("facetsloaded");

    self.loadData = function() {
        dataLoader.watch("loadedData", function(id, oldval, newval) {
            if (newval === dataLoader.dataToLoad.length) {
                $(document).trigger(dataLoaded);
            }
            return newval;
        });

        $.getJSON("/api/v1/dataseries").done(function(data) {
            self.dataseries = data.objects;
            extendDataseries();
            extendFilters();
            dataLoader.loadedData++;
            $(document).trigger(dataseriesLoaded);
        });

        $.getJSON("/api/v1/sites").done(function(data) {
            self.sites = data.objects;
            dataLoader.loadedData++;
            $(document).trigger(sitesLoaded);
        });

        $.getJSON("/api/v1/facets").done(function(data) {
            self.facets = data.objects;
            extendFacets();
            dataLoader.loadedData++;
            $(document).trigger(facetsLoaded);
        });
    };



    function extendDataseries() {
        self.dataseries.forEach(function(series) {
            series.dataset = [];
            series.loadDataset = function(callback) {
                if (series.dataset.length !== 0) {
                    callback();
                    return;
                }

                $.ajax(series.getdataurl).done(function(data){
                    var values = $(data).find('values').children('value');
                    values.each(function(index, value) {
                        value = $(value);
                        var seriesData = {};
                        seriesData.seriesID = TsaApplication.VisualizationController.plottedSeries.length - 1;
                        seriesData.date = value.attr('dateTime');
                        seriesData.value = value.text();
                        seriesData.variable = series.variablename;
                        series.dataset.push(seriesData);
                    });})
                    .done(function(){ callback(); }
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
                    applied: false
                });
                facet.filters.push(filter);
            });

            facet.updateFacetSeries();
        });
    }
	return self;
}(TsaApplication.DataManager || {}));