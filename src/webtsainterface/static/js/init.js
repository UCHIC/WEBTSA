jQuery(document).ready(function ($) {
    var map;
    var markers = [];
    var filters = {
        "divisions": [
            {
                "id": "Network",
                "title": "Network"
            },
            {
                "id": "Site",
                "title": "Site"
            },
            {
                "id": "VariableCategory",
                "title": "Variable Category"
            },
            {
                "id": "VariableName",
                "title": "Variable Name"
            },
            {
                "id": "ControlLevel",
                "title": "Quality Control Level"
            }
        ]
    };
    var datasets;
    var margin = { top: 0, right: 20, bottom: 120, left: 50 },
        width = $("#visualizationContent").width() - margin.left - margin.right,
        height = $("#visualizationContent").height() - margin.top - margin.bottom;

    function getURLParameter(name) {
        return decodeURI(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
        );
    }

    // Load filter categories
    function loadFilterCategories() {
        // Build left panel filters from JSON
        filters.divisions.forEach(function (entry){
            $("#leftPanel").append(
                "<div class='panel panel-default'>\
                    <div class='panel-heading'>\
                        <h4 class='panel-title'>\
                            <a data-toggle='collapse' class='accordion-toggle' data-parent='#accordion' href='#" + entry.id + "'> " + entry.title + "</a>\
                        </h4>\
                    </div>\
                    <div id='" + entry.id + "' class='panel-collapse collapse in'>\
                        <div class='panel-body'>\
                            <div class='list-group'>\
                                <ul class='list-group inputs-group'>\
                                    <div class='ring'></div>\
                                </ul>\
                            </div>\
                        </div>\
                    </div>\
                </div>");
        });
    }

    function removeMarker(marker) {
        (function animationStep() {
            //Converting GPS to World Coordinates
            var newPosition = map.getProjection().fromLatLngToPoint(marker.getPosition());

            //Moving 10px to up
            newPosition.y -= 10 / (1 << map.getZoom());

            //Converting World Coordinates to GPS
            newPosition = map.getProjection().fromPointToLatLng(newPosition);
            //updating maker's position
            marker.setPosition(newPosition);
            //Checking whether marker is out of bounds
            if (map.getBounds().getNorthEast().lat() < newPosition.lat()) {
                marker.setMap(null);
            } else {
                //Repeating animation step
                setTimeout(animationStep, 6);
            }
        })();
    }

    // Add a marker to the map
    function addMarker(entry) {
        var location = new google.maps.LatLng(entry.latitude, entry.longitude);
        marker = new google.maps.Marker({
            position: location,
            map: map,
            animation: google.maps.Animation.DROP,
            site: entry
        });
        markers.push(marker);
    }

    // Initialize map canvas
    function initialize() {
        var map_canvas = document.getElementById('map_canvas');
        var map_options = {
            center: new google.maps.LatLng(40.760744, -111.816903),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        }
        map = new google.maps.Map(map_canvas, map_options);
    }

    function loadDatasets(datasets){
        // Populate datasets container
        $("#datasetsTable thead").append(
            '<tr>\
              <th><input type="checkbox"></th>\
              <th>Site Code</th>\
              <th>Variable</th>\
              <th>Quality Control Level</th>\
              <th></th>\
            </tr>');
        for (var i = 0; i < datasets.length; i++) {
            $("#datasetsTable tbody").append(
                '<tr>\
                   <td><input type="checkbox"></td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].sitecode + '</td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].variablename + '</td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].qualitycontrolleveldefinition + '</td>\
                </tr>');
        }
    }

    /* Data Visualization */
    function drawTimeSeries() {
        var parseDate = d3.time.format("%d-%b-%y").parse;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function (d) {
                return x(d.date);
            })
            .y(function (d) {
                return y(d.close);
            });

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.tsv("/static/files/data.tsv", function (error, data) {
            data.forEach(function (d) {
                d.date = parseDate(d.date);
                d.close = +d.close;
            });

            x.domain(d3.extent(data, function (d) {
                return d.date;
            }));
            y.domain(d3.extent(data, function (d) {
                return d.close;
            }));

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("pH ");

            svg.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", line);
        });
    }

    function drawHistogram() {
        /* Initialize Histogram*/
        // Generate an Irwin–Hall distribution of 10 random variables.
        //var values = d3.range(1000).map(d3.random.irwinHall(10));

        var values = new Array(1,2,3, 5, 5, 6, 7, 2);   // populate this array like this
        // A formatter for counts.
        var formatCount = d3.format(",.0f");

        var x = d3.scale.linear()
            .domain([0, 10])
            .range([0, width]);


        // Generate a histogram using twenty uniformly-spaced bins.
        var data = d3.layout.histogram()
            .bins(x.ticks(20))
            (values);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function (d) {
                return d.y;
            })])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var bar = svg.selectAll(".bar")
            .data(data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function (d) {
                return "translate(" + x(d.x) + "," + y(d.y) + ")";
            });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function (d) {
                return height - y(d.y);
            });

        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) / 2)
            .attr("text-anchor", "middle")
            .text(function (d) {
                return formatCount(d.y);
            });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    }

    function drawScatterPlot(data2) {
        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.category10();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.tsv("/static/files/scatterplot.tsv", function (error, data) {
            console.log(data2);
            console.log(data);
            data.forEach(function (d) {
                d.sepalLength = +d.sepalLength;
                d.sepalWidth = +d.sepalWidth;
            });

            x.domain(d3.extent(data, function (d) {
                return d.sepalWidth;
            })).nice();
            y.domain(d3.extent(data, function (d) {
                return d.sepalLength;
            })).nice();

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text("Sepal Width (cm)");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Sepal Length (cm)")

            svg.selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("r", 3.5)
                .attr("cx", function (d) {
                    return x(d.sepalWidth);
                })
                .attr("cy", function (d) {
                    return y(d.sepalLength);
                })
                .style("fill", function (d) {
                    return color(d.species);
                });

            var legend = svg.selectAll(".legend")
                .data(color.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) {
                    return "translate(0," + i * 20 + ")";
                });

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) {
                    return d;
                });

        });
    }

    function drawMultiSeries(data2) {
        var parseDate = d3.time.format("%Y%m%d").parse;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.category10();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .interpolate("basis")
            .x(function (d) {
                return x(d.date);
            })
            .y(function (d) {
                return y(d.temperature);
            });

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.tsv("/static/files/multiseries.tsv", function (error, data) {
            console.log(data2);
            //console.log(data[0]);

            color.domain(d3.keys(data2[0]).filter(function (key) {
                return key !== "date";
            }));

            data2.forEach(function (d) {
                d.date = parseDate(d.date);
            });

            var cities = color.domain().map(function (name) {
                return {
                    name: name,
                    values: data2.map(function (d) {
                        return { date: d.date, temperature: +d[name] };
                    })
                };
            });

            x.domain(d3.extent(data2, function (d) {
                return d.date;
            }));

            y.domain([
                d3.min(cities, function (c) {
                    return d3.min(c.values, function (v) {
                        return v.temperature;
                    });
                }),
                d3.max(cities, function (c) {
                    return d3.max(c.values, function (v) {
                        return v.temperature;
                    });
                })
            ]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Some scale");

            var city = svg.selectAll(".city")
                .data(cities)
                .enter().append("g")
                .attr("class", "city");

            city.append("path")
                .attr("class", "line")
                .attr("d", function (d) {
                    return line(d.values);
                })
                .style("stroke", function (d) {
                    return color(d.name);
                });

            city.append("text")
                .datum(function (d) {
                    return { name: d.name, value: d.values[d.values.length - 1] };
                })
                .attr("transform", function (d) {
                    return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
                })
                .attr("x", 3)
                .attr("dy", ".35em")
                .text(function (d) {
                    return d.name;
                });
            });
    }

    function drawAreaChart(data2) {
        var parseDate = d3.time.format("%Y%m%d").parse;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var area = d3.svg.area()
            .x(function (d) {
                return x(d.date);
            })
            .y0(function (d) {
                return y(d.low);
            })
            .y1(function (d) {
                return y(d.high);
            });

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.tsv("/static/files/areachart.tsv", function (error, data) {
            console.log(data2);
            console.log(data);
            data.forEach(function (d) {
                d.date = parseDate(d.date);
                d.low = +d.low;
                d.high = +d.high;
            });

            x.domain(d3.extent(data, function (d) {
                return d.date;
            }));
            y.domain([d3.min(data, function (d) {
                return d.low;
            }), d3.max(data, function (d) {
                return d.high;
            })]);

            svg.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Temperature (ºF)");
        });
    }

    function drawMultiHistogram() {
        var n = 5, // number of layers
            m = 20, // number of samples per layer

            stack = d3.layout.stack(),
            layers = stack(d3.range(n).map(function () {
                return bumpLayer(m, .1);
            })),
            yGroupMax = d3.max(layers, function (layer) {
                return d3.max(layer, function (d) {
                    return d.y;
                });
            }),
            yStackMax = d3.max(layers, function (layer) {
                return d3.max(layer, function (d) {
                    return d.y0 + d.y;
                });
            });


        var x = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangeRoundBands([0, width], .08);

        var y = d3.scale.linear()
            .domain([0, yStackMax])
            .range([height, 0]);

        var color = d3.scale.linear()
            .domain([0, n - 1])
            .range(["#aad", "#556"]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickSize(0)
            .tickPadding(6)
            .orient("bottom");

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var layer = svg.selectAll(".layer")
            .data(layers)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function (d, i) {
                return color(i);
            });

        var rect = layer.selectAll("rect")
            .data(function (d) {
                return d;
            })
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.x);
            })
            .attr("y", height)
            .attr("width", x.rangeBand())
            .attr("height", 0);

        rect.transition()
            .delay(function (d, i) {
                return i * 10;
            })
            .attr("y", function (d) {
                return y(d.y0 + d.y);
            })
            .attr("height", function (d) {
                return y(d.y0) - y(d.y0 + d.y);
            });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        d3.selectAll("input").on("change", change);

        var timeout = setTimeout(function () {
            d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
        }, 2000);

        function change() {
            clearTimeout(timeout);
            if (this.value === "grouped") transitionGrouped();
            else transitionStacked();
        }

        function transitionGrouped() {
            y.domain([0, yGroupMax]);

            rect.transition()
                .duration(500)
                .delay(function (d, i) {
                    return i * 10;
                })
                .attr("x", function (d, i, j) {
                    return x(d.x) + x.rangeBand() / n * j;
                })
                .attr("width", x.rangeBand() / n)
                .transition()
                .attr("y", function (d) {
                    return y(d.y);
                })
                .attr("height", function (d) {
                    return height - y(d.y);
                });
        }

        function transitionStacked() {
            y.domain([0, yStackMax]);

            rect.transition()
                .duration(500)
                .delay(function (d, i) {
                    return i * 10;
                })
                .attr("y", function (d) {
                    return y(d.y0 + d.y);
                })
                .attr("height", function (d) {
                    return y(d.y0) - y(d.y0 + d.y);
                })
                .transition()
                .attr("x", function (d) {
                    return x(d.x);
                })
                .attr("width", x.rangeBand());
        }

        // Inspired by Lee Byron's test data generator.
        function bumpLayer(n, o) {

            function bump(a) {
                var x = 1 / (.1 + Math.random()),
                    y = 2 * Math.random() - .5,
                    z = 10 / (.1 + Math.random());
                for (var i = 0; i < n; i++) {
                    var w = (i / n - y) * z;
                    a[i] += x * Math.exp(-w * w);
                }
            }

            var a = [], i;
            for (i = 0; i < n; ++i) a[i] = o + o * Math.random();
            for (i = 0; i < 5; ++i) bump(a);
            return a.map(function (d, i) {
                return { x: i, y: Math.max(0, d) };
            });
        }
    }

    function drawMultiBarChart() {

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .rangeRound([height, 0]);

        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(d3.format(".2s"));

        var svg = d3.select(".graphContainer").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.csv("/static/files/multibarchart.csv", function (error, data) {
            color.domain(d3.keys(data[0]).filter(function (key) {
                return key !== "State";
            }));

            data.forEach(function (d) {
                var y0 = 0;
                d.ages = color.domain().map(function (name) {
                    return { name: name, y0: y0, y1: y0 += +d[name] };
                });
                d.total = d.ages[d.ages.length - 1].y1;
            });

            data.sort(function (a, b) {
                return b.total - a.total;
            });

            x.domain(data.map(function (d) {
                return d.State;
            }));
            y.domain([0, d3.max(data, function (d) {
                return d.total;
            })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Population");

            var state = svg.selectAll(".state")
                .data(data)
                .enter().append("g")
                .attr("class", "g")
                .attr("transform", function (d) {
                    return "translate(" + x(d.State) + ",0)";
                });

            state.selectAll("rect")
                .data(function (d) {
                    return d.ages;
                })
                .enter().append("rect")
                .attr("width", x.rangeBand())
                .attr("y", function (d) {
                    return y(d.y1);
                })
                .attr("height", function (d) {
                    return y(d.y0) - y(d.y1);
                })
                .style("fill", function (d) {
                    return color(d.name);
                });

            var legend = svg.selectAll(".legend")
                .data(color.domain().slice().reverse())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) {
                    return "translate(0," + i * 20 + ")";
                });

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) {
                    return d;
                });
        });
    }

    loadFilterCategories();



    $.getJSON( "/api/v1/dataseries", function( data ){
        datasets = data['objects'];

        var sites = new Array();
        var networks = new Array();
        var varcategories = new Array();
        var varnames = new Array();
        var qualitycontrols = new Array();
        //console.log(datasets[1]);
        for (var i = 0; i < datasets.length; i++){

            // Load Networks
            if (networks[datasets[i].sourcedataserviceid] == null){
                networks[datasets[i].sourcedataserviceid] = 1;
                $('#Network ul').append('<li class="list-group-item">' +
                '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                '<input type="checkbox" checked  data-network="' +
                datasets[i].sourcedataserviceid + '" value="' + datasets[i].sourcedataserviceid + '"> ' + "Network " +  datasets[i].sourcedataserviceid + '</label></li>');
            }
            else{
                networks[datasets[i].sourcedataserviceid]++;
            }
            // Load Sites
            if (sites[datasets[i].sitecode] == null){
                sites[datasets[i].sitecode] = 1;
                $('#Site ul').append('<li class="list-group-item">' +
                '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                '<input type="checkbox" checked  data-network="' +
                datasets[i].sourcedataserviceid + '" value="' + datasets[i].sitecode + '"> ' + datasets[i].sitename + '</label></li>');
                addMarker(datasets[i]);
            }
            else{
                sites[datasets[i].sitecode]++;
            }
            // Load Variable Names
            if(varnames[datasets[i].variablecode] == null){
                varnames[datasets[i].variablecode] = 1;
                $('#VariableName ul').append('<li class="list-group-item">' +
                '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                '<input type="checkbox" checked " value="' + datasets[i].variablecode + '"> ' + datasets[i].variablename + '</label></li>');
            }
            else{
                varnames[datasets[i].variablecode]++;
            }
            // Load Quality Control Levels
            if(qualitycontrols[datasets[i].qualitycontrollevelcode] == null){
                qualitycontrols[datasets[i].qualitycontrollevelcode] = 1;
                $('#ControlLevel ul').append('<li class="list-group-item">' +
                '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                '<input type="checkbox" checked " value="' + datasets[i].qualitycontrollevelcode + '"> ' + datasets[i].qualitycontrolleveldefinition + '</label></li>');
            }
            else{
                qualitycontrols[datasets[i].qualitycontrollevelcode]++;
            }
            // Load Variable Categories
            if(varcategories[datasets[i].generalcategory] == null){
               varcategories[datasets[i].generalcategory] = 1;
                $('#VariableCategory ul').append('<li class="list-group-item">' +
                '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                '<input type="checkbox" checked " value="' + datasets[i].generalcategory + '"> ' + datasets[i].generalcategory + '</label></li>');
            }
            else{
                varcategories[datasets[i].generalcategory]++;
            }
        }

        //console.log(datasets[0]);

        /* ---------------Load badges--------------------------*/
        for (var i = 0; i < $("#Network .badge").length; i++){
            $("#Network .badge")[i].innerHTML = networks[i + 1];
        }

        var mySites = $("#Site input[type='checkbox']");
        for (var i = 0; i < mySites.length; i++){
            var index = mySites[i].getAttribute("value");
            $("#Site input[value='"+ index +"']").closest("li").children(".badge")[0].innerHTML = sites[index];
        }

        var myCategories = $("#VariableCategory input[type='checkbox']");
        for (var i = 0; i < myCategories.length; i++){
            var index = myCategories[i].getAttribute("value");
            $("#VariableCategory input[value='"+ index +"']").closest("li").children(".badge")[0].innerHTML = varcategories[index];
        }

        var myVarNames = $("#VariableName input[type='checkbox']");
        for (var i = 0; i < myVarNames.length; i++){
            var index = myVarNames[i].getAttribute("value");
            $("#VariableName input[value='"+ index +"']").closest("li").children(".badge")[0].innerHTML = varnames[index];
        }

        var myControlLevels = $("#ControlLevel input[type='checkbox']");
        for (var i = 0; i < qualitycontrols.length; i++){
            var index = myControlLevels[i].getAttribute("value");
            $("#ControlLevel input[value='"+ index +"']").closest("li").children(".badge")[0].innerHTML = qualitycontrols[index];
        }

        // Bind Click Events
        $('#Network input[type="checkbox"]').click(function(){
            var that = this;
            sites = new Array();    // array to keep track of sites with markers displayed
            var sites = $('#Site input[data-network="' + that.value + '"]');
            if (that.checked) {
                datasets.forEach(function (entry) {            // Load markers from JSON
                    if (entry.sourcedataserviceid == that.value && sites[entry.sitecode] == null){
                        var site = $('#Site input[value="' + entry.sitecode + '"]');
                        if (site[0] != null) {                      // Check that the element exists, just in case
                            if (site[0].checked == false) {
                                addMarker(entry);
                                sites[entry.sitecode] = 1;          // Marker is placed
                            }
                        }
                    }
                });
                for (var i = 0; i < sites.length; i++) {            // Check site's checkbox
                    sites[i].checked = true;
                }
            }
            else {
                for (var i = 0; i < markers.length; i++) {          //delete markers from this network
                    if (markers[i].site.sourcedataserviceid == that.value) {
                        //markers[i].setMap(null);
                        removeMarker(markers[i]);
                        markers.splice(i, 1);
                        i--;                                        // because we removed one marker
                    }
                }
                for (var i = 0; i < sites.length; i++) {            // Uncheck corresponding sites
                    sites[i].checked = false;
                }
            }
            // console.log(markers);
        });

        $('#Site input[type="checkbox"]').click(function () {
            var that = this;
            if (that.checked) {
                var i = 1;
                datasets.forEach(function (entry) {                 // Create marker for this site
                    if (entry.sitecode == that.value) {
                        addMarker(entry);
                        // check the network's checkbox
                        var network = $('#Network input[value="' + that.getAttribute('data-network') + '"]')[0].checked = true;
                    }
                });
            }
            else {
                for (var i = 0; i < markers.length; i++) {          //delete marker for this site
                    if (markers[i].site.sitecode == that.value) {
                        removeMarker(markers[i]);

                        markers.splice(i, 1);
                        i--;                                        // because we removed one marker

                        var checkedSites = $('#Site input[data-network="' + that.getAttribute('data-network') + '"]:checked');  // Get corresponding marked checkboxes
                        if (checkedSites.length == 0) {
                            var network = $('#Network input[value="' + that.getAttribute('data-network') + '"]')[0].checked = false;
                        }
                    }
                }
            }
        });

        $('#VariableName input[type="checkbox"]').click(function () {
            var that = this;
            if (that.checked) {

            }
            else {

            }
        });

        $('#ControlLevel input[type="checkbox"]').click(function () {
            var that = this;
            if (that.checked) {

            }
            else {

            }
        });

        // Load datasets
        loadDatasets(datasets);

        // Loading ends, Remove spinners
        $('.ring').remove();

        // PRUEBA DE LA VAINA DE VISUALIZACION
        console.log(datasets);
        $.ajax(datasets[0].getdataurl).done(function(data){
            var series = data.getElementsByTagName("value");
            var datas = new Array();
            for (var i = 0; i < series.length; i++){
                var obj = {
                    value: series[i].innerHTML,
                    date: series[i].getAttribute('dateTime').substr(0,10).replace("-", "").replace("-", "") //remove the 2 dashes
                };
                datas.push(obj);
            }
            drawMultiSeries(datas);
            //drawScatterPlot(datas);
        });
    });

    google.maps.event.addDomListener(window, 'load', initialize);

        // -----------------  Click Events ----------------------

    // Run Date Picker plugin
    $('.datepicker').datepicker();

    // Load view
    var tab = getURLParameter("view");
    if (tab == "datasets") {
        $("#datasetsTab").addClass("active");
        $("#datasetsContent").addClass("active");
    }
    else if (tab == "visualization") {
        $("#visualizationTab").addClass("active");
        $("#visualizationContent").addClass("active");
    }
    else {
        $("#mapTab").addClass("active");
        $("#mapContent").addClass("active");
    }

    //default each row to visible
  $('tbody tr').addClass('visible');
        //filter results based on query
    function filter(selector, query) {
      query =   $.trim(query); //trim white space
      query = query.replace(/ /gi, '|'); //add OR for regex query

      $(selector).each(function() {
        ($(this).text().search(new RegExp(query, "i")) < 0) ? $(this).hide().removeClass('visible') : $(this).show().addClass('visible');
      });
    }

  $('#txtSearch').keyup(function(event) {
    //if esc is pressed or nothing is entered
    if (event.keyCode == 27 || $(this).val() == '') {
      //if esc is pressed we want to clear the value of search box
      $(this).val('');

      //we want each row to be visible because if nothing
      //is entered then all rows are matched.
      $('tbody tr').removeClass('visible').show().addClass('visible');
    }

    //if there is text, lets filter
    else {
      filter('tbody tr', $(this).val());
    }
  });

});

