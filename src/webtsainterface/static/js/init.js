var datasets;
var obsMultiSeries = [];
var varNames = [];
var obsHistogram = [];
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
var id;


function graphEnd() {
    $("#graphArea .ring").hide();
    $("#panel-right").show();
    //$("#graphContainer").show();
}

function graphStart() {
    $("#panel-right").hide();
    //$("#graphContainer").hide();
    $("#graphArea .ring").show();
}

function draw(url, type) {
    graphStart();
    var urls = [];
    var seriesID = 0;
    var point = 0;

    if (varNames.length == 0) {
        // Get all the urls from the dataset keys provided
        for (var i = 0; i < url.length; i++) {
            var newUrl = datasets[url[i]].getdataurl;
            urls.push(newUrl);
        }

        var done = urls.length; // jobs counter

        urls.forEach(function (entry) {
            $.ajax(entry, {async: true}).done(function (data) {
                var myID = seriesID;
                seriesID++;
                varNames[myID] = data.getElementsByTagName("variableName")[0].innerHTML;
                var series = data.getElementsByTagName("value");

                obsHistogram[myID] = [];
                for (var i = 0; i < series.length; i++) {
                    if (obsMultiSeries[point] == null) {
                        obsMultiSeries[point] = {};
                    }
                    // Array for multiseries
                    obsMultiSeries[point]['seriesID'] = myID;
                    obsMultiSeries[point]['value'] = series[i].innerHTML;
                    obsMultiSeries[point]['date'] = series[i].getAttribute('dateTime');
                    point++;
                    // Array for multihistogram
                    obsHistogram[myID].push(series[i].innerHTML);
                }
                done -= 1;
                if (done == 0) { // If all jobs done
                    if (type == "multiseries") {
                        drawMultiSeries(obsMultiSeries, varNames);
                    }
                    else if (type == "histogram") {
                        drawHistogram(obsHistogram, varNames);
                    }
                    else if (type = "boxplot"){
                        drawBoxPlot(obsHistogram, varNames);
                    }
                }
            });
        });
    }
    else {
        if (type == "multiseries") {
            drawMultiSeries(obsMultiSeries, varNames);
        }
        else if (type == "histogram") {
            drawHistogram(obsHistogram, varNames);
        }
        else if (type == "boxplot") {
            drawBoxPlot(obsHistogram, varNames);
        }
    }
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
    );
}

function drawMultiSeries(data, varnames) {
// first we need to corerce the data into the right formats
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

    var minDate = new Date(8640000000000000);
    var maxDate = new Date(-8640000000000000);

    for (var i = 0; i < data.length; i++) {
        var parsedDate = parseDate(data[i]['date']);
        if (minDate.valueOf() > parsedDate.valueOf()) {
            minDate = parsedDate;
        }
        if (maxDate.valueOf() < parsedDate.valueOf()) {
            maxDate = parsedDate;
        }
    }

    data = data.map(function (d) {
        return {
            seriesID: +d.seriesID,
            date: parseDate(d['date']),
            val: +d['value'] };
    });

    // Update minimum and maximum dates

    var dateFirst = $('#dpd1').datepicker({
        onRender: function (date) {
            return (date.valueOf() > maxDate.valueOf() || date.valueOf() < minDate.valueOf()) ? 'disabled' : '';
        }
    }).on('changeDate',function (ev) {
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
    data = data.filter(function (d) {
        return (d.date.valueOf() >= dateFirst.date.valueOf() && d.date.valueOf() <= dateLast.date.valueOf());
    })

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
         .text("variable");

        $("#legendContainer ul").append(
            '<li class="list-group-item">' +
                '<input type="checkbox" checked="" data-id="' + i + '">' +
                '<font color=' + color(i) + ' style="font-size: 22px; line-height: 1;"> ■ '  + '</font>' + varnames[i] +
                '</li>');
    }

    $('#panel-right input[type="checkbox"]').click(function () {
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

    seriesID.append("path")
        .attr("class", "line")
        .style("stroke-width", 1.5)
        .on("click", function (d) {
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
            this.parentNode.parentNode.appendChild(this.parentNode);
        })

        .attr("d", function (d) {
            return lines[d.key](d.values);
        })
        .style("stroke", function (d) {
            return color(d.key);
        });

    graphEnd();
}

function drawHistogram(values, varnames) {
    /* Initialize Histogram*/
    var minHeight = 15;                 // minimum height in pixels of a rectangle
    var textHeight = -8;                 // distance in pixels for the text from the top of the rectangle
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
              .style("text-anchor", "end")
              .text("VarName (Unit)");


        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 14)
          .style("text-anchor", "end")
          .text("Y Label");

    }
    graphEnd();
}

function drawBoxPlot(observations, varnames){
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
    graphEnd();
}

// Load filter categories
function loadFilterCategories() {
    // Build left panel filters from JSON
    filters.divisions.forEach(function (entry) {
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

function loadDatasets(datasets) {
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
               <td data-id="' + i + '"><input type="checkbox"></td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].sitecode + '</td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].variablename + '</td>\
                   <td data-toggle="modal" data-target="#InfoDialog">' + datasets[i].qualitycontrolleveldefinition + '</td>\
                </tr>');
    }
}


jQuery(document).ready(function ($) {
    loadFilterCategories();

    $.getJSON("/api/v1/dataseries", function (data) {
        datasets = data['objects'];
        //console.log(datasets[0])
        var sites = new Array();
        var networks = new Array();
        var varcategories = new Array();
        var varnames = new Array();
        var qualitycontrols = new Array();
        //console.log(datasets[1]);
        for (var i = 0; i < datasets.length; i++) {

            // Load Networks
            if (networks[datasets[i].sourcedataserviceid] == null) {
                networks[datasets[i].sourcedataserviceid] = 1;
                $('#Network ul').append('<li class="list-group-item">' +
                    '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                    '<input type="checkbox" checked  data-network="' +
                    datasets[i].sourcedataserviceid + '" value="' + datasets[i].sourcedataserviceid + '"> ' + "Network " + datasets[i].sourcedataserviceid + '</label></li>');
            }
            else {
                networks[datasets[i].sourcedataserviceid]++;
            }
            // Load Sites
            if (sites[datasets[i].sitecode] == null) {
                sites[datasets[i].sitecode] = 1;
                $('#Site ul').append('<li class="list-group-item">' +
                    '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                    '<input type="checkbox" checked  data-network="' +
                    datasets[i].sourcedataserviceid + '" value="' + datasets[i].sitecode + '"> ' + datasets[i].sitename + '</label></li>');
                addMarker(datasets[i]);
            }
            else {
                sites[datasets[i].sitecode]++;
            }
            // Load Variable Names
            if (varnames[datasets[i].variablecode] == null) {
                varnames[datasets[i].variablecode] = 1;
                $('#VariableName ul').append('<li class="list-group-item">' +
                    '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                    '<input type="checkbox" checked " value="' + datasets[i].variablecode + '"> ' + datasets[i].variablename + '</label></li>');
            }
            else {
                varnames[datasets[i].variablecode]++;
            }
            // Load Quality Control Levels
            if (qualitycontrols[datasets[i].qualitycontrollevelcode] == null) {
                qualitycontrols[datasets[i].qualitycontrollevelcode] = 1;
                $('#ControlLevel ul').append('<li class="list-group-item">' +
                    '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                    '<input type="checkbox" checked " value="' + datasets[i].qualitycontrollevelcode + '"> ' + datasets[i].qualitycontrolleveldefinition + '</label></li>');
            }
            else {
                qualitycontrols[datasets[i].qualitycontrollevelcode]++;
            }
            // Load Variable Categories
            if (varcategories[datasets[i].generalcategory] == null) {
                varcategories[datasets[i].generalcategory] = 1;
                $('#VariableCategory ul').append('<li class="list-group-item">' +
                    '<span class="badge">' + 0 + '</span><label class="checkbox">' +
                    '<input type="checkbox" checked " value="' + datasets[i].generalcategory + '"> ' + datasets[i].generalcategory + '</label></li>');
            }
            else {
                varcategories[datasets[i].generalcategory]++;
            }
        }

        /* ---------------Load badges--------------------------*/
        for (var i = 0; i < $("#Network .badge").length; i++) {
            $("#Network .badge")[i].innerHTML = networks[i + 1];
        }

        var mySites = $("#Site input[type='checkbox']");
        for (var i = 0; i < mySites.length; i++) {
            var index = mySites[i].getAttribute("value");
            $("#Site input[value='" + index + "']").closest("li").children(".badge")[0].innerHTML = sites[index];
        }

        var myCategories = $("#VariableCategory input[type='checkbox']");
        for (var i = 0; i < myCategories.length; i++) {
            var index = myCategories[i].getAttribute("value");
            $("#VariableCategory input[value='" + index + "']").closest("li").children(".badge")[0].innerHTML = varcategories[index];
        }

        var myVarNames = $("#VariableName input[type='checkbox']");
        for (var i = 0; i < myVarNames.length; i++) {
            var index = myVarNames[i].getAttribute("value");
            $("#VariableName input[value='" + index + "']").closest("li").children(".badge")[0].innerHTML = varnames[index];
        }

        var myControlLevels = $("#ControlLevel input[type='checkbox']");
        for (var i = 0; i < qualitycontrols.length; i++) {
            var index = myControlLevels[i].getAttribute("value");
            $("#ControlLevel input[value='" + index + "']").closest("li").children(".badge")[0].innerHTML = qualitycontrols[index];
        }

        // Bind Click Events
        $('#Network input[type="checkbox"]').click(function () {
            var that = this;
            sites = new Array();    // array to keep track of sites with markers displayed
            var sites = $('#Site input[data-network="' + that.value + '"]');
            if (that.checked) {
                datasets.forEach(function (entry) {            // Load markers from JSON
                    if (entry.sourcedataserviceid == that.value && sites[entry.sitecode] == null) {
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
        $('#leftPanel .ring').remove();
    });

    google.maps.event.addDomListener(window, 'load', initialize);

    // -----------------  Click Events ----------------------

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
        query = $.trim(query); //trim white space
        query = query.replace(/ /gi, '|'); //add OR for regex query

        $(selector).each(function () {
            ($(this).text().search(new RegExp(query, "i")) < 0) ? $(this).hide().removeClass('visible') : $(this).show().addClass('visible');
        });
    }

    $('#txtSearch').keyup(function (event) {
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

    var test = [6,7];

    $('#btnSetPlotOptions').click(function () {
        $("#graphContainer").empty();
        $("#legendContainer ul").empty();
        draw(test, "multiseries");
        $(window).resize(function() {
            clearTimeout(id);
            id = setTimeout(function doneResizing(){
            $("#graphContainer").empty();
            $("#legendContainer ul").empty();
                draw(test, "multiseries");
            }, 500);
         });
    });

    $('#btnTimeSeries').click(function () {
        $("#visualizationDropDown").text("Time Series ");
        $("#visualizationDropDown").append("<span class='caret'></span>");
        $("#graphContainer").empty();
        $("#legendContainer ul").empty();
        draw(test, "multiseries");
        $(window).resize(function() {
            clearTimeout(id);
            id = setTimeout(function doneResizing(){
            $("#graphContainer").empty();
            $("#legendContainer ul").empty();
                draw(test, "multiseries");
            }, 500);
        });
    });

    $('#btnHistogram').click(function () {
        $("#visualizationDropDown").text("Histogram ");
        $("#visualizationDropDown").append("<span class='caret'></span>");
        $("#graphContainer").empty();
        $("#legendContainer ul").empty();
        draw(test, "histogram");
        $(window).resize(function() {
            clearTimeout(id);
            id = setTimeout(function doneResizing(){
                $("#graphContainer").empty();
                $("#legendContainer ul").empty();
                draw(test, "histogram");
            }, 500);
         });
    });

    $('#btnBoxAndWhisker').click(function () {
        $("#visualizationDropDown").text("Box and Whisker ");
        $("#visualizationDropDown").append("<span class='caret'></span>");
        $("#graphContainer").empty();
        $("#legendContainer ul").empty();
        draw(test, "boxplot");
        $(window).resize(function() {
            clearTimeout(id);
            id = setTimeout(function doneResizing(){
                $("#graphContainer").empty();
                $("#legendContainer ul").empty();
                draw(test, "boxplot");
            }, 500);
         });
    });
});

