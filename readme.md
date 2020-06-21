# [United States Power Generation &amp; Location](https://dwaggenspack.github.io/SUSPECT-Power/)

## I. Introduction

This map represents the geographic distribution of power generating plants across the United States.  The map will be able to reveal the locations of these power plants and a user provided location.  

The intended user of this map is those curious or caution about where they may be in relation to these plants.  It is essentially attempting to be a playful look at something that some in society would dread.  Worries about what ifs something went wrong, but at the same time, hoping they understand that these plants did not just pop into existence overnight.  Teaching them that knowing of a phenomena might uncloud the fears they may have had.

## II. Methodology
I created a map from plant data from the [U.S. Energy Information Administration](http://www.eia.gov/electricity/data/eia923/).  I had to perform some data wrangling and cleanup in a Jupyter Notebook to get it into a more streamlined format.  That data was then used to create a web application in which a user could explore the many plants around a user-defined space.

First provide a general statement summarizing the following subsections (one or two sentences).

### A. Data
What are the content requirements for your map? Provide a description of the following:

Plant data from the [U.S. Energy Information Administration Plants Shapefile](https://www.eia.gov/maps/map_data/PowerPlants_US_EIA.zip) was formatted and cleaned up in [Jupyter Notebooks](https://github.com/dwaggenspack/SUSPECT-Power/blob/master/notebooks/PowerPlants.ipynb) (Python 3) with the geopandas module and some creative data wrangling.  It was then written out to the web app's data folder as [plants.geojson](https://github.com/dwaggenspack/SUSPECT-Power/blob/master/data/plants.geojson)

<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>code</th>
      <th>plant_name</th>
      <th>capacity_mw</th>
      <th>fuel_source</th>
      <th>geometry</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>2</td>
      <td>Bankhead Dam</td>
      <td>53.0</td>
      <td>{'Hydroelectric': '53'}</td>
      <td>POINT (-87.35682 33.45867)</td>
    </tr>
    <tr>
      <th>1</th>
      <td>3</td>
      <td>Barry</td>
      <td>2386.9</td>
      <td>{'Coal': '1118.5', 'Natural Gas': '1268.4'}</td>
      <td>POINT (-88.01030 31.00690)</td>
    </tr>
    <tr>
      <th>2</th>
      <td>4</td>
      <td>Walter Bouldin Dam</td>
      <td>224.1</td>
      <td>{'Hydroelectric': '224.1'}</td>
      <td>POINT (-86.28306 32.58389)</td>
    </tr>
    <tr>
      <th>3</th>
      <td>7</td>
      <td>Gadsden</td>
      <td>130.0</td>
      <td>{'Natural Gas': '130'}</td>
      <td>POINT (-85.97080 34.01280)</td>
    </tr>
    <tr>
      <th>4</th>
      <td>9</td>
      <td>Copper</td>
      <td>63.0</td>
      <td>{'Natural Gas': '63'}</td>
      <td>POINT (-106.37500 31.75690)</td>
    </tr>
    <tr>
      <th>5</th>
      <td>10</td>
      <td>Greene County</td>
      <td>1256.1</td>
      <td>{'Natural Gas': '1256.1'}</td>
      <td>POINT (-87.78110 32.60170)</td>
    </tr>
    <tr>
      <th>6</th>
      <td>11</td>
      <td>H Neely Henry Dam</td>
      <td>71.1</td>
      <td>{'Hydroelectric': '71.1'}</td>
      <td>POINT (-86.05240 33.78450)</td>
    </tr>
    <tr>
      <th>7</th>
      <td>12</td>
      <td>Holt Dam</td>
      <td>48.0</td>
      <td>{'Hydroelectric': '48'}</td>
      <td>POINT (-87.44950 33.25530)</td>
    </tr>
    <tr>
      <th>8</th>
      <td>13</td>
      <td>Jordan Dam</td>
      <td>129.2</td>
      <td>{'Hydroelectric': '129.2'}</td>
      <td>POINT (-86.25480 32.61890)</td>
    </tr>
    <tr>
      <th>9</th>
      <td>14</td>
      <td>Logan Martin Dam</td>
      <td>129.0</td>
      <td>{'Hydroelectric': '129'}</td>
      <td>POINT (-86.33755 33.42588)</td>
    </tr>
  </tbody>
</table>
</div></div></div></div><div class="btn btn-default output_collapsed" title="click to expand output" style="display: none;">. . .</div></div></div>

### B. Medium for delivery
The map is be a web browser-based application accessible on non-Internet Explorer browsers.  It has been tested on Edge, Chrome, and FireFox. The application uses HTML, CSS, and Javascript with the [D3](https://d3js.org/), [Jquery](https://jquery.com/), and [Leaflet libraries](https://leafletjs.com/).  Geocoding is performed using the [esri-leaflet-geocoder](https://github.com/Esri/esri-leaflet-geocoder)


### C. Application layout
Application is laid out to resize for many different landscape sizes.  Application allows for overflow scrolling on results panel without resizing the entire page to have to scroll where the map would not be visible.

### D. Thematic representation
Plants are represented by CircleMarker symbols with colored dynamically chosen at application load from a preset array of colors.

The radius of the CircleMarkers are based on the MegaWatt capacity of the plant scaled down to a radius between 4 and 12 using the d3.scaleSqrt() function and the d3.max and d3.min functions to find the maximum and minimum for the domains.


### E. User interaction
The user is able to pan and zoom around on the map using mouse inputs as well as the zoom control in the upper left of the map.  There is a slider control where the user can drag the thumb to increase or decrease the radius that the buffer query will use.  On the right side of the map is a layer control.  The fuel sources for the plants are listed in the color they were assigned on data load.  By clicking the checkboxes, the user is able to remove plants with fuel sources that they do not wish to query.  This also removes them from a query that has already run.

By either clicking anywhere on the map or entering an address into the search at the top left of the map, the selected point is be used in a query to populate a side panel with an interactive list of plants within a radius of the chosen point as well as display the total number of plants meeting the query criteria.  Hovering over any item on the list of plants highlights the plant marker on the map.  

While the query is active, clicking on the buffer opens a summary statistics panel, showing the total MegaWatt capacity of all the plants within the buffer as well as a breakdown of each individual fuel source and their contributions to the total.
By hovering over a marker, a tooltip displays with information about the plant.  Clicking on a plant causes the right panel to automatically scroll to and highlight the appropriate plant listing.

The back button resets the map to a pre-query state by zooming the map back to the initial zoom level and position, resetting the side panel with the intro instructions, removing the query buffer layer, and showing the fuel layers chosen by the user.

### F. Aesthetics and design considerations
I went with a mix between a light and dark color theme in an attempt to balance readability of both text and symbols as well as offering a good contrast.  By this balance, I was trying to establish a neutral tone.

### G. Conclusion
Provide a brief (one or two paragraphs) statement to conclude the proposal. This will likely be restating what you said in the introduction, but also (re)consider the format we used in the first assignment (a topic with a motivating question).
As I mentioned before, this map represents a geographic distribution of power plants across the United States.  
I was able to test it with multiple users who all had positive reaction.  Most had the reaction I was going for, they looked up their house address and those of friends, and started a discussion about how close some of these plants were and that they "had no idea" that there were so many nearby.