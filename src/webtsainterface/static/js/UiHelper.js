/**
 * Created by Juan on 4/6/14.
 */

TsaApplication.UiHelper = (function (self) {
    var visibleViewClass = 'active';
    var defaultTabElementId = '#mapTab';
    var defaultContentElementId = '#mapContent';

//    $(document).on('plotdataloading', function() {
//        $('visualization')
//    });
//
//    $(document).on('plotdataready', function() {
//
//    });

    self.loadView = function(view) {
        if ($('#' + view + 'Tab').hasClass('active')) {
            return;
        }
        var contentElement = view + 'Content';
        //contentElement = (contentElement.length == 0)? $(defaultContentElementId): contentElement;
        $(".nav-tabs").find("a[href='#" + contentElement + "']").click();
    };

    self.getActiveView = function() {
        return $(".nav-tabs .active").prop("id").replace("Tab", "");
    };

    self.getBrowserName= (function(){
        var ua= navigator.userAgent, tem,
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\bOPR\/(\d+)/)
            if(tem!= null) return 'Opera '+tem[1];
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    })();

    self.facetsTemplate = _.template("<div class='panel panel-default'>\
        <div class='panel-heading'>\
            <h4 class='panel-title'>\
                <a data-toggle='collapse' class='accordion-toggle' data-parent='#accordion' href='#<%= facetid %>'>\
                    <%= facettitle %> \
                </a>\
            </h4>\
        </div>\
        <div id='<%= facetid %>' class='facet-list panel-collapse collapse in'>\
            <div class='panel-body'>\
                <div class='list-group'>\
                    <ul class='list-group inputs-group default-values'>\
                    </ul>\
                    <ul id='more-<%= facetid %>' class='list-group inputs-group collapse more'>\
                    </ul>\
                </div>\
            </div>\
        </div>\
    </div>");

    self.filterTemplate = _.template("<li class='list-group-item' id='<%= id %>'>\
        <span class='badge'><%= count %></span>\
        <label class='checkbox'>\
            <input type='checkbox' data-facet='<%= facet %>' value='<%= id %>' <%= checked %>>\
            <%= name %>\
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
        <button data-sitecode='<%= sitecode %>' class='btnViewSeries'>View Dataseries</button>\
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
        $(".facet-list").find("ul").empty();

        TsaApplication.DataManager.facets.forEach(function(facet) {
            var filters = [];           // Default filters
            var filters2 = [];          // Non-default filters. Must click "Show more" to display.
            var counter = 0;
            var maxDefault = 6;         // Number of default filters
            var orderedFilters = (_(facet.filters)
                .chain()
                .sortBy('dataseriesCount')
                .sortBy('applied')
                .reverse()
                .value()
            );

            orderedFilters.forEach(function(filter) {
                if (!filter.dataseriesCount) {
                    return;
                }

                var filterName = _.map(facet.namefields, function(namefield){ return filter[namefield]; }).join(', ');
                var elementData = {
                    facet: facet.keyfield,
                    id: filter[facet.keyfield],
                    name: filterName,
                    count: filter.dataseriesCount,
                    checked: (filter.applied? 'checked': '')
                };
                if (counter < maxDefault){
                    filters.push(self.filterTemplate(elementData));
                    counter++;
                }
                else{
                    filters2.push(self.filterTemplate(elementData));
                }
            });

            var button = "<li id='morebtn-" + facet.keyfield + "' class='align-center'><a data-toggle='collapse' data-target='#more-" + facet.keyfield + "' href='javascript:void(0)'>Show more</a></li>";
            var filterElements = $(filters.join('')).appendTo($("#" + facet.keyfield + "  .default-values"));

            $("#morebtn-" + facet.keyfield).remove();
            $("#" + facet.keyfield).append(button);

            // Toggle between "Show more" and "Show less"
            $("#morebtn-" + facet.keyfield + " a").click(function(){
                $(this).html($(this).html() == "Show more" ? "Show less" : "Show more");
            });

            // Bind checkbox check event for the default values
            filterElements.find("input:checkbox").on('change', function() {
                TsaApplication.Search.toggleFilter(this.dataset.facet, this.value);
            });

            if (!filters2.length){
                $("#morebtn-" + facet.keyfield).remove();       // If there is nothing to show, remove the button
            }
            else{
                filterElements = $(filters2.join('')).appendTo($("#" + facet.keyfield + " .more"));

                // Bind checkbox check event for the non-default values
                filterElements.find("input:checkbox").on('change', function() {
                    TsaApplication.Search.toggleFilter(this.dataset.facet, this.value);
                });
            }
        });

    };

    self.showDataseriesDialog = function(series) {
        var dialog = $('#InfoDialog');
        var plottedSeries = TsaApplication.VisualizationController.plottedSeries;
        var isAlreadyPlotted = _(_(plottedSeries).pluck('seriesid')).contains(series.seriesid);

         $(".modal-header").find(".alert").remove();    // Clear previous download links

        dialog.get(0).dataset['series'] = series.seriesid;
        dialog.find("#series-active-info").text((series.isactive? "Active": "Not Active"));
        dialog.find(".series-item-value").each(function(index, item) {
            if (series.hasOwnProperty(item.dataset.field)) {
                $(item).text(series[item.dataset.field]);
            }
        });

        dialog.find("#btnAddToPlot").prop('disabled',
            !TsaApplication.VisualizationController.canPlot() || isAlreadyPlotted);
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

        $('#tableButtons').detach().prependTo('#datasetsTable_wrapper');

        if ($.support.placeholder) {
            var filter = $('#datasetsTable_filter');
            var txtSearch = filter.find('input[type="search"]').detach();
            txtSearch.prop({placeholder: 'Search', results: 5});
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