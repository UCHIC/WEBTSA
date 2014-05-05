/**
 * Created by Juan on 4/6/14.
 */
TsaApplication.TableController = (function(self) {
    self.dataseriesTable = {};
    var tableOffsetY = 115;

    self.initializeTable = function() {
        self.dataseriesTable = $('#datasetsTable').DataTable({
            "sDom": 'RCfrtiS', "bDestroy": true,
            "aaData": TsaApplication.DataManager.dataseries,
            "sScrollY": ($('div#datasetsContent').height() - tableOffsetY),
            "sScrollX": "100%", "bScrollCollapse": true, "bProcessing": true,
            "bFilter": true, "bDeferRender": true, "bAutoWidth": true, "bStateSave": true,
            "oColReorder": { "iFixedColumns": 1 }, "oColVis": { "aiExclude": [0, 1], "sAlign": "left" },
            "fnStateSave": function (oSettings, oData) {
                localStorage.setItem('dt-' + window.location.pathname, JSON.stringify(oData));
            },
            "fnStateLoad": function () {
                return JSON.parse(localStorage.getItem('dt-' + window.location.pathname));
            },
            "aoColumns": [
                {
                    "mDataProp": 'seriesid', "bSearchable": false, "bSortable": false, "sType": "html",
                    "mRender": function(data, type) { return '<input type="checkbox" data-seriesid="' + data + '">'; }
                },
                { "sTitle": "Series",  "mDataProp": 'seriesid' },
                { "sTitle": "Network",  "mDataProp": 'network' },
                { "sTitle": "Site Code", "mDataProp": 'sitecode' },
                { "sTitle": "Site Name", "mDataProp": 'sitename', "bVisible": false },
                { "sTitle": "Latitude", "mDataProp": 'latitude', "bVisible": false },
                { "sTitle": "Longitude", "mDataProp": 'longitude', "bVisible": false },
                { "sTitle": "State", "mDataProp": 'state', "bVisible": false },
                { "sTitle": "County", "mDataProp": 'county', "bVisible": false },
                { "sTitle": "Site Type", "mDataProp": 'sitetype', "bVisible": false },
                { "sTitle": "Variable Code", "mDataProp": 'variablecode', "bVisible": false },
                { "sTitle": "Variable Name", "mDataProp": 'variablename' },
                { "sTitle": "Method", "mDataProp": 'methoddescription', "bVisible": false },
                { "sTitle": "Units", "mDataProp": 'variableunitsname', "bVisible": false },
                { "sTitle": "Units Type", "mDataProp": 'variableunitstype', "bVisible": false },
                { "sTitle": "Units Abreviation", "mDataProp": 'variableunitsabbreviation', "bVisible": false },
                { "sTitle": "Sample Medium", "mDataProp": 'samplemedium', "bVisible": false },
                { "sTitle": "Value Type", "mDataProp": 'valuetype', "bVisible": false },
                { "sTitle": "Data Type", "mDataProp": 'datatype', "bVisible": false },
                { "sTitle": "Category", "mDataProp": 'generalcategory', "bVisible": false },
                { "sTitle": "Time Support", "mDataProp": 'timesupport', "bVisible": false },
                { "sTitle": "Time Support Units Name", "mDataProp": 'timesupportunitsname', "bVisible": false },
                { "sTitle": "Time Support Units Type", "mDataProp": 'timesupportunitstype', "bVisible": false },
                { "sTitle": "Time Support Units Abbreviation", "mDataProp": 'timesupportunitsabbreviation', "bVisible": false },
                { "sTitle": "Quality Control Level", "mDataProp": 'qualitycontrolleveldefinition', "bVisible": false },
                { "sTitle": "Source Organization", "mDataProp": 'sourceorganization', "bVisible": false },
                { "sTitle": "Source Description", "mDataProp": 'souredescription', "bVisible": false },
                { "sTitle": "Begin DateTime", "mDataProp": 'begindatetime', "bVisible": false },
                { "sTitle": "End DateTime", "mDataProp": 'enddatetime', "bVisible": false },
                { "sTitle": "UTC Offset", "mDataProp": 'utcoffset', "bVisible": false },
                { "sTitle": "Number Observations", "mDataProp": 'numberobservations' },
                { "sTitle": "Date Last Updated", "mDataProp": 'datelastupdated' },
                { "sTitle": "Active", "mDataProp": 'isactive' }
            ]
        });

        TsaApplication.UiHelper.customizeTableStyle();

        $(window).on('resize', function() {
            var oSettings = self.dataseriesTable.fnSettings();
            oSettings.oScroll.sY = ($('div#datasetsContent').height() - tableOffsetY);
            self.dataseriesTable.fnDraw();
        });

        $('.dataTables_scrollBody').on('scroll', function() {
            self.dataseriesTable.find("tr").find("td:not(:first)").click(function(event) {
                var row = $(this).parent("tr").get(0);
                var series = self.dataseriesTable.fnGetData(row);
                TsaApplication.UiHelper.showDataseriesDialog(series);
            });
        });

    };

    self.updateDataseries = function() {
        //TODO: make it so it doesn't remove all data, but just the necessary.
        self.dataseriesTable.fnClearTable();
        self.dataseriesTable.fnAddData(TsaApplication.Search.filteredDataseries);
    };

    return self;
}(TsaApplication.TableController || {}));