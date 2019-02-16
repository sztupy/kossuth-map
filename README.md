Determine furthest points away in a country for a specific set of points
========================================================================

Based on a set of locations (nodes) these scripts will try to figure out which points are the furthest away from these locations in a country.

It uses the following algorithm:

First it tries to find locations, which are potentially far away from our input set:

1. It generates the Voronoi-graph based on the input set of locations
2. It checks each of the generated vertices whether they are within the country's boundaries or not. Any point that's in the boundary gets added to the potential list of candidates
3. Each of the vertices of the boundary are also added to the potential candidates list
4. Finally any point on the boundary that is bisected by a Voronoi-edge is also added to the candidate list

The vertices of the Voronoi-graph are good candidates as they are the furthest point away from their neighbouring locations. However some of these points can be outside of the country's boundaries. To make sure they are also accounted for both the vertices in the country's boundaries are added to the list, as well as any place where the boundary was intersected by a voroni-edge. These are the points where distances are at a local maximum, so it's worth checking.

Once we have a set of potential locations, we simply go through them, find the nearest node to them, and check it's distance. Then we sort these nodes according to how large it's distance is.

To make the result not too clustered, we also remove points that are too close together at the end. This makes sure that remote border locations, which have a large amount of points in the search set will not be over-represented in the result, as we are interested in more distinct locations anyway.

Once we have the end values we render them to a map as well.

Usage
-----

The app requires Node.JS to be installed, and the proper modules downloaded using `npm install`.

Once the setup is done change the constants at the start of `generate_data.js` to match the input and output filenames, then simply run `./generate_data.js`

Some useful config values to change:

* `INPUT_FILE_NAME`: The input file containing the set of points we wish to avoid. It's a JSON array of `[lon,lat]` pairs preferably in WGS84.
* `BOUNDARY_FILE_NAME`: The file containig the boundary of the country in geoJSON multi-polygon format. For fast results only run it one land, but the script should work fine with datasets containing islands as well.
* `OUTPUT_FILE_NAME`: The file where the rendered image should be saved in PNG format.
* `IMAGE_WIDTH`: Set this to the preferred image width size. The height of the image will be calculated automatically to keep the aspect relations.
* `NUMBER_OF_CLUSTERS`: The amount of points we wish to obtain at the end.
* `CLUSTERING_MINUMUM_DISTANCE`: Sets how far away two points need to be (in km) in order to be considered for inclusion.
* `BORDER_PROCESSING_MODE`: Determines what kind of intersections between the Voronoi-edges and the border should be checked. 0 is the slowest but most complete, 1 is a middle ground, which should work for most cases, but might skip some points around concave features and islands, and 2 is a fast solution that only gives satisfactory results on single-polygon, convex countries.

You can also change the styling on the output by changing any of the other values

Examples
--------

Some examples:

### Points furthest away in Hungary from a street named "Kossuth"

Almost all settlements in Hungary have a street or square named "Kossuth". If you wish to be the furthest away from any of them, the best place is around the tripoint border between Hungary, Austria and Slovenia where you'll be 22.30km away from one.

Large resolution map:
![Kossuth large](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/kossuth.png)

Small resolution map:
![Kossuth small](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/kossuth_small.png)

The dataset is called `kossuth_points.json`. To generate the file I used the following scripts:

1. Download Hungary.osm.pbf from http://data.osm-hr.org/hungary/

2. Extract all streets from the osm into an xml:

```
osmosis –read-pbf-fast hungary.osm.pbf file=“hungary.osm.pbf” –way-key keyList=highway –way-key keyList=name –used-node –tag-filter reject-relations  –write-xml file=“hungary2.osm”
```

3. Extract street names from it and filter by kossuth

```
osmconvert hungary2.osm –all-to-nodes –csv=“@id @lon @lat name” –csv-headline | grep -i kossuth > streets.csv
```

4. Finally I converted the CSV to JSON using vi manually.

### Points furthest away in Hungary from any sports complex

There's plenty of sports complexes in Hungary. To be the furthest from one, you have to be in the centre of Hortobágy National Park, where the closest complex will be 15.25km away.

Large resolution map:
![Stadion large](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/stadionok.png)

Small resolution map:
![Stadion small](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/stadionok_small.png)

The dataset is from a list I gathered for another project called Magyar Stadionok: https://github.com/sztupy/magyar-stadionok

### Points furthest away in Great Britain from a pub

Also it's widely known that there are a lot of pubs in the UK. However there's not that many of them in the Highlands, you can be 94km from one if you go to the right spot. The best you can do is 18km in Wales, and 12.5km in England.

Large resolution map:
![GB Pubs](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/gb_pubs.png)

Data source: https://www.getthedata.com/open-pubs

### Points furthest away in Scotland from a distillery

The Isles are left out from distilleries, and on the Mainland you actually have to head to England to get far away from some Scotch.

Large resolution map:
![Scottish distilleries](https://raw.githubusercontent.com/sztupy/kossuth-map/master/images/scottish_distilleries.png)

Dataset is from here: http://adn.biol.umontreal.ca/~numericalecology/data/scotch.html
