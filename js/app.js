(function () {
    var map = L.map('map', {
        center: [36, -94],
        zoom: 4
    });

    //hold the current latlng in case user just wants to change the buffer.
    var currentLatLng = {
        latlng: L.latLng(38.0307, -84.5040)
    };
    var tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    tiles.addTo(map);

    //add address search to the map
    var searchControl = L.esri.Geocoding.geosearch().addTo(map);

    var slide = document.getElementById('slide'),
        sliderDiv = document.getElementById("buffDist");

    slide.oninput = function () {
        sliderDiv.value = this.value;
    };
    slide.onchange = function () {
        spotlightSearch(currentLatLng);
    };
    spotlightSearch

    var results = L.layerGroup().addTo(map);

    //function to handle the results of an address search
    searchControl.on('results', function (data) {
        results.clearLayers();
        spotlightSearch(data.results[0]);

    });

    //Validate number input for buffer radius.
    function isNumberKey(evt) {

        var charCode = (evt.which) ? evt.which : event.keyCode
        //Make sure the character entered is a number or decimal
        if (charCode > 31 && (charCode != 46 && (charCode < 48 || charCode > 57))) {
            return false;
        }
        //make sure another decimal wasn't already entered
        if (charCode == 46 && event.srcElement.value.indexOf('.') > -1) {
            return false;
        }
        //If it was a number or the first decimal point, say yes!
        return true;
        
    }

    var commonStyles = {
        weight: .2,
        stroke: 1,
        fillOpacity: .7
    }

    //info for all the layers used.  Chose primary colors of light for best contrast between sources of power
    var layerInfo = {
        powerLayer: {

        }
    };

    var geoJsonLayers = {};

    //hold the makers for quick jquery lookup
    var markerMap = {};

    //Loop through all of the layers and add the data for the plants.
    for (var layer in layerInfo) {
        geoJsonLayers[layer] = L.geoJson(plants, {
            pointToLayer: function (feature, latlng) {
                var cMarker = new L.circleMarker(latlng, commonStyles);
                markerMap[feature.properties.code] = cMarker;
                return cMarker;
            },
            style: function (feature) {
                return {
                    color: '#c8c8c7',
                    fillColor: '#0033A0',
                    radius: 7
                }
            }
        }).addTo(map);
    }

    //function used to calculate proportional radius based on fuel capacity
    function getRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * .7;
    }

    //feature group for the spotlight so that we can clear the old spotlight when a new click is performed
    var SpotGroup = L.featureGroup().addTo(map);

    //click function for the map. Performs a 500km buffer query and shows only plants that fall within that buffer.
    map.on('click', function (e) {
        spotlightSearch(e);
    });

    //function to handle spotlight and search for power plants
    function spotlightSearch(chosenPoint) {
        currentLatLng = chosenPoint;
        //variable to hold buffer distance entered
        var bufferKm = $(".buffInput").val() * 1.609344;
        //prep the sidebar for some knowledge!
        $(".Layout-right").html("<div id='totals'></div><br>");
        SpotGroup.clearLayers();
        //create an object to hold the totals to use in the spotlight popup.
        var spotTots = {};

        //count the number of features.
        var count = 0;
        for (var layer in layerInfo) {
            geoJsonLayers[layer].eachLayer(function (layer) {
                var distance = chosenPoint.latlng.distanceTo(layer.getLatLng()) / 1000;
                if (distance > bufferKm) {
                    layer.setStyle({
                        stroke: false,
                        fill: false
                    });
                } else {
                    count++;
                    layer.setStyle({
                        stroke: true,
                        fill: true
                    });

                    var fullPopup = buildPopup(layer.feature.properties, distance);
                    layer.bindPopup("<div>" + fullPopup + "</div><br>");

                    $('.Layout-right').append("<div id='" + layer.feature.properties.plant_name +
                        "' class='borderpop' markerID='" + layer.feature.properties.code + "'>" + fullPopup + "</div>");

                    for (var key in layer.feature.properties.fuel_source) {
                        //makes it so that the SpotTots[key] does not read as NaN
                        //Otherwise it will not do the totals.
                        spotTots[key] = spotTots[key] ? spotTots[key] : 0;
                        //total the fuel source
                        spotTots[key] += layer.feature.properties.fuel_source[key];
                    }
                };
            });

            //            $(".borderpop").click(function () {
            //
            //                var targetName = $(this).attr('id');
            //
            //                for (var layer in layerInfo) {
            //                    geoJsonLayers[layer].eachLayer(function (layer) {
            //                        if (layer.feature.properties.plant_name == targetName) {
            //                            map.flyTo(layer.getLatLng(), 9)
            //                            layer.setStyle({
            //                                fillColor: 'yellow',
            //                                radius: 15
            //                            });
            //                        } else {
            //                            layer.setStyle({
            //                                fillColor: '#0033A0',
            //                                radius: 7
            //                            });
            //                        }
            //                    });
            //                }
            //
            //
            //            });

            
            $(".borderpop").click(function () {
                //Get the id of the marker
                var markID = $(this).attr('markerID');
                var marker = markerMap[markID];

                map.closePopup();
                map.flyTo(marker.getLatLng(), 9)
                marker.openPopup().bringToFront();


            });
            
            $(".borderpop").mouseover(function () {
                //Get the id of the marker
                var markID = $(this).attr('markerID');
                var marker = markerMap[markID];

                $(this).addClass('divHighlight');
                marker.bringToFront().setStyle({
                    fillColor: 'yellow',
                    radius: 15
                });

            });

            $(".borderpop").mouseout(function () {
                //Get the id of the marker
                var markID = $(this).attr('markerID');
                var marker = markerMap[markID];

                $(this).removeClass('divHighlight');
                marker.bringToFront().setStyle({
                    fillColor: '#0033A0',
                    radius: 7
                });

            });

            var spotlight = L.circle(chosenPoint.latlng, {
                radius: (bufferKm * 1000),
                color: '#303030',
                stroke: false
            }).bindPopup(buildSpotPopup(spotTots)).addTo(SpotGroup).bringToBack();
            map.fitBounds(SpotGroup.getBounds(0));
        };
        var totalstring = "There are <b>" + count + "</b> power plants that are <b>" + $(".buffInput").val() + " Miles</b> from the selected origin."
        $("#totals").html(totalstring);
    };

    //function to build the popup for the plants
    function buildPopup(plantProp, distance) {
        //create a string for multiple fuel types
        var fuelSourceStr = "";
        //go through the keys for fuels source and build the string to show the power capacity for multiple fuel types.
        for (var key in plantProp.fuel_source) {

            fuelSourceStr += "<br><b>" + key + "</b>: " + plantProp.fuel_source[key] + " MW"
        }

        // declare and define popup here
        var popup = "<b>" + plantProp.plant_name + "</b>" +
            fuelSourceStr;

        popup += "<br>Plant is <b>" + (distance * 0.62137119).toLocaleString() + " miles</b> from the original point.";
        return popup;
    }

    //build the popup for spotlight
    function buildSpotPopup(plantTots) {

        var popup = "<b>Summary Statistics</b>";
        //go through the keys for fuels source and build the string to show the power capacity for multiple fuel types.
        for (var key in plantTots) {
            popup += "<br><b>" + key + "</b>: " + plantTots[key].toLocaleString() + " MW"
        }
        return popup;
    }
})();
