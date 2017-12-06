/**
 * Created by Juan on 4/6/14.
 */

define('visualization', ['jquery', 'underscore', 'd3Libraries'], function () {
    var self = {};

    self.plotTypes = {histogram: drawHistogram, multiseries: drawMultiseries, box: drawBoxPlot};
    self.currentPlot = self.plotTypes.multiseries;
    self.plotLimit = 5;
    self.doPlot = true;
    self.shouldPlot = false;
    self.plottedSeries = [];
    self.unplottedSeries = [];
    self.boxWhiskerSvgs = [];
    self.dateFirst;
    self.dateLast;

    var plotDataReady = jQuery.Event("plotdataready");
    var plotDataLoading = jQuery.Event("plotdataloading");
    var plotStarted = jQuery.Event("plotstarted");
    var plotFinished = jQuery.Event("plotfinished");

    $(window).resize(_.debounce(function () {
        if ($("#visualizationTab").hasClass("active")) {
            self.plotSeries();
            var offset = $("#graphArea").width() - $("#panel-right").position().left;
            $("#graphContainer").width("calc(100% - " + offset + "px)");
        }
    }, 500));

    self.canPlot = function () {
        return self.plottedSeries.length + self.unplottedSeries.length < self.plotLimit;
    };

    self.initializeDatePickers = function () {
        // Remove the date pickers
        $("#plotOptionsContainer tbody tr:first-child").remove();
        $("#plotOptionsContainer tbody tr:first-child").remove();

        // Add new ones
        $("#plotOptionsContainer tbody").prepend(
            '<tr><td>Begin Date</td><td><input id="dpd1" type="text" class="datepicker" data-date-format="m/dd/yyyy"></td></tr>\
             <tr><td>End Date</td><td><input id="dpd2" type="text" class="datepicker" data-date-format="m/dd/yyyy"></td></tr>'
        );
    };

    self.prepareSeries = function (series) {
        if (!self.canPlot()) {
            return;
        }

        $(document).trigger(plotDataLoading);
        self.unplottedSeries.push(series);

        series.loadDataset(function () {
            $(document).trigger(plotDataReady);
        });
    };

    self.plotSeries = function () {
        var ui = require('ui');

        var shouldPlot = true;

        if (self.unplottedSeries.length + self.plottedSeries.length === 0) {
            self.clearGraph();
            return;
        }

        $(document).trigger(plotStarted);
        self.unplottedSeries.forEach(function (series) {
            if (series.dataset.length === 0) {
                shouldPlot = false;
            }
        });

        if (!shouldPlot || ui.getActiveView() !== 'visualization') {
            self.doPlot = true;
            return;
        }

        self.plottedSeries = _(self.plottedSeries).union(self.unplottedSeries);
        self.unplottedSeries.length = 0;
        assignSeriesId();
        self.currentPlot();
        $(document).trigger(plotFinished);
    };

    self.unplotSeries = function (seriesid) {
        var table = require('table');
        var ui = require('ui');
        self.plottedSeries = _(self.plottedSeries).reject(function (plotted) {
            return plotted.seriesid === seriesid;
        });

        self.unplottedSeries = _(self.unplottedSeries).reject(function (unplotted) {
            return unplotted.seriesid === seriesid;
        });

        table.uncheckSeries(seriesid);
        if (ui.getActiveView() !== 'visualization') {
            self.shouldPlot = true;
            return;
        }

        self.plotSeries(); //TODO: remove it from the plot without re-plotting.
    };

    self.clearGraph = function () {
        $("#graphContainer").empty();
        $("#legendContainer").find("ul").empty();
        $("#statisticsTable tbody").empty();
    };

    // Adds commas to numbers in thousand intervals
    self.numberWithCommas = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Moves an svg element to the last position of its container so it is rendered last and appears in front
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };

    function assignSeriesId() {
        self.plottedSeries.forEach(function (series, index) {
            series.dataset.forEach(function (data) {
                data.seriesID = index;
            });
        });
    }

    function onMouseOver(color) {
        return function () {
            var lighterColor = increase_brightness(color, 30);
            d3.select(this)
                .transition()
                .duration(50)
                //.attr('opacity', 0.7);
                .style('fill', lighterColor);
        }
    }

    function onMouseOut(color) {
        return function () {
            d3.select(this)
                .transition()
                .duration(300)
                .style('fill', color);
            //.attr('opacity', 1);
        }
    }

    function increase_brightness(hex, percent) {
        // strip the leading # if it's there
        hex = hex.replace(/^\s*#|\s*$/g, '');

        // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
        if (hex.length == 3) {
            hex = hex.replace(/(.)/g, '$1$1');
        }

        var r = parseInt(hex.substr(0, 2), 16),
            g = parseInt(hex.substr(2, 2), 16),
            b = parseInt(hex.substr(4, 2), 16);

        return '#' +
            ((0 | (1 << 8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
            ((0 | (1 << 8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
            ((0 | (1 << 8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
    }

    // Returns the length of the longest tick in characters
    function getAxisSeparation(id) {
        var ui = require('ui');
        var browser = ui.getBrowserName;
        var ticks = $(".y.axis[data-id='" + id + "'] .tick text");
        var max = 0;
        if (browser.substring(0, 7) == "Firefox" || browser.substr(0, 2) == "IE") {               // Firefox and IE do not support width() for elements inside an svg. Must calculate it using the textContent and font size (12)
            for (var index = 0; index < ticks.length; index++) {
                var a = ticks[index].textContent.length * 6.5;
                if (max < a) {
                    max = a;
                }
            }
        }
        else {
            for (var index = 0; index < ticks.length; index++) {
                var a = $(ticks[index]);
                if (max < a.width()) {
                    max = a.width();
                }
            }
        }
        return max;
    }

    function calcSummaryStatistics(data) {
        var summary = [];
        var sortedValues = data.map(function (value) {
            return _.pluck(value, 'value');
        });
        for (var i = 0; i < data.length; i++) {
            summary[i] = {
                maximum: -Infinity,
                minimum: Infinity,
                arithmeticMean: 0,
                geometricSum: 0,
                geometricMean: 0,
                deviationSum: 0,
                standardDeviation: 0,
                observations: 0,
                coefficientOfVariation: 0,
                quantile10: 0,
                quantile25: 0,
                median: 0,
                quantile75: 0,
                quantile90: 0
            };

            if (data[i].length == 0) {
                summary[i].maximum = "NaN";
                summary[i].minimum = "NaN";
                summary[i].arithmeticMean = "NaN";
                summary[i].geometricSum = "NaN";
                summary[i].geometricMean = "NaN";
                summary[i].deviationSum = "NaN";
                summary[i].standardDeviation = "NaN";
                summary[i].observations = 0;
                summary[i].quantile10 = "NaN";
                summary[i].quantile25 = "NaN";
                summary[i].median = "NaN";
                summary[i].quantile75 = "NaN";
                summary[i].quantile90 = "NaN";

                continue;
            }

            sortedValues[i] = sortedValues[i].map(function (value) {
                return parseFloat(value);
            });

            sortedValues[i].sort();

            // Quantiles
            summary[i].quantile10 = d3.quantile(sortedValues[i], .09).toFixed(2);
            summary[i].quantile25 = d3.quantile(sortedValues[i], .249).toFixed(2);
            summary[i].median = d3.quantile(sortedValues[i], .49).toFixed(2);
            summary[i].quantile75 = d3.quantile(sortedValues[i], .749).toFixed(2);
            summary[i].quantile90 = d3.quantile(sortedValues[i], .89).toFixed(2);

            // Number of observations
            summary[i].observations = data[i].length;

            // Maximum and Minimum
            summary[i].maximum = d3.max(data[i], function (d) {
                return parseFloat(d.value);
            });
            summary[i].minimum = d3.min(data[i], function (d) {
                return parseFloat(d.value);
            });

            // Arithmetic Mean
            summary[i].arithmeticMean = d3.mean(data[i], function (d) {
                return parseFloat(d.value);
            }).toFixed(2);

            // Standard Deviation
            summary[i].deviationSum = d3.sum(data[i], function (d) {
                return Math.pow(parseFloat(d.value) - summary[i].arithmeticMean, 2)
            }).toFixed(2);
            summary[i].standardDeviation = (Math.pow(summary[i].deviationSum / data[i].length, (1 / 2))).toFixed(2);

            // Geometric Mean
            summary[i].geometricSum = d3.sum(data[i], function (d) {
                if (d.value != 0) return Math.log(Math.abs(d.value));
            }).toFixed(2);
            summary[i].geometricMean = (Math.pow(2, (summary[i].geometricSum / data[i].length))).toFixed(2);

            // Coefficient of Variation
            var variation = summary[i].standardDeviation / summary[i].arithmeticMean;
            if (variation == Infinity || variation == -Infinity) {
                variation = null;
            }
            summary[i].coefficientOfVariation = ((summary[i].standardDeviation / summary[i].arithmeticMean) * 100).toFixed(2) + "%";

            // Add commas
            summary[i].arithmeticMean = self.numberWithCommas(summary[i].arithmeticMean);
            summary[i].geometricMean = self.numberWithCommas(summary[i].geometricMean);
            summary[i].observations = self.numberWithCommas(summary[i].observations);
            summary[i].quantile10 = self.numberWithCommas(summary[i].quantile10);
            summary[i].quantile25 = self.numberWithCommas(summary[i].quantile25);
            summary[i].median = self.numberWithCommas(summary[i].median);
            summary[i].quantile75 = self.numberWithCommas(summary[i].quantile75);
            summary[i].quantile90 = self.numberWithCommas(summary[i].quantile90);
        }
        return summary;
    }

    function setSummaryStatistics(summary) {
        $("#statisticsTable tbody").empty();
        $("#statisticsTable tbody").append(
            '<tr><td>Arithmetic Mean</td><td>' + summary.arithmeticMean + '</td></tr>\
                    <tr><td>Geometric Mean</td><td>' + summary.geometricMean + '</td></tr>\
                    <tr><td>Maximum</td><td>' + summary.maximum + '</td></tr>\
                    <tr><td>Minimum</td><td>' + summary.minimum + '</td></tr>\
                    <tr><td>Standard Deviation</td><td>' + summary.standardDeviation + '</td></tr>\
                    <tr><td>10%</td><td>' + summary.quantile10 + '</td></tr>\
                    <tr><td>25%</td><td>' + summary.quantile25 + '</td></tr>\
                    <tr><td>Median, 50%</td><td>' + summary.median + '</td></tr>\
                    <tr><td>75%</td><td>' + summary.quantile75 + '</td></tr>\
                    <tr><td>90%</td><td>' + summary.quantile90 + '</td></tr>\
                    <tr><td>Number of Observations</td><td>' + summary.observations + '</td></tr>'
        );
    }

    function getDatasetsAfterFilters() {
        var minDate = new Date(8640000000000000);
        var maxDate = new Date(-8640000000000000);
        var datasets = _(self.plottedSeries).pluck('dataset');
        var noDataValues = _(datasets).pluck('noDataValue');
        var parseDate = d3.time.format("%Y-%m-%dT%I:%M:%S").parse;

        for (var i = 0; i < datasets.length; i++) {
            // Filter no-data value
            datasets[i] = datasets[i].filter(function (d) {
                return (d.value != noDataValues[i]);
            });
            for (var j = 0; j < datasets[i].length; j++) {
                var parsedDate = parseDate(datasets[i][j]['date']);
                if (minDate.valueOf() > parsedDate.valueOf()) {
                    minDate = parsedDate;
                }
                if (maxDate.valueOf() < parsedDate.valueOf()) {
                    maxDate = parsedDate;
                }
            }
        }

        // Update minimum and maximum dates on the date pickers
        self.dateFirst = $('#dpd1').datepicker({
            onRender: function (date) {
                return (date.valueOf() > maxDate.valueOf() || date.valueOf() < minDate.valueOf()) ? 'disabled' : '';    // disable dates with no records
            }
        }).on('click', function () {
            self.dateLast.hide();
        }).on('changeDate', function (ev) {
            self.dateFirst.hide();
            //$('#dpd2')[0].focus();
        }).data('datepicker');

        self.dateLast = $('#dpd2').datepicker({
            onRender: function (date) {
                return (date.valueOf() > maxDate.valueOf() || date.valueOf() < minDate.valueOf()) ? 'disabled' : '';    // disable dates with no records
            }
        }).on('click', function () {
            self.dateFirst.hide();
        }).on('changeDate', function (ev) {
            self.dateLast.hide();
        }).data('datepicker');

        var nowTemp = new Date();
        var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

        // If no dates are set, display the last month. Display the whole set if it contains less than 500 data points.
        if (self.dateFirst.date.valueOf() == now.valueOf() && self.dateLast.date.valueOf() == now.valueOf()) {
            // Mark the button of last month interval
            $("#dateIntervals button").removeClass("active");
            $("#btnLastMonth").addClass("active");

            self.dateFirst.date = maxDate.setMonth(maxDate.getMonth() - 1);
            self.dateFirst.setValue(maxDate);

            self.dateLast.date = maxDate.setMonth(maxDate.getMonth() + 1);
            self.dateLast.setValue(maxDate);
        }

        // Update click events for the date interval buttons
        $("#btnLastWeek").click(function () {
            $("#dateIntervals button").removeClass("active");
            $(this).addClass("active");

            self.dateFirst.date = maxDate.setDate(maxDate.getDate() - 7);
            self.dateFirst.setValue(maxDate);

            self.dateLast.date = maxDate.setDate(maxDate.getDate() + 7);
            self.dateLast.setValue(maxDate);
        });
        $("#btnLastMonth").click(function () {
            $("#dateIntervals button").removeClass("active");
            $(this).addClass("active");

            self.dateFirst.date = maxDate.setMonth(maxDate.getMonth() - 1);
            self.dateFirst.setValue(maxDate);

            self.dateLast.date = maxDate.setMonth(maxDate.getMonth() + 1);
            self.dateLast.setValue(maxDate);
        });
        $("#btnAll").click(function () {
            $("#dateIntervals button").removeClass("active");
            $(this).addClass("active");

            self.dateFirst.date = minDate;
            self.dateFirst.setValue(minDate);

            self.dateLast.date = maxDate;
            self.dateLast.setValue(maxDate);
        });

        // Filter by dates if specified
        for (var i = 0; i < datasets.length; i++) {
            datasets[i] = datasets[i].filter(function (d) {
                return (parseDate(d.date).valueOf() >= self.dateFirst.date.valueOf() && parseDate(d.date).valueOf() <= self.dateLast.date.valueOf());
            });
        }
        return datasets;
    }

    function drawMultiseries() {
        self.clearGraph();

        var ui = require('ui');
        var varNames = _(self.plottedSeries).pluck('variablename');
        var siteNames = _(self.plottedSeries).pluck('sitename');
        var siteCodes = _(self.plottedSeries).pluck('sitecode');
        var varCodes = _(self.plottedSeries).pluck('variablecode');
        var varUnits = _(self.plottedSeries).pluck('variableunitsabbreviation');
        var datasets = getDatasetsAfterFilters();
        var parseDate = d3.time.format("%Y-%m-%dT%I:%M:%S").parse;
        var numOfYAxes = varNames.length;
        var qualityControlLevels = _(self.plottedSeries).pluck('qualitycontrolleveldefinition');

        // Iterate the datasets and see which ones share y-axes
        for (var i = 0; i < varNames.length; i++) {
            if (datasets[i].length == 0) {
                numOfYAxes--;
                continue;
            }
        }
        for (var i = 0; i < varNames.length - 1; i++) {
            for (var j = i + 1; j < varNames.length; j++) {
                if (varNames[i] == varNames[j] && varUnits[i] == varUnits[j] && datasets[i].length > 0) {
                    numOfYAxes--;
                    break;
                }
            }
        }

        var margin = {top: 20, right: 20, bottom: 100, left: 10},
            width = $("#graphContainer").width() + $("#leftPanel").width(),
            height = $("#graphContainer").height() - margin.top - margin.bottom,
            margin2 = {top: height + 63, right: margin.right, bottom: 20, left: margin.left},
            height2 = 30;

        var yAxisCount = 0;     // Counter to keep track of y-axises as we place them

        // Properties for the five vertical axises.
        // even: f(n) = n * 10
        // odd: f(n) = width - (n-1) * 10
        var axisProperties = [
            {xTranslate: 0, orient: "left", textdistance: -1},
            {xTranslate: width, orient: "right", textdistance: 1},
            {xTranslate: -65, orient: "left", textdistance: -1},
            {xTranslate: width + 65, orient: "right", textdistance: 1},
            {xTranslate: -130, orient: "left", textdistance: -1}
        ];

        var summary = calcSummaryStatistics(datasets);

        var data = _(datasets).flatten();

        // Restructure the data to use it in a time series
        data = data.map(function (d) {
            return {
                seriesID: +d.seriesID,
                date: parseDate(d['date']),
                val: parseFloat(+d['value'])
            };
        });

        // Then we need to nest the data on seriesID since we want to only draw one line per series
        data = d3.nest().key(function (d) {
            return d.seriesID;
        }).entries(data);

        var domain = [d3.min(data, function (d) {
            return d3.min(d.values, function (d) {
                return d.date;
            });
        }),
            d3.max(data, function (d) {
                return d3.max(d.values, function (d) {
                    return d.date;
                });
            })];

        var x = d3.time.scale()
            .domain(domain)
            .range([0, width])
            .nice(d3.time.day);

        var x2 = d3.time.scale()
            .domain(domain)
            .range([0, width])
            .nice(d3.time.day);

        var color = d3.scale.category10()
            .domain(d3.keys(data[0]).filter(function (key) {
                return key === "seriesID";
            }));

        var y = new Array(data.length);
        var y2 = new Array(data.length);
        var yAxis = new Array(data.length);
        var lines = new Array(data.length);
        var lines2 = new Array(data.length);

        var svg = d3.select("#graphContainer").append("svg")
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom);

        var focus = svg.append("g")
            .attr("class", "focus")
            .attr("width", $("#graphContainer").width() + $("#leftPanel").width())
            .attr("height", "100%");
        //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var context = svg.append("g")
            .attr("class", "context");

        var offset = 0;     // offset for the data array when a dataset is empty

        // Append legend
        for (var i = 0; i < self.plottedSeries.length; i++) {
            $("#legendContainer ul").append(
                '<li class="list-group-item" data-id="' + i + '">' +
                '<input type="checkbox" checked="" data-id="' + i + '">' +
                '<button class="close" data-seriesid=' + self.plottedSeries[i].seriesid + ' >&times;</button>' +
                '<font color=' + color(i) + '> ■ ' + '</font><span>' + varCodes[i] + ": " + varNames[i] + '</span>' +
                '<span class="caption">' + siteCodes[i] + ": " + siteNames[i] + '</span>' +
                '<span class="caption text-center">' + qualityControlLevels[i] + '</span></li>'
            );
        }

        // This loop builds and draws each time series
        for (var i = 0; i < datasets.length; i++) {
            // y-coordinate for the graph
            var domainMin = d3.min(data, function (d) {
                if (d.key == i) {
                    return d3.min(d.values, function (d) {
                        return d.val;
                    });
                }
            });

            var domainMax = d3.max(data, function (d) {
                if (d.key == i) {
                    return d3.max(d.values, function (d) {
                        return d.val;
                    });
                }
            });

            if (domainMin == domainMax) {
                var delta = (domainMin + 1) / 10;
                domainMin -= delta;
                domainMax += delta;
            }

            y[i] = d3.scale.linear()
                .domain([domainMin, domainMax])
                .range([height, 0]);

            // y-coordinate for the context view
            y2[i] = d3.scale.linear()
                .domain([domainMin, domainMax])
                .range([height2, 0]);

            yAxis[i] = d3.svg.axis()
                .scale(y[i])
            //.tickFormat(d3.format(".2f"))

            if (datasets[i].length == 0) {
                offset++;
                continue;
            }

            // ----------------------- OPTIMIZATION BEGINS -----------------------
            var index = i - offset;
            var date1 = data[index]["values"][0].date;
            var val1 = parseFloat(data[index]["values"][0].val);
            var dataCopy = [];
            var marginOfError = 2; // The margin of error in degree units

            dataCopy.push({val: val1, date: date1, seriesID: i})
            var points = [];
            points.push({x: x(date1), y: y[i](val1)});  // push in the first point

            for (var j = 2; j < data[index]["values"].length - 1; j++) {
                // Current point
                var date2 = data[index]["values"][j - 1].date;
                var val2 = parseFloat(data[index]["values"][j - 1].val);
                var point2 = {x: x(date2), y: y[i](val2)};

                // Last inserted
                var point1 = {x: points[points.length - 1].x - point2.x, y: points[points.length - 1].y - point2.y};

                // Next point
                var date3 = data[index]["values"][j].date;
                var val3 = data[index]["values"][j].val;
                var point3 = {x: (x(date3) - point2.x), y: (y[i](val3) - point2.y)};

                var dotProduct = (point1.x * point3.x + point1.y * point3.y);
                var divisor = ((Math.sqrt(Math.pow(point1.x, 2) + Math.pow(point1.y, 2))) * (Math.sqrt(Math.pow(point3.x, 2) + Math.pow(point3.y, 2))));

                // Angle between two vectors
                var angle = Math.acos(dotProduct / divisor) * (180 / Math.PI);

                if (!(angle > 180 - marginOfError && angle < 180 + marginOfError)) {
                    dataCopy.push({val: val2, date: date2, seriesID: i});
                    points.push(point2);
                }
            }

            // insert last value
            date1 = data[index]["values"][data[index]["values"].length - 1].date;
            val1 = parseFloat(data[index]["values"][data[index]["values"].length - 1].val);

            dataCopy.push({val: val1, date: date1, seriesID: i})
            data[index]["values"] = dataCopy;   // Replace with new and optimized array

            // Show message with number of data points
            /* $("#graphArea .alert").remove();
             $("#graphArea").prepend(
                 '<div class="alert alert-info alert-dismissable">\
                   <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>\
                   <strong></strong>' + "Number of data points: " + dataCopy.length +
                 '</div>'
             );*/
            // ----------------------- OPTIMIZATION ENDS -----------------------

            // Append y-axis
            var chosenYAxes = [i];

            // Check if this axis will be shared with another variable
            for (var j = 0; j < i; j++) {
                if (i != j && varNames[i] == varNames[j] && varUnits[i] == varUnits[j]) {
                    chosenYAxes.push(j);
                }
            }

            if (chosenYAxes.length > 1) {
                var usedAxis = Math.min.apply(null, chosenYAxes);   // select the first axis created for this variable
                var domain = [Infinity, -Infinity];

                domain = [Math.min(domain[0], d3.min(data, function (d) {
                    if (jQuery.inArray(parseInt(d.key), chosenYAxes) != -1) {
                        return d3.min(d.values, function (d) {
                            return d.val;
                        });
                    }
                })), Math.max(domain[1], d3.max(data, function (d) {
                    if (jQuery.inArray(parseInt(d.key), chosenYAxes) != -1) {
                        return d3.max(d.values, function (d) {
                            return d.val;
                        });
                    }
                }))];

                // update previous axis and use it
                y[i] = d3.scale.linear()
                    .domain(domain)
                    .range([height, 0]);

                // y-coordinate for the context view
                y2[i] = d3.scale.linear()
                    .domain(domain)
                    .range([height2, 0]);

                $(".y.axis[data-id='" + usedAxis + "']").attr("style", "fill: #000");
                focus.select(".y.axis[data-id='" + usedAxis + "']").call(yAxis[usedAxis]);

                lines[i] = d3.svg.line()
                    .x(function (d) {
                        return x(d.date);
                    })
                    .y(
                        function (d) {
                            return y[d.seriesID](d.val);
                        });

                lines2[i] = d3.svg.line()
                //.interpolate("basis")
                    .x(function (d) {
                        return x2(d.date);
                    })
                    .y(
                        function (d) {
                            return y2[d.seriesID](d.val);
                        });
            }
            else {
                // Create a new axis
                yAxis[i].orient(axisProperties[yAxisCount].orient);
                var text = focus.append("g")
                    .attr("class", "y axis")
                    .attr("data-id", i)
                    .attr("id", "yAxis-" + yAxisCount)
                    .style("fill", color(i))
                    .attr("transform", "translate(" + (axisProperties[yAxisCount].xTranslate) + " ,0)")
                    .call(yAxis[i])
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .style("text-anchor", "end")
                    .style("font-size", "14px")
                    .attr("dy", ".71em")
                    .text(varNames[i] + " (" + varUnits[i] + ")");

                var axisHeight = $(".y.axis[data-id=" + 0 + "]")[0].getBBox().height;
                var textHeight = $(".y.axis[data-id='" + i + "'] > text").width();

                // the width() method does not work in Firefox for elements inside an svg. Must calculate it
                var browser = ui.getBrowserName;
                if (browser.substring(0, 7) == "Firefox" || browser.substr(0, 2) == "IE") {
                    textHeight = $(".y.axis[data-id='" + i + "'] > text").text().length * 6.5;
                }
                text.attr("x", -(axisHeight - textHeight) / 2);
                text.attr("y", (getAxisSeparation(i) + 22) * axisProperties[yAxisCount].textdistance);
                yAxisCount++;

                lines[i] = d3.svg.line()
                    .x(function (d) {
                        return x(d.date);
                    })
                    .y(function (d) {
                        return y[d.seriesID](d.val);
                    });

                lines2[i] = d3.svg.line()
                //.interpolate("basis")
                    .x(function (d) {
                        return x2(d.date);
                    })
                    .y(
                        function (d) {
                            return y2[d.seriesID](d.val);
                        });

                // Update the axis properties
                if (yAxisCount - 1 == 0) {
                    axisProperties[2].xTranslate = -$("#yAxis-" + 0)[0].getBBox().width;
                    margin.left += $("#yAxis-" + 0)[0].getBBox().width;
                }
                else if (yAxisCount - 1 == 1) {
                    axisProperties[3].xTranslate = axisProperties[1].xTranslate + $("#yAxis-" + 1)[0].getBBox().width;
                    margin.right += $("#yAxis-" + 1)[0].getBBox().width;
                }
                else if (yAxisCount - 1 == 2) {
                    axisProperties[4].xTranslate = axisProperties[2].xTranslate - $("#yAxis-" + 2)[0].getBBox().width;
                    margin.left += $("#yAxis-" + 2)[0].getBBox().width;
                }
                else if (yAxisCount - 1 == 3) {
                    margin.right += $("#yAxis-" + 3)[0].getBBox().width;
                }
                else if (yAxisCount - 1 == 4) {
                    margin.left += $("#yAxis-" + 4)[0].getBBox().width;
                }

                focus.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("width", $("#graphContainer").width() - margin.left - margin.right);
            }

            // If the graph contains less than 2 data points, append circles
            if (data[i].values.length < 2) {
                focus.selectAll("circle.line")
                    .data(data[i]['values'])
                    .enter().append("svg:circle")
                    .attr("class", "line")
                    .style("fill", color(i))
                    .attr("cx", lines[i].x())
                    .attr("cy", lines[i].y())
                    .attr("r", 3.5);

                context.selectAll("circle.line")
                    .data(data[i]['values'])
                    .enter().append("svg:circle")
                    .attr("class", "line")
                    .style("fill", color(i))
                    .attr("cx", lines2[i].x())
                    .attr("cy", lines2[i].y())
                    .attr("r", 3.5);
            }
        }

        // Append x axis
        width = $("#graphContainer").width() - margin.left - margin.right;

        axisProperties[1].xTranslate = width;
        axisProperties[3].xTranslate = width + 65;

        context.attr("transform", "translate(" + margin.left + "," + margin2.top + ")");

        d3.select("#yAxis-1").attr("transform", "translate(" + (axisProperties[1].xTranslate) + " ,0)");
        d3.select("#yAxis-3").attr("transform", "translate(" + (axisProperties[3].xTranslate) + " ,0)");

        x.range([0, width]);
        x2.range([0, width]);


        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(Math.max(1, (width - data.length * 51) / 60))      // Don't even...
            .orient("bottom");

        var xAxis2 = d3.svg.axis()
            .scale(x2)
            .ticks(Math.max(1, (width - data.length * 51) / 60))
            .orient("bottom");

        focus.append("g")
            .attr("class", "x axis")
            //.attr("width", width  - margin.left - margin.right)
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)
            .append("text")
            .style("text-anchor", "end")
            .attr("x", width / 2)
            .attr("y", 35)
            .text("Date");

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height2) + ")")
            .call(xAxis2);

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);


        $('#legendContainer input[type="checkbox"]').click(function () {
            var that = this;
            var path = $("#path" + that.getAttribute("data-id"));

            if (that.checked) {
                path.show();
            }
            else {
                path.hide();
            }
        });

        // Bind unplot button event
        $('#legendContainer').find('button.close').click(function () {
            var id = +this.dataset['seriesid'];
            self.unplotSeries(id);
        });

        var seriesID = focus.selectAll(".seriesID")
            .data(data, function (d) {
                return d.key;
            })
            .enter().append("g")
            .attr("id", function (d) {
                return "path" + d.key;
            })
            .attr("data-id", function (d) {
                return d.key;
            })
            .attr("class", "seriesID");

        var seriesID2 = context.selectAll(".seriesID2")
            .data(data, function (d) {
                return d.key;
            })
            .enter().append("g")
            .attr("data-id", function (d) {
                return d.key;
            })
            .attr("class", "seriesID2");

        var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed);

        context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);

        function paintGridAxis(id) {
            var gridAxis = d3.svg.axis()
                .scale(y[id])
                .orient("left")
                .tickSize(-width, 0, 0)
                .tickFormat("");

            focus.insert("g", ":first-child")
                .attr("class", "grid")
                .style({'stroke': 'lightgray', 'stroke-width': '1.5px'})
                .call(gridAxis);
        }

        function onPathClick() {
            var id = 0;
            var varName = varNames[this.parentElement.getAttribute("data-id")];
            var varUnit = varUnits[this.parentElement.getAttribute("data-id")];
            for (var x = 0; x < varNames.length; x++) {
                if (varName == varNames[x] && varUnit == varUnits[x]) {
                    id = x;
                    break;
                }
            }

            var flag = true;
            ".y.axis[data-id=" + 0 + "]"
            d3.select(this.parentElement).moveToFront();
            d3.selectAll(".y.axis[data-id='" + id + "'] .domain," + ".y.axis[data-id='" + id + "'] .domain .tick line").attr("stroke-width", 2.5);

            if (this.parentElement.getAttribute("opacity") == "0.4") {
                focus.selectAll(".seriesID").attr("opacity", "0.4");
            }
            else {
                var paths = focus.selectAll(".seriesID")[0];

                if (paths.length > 1) {
                    paths.forEach(function (path) {
                        if (path.getAttribute("opacity") == "0.4") {
                            path.setAttribute("opacity", "1");
                            flag = false;
                        }
                        else {
                            path.setAttribute("opacity", "0.4");
                        }
                    });
                }
                else {
                    if (focus.selectAll(".grid")[0].length) {
                        // d3.selectAll(".grid").remove();
                        d3.selectAll(".domain, .tick line").attr("stroke-width", 1);
                        flag = false;
                    }
                    else {
                        d3.selectAll(".y.axis[data-id='" + id + "'] .domain," + ".y.axis[data-id='" + id + "'] .domain .tick line").attr("stroke-width", 2.5);
                        // paintGridAxis(id);
                    }
                }
            }

            this.parentElement.setAttribute("opacity", "1");
            // d3.selectAll(".grid").remove();
            d3.selectAll(".domain, .tick line").attr("stroke-width", 1);

            if (flag) {
                d3.selectAll(".y.axis[data-id='" + id + "'] .domain," + ".y.axis[data-id='" + id + "'] .domain .tick line").attr("stroke-width", 2.5);
                // paintGridAxis(id);
            }
            else {
                d3.selectAll(".domain, .tick line").attr("stroke-width", 1);
            }

            $('#legendContainer .list-group-item').removeClass("highlight");
            $('#legendContainer .list-group-item[data-id="' + this.parentElement.getAttribute("data-id") + '"]').addClass("highlight");
            setSummaryStatistics(summary[id]);
        }

        seriesID.append("path")
            .attr("class", "line")
            .style("stroke-width", 1.5)
            .on("click", onPathClick)
            .attr("d", function (d) {
                return lines[d.key](d.values);
            })
            .style("stroke", function (d) {
                    return color(d.key);
                }
            );

        seriesID2.append("path")
            .attr("class", "line")
            .style("stroke-width", 1.5)
            .attr("d", function (d) {
                return lines2[d.key](d.values);
            })
            .style("stroke", function (d) {
                    return color(d.key);
                }
            );

        // Set the first summary statistics by default
        setSummaryStatistics(summary[0]);
        // Make the first row bold
        $('#legendContainer .list-group-item').removeClass("highlight");
        $('#legendContainer .list-group-item[data-id="0"]').addClass("highlight");

        // Highlight the first path
        var path = d3.select("#path0 > g");
        path.each(onPathClick);

        $('#legendContainer .list-group-item').click(function (e) {
            if (e.target.nodeName.toLowerCase() == 'input' || e.target.nodeName.toLowerCase() == 'button') {
                return;
            }

            var id = this.getAttribute("data-id");

            if (this.className != "list-group-item") {
                var path = d3.select("#path" + id + " path");
                path.each(onPathClick);
            }

            if (this.className == "list-group-item") {
                $('#legendContainer .list-group-item').removeClass("highlight");
                // d3.selectAll(".grid").remove();
                d3.selectAll(".domain, .tick line").attr("stroke-width", 1);
                d3.selectAll(".seriesID").attr("opacity", "1");
                this.className = "list-group-item highlight";

                // Set summary statistics
                setSummaryStatistics(summary[id]);
            }
        });

        function brushed() {
            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.selectAll(".seriesID")
                .selectAll("path")
                .attr("d", function (d) {
                    return lines[d.key](d.values);
                });

            focus.select(".x.axis").call(xAxis);
        }
    }

    function drawHistogram() {
        self.clearGraph();
        var varNames = _(self.plottedSeries).pluck('variablename');
        var siteNames = _(self.plottedSeries).pluck('sitename');
        var siteCodes = _(self.plottedSeries).pluck('sitecode');
        var varCodes = _(self.plottedSeries).pluck('variablecode');
        var qualityControlLevels = _(self.plottedSeries).pluck('qualitycontrolleveldefinition');
        var varUnits = _(self.plottedSeries).pluck('variableunitsabbreviation');
        var datasets = getDatasetsAfterFilters();
        var summary = calcSummaryStatistics(datasets);
        var values = _(datasets).map(function (dataset) {
            return _.pluck(dataset, 'value');
        });
        var numOfDatasets = values.length;
        var colors = d3.scale.category10();
        var margin = {top: 8, right: 30, bottom: 60, left: 80},
            width = $("#graphContainer").width() - margin.left - margin.right,
            height = $("#graphContainer").height();
        var numOfEmptyDatasets = 0;

        for (var i = 0; i < numOfDatasets; i++) {
            if (values[i].length == 0) {
                numOfEmptyDatasets++;
            }
        }

        var numOfTicks = 20 / (numOfDatasets - numOfEmptyDatasets);                // Number of divisions for columns
        var graphHeight = ($("#graphContainer").height() / (Math.max(numOfDatasets - numOfEmptyDatasets, 1))) - margin.bottom - margin.top;

        var graphs = [];

        for (var i = 0; i < numOfDatasets; i++) {
            var formatCount = d3.format(",.0f");
            var domainMin = Math.min.apply(Math, values[i]);
            var domainMax = Math.max.apply(Math, values[i]);

            var graph = {x: null, y: null, xAxis: null, numberOfBins: 20, yAxis: null, svg: null, data: null}

            // Append legend
            $("#legendContainer ul").append(
                '<li class="list-group-item" data-id="' + i + '">' +
                '<button class="close" data-seriesid=' + self.plottedSeries[i].seriesid + ' >&times;</button>' +
                '<font color=' + colors(i) + '> ■ ' + '</font><span>' + varCodes[i] + ": " + varNames[i] + '</span>' +
                '<span class="caption">' + siteCodes[i] + ": " + siteNames[i] + '</span>' +
                '<span class="caption text-center">' + qualityControlLevels[i] + '</span></li>'
            );

            // Bind unplot button event
            $('#legendContainer').find('button.close').click(function () {
                var id = +this.dataset['seriesid'];
                self.unplotSeries(id);
            });

            // If the dataset is empty, skip to the next one
            if (values[i].length == 0) {
                continue;
            }

            // domain can't be closed on a single value
            if (domainMin == domainMax) {
                if (domainMin == 0) {
                    domainMax = 1;
                }
                else {
                    domainMax += domainMin / 10;
                }
            }

            graph.x = d3.scale.linear()
                .domain([domainMin, domainMax])
                .range([0, width]);

            var ticks = graph.x.ticks(20);
            var ticksDelta = ticks[1] - ticks[0];

            ticks.unshift(ticks[0] - (ticksDelta));
            ticks.push(ticks[ticks.length - 1] + ticksDelta);

            for (var x = 0; x < ticks.length; x++) {
                ticks[x] = parseFloat(ticks[x].toFixed(2))
            }

            graph.x = d3.scale.linear()
                .domain([ticks[0], ticks[ticks.length - 1]])
                .range([0, width]);

            // Generate a histogram using uniformly-spaced bins.
            graph.data = d3.layout.histogram()
                .bins(ticks)
                (values[i]);

            graph.y = d3.scale.linear()
                .domain([0, d3.max(graph.data, function (d) {
                    return d.y;
                })])
                .range([graphHeight, 0]);

            graph.xAxis = d3.svg.axis()
                .scale(graph.x)
                .tickValues(ticks)
                .tickFormat(d3.format(""))
                .orient("bottom");

            graph.yAxis = d3.svg.axis()
                .ticks(numOfTicks)
                .scale(graph.y)
                .orient("left");

            graph.svg = d3.select("#graphContainer").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("id", "graph-" + i)
                .attr("data-id", i)
                .attr("height", graphHeight + margin.bottom + margin.top)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var bar = graph.svg.selectAll(".bar")
                .data(graph.data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d) {
                    return "translate(" + graph.x(d.x) + "," + graph.y(d.y) + ")";
                });

            // TODO: IMPLEMENT FLOATING DIV
            /*.on("mouseover", function(d) {
                var bar_width = parseInt($(this).attr("width"), 10);
                var x = parseInt($(this).attr("x"), 10) + bar_width / 2 + 5;
                var y = parseInt($(this).attr("y"), 10) - 20;
                div.transition().duration(200).style("opacity", 1);
                // include info you want to display here:
                div.html(formatCount(d.y) + "<br/>").style("left", x + "px").style("top", y + "px");
            }).on("mouseout", function(d) {
                div.transition().duration(500).style("opacity", 0);
            });
*/

            var rectWidth = 0;
            for (var x = 0; x < graph.data.length; x++) {
                if (graph.data[x].length != 0) {
                    rectWidth = graph.x(graph.data[x].dx + ticks[0]) - 2;
                    break;
                }
            }

            bar.append("rect")
                .attr("x", 1)
                .attr("width", rectWidth)
                .style("fill", colors(i))
                .attr("height", function (d) {
                    return graphHeight - graph.y(d.y);
                })
                .on("mouseover", onMouseOver(colors(i)))
                .on("mouseout", onMouseOut(colors(i)));

            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", function (d) {
                    if (graphHeight - graph.y(d.y) > 16) {
                        return 6;
                    }
                    else {
                        return -14;
                    }
                })
                .attr("x", rectWidth / 2)
                .attr("fill", function (d) {
                    if (graphHeight - graph.y(d.y) > 16) {
                        return "#fff";
                    }
                    else {
                        return "#000";
                    }
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    if (formatCount(d.y) != "0") {
                        return formatCount(d.y);
                    }
                });

            graph.svg.append("g")
                .attr("class", "x axis")
                .attr("id", "x-axis-" + i)
                .attr("transform", "translate(0," + graphHeight + ")")
                .call(graph.xAxis)
                .append("text")
                .attr("class", "x label")
                .attr("x", width / 2)
                .attr("y", margin.bottom - 25)
                .style("text-anchor", "middle")
                .text(varNames[i] + " (" + varUnits[i] + ")")

            graph.svg.append("g")
                .attr("class", "y axis")
                .attr("id", "y-axis-" + i)
                .call(graph.yAxis)
                .append("text")
                .attr("class", "y label")
                .attr("transform", "rotate(-90)")
                .attr("x", -(graphHeight + margin.bottom) / 2)
                .attr("y", -50)
                .text("Data points");

            // Draw grid lines
            var gridAxis = d3.svg.axis()
                .scale(graph.y)
                .orient("left")
                .tickSize(-width, 0, 0)
                .tickFormat("");

            //graph.svg.selectAll(".grid").remove();
            graph.svg.insert("g", ":first-child")
                .attr("class", "grid")
                .style({'stroke': 'lightgray', 'stroke-width': '1.5px'})
                .call(gridAxis);

            graphs.push(graph);

            // Scroll event
            $('#graph-' + i).on('mousewheel DOMMouseScroll', function (e) {
                var minTicks = 5;
                var maxTicks = 40;
                var i = e.currentTarget.getAttribute("data-id");
                var delta;

                var domainMax = Math.max.apply(Math, values[i]);
                var domainMin = Math.min.apply(Math, values[i]);

                graphs[i].x = d3.scale.linear()
                    .domain([domainMin, domainMax])
                    .range([0, width]);

                var binNumber = graphs[i].x.ticks(graphs[i].numberOfBins).length;

                if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail > 0) {
                    delta = 1;
                }
                else {
                    delta = -1
                }

                do {
                    graphs[i].x = d3.scale.linear()
                        .domain([domainMin, domainMax])
                        .range([0, width]);

                    graphs[i].numberOfBins += delta;

                    // Check for boundaries
                    graphs[i].numberOfBins = Math.max(graphs[i].numberOfBins, minTicks);
                    graphs[i].numberOfBins = Math.min(graphs[i].numberOfBins, maxTicks);

                    // If this input does not produce a different number of bins in the graph, skip to the next iteration
                    if (binNumber == graphs[i].x.ticks(graphs[i].numberOfBins).length) {
                        continue;
                    }

                    var ticks = graphs[i].x.ticks(graphs[i].numberOfBins);
                    var ticksDelta = ticks[1] - ticks[0];

                    ticks.unshift(ticks[0] - ticksDelta);
                    ticks.push(ticks[ticks.length - 1] + ticksDelta);

                    // Format the ticks to prevent a big chain of 0s
                    for (var x = 0; x < ticks.length; x++) {
                        ticks[x] = parseFloat(ticks[x].toFixed(2))
                    }

                    graphs[i].x = d3.scale.linear()
                        .domain([ticks[0], ticks[ticks.length - 1]])
                        .range([0, width]);
                    graphs[i].data = d3.layout.histogram()
                        .bins(ticks)(values[i]);

                    graphs[i].y.domain([0, d3.max(graphs[i].data, function (d) {
                        return d.y;
                    })]);

                    // Bind new axis properties
                    graphs[i].xAxis.tickValues(ticks);
                    graphs[i].xAxis.tickFormat(d3.format(""));  // Empty format so it doesn't use its default format which rounds the numbers
                    graphs[i].xAxis.scale(graphs[i].x);
                    graphs[i].yAxis.scale(graphs[i].y);

                    // Call axes
                    d3.select("#x-axis-" + i).call(graphs[i].xAxis);
                    d3.select("#y-axis-" + i).call(graphs[i].yAxis);

                    // Draw new grid lines
                    var gridAxis = d3.svg.axis()
                        .scale(graphs[i].y)
                        .orient("left")
                        .tickSize(-width, 0, 0)
                        .tickFormat("")
                        .ticks(numOfTicks);

                    graphs[i].svg.selectAll(".grid").remove();
                    graphs[i].svg.insert("g", ":first-child")
                        .attr("class", "grid")
                        .style({'stroke': 'lightgray', 'stroke-width': '1.5px'})
                        .call(gridAxis);

                    // Append new graph
                    graphs[i].svg.selectAll(".bar").remove();

                    var bar = graphs[i].svg.selectAll(".bar")
                        .data(graphs[i].data)
                        .enter().append("g")
                        .attr("class", "bar")
                        .attr("transform", function (d) {
                            return "translate(" + graphs[i].x(d.x) + "," + graphs[i].y(d.y) + ")";
                        });

                    var rectWidth = 0;
                    for (var x = 0; x < graphs[i].data.length; x++) {
                        if (graphs[i].data[x].length != 0) {
                            rectWidth = graphs[i].x(graphs[i].data[x].dx + ticks[0]) - 2;
                            break;
                        }
                    }

                    bar.append("rect")
                        .attr("x", 1)
                        .attr("width", rectWidth)
                        .style("fill", colors(i))
                        .attr("height", function (d) {
                            return graphHeight - graphs[i].y(d.y);
                        })
                        .on("mouseover", onMouseOver(colors(i)))
                        .on("mouseout", onMouseOut(colors(i)));

                    bar.append("text")
                        .attr("dy", ".75em")
                        .attr("x", rectWidth / 2)
                        .attr("y", function (d) {
                            if (graphHeight - graphs[i].y(d.y) > 16) {
                                return 6;
                            }
                            else {
                                return -14;
                            }
                        })
                        .attr("text-anchor", "middle")
                        .attr("fill", function (d) {
                            if (graphHeight - graphs[i].y(d.y) > 16) {
                                return "#fff";
                            }
                            else {
                                return "#000";
                            }
                        })
                        .text(function (d) {
                            if (formatCount(d.y) != "0") {
                                return formatCount(d.y);
                            }
                        });
                }
                while (binNumber == graphs[i].x.ticks(graphs[i].numberOfBins).length && graphs[i].numberOfBins > minTicks && graphs[i].numberOfBins < maxTicks);
            });
        }


        setSummaryStatistics(summary[0]);                                               // Set the first summary statistics by default

        $('#legendContainer .list-group-item').removeClass("highlight");                // Highlight the first row
        $('#legendContainer .list-group-item[data-id="0"]').addClass("highlight");

        $('#legendContainer .list-group-item').click(function (e) {
            if (e.target.nodeName.toLowerCase() == 'input' || e.target.nodeName.toLowerCase() == 'button') {
                return;
            }
            var that = this;

            var id = that.getAttribute("data-id");
            if (that.className == "list-group-item") {
                $('#legendContainer .list-group-item').removeClass("highlight");
                this.className = "list-group-item highlight"

                // Set summary statistics
                setSummaryStatistics(summary[id]);
            }
        });
    }

    function drawBoxPlot() {
        var ui = require('ui');
        var varNames = _(self.plottedSeries).pluck('variablename');
        var siteNames = _(self.plottedSeries).pluck('sitename');
        var siteCodes = _(self.plottedSeries).pluck('sitecode');
        var varCodes = _(self.plottedSeries).pluck('variablecode');
        var varUnits = _(self.plottedSeries).pluck('variableunitsabbreviation');
        var qualityControlLevels = _(self.plottedSeries).pluck('qualitycontrolleveldefinition');
        var observations = getDatasetsAfterFilters()
        var summary = calcSummaryStatistics(observations);

        observations = observations.map(function (dataset) {
            return _.pluck(dataset, 'value');
        });

        // properties for the box plots
        var margin = {top: 10, right: 0, bottom: 30, left: 0},
            width = 30,
            height = ($("#graphContainer").height()) / Math.ceil(varNames.length / 3) - margin.top - margin.bottom;

        var boxContainerWidth = $("#graphContainer").width() / 3 - 30;

        var colors = d3.scale.category10();
        var data = [];
        var charts = [];

        if (self.boxWhiskerSvgs.length == 0) {
            self.clearGraph();
        }
        if ($(".focus").length > 0 || $(".bar").length) {
            self.clearGraph();
            self.boxWhiskerSvgs = [];
        }

        // The x-axis
        var x = d3.time.scale()
            .domain([0, 1])
            .range([0, 180])
            .nice(d3.time.day);

        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(0)
            .orient("bottom");

        for (var i = 0; i < observations.length; i++) {
            data[0] = observations[i];

            if (data[0].length == 0) {   // This will prevent the plugin from throwing errors when dealing with empty sets
                data[0][0] = 0;
            }

            var min = Infinity,
                max = -Infinity;

            for (var j = 0; j < data[0].length; j++) {
                data[0][j] = parseFloat(data[0][j]);
                if (data[0][j] > max) {
                    max = data[0][j];
                }
                if (data[0][j] < min) {
                    min = data[0][j]
                }
            }

            min = min - (max - min) / 20;   //  Add a last tick so that the box doesn't appear right on top of the x-axis

            // The y-axis
            var y = d3.scale.linear()
                .domain([min, max])
                .range([height, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            charts[i] = d3.box()
                .whiskers(iqr(1.5))
                .width(width)
                .height(height);

            if (min == Infinity || max == -Infinity) {
                min = 1;
                max = 1;
            }
            var text;
            charts[i].domain([min, max]);
            if (self.boxWhiskerSvgs[i] != null) {
                // update domain
                charts[i].domain([min, max]);

                // call the new y-axis
                self.boxWhiskerSvgs[i].datum(data[0]).call(charts[i].duration(1000));
                self.boxWhiskerSvgs[i].select("g").call(yAxis);

                text = $("svg[data-id='" + i + "'] .yAxisLabel");
            }
            else {
                self.boxWhiskerSvgs[i] = d3.select("#graphContainer").append("svg")
                    .data(data)
                    .attr("class", "box")
                    .attr("data-id", i)
                    .append("g")
                    .attr("transform", "translate(" + ((boxContainerWidth) / 2) + "," + margin.top + ")")
                    .call(charts[i]);

                // Inline width does not work in IE.
                $(".box[data-id=" + i + "]").css("width", boxContainerWidth + "px");

                // Draw y-axis
                text = self.boxWhiskerSvgs[i].append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("class", "yAxisLabel")
                    .attr("y", -$("svg[data-id='" + i + "'] .tick:last text").width() - 26)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .style("font-size", "14px")
                    .text(varNames[i] + " (" + varUnits[i] + ")");

                // Draw x-axis
                self.boxWhiskerSvgs[i].append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(" + (-$("svg[data-id='" + i + "'] text.box").width() - 40) + "," + height + ")")
                    .call(xAxis)
                    .append("text")
                    .style("text-anchor", "end")
                    .attr("x", 105)
                    .attr("y", 15)
                    .text("Overall");

                // Append legend
                $("#legendContainer ul").append(
                    '<li class="list-group-item" data-id="' + i + '">' +
                    '<button class="close" data-seriesid=' + self.plottedSeries[i].seriesid + ' >&times;</button>' +
                    '<font color=' + colors(i) + '> ■ ' + '</font><span>' + varCodes[i] + ": " + varNames[i] + '</span>' +
                    '<span class="caption">' + siteCodes[i] + ": " + siteNames[i] + '</span>' +
                    '<span class="caption text-center">' + qualityControlLevels[i] + '</span></li>'
                );

                // Bind unplot button event
                $('#legendContainer').find('button.close').click(function () {
                    var id = +this.dataset['seriesid'];
                    $('#legendContainer ul').empty();
                    self.boxWhiskerSvgs.length = 0;
                    self.unplotSeries(id);
                });
            }

            var axisHeight = height;
            var textHeight = $("svg[data-id=" + i + "] .yAxisLabel").width();
            var textWidth = $("svg[data-id='" + i + "'] .tick:last text").width();
            var tickWidth = $("svg[data-id='" + i + "'] text.box").width();

            // Reposition y-axis label
            // the width() method does not work in Firefox for elements inside an svg. Must calculate it
            var browser = ui.getBrowserName;
            if (browser.substring(0, 7) == "Firefox" || browser.substr(0, 2) == "IE") {
                textHeight = $("svg[data-id=" + i + "] .yAxisLabel").text().length * 7;
                textWidth = $("svg[data-id='" + i + "'] .tick:last text").text().length * 7;
                tickWidth = $("svg[data-id='" + i + "'] text.box")[0].textContent.length * 7;
            }

            // Reposition x-axis
            $("svg[data-id='" + i + "'] .x.axis").attr("transform", "translate(" + (-tickWidth - 40) + "," + height + ")");

            // Reposition y-axis
            $("svg[data-id='" + i + "'] .y.axis").attr("transform", "translate(" + (-tickWidth - 40) + "," + (0) + ")");

            text.attr("x", -(axisHeight - textHeight) / 2);
            text.attr("y", -textWidth - 26)

            // Update size
            self.boxWhiskerSvgs[i].attr("height", height);
            var browser = ui.getBrowserName;
            if (browser.substr(0, 2) == "IE") {
                $(self.boxWhiskerSvgs[i][0][0].parentNode).css("height", height + margin.bottom + margin.top + "px");
            }
            else {
                self.boxWhiskerSvgs[i][0][0].parentElement.setAttribute("height", height + margin.bottom + margin.top);
            }

            $("svg").css("margin-left", margin.left + "px");
            $("svg[data-id='" + i + "'] rect").css("fill", colors(i));
        }

        // Set the first summary statistics by default
        setSummaryStatistics(summary[0]);
        // Highlight the first row
        $('#legendContainer .list-group-item').removeClass("highlight");
        $('#legendContainer .list-group-item[data-id="0"]').addClass("highlight");

        $('#legendContainer .list-group-item').click(function (e) {
            if (e.target.nodeName.toLowerCase() == 'input' || e.target.nodeName.toLowerCase() == 'button') {
                return;
            }
            var that = this;

            var id = that.getAttribute("data-id");
            if (that.className == "list-group-item") {
                $('#legendContainer .list-group-item').removeClass("highlight");
                this.className = "list-group-item highlight"

                // Set summary statistics
                setSummaryStatistics(summary[id]);
            }
        });

        // Returns a function to compute the interquartile range.
        function iqr(k) {
            return function (d, i) {
                var q1 = d.quartiles[0],
                    q3 = d.quartiles[2],
                    iqr = (q3 - q1) * k,
                    i = -1,
                    j = d.length;
                while (d[++i] < q1 - iqr) ;
                while (d[--j] > q3 + iqr) ;
                return [i, j];
            };
        }
    }

    return self;
});
