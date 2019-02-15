Scripts I used to find the point furhtest away in Hungary from a street named Kossuth

To generate `streets.csv` use:

1. Download Hungary.osm.pbf from http://data.osm-hr.org/hungary/

2. Extract all streets from the osm into an xml:

```
osmosis –read-pbf-fast hungary.osm.pbf file=“hungary.osm.pbf” –way-key keyList=highway –way-key keyList=name –used-node –tag-filter reject-relations  –write-xml file=“hungary2.osm”
```

3. Extract street names from it and filter by kossuth

```
osmconvert hungary2.osm –all-to-nodes –csv=“@id @lon @lat name” –csv-headline | grep -i kossuth > streets.csv
```

Next to generate the vornoi diagram I used `rubyvor`. Dependent on the scaling used it will generate a more-or less nice SVG, with the relevant data. You can find a generated svg called `dia.dvg`, and an export to png called `dia.png`:

![Voronoi of Hungary](https://raw.githubusercontent.com/sztupy/kossuth-map/master/dia.png)

And one with a crude overlay of the borders of Hungary:

![Voronoi of Hungary](https://raw.githubusercontent.com/sztupy/kossuth-map/master/hungary-overlay.png)
