/**
 * Created by Juan on 4/6/14.
 */

define('map', ['mapLibraries'], function() {
    var self = {};
    self.map = {};

    var DEGREE_IN_METERS = 111320;

    var markers = [];
    var markersManagers = {};
    var infoWindow = {};
    var iconsMap = {
        'Stream': 'aquatic', 'Atmosphere': 'climate', 'Land': 'climate',
        'Canal': 'marker', 'Well': 'marker', 'Test Hole': 'marker'
    };
    var iconPath = {
        marker: 'M75.456,15.919C68.939,9.175,59.939,5,50,5c-9.94,0-18.94,4.175-25.456,10.919C18.03,22.666,14,31.404,14,41.699\
        c0,10.293,4.03,20.195,10.544,26.943L50,95l25.456-26.357C81.969,61.895,86,51.992,86,41.699C86,31.404,81.969,22.666,75.456,15.919\
        z M50,65.493c-13.061,0-23.648-10.589-23.648-23.648c0-13.061,10.587-23.648,23.648-23.648c13.06,0,23.648,10.587,23.648,23.648\
        C73.648,54.904,63.06,65.493,50,65.493z',
        climate: 'M75.456,15.919C68.939,9.175,59.939,5,50,5c-9.94,0-18.94,4.175-25.456,10.919C18.03,22.666,14,31.404,14,41.699\
        c0,10.293,4.03,20.195,10.544,26.943L50,95l25.456-26.357C81.969,61.895,86,51.992,86,41.699C86,31.404,81.969,22.666,75.456,15.919\
        z M71.209,49.727c-0.52,0.729-1.357,1.16-2.25,1.16H29.411c-1.357,0-2.514-0.986-2.728-2.327c-0.065-0.407-0.097-0.786-0.097-1.155\
        c0-3.127,1.971-5.803,4.738-6.85c-0.12-0.797-0.18-1.602-0.18-2.406c0-9.138,7.436-16.575,16.576-16.575\
        c6.452,0,12.235,3.725,14.958,9.448c6.014,0.578,10.734,5.661,10.734,11.825C73.414,45.322,72.65,47.701,71.209,49.727z',
        aquatic: 'M75.456,15.919C68.939,9.175,59.939,5,50,5c-9.94,0-18.94,4.175-25.456,10.919C18.03,22.666,14,31.404,14,41.699\
        c0,10.293,4.03,20.195,10.544,26.943L50,95l25.456-26.357C81.969,61.895,86,51.992,86,41.699C86,31.404,81.969,22.666,75.456,15.919\
        z M36.073,26.515c7.458,0,11.22,1.983,14.858,3.901c3.356,1.769,6.525,3.439,12.994,3.439c1.104,0,2,0.896,2,2s-0.896,2-2,2\
        c-7.458,0-11.221-1.983-14.859-3.901c-3.355-1.769-6.525-3.439-12.994-3.439c-1.104,0-2-0.896-2-2S34.969,26.515,36.073,26.515z\
         M36.073,36.23c7.458,0,11.221,1.983,14.86,3.901c3.355,1.769,6.525,3.439,12.993,3.439c1.104,0,2,0.896,2,2s-0.896,2-2,2\
        c-7.457,0-11.22-1.983-14.858-3.9c-3.356-1.769-6.525-3.439-12.995-3.439c-1.104,0-2-0.896-2-2S34.968,36.23,36.073,36.23z\
         M63.928,57.285c-7.459,0-11.222-1.983-14.86-3.901c-3.356-1.77-6.526-3.44-12.995-3.44c-1.104,0-2-0.896-2-2s0.896-2,2-2\
        c7.458,0,11.221,1.983,14.86,3.901c3.356,1.769,6.526,3.44,12.995,3.44c1.104,0,2,0.896,2,2S65.032,57.285,63.928,57.285z'
    };

    self.initializeMap = function() {
        var ui = require('ui');

        var settings = {
            center: new google.maps.LatLng(41.0648701, -111.4622151),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoom: 7
        };

        infoWindow = new google.maps.InfoWindow();
        self.map = new google.maps.Map(ui.getMapCanvas(), settings);

        google.maps.event.addListener(self.map, 'zoom_changed', function() {
            var getDistance = google.maps.geometry.spherical.computeDistanceBetween;
            var maxOffset = 500;
            var pixelOffset = 3;

            // If the offset is going to be more than 500 meters, don't do it.
            var zoomOffset = pixelOffset * getMapScale();
            if (zoomOffset > maxOffset) {
                return;
            }

            // Only get markers in the current map bounds.
            var mapBounds = self.map.getBounds();
            var markersInViewport = _(markers).filter(function(marker) {
                return mapBounds.contains(marker.getPosition());
            });

            // Reset the markers position.
            markersInViewport.forEach(function(marker) {
                marker.setPosition({ lat: marker.site.latitude, lng: marker.site.longitude });
            });

            markersInViewport.forEach(function(marker) {
                var closeMarkers = _(markersInViewport).filter(function(point) {
                    if (point === marker) {
                        return false;
                    }
                    return getDistance(marker.getPosition(), point.getPosition()) < zoomOffset;
                });

                closeMarkers.forEach(function(point) {
                    var newLat = point.getPosition().lat() + ((zoomOffset) / DEGREE_IN_METERS);
                    var newLng = point.getPosition().lng() - ((zoomOffset / 2) / (DEGREE_IN_METERS * Math.cos(newLat)));
                    point.setPosition({lat: newLat, lng: newLng });
                });
            });
        });
    };

    self.loadMarkers = function() {
        var ui = require('ui');
        var data = require('data');

        loadMarkerManagers();

        data.sites.forEach(function(site) {
            var marker = createMarker(site);
            marker.site = site;
            markersManagers[site.sourcedataserviceid].addMarker(marker);
            markers.push(marker);

            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.setContent(ui.siteInfoWindowTemplate({
                    sitecode: site.sitecode, sitename: site.sitename, network: site.network, sitetype: site.sitetype,
                    latitude: site.latitude, longitude: site.longitude, state: site.state, county: site.county
                }));
                infoWindow.open(self.map, marker);

                $('.btnViewSeries').on('click', function() {
                    var siteFacet = _(data.facets).findWhere({ keyfield: 'sitecode' });
                    data.selectOnlyFilter(siteFacet, this.dataset['sitecode']);
                    ui.loadView('datasets');
                });
            });
        });

        markers.forEach(function(marker, index) {
            // highlight hovered marker.
            google.maps.event.addListener(marker, "mouseover", function() {
                var icon = marker.getIcon();
                icon.fillOpacity = icon.fillOpacity + 0.07;
                icon.strokeWeight = icon.strokeWeight + 0.1;
                marker.setIcon(icon);
                marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
            });

            //bring it back to normal.
            google.maps.event.addListener(marker, "mouseout", function() {
                var icon = marker.getIcon();
                icon.fillOpacity = icon.fillOpacity - 0.07;
                icon.strokeWeight = icon.strokeWeight - 0.1;
                marker.setIcon(icon);
                marker.setZIndex();
            });
        });
    };

    self.renderLegend = function() {
        var ui = require('ui');
        var data = require('data');

        var legendElement = $(ui.legendTemplate());
        var legendItems = [];

        var uniqueNetworks = _(data.sites).uniq(function(site) { return site.sourcedataserviceid; });
        var networkIds = _(uniqueNetworks).pluck('sourcedataserviceid');

        legendItems.push(ui.legendIconItemTemplate({ title: 'Aquatic Site', imagePath: iconPath['aquatic'] }));
        legendItems.push(ui.legendIconItemTemplate({ title: 'Climate Site', imagePath: iconPath['climate'] }));
        legendItems.push(ui.legendIconItemTemplate({ title: 'Other', imagePath: iconPath['marker'] }));

        networkIds.forEach(function(networkId) {
            var markerManager = markersManagers[networkId];
            var itemSettings = { cssClass: markerManager.cssClass, title: markerManager.getTitle() };
            legendItems.push(ui.legendItemTemplate(itemSettings));
        });

        legendElement.find('ul.legendItems').append($(legendItems.join('')));
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legendElement.get(0));
    };

    self.updateSitesMarkers = function() {
        var data = require('data');
        for (var property in markersManagers) {
            if (markersManagers.hasOwnProperty(property)) {
                var markersManager = markersManagers[property];
                markersManager.getMarkers().forEach(function(marker) {
                    var siteMarker = _(data.filteredSites).findWhere({ sitename: marker.title, network: markersManager.getTitle() });
                    marker.setVisible(( (siteMarker)? true: false ));
                });
                markersManager.repaint();
            }
        }
        infoWindow.close();
    };

    function loadMarkerManagers() {
        var data = require('data');
        var ui = require('ui');

        var uniqueNetworks = _.uniq(data.sites, function(site) { return site.sourcedataserviceid; });
        var networkIds = _.pluck(uniqueNetworks, 'sourcedataserviceid');
        var networkNames = _.pluck(uniqueNetworks, 'network');
        var networks = _.object(networkIds, networkNames);

        networkIds.forEach(function(networkId) {
            var clusterer = new MarkerClusterer(self.map);
            var cssClass = ui.generateClusterClass(networkId);
            clusterer.cssClass = cssClass;
            clusterer.setIgnoreHidden(true);
            clusterer.setMinimumClusterSize(4);
            clusterer.setClusterClass(clusterer.getClusterClass() + " " + cssClass);
            clusterer.setStyles([{
                url: document.getElementById('transparentPixel').src,
                width: 30, height: 30, textSize: 12, anchorText: [0, -1],
                fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light",\
                    "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'
            }]);

            clusterer.setTitle(networks[networkId]);
            clusterer.setCalculator(function (markers) {
              return { text: markers.length.toString(), index: 1, title: networks[networkId] };
            });

            ui.addColorToClass(cssClass, getMarkerColorMapping(networkId));
            markersManagers[networkId] = clusterer;
        });
    }

    function createMarker(site) {
        var color = getMarkerColorMapping(site.sourcedataserviceid).hex;
        var markerIcon = {
            path: iconPath[iconsMap[site.sitetype]],
            anchor: new google.maps.Point(50, 100),
            fillColor: '#' + color,
            fillOpacity: 0.86,
            scale: 0.4,
            strokeColor: 'black',
            strokeWeight: 1,
            strokeOpacity: 0.4
        };
        return new google.maps.Marker({
            title: site.sitename,
            position: new google.maps.LatLng(site.latitude, site.longitude),
            icon: markerIcon
        });
    }

    function removeInfoWindows() {
        infoWindows.forEach(function(infoWindow) {
            infoWindow.close();
        });

        infoWindows.length = 0;
    }

    function getMarkerColorMapping(number) {
        var red = Math.floor(Math.exp(number * 2) * 255 * ((Math.sin(number) + 4))) % 255;
        var green = Math.floor(Math.exp(number * 3) * 255 * ((Math.cos(number) + 4))) % 255;
        var blue = Math.floor(Math.exp(number) * 255 * ((Math.sin(2 * number) + 4))) % 255;
        return {
            rgb: { red: red, green: green, blue: blue },
            hex: ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
        };
    }

    function getMapScale() {
        var circumference = 40075040;
        return (circumference * -Math.cos(self.map.getCenter().lat()) / Math.pow(2, self.map.getZoom() + 8));
    }

	return self;
});