# Determine roundness of geographical features based on OSM / MapIt data

To determine roundness first download an appropriate JSON from MapIt. For example for Germany the data is from https://global.mapit.mysociety.org/areas/O06.html?country=DE

Next run `download.rb` to download the geometry files to each of the areas.
Finally run `roundness.rb` to run the roundness calulation across each area. We are using a tool called `planimeter` part of `geographiclib` to calculate the parea and permieter of the polygons, then use the Polsby-Popper test to determine compactness, which we're going to use as a roundness definition

