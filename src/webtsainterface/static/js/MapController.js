/**
 * Created by Juan on 4/6/14.
 */

TsaApplication.MapController = (function (self) {
    self.map = {};
    var settings = {};
    var markersManagers = {};
    var infoWindows = [];

    self.initializeMap = function() {
        settings = {
            center: new google.maps.LatLng(41.0648701, -111.4622151),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoom: 7
        };
        self.map = new google.maps.Map(TsaApplication.UiHelper.getMapCanvas(), settings);
    };

    self.loadMarkers = function() {
        loadMarkerManagers();
        TsaApplication.DataManager.sites.forEach(function(site) {
            var marker = createMarker(site);
            markersManagers[site.sourcedataserviceid].addMarker(marker);
            var markerInfoWindow = new google.maps.InfoWindow({ content: TsaApplication.UiHelper.siteInfoWindowTemplate({
                sitecode: site.sitecode, sitename: site.sitename, network: site.network, sitetype: site.sitetype,
                latitude: site.latitude, longitude: site.longitude, state: site.state, county: site.county})
            });

            google.maps.event.addListener(marker, 'click', function() {
                removeInfoWindows();
                infoWindows.push(markerInfoWindow);
                markerInfoWindow.open(self.map, marker);
                $('.btnViewSeries').on('click', function() {
                    TsaApplication.UiHelper.loadView('datasets');
                    var siteCode = this.dataset['sitecode']
                    TsaApplication.TableController.filterBySite(siteCode);
                });
            });
        });
    };

    self.updateSitesMarkers = function() {
        for (var property in markersManagers) {
            if (markersManagers.hasOwnProperty(property)) {
                var markersManager = markersManagers[property];
                markersManager.getMarkers().forEach(function(marker) {
                    var siteMarker = _.find(TsaApplication.Search.filteredSites, function(site) {
                        return site.sitename === marker.title;
                    });
                    marker.setVisible(( (siteMarker)? true: false ));
                });
                markersManager.repaint();
            }
        }
        removeInfoWindows();
    };

    function loadMarkerManagers() {
        var uniqueNetworks = _.uniq(TsaApplication.DataManager.sites, function(site) { return site.sourcedataserviceid; });
        var networkIds = _.pluck(uniqueNetworks, 'sourcedataserviceid');
        var networkNames = _.pluck(uniqueNetworks, 'network');
        var networks = _.object(networkIds, networkNames);

        networkIds.forEach(function(networkId) {
            var networkMarkersManager = new MarkerClusterer(self.map);
            var cssClass = TsaApplication.UiHelper.generateClusterClass(networkId);
            networkMarkersManager.setIgnoreHidden(true);
            networkMarkersManager.setMinimumClusterSize(4);
            networkMarkersManager.setClusterClass(networkMarkersManager.getClusterClass() + " " + cssClass);
            networkMarkersManager.setStyles([{
                url: '', width: 30, height: 30, textSize: 12, anchorText: [0, -1],
                fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light",\
                    "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'
            }]);

            networkMarkersManager.setCalculator(function (markers) {
              return { text: markers.length.toString(), index: 1, title: networks[networkId] };
            });

            TsaApplication.UiHelper.addColorToClass(cssClass, getMarkerColorMapping(networkId));
            markersManagers[networkId] = networkMarkersManager;
        });
    }

    function createMarker(site) {
        var color = getMarkerColorMapping(site.sourcedataserviceid).hex;
        var pinImage = new google.maps.MarkerImage('https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%20|' + color);
        var marker = new google.maps.Marker({
            title: site.sitename,
            position: new google.maps.LatLng(site.latitude, site.longitude),
            icon: pinImage
        });
        google.maps.event.addDomListener(marker, "visible_changed", function() {
            if (marker.getVisible()) {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.setAnimation(null); }, 2000);
            }
        });

        return marker;
    }

    function removeInfoWindows() {
        infoWindows.forEach(function(infoWindow) {
            infoWindow.close();
        });

        infoWindows.length = 0;
    }

    function getMarkerColorMapping(number) {
        var red = Math.floor(Math.exp(number) * 255 * ((Math.sin(number) + 4))) % 255;
        var green = Math.floor(Math.exp(number) * 255 * ((Math.cos(number) + 4))) % 255;
        var blue = Math.floor(Math.exp(number) * 255 * ((Math.sin(2 * number) + 4))) % 255;
        return {
            rgb: { red: red, green: green, blue: blue },
            hex: ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
        };
    }


	return self;
}(TsaApplication.MapController || {}));