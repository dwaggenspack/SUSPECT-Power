var map = L.map('map', {
        center: [36, -94],
        zoom: 4,
    });

    var tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    tiles.addTo(map);

  var searchControl = L.esri.Geocoding.geosearch().addTo(map);

  var results = L.layerGroup().addTo(map);
    //console.log(results);

  searchControl.on('results', function(data){
    results.clearLayers();
      //console.log(data.results[0]);
      
      spotlightSearch(data.results[0]);
//    for (var i = data.results.length - 1; i >= 0; i--) {
//      results.addLayer(L.marker(data.results[i].latlng));
//    }
  });

    //d3.select("h2").text(d.properties.plant_name);

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
    //console.log($(".buffInput").val());
    //console.log($(".Layout-right"));

    var commonStyles = {
        weight: 1,
        stroke: 1,
        fillOpacity: .7
    }

    //info for all the layers used.  Chose primary colors of light for best contrast between sources of power
    var layerInfo = {
        coalLayer: {
            source: "Coal",
            color: '#dd0000'
        },
        hydroLayer: {
            source: "Hydro",
            color: '#0000dd'
        },
        windLayer: {
            source: "Wind",
            color: '#00dd00'
        }
    };



    var geoJsonLayers = {};

    //Loop through al of the layers and add the data for the plants with the appropriate fuel source.
    for (var layer in layerInfo) {
        geoJsonLayers[layer] = L.geoJson(plants, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, commonStyles);
            },
            filter: function(feature) {
                if (feature.properties.fuel_source[layerInfo[layer].source]) {
                    return feature;
                }
            },
            style: function(feature) {
                return {
                    color: layerInfo[layer].color,
                    fillColor: layerInfo[layer].color,
                    //radius: getRadius(feature.properties.fuel_source[layerInfo[layer].source])
                    radius:5
                }
            }
        }).addTo(map);
    }

    //function used to calculate proportional radius based on fuel capacity
    function getRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * .7;
    }

    //labels for the TOC
    var sourcesLabels = {
        "<b style='color:#dd0000'>Coal</b>": geoJsonLayers.coalLayer,
        "<b style='color:#0000dd'>Hydro</b>": geoJsonLayers.hydroLayer,
        "<b style='color:#00dd00'>Wind</b>": geoJsonLayers.windLayer
    }

    //Add TOC to the Map
    L.control.layers(null, sourcesLabels, {
        collapsed: false
    }).addTo(map);


    //feature group for the spotlight so that we can clear the old spotlight when a new click is performed
    var SpotGroup = L.featureGroup().addTo(map);

    //click function for the map. Performs a 500km buffer query and shows only plants that fall within that buffer.
        map.on('click', function(e){
            spotlightSearch(e);
        });

        //function to handle spotlight and search for power plants
        function spotlightSearch(chosenPoint) {
            //variable to hold buffer distance entered
        var bufferKm = $(".buffInput").val() * 1.609344;
        $(".Layout-right").html("");
        SpotGroup.clearLayers();
        //create an object to hold the totals to use in the spotlight popup.
        var spotTots = {};
        for (var layer in layerInfo) {
            geoJsonLayers[layer].eachLayer(function(layer) {
                var distance = chosenPoint.latlng.distanceTo(layer.getLatLng()) / 1000;
                if (distance > bufferKm) {
                    layer.setStyle({
                        stroke: false,
                        fill: false
                    });
                } else {
                    layer.setStyle({
                        stroke: true,
                        fill: true
                    });
                    layer.bindPopup(buildPopup(layer.feature.properties, distance));
                    $('.Layout-right').append(buildPopup(layer.feature.properties, distance));
                    for (var key in layer.feature.properties.fuel_source) {
                        //makes it so that the SpotTots[key] does not read as NaN
                        //Otherwise it will not do the totals.
                        spotTots[key] = spotTots[key] ? spotTots[key] : 0;
                        //total the fuel source
                        spotTots[key] += layer.feature.properties.fuel_source[key];
                    }
                };
            });
            var spotlight = L.circle(chosenPoint.latlng, {
                radius: (bufferKm * 1000),
                color: '#f0f0f0',
                stroke: false
            }).bindPopup(buildSpotPopup(spotTots)).addTo(SpotGroup).bringToBack().openPopup();
            map.fitBounds(SpotGroup.getBounds(0));
        };
    };

    //function to build the popup for the plants
    function buildPopup(plantProp, distance) {
        //create a string for multiple fuel types
        var fuelSourceStr = "";
        //go through the keys for fuels source and build the string to show the power capacity for multiple fuel types.
        for (var key in plantProp.fuel_source) {
            //console.log(key, plantProp.fuel_source[key]);
            fuelSourceStr += "<br><b>" + key + "</b>: " + plantProp.fuel_source[key] + " MW"
        }

        // declare and define popup here
        var popup = "<div class='" + "" + "'><b>" + plantProp.plant_name + "</b>" +
            fuelSourceStr;

        popup += "<br>Plant is <b>" + (distance * 0.62137119).toLocaleString() + " miles</b> from the original point.</div><br>";
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