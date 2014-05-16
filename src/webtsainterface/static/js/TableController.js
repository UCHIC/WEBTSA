/**
 * Created by Juan on 4/6/14.
 */
TsaApplication.TableController = (function(self) {
    self.dataseriesTable = {};
    var tableOffsetY = 110;

    self.initializeTable = function() {

//        self.dataseriesTable = $('#datasetsTable').DataTable({
//            "sDom": 'RCfrtiS', "bDestroy": true,
//            "aaData": TsaApplication.DataManager.dataseries,
//            "sScrollY": ($('div#datasetsContent').height() - tableOffsetY),
//            "sScrollX": "100%", "bScrollCollapse": true, "bProcessing": true,
//            "bFilter": true, "bDeferRender": true, "bAutoWidth": true, "bStateSave": true,
//            "oColReorder": { "iFixedColumns": 1 }, "oColVis": { "aiExclude": [0, 1], "sAlign": "left" },
//            "fnStateSave": function (oSettings, oData) {
//                localStorage.setItem('dt-' + window.location.pathname, JSON.stringify(oData));
//            },
//            "fnStateLoad": function () {
//                return JSON.parse(localStorage.getItem('dt-' + window.location.pathname));
//            },
//            "aoColumns": [
//                {
//                    "mDataProp": 'seriesid', "bSortable": false, "sType": "html",
//                    "mRender": renderCheckbox
//                },
//                { "sTitle": "Series",  "mDataProp": 'seriesid' },
//                { "sTitle": "Network",  "mDataProp": 'network' },
//                { "sTitle": "Site Code", "mDataProp": 'sitecode' },
//                { "sTitle": "Site Name", "mDataProp": 'sitename', "bVisible": false },
//                { "sTitle": "Latitude", "mDataProp": 'latitude', "bVisible": false },
//                { "sTitle": "Longitude", "mDataProp": 'longitude', "bVisible": false },
//                { "sTitle": "State", "mDataProp": 'state', "bVisible": false },
//                { "sTitle": "County", "mDataProp": 'county', "bVisible": false },
//                { "sTitle": "Site Type", "mDataProp": 'sitetype', "bVisible": false },
//                { "sTitle": "Variable Code", "mDataProp": 'variablecode', "bVisible": false },
//                { "sTitle": "Variable Name", "mDataProp": 'variablename' },
//                { "sTitle": "Method", "mDataProp": 'methoddescription', "bVisible": false },
//                { "sTitle": "Units", "mDataProp": 'variableunitsname', "bVisible": false },
//                { "sTitle": "Units Type", "mDataProp": 'variableunitstype', "bVisible": false },
//                { "sTitle": "Units Abreviation", "mDataProp": 'variableunitsabbreviation', "bVisible": false },
//                { "sTitle": "Sample Medium", "mDataProp": 'samplemedium', "bVisible": false },
//                { "sTitle": "Value Type", "mDataProp": 'valuetype', "bVisible": false },
//                { "sTitle": "Data Type", "mDataProp": 'datatype', "bVisible": false },
//                { "sTitle": "Category", "mDataProp": 'generalcategory', "bVisible": false },
//                { "sTitle": "Time Support", "mDataProp": 'timesupport', "bVisible": false },
//                { "sTitle": "Time Support Units Name", "mDataProp": 'timesupportunitsname', "bVisible": false },
//                { "sTitle": "Time Support Units Type", "mDataProp": 'timesupportunitstype', "bVisible": false },
//                { "sTitle": "Time Support Units Abbreviation", "mDataProp": 'timesupportunitsabbreviation', "bVisible": false },
//                { "sTitle": "Quality Control Level", "mDataProp": 'qualitycontrolleveldefinition', "bVisible": false },
//                { "sTitle": "Source Organization", "mDataProp": 'sourceorganization', "bVisible": false },
//                { "sTitle": "Source Description", "mDataProp": 'souredescription', "bVisible": false },
//                { "sTitle": "Begin DateTime", "mDataProp": 'begindatetime', "bVisible": false },
//                { "sTitle": "End DateTime", "mDataProp": 'enddatetime', "bVisible": false },
//                { "sTitle": "UTC Offset", "mDataProp": 'utcoffset', "bVisible": false },
//                { "sTitle": "Number Observations", "mDataProp": 'numberobservations' },
//                { "sTitle": "Date Last Updated", "mDataProp": 'datelastupdated' },
//                { "sTitle": "Active", "mDataProp": 'isactive' }
//            ]
//        });
//
//
//
//        $(window).on('resize', function() {
//            self.reDrawTable();
//        });
//
//        $('.dataTables_scrollBody').on('scroll', function() {
//            bindRows();
//        });
//
//        bindRows();


        self.dataseriesTable = $('#datasetsTable').dataTable({
            data: TsaApplication.DataManager.dataseries,
            dom: 'ftiS',
            //stateSave: true,
            deferRender: true,
            scrollCollapse: true,
            scrollY: ($('div#datasetsContent').height() - tableOffsetY),
            scrollX: '100%',
            order: [[ 1, "asc" ]],
            columns: [
                {
                    title: 'Plot', orderable: false, type: 'html',
                    render: renderCheckbox, data: 'seriesid',
                    searchable: true

                },
                {
                    title: 'Source Network Id',  data: 'sourcedataserviceid',
                    name: 'sourcedataserviceid', visible: false, orderable: false
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
                { title: 'Variable Code', data: 'variablecode', name: 'variablecode', visible: false },
                { title: 'Variable Name', data: 'variablename', name: 'variablename' },
                { title: 'Method', data: 'methoddescription', name: 'methoddescription', visible: false },
                { title: 'Units', data: 'variableunitsname', name: 'variableunitsname', visible: false },
                { title: 'Units Type', data: 'variableunitstype', name: 'variableunitstype', visible: false },
                { title: 'Units Abreviation', data: 'variableunitsabbreviation', name: 'variableunitsabbreviation', visible: false },
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
                { title: 'Active', data: 'isactive', name: 'isactive' }
            ],
            createdRow: function(row, data, dataIndex) {
                var tableRow = $(row);

                tableRow.find('td:not(:first)').click(function(){
                    var series = data;
                    TsaApplication.UiHelper.showDataseriesDialog(series);
                });

                tableRow.find('input[type="checkbox"]').on('change', function() {
                    var visualization = TsaApplication.VisualizationController;
                    var series = data;
                    if (this.checked) {
                        if (!visualization.canPlot()) {
                            this.checked = false;
                            return;
                        }

                        var method = visualization.plottingMethods.addPlot;
                        visualization.doPlot = false;
                        visualization.prepareSeries(series, method);
                    } else {
                        visualization.unplotSeries(series.seriesid);
                    }
                });
            }
        });

        var colvis = new $.fn.dataTable.ColVis(self.dataseriesTable);
        colvis.s.aiExclude = [0, 1, 2];
        $.fn.dataTable.ColVis.fnRebuild();
        $(colvis.button()).insertAfter('.export');

        $(window).on('resize', _.debounce(self.reDrawTable, 500));

        self.dataseriesTable.on('length.dt', function(event){
            console.log('a');
        });

        TsaApplication.UiHelper.customizeTableStyle();
    };

    self.reDrawTable = function() {
        var oSettings = self.dataseriesTable.fnSettings();
        oSettings.oScroll.sY = ($('div#datasetsContent').height() - tableOffsetY);
        self.dataseriesTable.api().draw();
    };

    self.updateDataseries = function() {
        var api = self.dataseriesTable.api();
        TsaApplication.DataManager.facets.forEach(function(facet) {
            var column = api.column(facet.keyfield + ':name');
            var filterRegex = '';

            facet.filters.forEach(function(filter) {
                if (filter.applied) {
                    filterRegex += (filterRegex === '')? '': '|';
                    filterRegex += '(' + filter[facet.keyfield] + ')';
                }
            });
            column.search(filterRegex, true, false);
        });
        api.draw();
    };

    function renderCheckbox(data, type) {
        var visualization = TsaApplication.VisualizationController;
        var series = _(visualization.plottedSeries).union(visualization.unplottedSeries);
        var checked = (_(series).findWhere({seriesid: data}))? 'checked': '';
        return ('<input type="checkbox" ' + checked + '>');
    }

    return self;
}(TsaApplication.TableController || {}));