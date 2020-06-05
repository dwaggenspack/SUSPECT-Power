(function () {

    var map = L.map('map', {
        center: [36, -94],
        zoom: 4,
        maxBounds: [
            [7.536764322084078, -180.35156250000003],
            [76.05850791800295, -16.523437500000004]
        ]
    });

    //hold the current latlng in case user just wants to change the buffer.
    var currentLatLng = {
        latlng: L.latLng(38.0307, -84.5040)
    };
    var tiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">Carto</a>',
        subdomains: 'abcd',
        minZoom: 3
    });

    tiles.addTo(map);

    //add address search to the map
    var searchControl = L.esri.Geocoding.geosearch().addTo(map);

    // create Leaflet control for the slider
    const sliderControl = L.control({
        position: 'bottomleft'
    });

    // when control is added
    sliderControl.onAdd = function (map) {

        // select the current slider with id of 'slider'
        const controls = L.DomUtil.get("range-slider");

        // disable scroll and click events on map beneath slider
        L.DomEvent.disableScrollPropagation(controls);
        L.DomEvent.disableClickPropagation(controls);

        // return selection to control
        return controls;

    }

    // add the control to the map
    sliderControl.addTo(map);

    var slide = document.getElementById('slide'),
        bufferVal = document.getElementById("buffDist");

    slide.oninput = function () {
        bufferVal.innerHTML = "<b>" + this.value + "</b>";
    };
    slide.onchange = function () {
        spotlightSearch(currentLatLng);
    };

    var TOC;

    var results = L.layerGroup().addTo(map);

    //function to handle the results of an address search
    searchControl.on('results', function (data) {
        results.clearLayers();
        spotlightSearch(data.results[0]);

    });

    $('#back-button').click(function () {

        $('#t-plant-pane').addClass('hide');
        $('#t-info-pane').removeClass('hide');
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

    var geoJsonLayers = {};

    //hold the makers for quick jquery lookup
    var markerMap = {};

    //get all of our keys for fuel source
    var distinct = [];
    for (var i in plants.features) {
        distinct.push(Object.keys(plants.features[i].properties.fuel_source));
        var trueFuel = "";
        var fuelCount = 0
        for (var key in plants.features[i].properties.fuel_source) {
            if (fuelCount == 0) {
                trueFuel = key;
                fuelCount++;
            } else {
                trueFuel = "Multiple";
                break;
            }

        }
        plants.features[i].properties.trueFuel = trueFuel;
    }

    //only want unique values
    function mergeDedupe(arr) {
        return [...new Set([].concat(...arr))];
    }


    distinct = mergeDedupe(distinct);
    distinct.push("Multiple");


    var layercolor = {};
    var colors = ['#1f78b4', '#9699d3', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#4ac2c6', '#6a3d9a', '#b15928', '#dddd99', '#969696', '#123456'];
    for (i = 0; i < distinct.length; i++) {
        layercolor[distinct[i]] = colors[i];
    }

    //info for all the layers used.  Chose primary colors of light for best contrast between sources of power
    var layerInfo = {};
    for (var key in layercolor) {
        layerInfo[key] = {};
        layerInfo[key].trueFuel = key;
        layerInfo[key].color = layercolor[key];
    }


    //Loop through all of the layers and add the data for the plants.
    for (var key in layerInfo) {
        geoJsonLayers[key] = L.geoJson(plants, {
            pointToLayer: function (feature, latlng) {
                var cMarker = new L.circleMarker(latlng, commonStyles);
                markerMap[feature.properties.code] = cMarker;
                return cMarker;
            },
            filter: function (feature) {
                if (feature.properties.trueFuel == key) {
                    return feature;
                }
            },
            style: function (feature) {
                return {
                    color: '#c8c8c7',
                    fillColor: layercolor[feature.properties.trueFuel],
                    radius: 7
                }
            }
        }).addTo(map);
    }
    var sourcesLabels = {};
    for (var key in layercolor) {
        var testing = "<span style='color:" + layercolor[key] + "'>" + key + "</span>";
        sourcesLabels[testing] = geoJsonLayers[key];
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

    TOC = L.control.layers(null, sourcesLabels, {
        collapsed: false
    }).addTo(map);

    //function to handle spotlight and search for power plants
    function spotlightSearch(chosenPoint) {
        currentLatLng = chosenPoint;
        //variable to hold buffer distance entered
        var bufferKm = $("#slide").val() * 1.609344;
        //prep the sidebar for some knowledge!
        //$("#info-pane").addClass("hide-me");
        //$("#results-pane").html("<h2>Plants within search area:</h2><div id='plant-search-results'></div><br>");
        //$("#plant-search-results").html("<div id='info-pane'><p>Do you SUSPECT there may be a power plant near you? Does it THRILL you?</p><p>Does it instill a crippling TERROR within you? Either way, this map has you covered!</p><p>There are 3 ways of performing this magical query to solve your quandry:</p><ol><li>Set your buffer distance using the slider below the map.</li><li>Click on the map.</li><li>Search for an address by clicking the magnifying glass on the map.</li></ol></div>");
        SpotGroup.clearLayers();
        //create an object to hold the totals to use in the spotlight popup.
        var spotTots = {};

        $('#t-plant-pane').removeClass('hide');
        $('#t-info-pane').addClass('hide');



        //count the number of features.
        var count = 0;
        for (var layer in layerInfo) {
            if (map.hasLayer(geoJsonLayers[layer])) {

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

                        $('#plant-search-results').append("<div id='" + layer.feature.properties.plant_name +
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
            };
            var totalstring = "There are <b>" + count + "</b> power plants that are <b>" + $("#slide").val() + " Miles</b> from the selected origin."
            $("#totals").html(totalstring);
        }

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
                fillColor: layercolor[marker.feature.properties.trueFuel],
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

    //function to build the popup for the plants
    function buildPopup(plantProp, distance) {
        //create a string for multiple fuel types
        var fuelSourceStr = "";
        //go through the keys for fuels source and build the string to show the power capacity for multiple fuel types.
        for (var key in plantProp.fuel_source) {

            fuelSourceStr += "<br><b style='color:" + layercolor[key] + "'>" + key + "</b>: " + plantProp.fuel_source[key] + " MW"
        }

        // declare and define popup here
        var popup = "<b style='color:" + layercolor[key] + "'>" + plantProp.plant_name + "</b>" +
            fuelSourceStr;

        popup += "<br>This plant is <b>" + (distance * 0.62137119).toLocaleString() + " miles</b> from the original point.";
        //popup += "<br><br><b>BONUS:</b> The <b>" + plantProp.nearestRiver + "</b> is the nearest river in Lousiana and is <b>" + plantProp.riverDistance + " miles</b> from this facility.";
        return popup;
    }

    //build the popup for spotlight
    function buildSpotPopup(plantTots) {

        var popup = "<b>Summary Statistics</b>";
        //go through the keys for fuels source and build the string to show the power capacity for multiple fuel types.
        for (var key in plantTots) {
            popup += "<br><b style='color:" + layercolor[key] + "'>" + key + "</b>: " + plantTots[key].toLocaleString() + " MW"
        }
        return popup;
    }

    $("#back-button").on('click', function () {
        console.log('hi')
        $("#results-pane").html($("#t-info-pane").html());
    })


})();