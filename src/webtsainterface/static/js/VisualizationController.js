/**
 * Created by Juan on 4/6/14.
 */

TsaApplication.VisualizationController = (function (self) {
    self.plottingMethods = { addPlot: {}, newPlot: {} };
    self.plotTypes = { histogram: drawHistogram, multiseries: drawMultiseries, box: drawBoxPlot };
    self.currentPlot = self.plotTypes.multiseries;
    self.plottedSeries = [];

    var plotDataReady = jQuery.Event("plotdataready");
    var plotDataLoading = jQuery.Event("plotdataloading");
    var plotStarted = jQuery.Event("plotstarted");
    var plotFinished = jQuery.Event("plotfinished");

    self.prepareSeries = function(series, method) {
        if (method === self.plottingMethods.addPlot && self.plottedSeries.length >= 5) {
            //TODO: TsaApplication.UiHelper.showMessage('tiene que quitar un series');
            return;
        } else if (method === self.plottingMethods.newPlot) {
            self.plottedSeries.length = 0;
        } //TODO: also check if method is not a plotting method and return.

        var loadedData = 0;
        self.plottedSeries.push(series);
        $(document).trigger(plotDataLoading);

        self.plottedSeries.forEach(function(dataseries) {
            dataseries.loadDataset(function() {
                if (++loadedData >= self.plottedSeries.length) {
                    $(document).trigger(plotDataReady);
                }
            });
        });
    };

    self.plotSeries = function() {
        if (self.plottedSeries.length === 0) {
            return;
        }

        $(document).trigger(plotStarted);

        $("#graphContainer").empty();
        $("#legendContainer").find("ul").empty();

        self.currentPlot();


        /*$("#dpd1").datepicker('setValue', _.min(
            _(self.plottedSeries)
                .pluck('begindatetime')
                .map(function(date){return new Date(date)}))
        );
        $("#dpd2").datepicker('setValue', _.max(
            _(self.plottedSeries)
                .pluck('enddatetime')
                .map(function(date){return new Date(date)}))
        );*/

        $(document).trigger(plotFinished);
        $("#panelRight").show();
    };

    $(window).resize(_.debounce(function(){
        self.plotSeries();
    }, 500));

    function calcSummaryStatistics(data){
        var summary = [];

        for (var i = 0; i < data.length; i++){
             summary[i] = {
                maximum:-Infinity,
                minimum:Infinity,
                arithmeticMean: 0,
                geometricSum:0,
                geometricMean:0,
                deviationSum:0,
                standardDeviation:0,
                coefficientOfVariation:0,
                count: 0,
                sum: 0
            };
        }

        for (var i = 0; i < data.length; i++){
            for (var j=0; j < data[i].length; j++){
                var dv = parseFloat(data[i][j].value);
                // update max value
                if (summary[i].maximum < dv){
                    summary[i].maximum = dv.toFixed(2);
                }

                // update min value
                if (summary[i].minimum > dv){
                    summary[i].minimum = dv.toFixed(2);
                }

                // update count
                summary[i].count++;

                // update sum
                summary[i].sum += dv;

                // update geometric sum (we'll use it to calculate the geometric mean)
                if (dv != 0)
                    summary[i].geometricSum += Math.log(Math.abs(dv));

            }

            summary[i].arithmeticMean = (summary[i].sum / summary[i].count).toFixed(2);
            summary[i].geometricMean = (Math.pow(2, (summary[i].geometricSum / summary[i].count))).toFixed(2);

            for (var j = 0; j < data[i].length; j++){
                var dv = data[i][j].value;
                summary[i].deviationSum += Math.pow(dv - summary[i].arithmeticMean, 2);
            }
            summary[i].standardDeviation = (Math.pow(summary[i].deviationSum / summary[i].count, (1 / 2))).toFixed(2);
            summary[i].coefficientOfVariation = (summary[i].standardDeviation / summary[i].arithmeticMean).toFixed(2);

        }

        return summary;
    }

    function getDatasetsAfterFilters(){
        var minDate = new Date(8640000000000000);
        var maxDate = new Date(-8640000000000000);
        var datasets = _(self.plottedSeries).pluck('dataset');
        var noDataValues = _(datasets).pluck('noDataValue');
        var parseDate = d3.time.format("%Y-%m-%dT%I:%M:%S").parse;
        // -------------- FILTERS BEGIN --------------------------
        // Filter no-data value
        for (var i = 0; i < datasets.length;i++){
            datasets[i] = datasets[i].filter(function (d) {
                return (d.value != noDataValues[i]);
            });
        }

        for (var i = 0; i < datasets.length; i++) {
            for (var j = 0; j < datasets[i].length; j++){
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
        var dateFirst = $('#dpd1').datepicker({
            onRender: function (date) {
                return (date.valueOf() > maxDate.valueOf() || date.valueOf() < minDate.valueOf()) ? 'disabled' : '';
            }
        }).on('click', function(){
            dateLast.hide();
        })
            .on('changeDate',function (ev) {
            if (ev.date.valueOf() < dateLast.date.valueOf()) {
                var newDate = new Date(ev.date)
                newDate.setDate(newDate.getDate() + 1);
                dateLast.setValue(newDate);
            }
            dateFirst.hide();
            $('#dpd2')[0].focus();
        }).data('datepicker');

        var dateLast = $('#dpd2').datepicker({
            onRender: function (date) {
                return (date.valueOf() > maxDate.valueOf() || date.valueOf() < minDate.valueOf()) ? 'disabled' : '';
            }
        }).on('click', function(){
            dateFirst.hide();
        }).on('changeDate',function (ev) {
            dateLast.hide();
        }).data('datepicker');


        var nowTemp = new Date();
        var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

        // If no dates are set, display the whole thing
        if (dateFirst.date.valueOf() == now.valueOf() && dateLast.date.valueOf() == now.valueOf()) {
            dateFirst.date = minDate;
            dateLast.date = maxDate;
        }

        // Filter by dates if specified
        for (var i = 0; i < datasets.length; i++){
            datasets[i] = datasets[i].filter(function (d) {
                return (parseDate(d.date).valueOf() >= dateFirst.date.valueOf() && parseDate(d.date).valueOf() <= dateLast.date.valueOf());
            });
        }

        return datasets;
        // -------------- FILTERS END --------------------------
    }

    function setSummaryStatistics(summary){
        // Load statistics for the first dataset by default
        $("#statisticsTable tbody").empty();
        $("#statisticsTable tbody").append(
            '<tr><td>Arithmetic Mean</td><td>' + summary.arithmeticMean + '</td></tr>\
                    <tr><td>Geometric Mean</td><td>'+ summary.geometricMean + '</td></tr>\
                    <tr><td>Maximum</td><td>' + summary.maximum + '</td></tr>\
                    <tr><td>Minimum</td><td>' + summary.minimum + '</td></tr>\
                    <tr><td>Standard Deviation</td><td>' + summary.standardDeviation + '</td></tr>\
                    <tr><td>Coefficient of Variation</td><td>'+ summary.coefficientOfVariation +'</td></tr>  '
        );
    }

    function drawMultiseries() {
        var varnames = _(self.plottedSeries).pluck('variablename');
        var varUnits = _(self.plottedSeries).pluck('variableunitsabbreviation');
        var datasets = getDatasetsAfterFilters();

        var parseDate = d3.time.format("%Y-%m-%dT%I:%M:%S").parse;
        var axisMargin = 60;
        var margin = {top: 20, right: 10 + (Math.floor(varnames.length / 2)) * axisMargin, bottom: 60, left: (Math.ceil(varnames.length / 2)) * axisMargin},
            width = $("#graphContainer").width() - margin.left - margin.right,
            height = $("#graphContainer").height() - margin.top - margin.bottom;
        // even: f(n) = n * 10
        // odd: f(n) = width - (n-1) * 10
        var axisProperties = [
            {xTranslate: 0, orient: "left", textdistance: -50},
            {xTranslate: width, orient: "right", textdistance: 50},
            {xTranslate: -65, orient: "left", textdistance: -50},
            {xTranslate: width + 65, orient: "right", textdistance: 50},
            {xTranslate: -130, orient: "left", textdistance: -50}
        ];
        var data = _(datasets).flatten();

        var summary = calcSummaryStatistics(datasets);



        data = data.map(function (d) {
            return {
                seriesID: +d.seriesID,
                date: parseDate(d['date']),
                val: +d['value'] };
        });

        // then we need to nest the data on seriesID since we want to only draw one
        // line per seriesID
        data = d3.nest().key(function (d) {
            return d.seriesID;
        }).entries(data);

        var x = d3.time.scale()
            .domain([d3.min(data, function (d) {
                return d3.min(d.values, function (d) {
                    return d.date;
                });
            }),
                d3.max(data, function (d) {
                    return d3.max(d.values, function (d) {
                        return d.date;
                    });
                })])
            .range([0, width])
            .nice(d3.time.day);

        var color = d3.scale.category10()
            .domain(d3.keys(data[0]).filter(function (key) {
                return key === "seriesID";
            }));

        var y = new Array(data.length);
        var yAxis = new Array(data.length);
        var lines = new Array(data.length);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var svg = d3.select("#graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "x axis")
            //.attr("width", width  - margin.left - margin.right)
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)
        .append("text")
          .style("text-anchor", "end")
          .attr("x", width/2)
          .attr("y", 35)
          .text("Date");;

        // This loop builds and draws each time series
        for (var i = 0; i < data.length; i++) {
            y[i] = d3.scale.linear()
                .domain([d3.min(data, function (d) {
                    if (d.key == i) {
                        return d3.min(d.values, function (d) {
                            return d.val;
                        });
                    }
                }), d3.max(data, function (d) {
                    if (d.key == i) {
                        return d3.max(d.values, function (d) {
                            return d.val;
                        });
                    }
                })])
                .range([height, 0]);

            yAxis[i] = d3.svg.axis()
                .scale(y[i])
                .orient(axisProperties[i].orient);

            lines[i] = d3.svg.line()
                //.interpolate("basis")
                .x(function (d) {
                    return x(d.date);
                })
                .y(
                function (d) {
                    return y[d.seriesID](d.val);
                });

            svg.append("g")
                .attr("class", "y axis")
                .style("fill", color(i))
                .attr("transform", "translate(" + axisProperties[i].xTranslate + " ,0)")
                .call(yAxis[i])
            .append("text")
             .attr("transform", "rotate(-90)")
             .attr("y", axisProperties[i].textdistance)
             .attr("x", 5)
             .attr("dy", ".71em")
             .style("text-anchor", "end")
             .text(varnames[i] + " (" +  varUnits[i] + ")");

            $("#legendContainer ul").append(
                '<li class="list-group-item">' +
                    '<input type="checkbox" checked="" data-id="' + i + '">' +
                    '<font color=' + color(i) + '> ■ '  + '</font><span data-id="' + i + '">' + varnames[i] +
                    '</span></li>');
        }

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

        var seriesID = svg.selectAll(".seriesID")
            .data(data, function (d) {
                return d.key;
            })
            .enter().append("g")
            .attr("id", function (d) {
                return "path" + d.key;
            })
            .attr("class", "seriesID");

        function pathClickHandler (d){
             if(d3.select(this).style("stroke-width") == "2.5px"){
                   d3.select(this)
                    .style("stroke-width", 1.5);
                }
                else{
                    svg.selectAll(".line")
                    .style("stroke-width", 1.5)
                    d3.select(this)
                    .style("stroke-width", 2.5);
                }
        }

        seriesID.append("path")
            .attr("class", "line")
            .style("stroke-width", 1.5)
            .on("click", pathClickHandler)
            .attr("d", function (d) {
                return lines[d.key](d.values);
            })
            .style("stroke", function (d) {
                return color(d.key);
            }
        );

        setSummaryStatistics(summary[0]);
        $('#legendContainer span').click(function () {
            var that = this;
            var id = that.getAttribute("data-id");
            var path = d3.select("#path" + that.getAttribute("data-id") + " path");
            path.each(pathClickHandler);

            this.style.fontWeight = "bold";

            // Set summary statistics
            $("#statisticsTable tbody").empty();
            $("#statisticsTable tbody").append(
                '<tr><td>Arithmetic Mean</td><td>' + summary[id].arithmeticMean + '</td></tr>\
                        <tr><td>Geometric Mean</td><td>'+ summary[id].geometricMean + '</td></tr>\
                        <tr><td>Maximum</td><td>' + summary[id].maximum + '</td></tr>\
                        <tr><td>Minimum</td><td>' + summary[id].minimum + '</td></tr>\
                        <tr><td>Standard Deviation</td><td>' + summary[id].standardDeviation + '</td></tr>\
                        <tr><td>Coefficient of Variation</td><td>'+ summary[id].coefficientOfVariation +'</td></tr>  '
            );
        });
    }

    function drawHistogram() {
        /* Initialize Histogram*/
        var varnames = _.pluck(self.plottedSeries, 'variablename');
        var varUnits = _(self.plottedSeries).pluck('variableunitsabbreviation');
        var datasets = getDatasetsAfterFilters();

        var values = _(datasets).map(function(dataset) {
            return _.pluck(dataset, 'value');
        });

        var numOfDatasets = values.length;
        var numOfTicks = 20;                // Number of divisions for columns
        var colors = d3.scale.category10();

        var margin = {top: 10, right: 30, bottom: 60, left: 80},
            width = $("#graphContainer").width() - margin.left - margin.right,
            height = $("#graphContainer").height() - margin.bottom - margin.top;



        // A formatter for counts.
        for (var i = 0; i < numOfDatasets; i++) {
            var formatCount = d3.format(",.0f");
            var graphHeight = $("#graphContainer").height() / numOfDatasets - margin.bottom;
            var domainMin = Math.min.apply(Math, values[i]);
            var domainMax = Math.max.apply(Math, values[i]);

             $("#legendContainer ul").append(
            '<li class="list-group-item">' +
                '<font color=' + colors(i) + ' style="font-size: 22px; line-height: 1;"> ■ '  + '</font>' + varnames[i] +
                '</li>');

            var x = d3.scale.linear()
                .domain([domainMin, domainMax])
                .range([0, width]);

            // Generate a histogram using uniformly-spaced bins.
            var data = d3.layout.histogram()
                .bins(x.ticks(numOfTicks))
                (values[i]);

            var y = d3.scale.linear()
                .domain([0, d3.max(data, function (d) {return d.y;})])
                .range([graphHeight, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .ticks(25 / numOfDatasets)
                //.tickSize(-width, 0, 0)
                //.orient("right")
                .scale(y)
                .orient("left");

            var svg = d3.select("#graphContainer").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", graphHeight + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + ",0)");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d) {
                    return "translate(" + x(d.x) + "," + y(d.y) + ")";
                })
                .on("mouseover", function (d) {
                   d3.select(this).append("text")
                    .attr("dy", ".75em")
                    .attr("y", 0)
                    .attr("x", x(data[0].dx + domainMin) / 2)
                    .attr("text-anchor", "middle")
                    .text(function (d) {
                        return formatCount(d.y);
                    });
                })

                .on("mouseout", function (d) {
                   d3.select(this).select("text").remove();
                });

            // TODO: IMPLEMENT DIV
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
            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(data[0].dx + domainMin) - 1)
                .style("fill", colors(i))
                .style("opacity", 1)
                .attr("height", function (d) {
                        return graphHeight - y(d.y);
                });

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + graphHeight + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "x label")
                  .attr("x", width / 2)
                  .attr("y", margin.bottom - 25)
                  .style("text-anchor", "middle")
                  .text(varnames[i] + " (" + varUnits[i] + ")");

            svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
                .attr("class", "y label")
              .attr("transform", "rotate(-90)")
              .attr("x", -(graphHeight + margin.bottom) / 2)
              .attr("y", -50)
              .text("Data points");
        }
    }

    function drawBoxPlot(){
        var varnames = _.pluck(self.plottedSeries, 'variablename');
        var observations = _(_(self.plottedSeries).pluck('dataset')).map(function(dataset) {
            return _.pluck(dataset, 'value');
        });

        var colors = d3.scale.category10();
        for (var i = 0; i < observations.length; i++){

            var margin = {top: 10, right: 50, bottom: 20, left: 50},
            width = 120  - margin.left - margin.right,
            height = 500  - margin.top - margin.bottom;

             $("#legendContainer ul").append(
            '<li class="list-group-item"><label class="checkbox">' +
                '<font color=' + colors(i) + ' style="font-size: 22px; line-height: 1;"> ■ '  + '</font>' + varnames[i] +
                '</label></li>');

            var data = [];
            data[0] = observations[i];
            var min = Infinity,
                max = -Infinity;

            for (var j = 0; j < data[0].length; j++){
                data[0][j] = parseFloat(data[0][j]);
                if(data[0][j] > max){
                    max = data[0][j];
                }
                if (data[0][j] < min){
                    min = data[0][j]
                }
            }

            var chart = d3.box()
                .whiskers(iqr(1.5))
                .width(width)
                .height(height);

            chart.domain([min, max]);

              var svg = d3.select("#graphContainer").selectAll("svg")
                  .data(data)
                .enter().append("svg")
                  .attr("class", "box")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.bottom + margin.top)
                .append("g")
                  .attr("transform", "translate(" + (margin.left + i * width) + "," + margin.top + ")")
                  .call(chart);
         }

        // Returns a function to compute the interquartile range.
        function iqr(k) {
          return function(d, i) {
            var q1 = d.quartiles[0],
                q3 = d.quartiles[2],
                iqr = (q3 - q1) * k,
                i = -1,
                j = d.length;
            while (d[++i] < q1 - iqr);
            while (d[--j] > q3 + iqr);
            return [i, j];
          };
        }
    }

	return self;
}(TsaApplication.VisualizationController || {}));