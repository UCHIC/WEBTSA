/**
 * Created by Juan on 4/6/14.
 */

TsaApplication.UiHelper = (function (self) {
    var visibleViewClass = 'active';
    var defaultTabElementId = '#mapTab';
    var defaultContentElementId = '#mapContent';

    self.loadView = function(view) {
        var contentElement = view + 'Content';
        //contentElement = (contentElement.length == 0)? $(defaultContentElementId): contentElement;
        $(".nav-tabs").find("a[href='#" + contentElement + "']").click();
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
                filterElement.on('change', function() {
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

    self.showDataseriesDialog = function(series) {
        var dialog = $('#InfoDialog');
        var plottedSeries = TsaApplication.VisualizationController.plottedSeries;
        var isAlreadyPlotted = _(_(plottedSeries).pluck('seriesid')).contains(series.seriesid);

        dialog.get(0).dataset['series'] = series.seriesid;
        dialog.find("#series-active-info").text((series.isactive? "Active": "Not Active"));
        dialog.find(".series-item-value").each(function(index, item) {
            if (series.hasOwnProperty(item.dataset.field)) {
                $(item).text(series[item.dataset.field]);
            }
        });

        dialog.find("#btnAddToPlot").attr('disabled', (plottedSeries.length >= 5 || isAlreadyPlotted));
        dialog.modal('show');
    }

    self.updateTabsFilteredCount = function() {
        var sitesCount = TsaApplication.Search.filteredSites.length;
        var seriesCount = TsaApplication.Search.filteredDataseries.length;
        $("div#datasetsTab .badge").text(seriesCount);
        $("div#mapTab .badge").text(sitesCount);
    };

    self.getMapCanvas = function() {
        return document.getElementById("map_canvas");
    };

    self.generateClusterClass = function(networkId) {
        return ('network' + networkId);
    };

    self.addColorToClass = function(cssClass, color) {
        var rgbaString = 'rgba(' + color.rgb.red + ', ' + color.rgb.green + ', ' + color.rgb.blue + ', 0.86)';
        var backgroundColorString = 'background-color: ' + rgbaString;
        $('<style>.' + cssClass + ' { ' + backgroundColorString + '; }</style>').appendTo('head');
    };

    self.customizeTableStyle = function() {
        $('.ColVis_MasterButton').removeClass('ColVis_Button').addClass('btn btn-default glyphicon');
        if ($.support.placeholder) {
            var filter = $('#datasetsTable_filter');
            var txtSearch = filter.find('input[type="text"]').detach();
            txtSearch.attr({placeholder: 'Search', type: 'search', results: 5});
            filter.empty().append(txtSearch);
        }
    };

    self.startPlotAnimation = function() {
          $("#summarystats").hide();
        $("div#graphArea .ring").show();
    };

    self.endPlotAnimation = function() {
        $("div#graphArea .ring").hide();
        $("#summarystats").show();
    };


    jQuery(function() {
        jQuery.support.placeholder = false;
        var test = document.createElement('input');
        if('placeholder' in test) jQuery.support.placeholder = true;
    });

	return self;
}(TsaApplication.UiHelper || {}));