/**
 * Created by Juan on 4/6/14.
 */

define('table', ['datatablesLibraries'], function() {
    var self = {};

    self.dataseriesTable = {};
    self.shouldInitialize = true;
    self.toSelect;

    var tableOffsetY = 125;

    var searchSettings = {
        exactMatch: false,
        smartSearch: true,
        caseSensitive: false
    };

    self.initializeTable = function() {
        var ui = require('ui');
        var data = require('data');
        var visualization = require('visualization');

        self.dataseriesTable = $('#datasetsTable').dataTable({
            data: data.dataseries,
            dom: 'TtiS',
            //stateSave: true,
            deferRender: true,
            scrollCollapse: true,
            scrollY: ($('div#datasetsContent').height() - tableOffsetY),
            scrollX: '100%',
            tableTools: {
                aButtons: [],
                sRowSelect: 'multi',
                sSelectedClass: 'selected',
                fnPreRowSelect: function (event, nodes) {
                    return !event;
                }
            },
            order: [[ 2, "asc" ]],
            columns: [
                {
                    title: 'Plot', orderable: false, type: 'html',
                    render: renderCheckbox, data: 'seriesid', name: 'plot'
                },
                {
                    title: 'Source Network Id',  data: 'sourcedataserviceid',
                    name: 'sourcedataserviceid', visible: false, orderable: false
                },
                {
                    title: 'Quality Control Level Code', data: 'qualitycontrollevelcode',
                    name: 'qualitycontrollevelcode', visible: false, orderable: false
                },
                { title: 'Series',  data: 'seriesid', name: 'seriesid', type: 'numeric' },
                { title: 'Network',  data: 'network',  name: 'network' },
                { title: 'Site Code', data: 'sitecode', name: 'sitecode' },
                { title: 'Site Name', data: 'sitename', name: 'sitename', visible: false },
                { title: 'Latitude', data: 'latitude', name: 'latitude', visible: false },
                { title: 'Longitude', data: 'longitude', name: 'longitude', visible: false },
                { title: 'State', data: 'state', name: 'state', visible: false },
                { title: 'County', data: 'county', name: 'county', visible: false },
                { title: 'Site Type', data: 'sitetype', name: 'sitetype', visible: false },
                { title: 'Variable Code', data: 'variablecode', name: 'variablecode' },
                { title: 'Variable Name', data: 'variablename', name: 'variablename' },
                { title: 'Method', data: 'methoddescription', name: 'methoddescription', visible: false },
                { title: 'Units', data: 'variableunitsname', name: 'variableunitsname', visible: false },
                { title: 'Units Type', data: 'variableunitstype', name: 'variableunitstype', visible: false },
                { title: 'Units Abbreviation', data: 'variableunitsabbreviation', name: 'variableunitsabbreviation', visible: false },
                { title: 'Sample Medium', data: 'samplemedium', name: 'samplemedium', visible: false },
                { title: 'Value Type', data: 'valuetype', name: 'valuetype', visible: false },
                { title: 'Data Type', data: 'datatype', name: 'datatype', visible: false },
                { title: 'Category', data: 'generalcategory', name: 'generalcategory', visible: false },
                { title: 'Time Support', data: 'timesupport', name: 'timesupport', visible: false },
                { title: 'Time Support Units Name', data: 'timesupportunitsname', name: 'timesupportunitsname', visible: false },
                { title: 'Time Support Units Type', data: 'timesupportunitstype', name: 'timesupportunitstype', visible: false },
                { title: 'Time Support Units Abbreviation', data: 'timesupportunitsabbreviation', name: 'timesupportunitsabbreviation', visible: false },
                { title: 'Quality Control Level', data: 'qualitycontrolleveldefinition', name: 'qualitycontrolleveldefinition', visible: false },
                { title: 'Source Organization', data: 'sourceorganization', name: 'sourceorganization', visible: false },
                { title: 'Source Description', data: 'sourcedescription', name: 'sourcedescription', visible: false },
                { title: 'Begin DateTime', data: 'begindatetime', name: 'begindatetime', visible: false },
                { title: 'End DateTime', data: 'enddatetime', name: 'enddatetime', visible: false },
                { title: 'UTC Offset', data: 'utcoffset', name: 'utcoffset', visible: false },
                { title: 'Number Observations', data: 'numberobservations', name: 'numberobservations' },
                { title: 'Date Last Updated', data: 'datelastupdated', name: 'datelastupdated' },
                { title: 'Active', data: 'isactive', name: 'isactive', visible: false }
            ],
            createdRow: function(row, rowData, dataIndex) {
                var tableRow = $(row);

                var plotSeries = _(visualization.plottedSeries).union(visualization.unplottedSeries);
                var selected = (_(plotSeries).findWhere({seriesid: rowData.seriesid}))? 'selected': '';
                tableRow.addClass(selected);


                tableRow.find('td:not(:first)').click(function(){
                    var series = rowData;
                    ui.showDataseriesDialog(series);
                });

                tableRow.find('input[type="checkbox"]').on('change', function() {
                    var tableTools = TableTools.fnGetInstance("datasetsTable");
                    var series = rowData;

                    if (this.checked) {
                        if (!visualization.canPlot()) {
                            this.checked = false;
                            return;
                        }

                        visualization.doPlot = false;
                        visualization.prepareSeries(series);
                        tableTools.fnSelect(this.parentElement.parentElement);
                    } else {
                        visualization.unplotSeries(series.seriesid);
                        tableTools.fnDeselect(this.parentElement.parentElement);
                    }
                });
            }
        });

        var colvis = new $.fn.dataTable.ColVis(self.dataseriesTable);
        colvis.s.aiExclude = [0, 1, 2, 3];
        $.fn.dataTable.ColVis.fnRebuild();
        $(colvis.button()).prependTo('#tableButtons');

        $(window).on('resize', _.debounce(function() {
            self.reDrawTable();
            if ($('.ColVis_collection').is(':visible')) {
                $('.ColVis_catcher').click();
            }
        }, 500));

        ui.customizeTableStyle();
        self.shouldInitialize = false;
        self.updateDataseries();

        if (self.toSelect) {
            var tableTools = TableTools.fnGetInstance("datasetsTable");
            var row = self.dataseriesTable.api().row({filter: 'applied'}).node();
            $(row).find('input[type="checkbox"]').attr('checked', true);
            tableTools.fnSelect(row);
        }
    };

    self.reDrawTable = function() {
        var oSettings = self.dataseriesTable.fnSettings();
        oSettings.oScroll.sY = ($('div#datasetsContent').height() - tableOffsetY);
        self.dataseriesTable.api().draw();
    };

    self.updateDataseries = function() {
        var data = require('data');
        if (self.shouldInitialize) {
            return;
        }
        var api = self.dataseriesTable.api();
        data.facets.forEach(function(facet) {
            var column = api.column(facet.keyfield + ':name');
            var filterRegex = '';

            facet.filters.forEach(function(filter) {
                if (filter.applied) {
                    filterRegex += (filterRegex === '')? '': '|';
                    filterRegex += '(^' + filter[facet.keyfield] + '$)';
                }
            });
            column.search(filterRegex, true, false);
        });
        api.draw();
    };

    self.uncheckSeries = function(id) {
        var tableTools = TableTools.fnGetInstance("datasetsTable");
        var selectedRows = tableTools.fnGetSelected();
        var api = self.dataseriesTable.api();

        selectedRows.forEach(function(row) {
            var rowData = api.row(row).data();
            if (rowData.seriesid === id) {
                tableTools.fnDeselect(row);
                $(row).find('input[type="checkbox"]').prop('checked', false);
            }
        });
    };

    $('#txtTableSearch').on('input propertychange paste change', _.debounce(function() {
        var api = self.dataseriesTable.api();
        var match = searchSettings.exactMatch;
        var input = this.value.split('"').join('');
        input = (searchSettings.exactMatch && input)? '"' + input + ' "': input;
        api.search(input, false, searchSettings.smartSearch, !searchSettings.caseSensitive).draw();
    }, 500));

    $('.settings-item').find(':checkbox').on('change', function() {
        searchSettings[this.value] = this.checked;
        $('#txtTableSearch').trigger('input');
    });

    $('#btnShowSelected').click(function() {
        var data = require('data');
        var tableTools = TableTools.fnGetInstance("datasetsTable");
        var api = self.dataseriesTable.api();

        data.clearAllFilters();
        var selectedObjects = tableTools.fnGetSelectedData();
        var idColumn = api.column('seriesid:name');
        var filterRegex = '(^$)';

        selectedObjects.forEach(function(series) {
            filterRegex += (filterRegex === '')? '': '|';
            filterRegex += '(^' + series.seriesid + '$)';
        });
        idColumn.search(filterRegex, true, false).draw();
    });

    $('#btnShowAll').click(function() {
        var data = require('data');
        var api = self.dataseriesTable.api();

        data.clearAllFilters();
        api.column('seriesid:name').search('').draw();
    });

    $('#btnClearSelected').click(function() {
        var visualization = require('visualization');
        var tableTools = TableTools.fnGetInstance("datasetsTable");

        var selectedObjects = tableTools.fnGetSelectedData();

        selectedObjects.forEach(function(series) {
            visualization.unplotSeries(series.seriesid);
        });
    });

    function renderCheckbox(data, type) {
        var visualization = require('visualization');
        var series = _(visualization.plottedSeries).union(visualization.unplottedSeries);
        var checked = (_(series).findWhere({seriesid: data}))? 'checked': '';
        return ('<input data-seriesid="' + data + '" type="checkbox" ' + checked + '>');
    }

    return self;
});