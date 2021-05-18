#!/usr/bin/env node

const maxInscribedCircle = require('max-inscribed-circle/dist/max-inscribed-circle.es5.min.js');
const jsts = require('jsts/dist/jsts.js');

var polygon = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [
          []
        ]
    }
};

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
  var coords = line.split(" ");
  if (coords.length == 2) {
    polygon.geometry.coordinates[0].push([parseFloat(coords[0]), parseFloat(coords[1])]);
  }
});

rl.on('close', function(){
  var reader = new jsts.io.GeoJSONReader();
  var writer = new jsts.io.GeoJSONWriter();

  var geom = reader.read(polygon);
  var algo = new jsts.algorithm.MinimumBoundingCircle(geom.geometry);

  if (process.argv[2] === 'skipinside') {
    result = { properties: {} }
  } else {
    result = maxInscribedCircle.default(polygon, { units: 'kilometers', numSegments: 3 });
  }
  result.properties.maxRadius = algo.getRadius() / 180 * Math.PI * 6378.137;
  console.log(JSON.stringify(result));
});
