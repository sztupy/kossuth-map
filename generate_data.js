#!/usr/bin/env node

const fs = require('fs');
const process = require('process');

const args = process.argv;
if (args.length != 3) {
    console.log("Usage: generate_data.js <config_file_name>");
    process.exit(1);
}

console.log('Preparing data');

const config = JSON.parse(fs.readFileSync(args[2]));

// configuration
const INPUT_FILE_NAME = config.INPUT_FILE_NAME || process.exit(2);
const BOUNDARY_FILE_NAME = config.BOUNDARY_FILE_NAME || process.exit(2);
const OUTPUT_FILE_NAME = config.OUTPUT_FILE_NAME || process.exit(2);

const IMAGE_WIDTH = config.IMAGE_WIDTH || process.exit(2); // px

const NUMBER_OF_CLUSTERS = config.NUMBER_OF_CLUSTERS || process.exit(2);
const CLUSTERING_MINIMUM_DISTANCE = config.CLUSTERING_MINIMUM_DISTANCE || process.exit(2); //in km
const BORDER_PROCESSING_MODE = config.BORDER_PROCESSING_MODE || 1;
// 0: slowest; gives best results on concave countries with lots of islands
// 1: middle ground; gives okay results for countries with lots of islands, but can skip some border points in concave countries
// 2: fastest; works okay for single polygon, convex countries with no islands
const AUTO_ADJUST_COORDINATE_MAPPING = config.AUTO_ADJUST_COORDINATE_MAPPING || true;
// when true it will adjust the height of the image based on the median latitude as well - but keep a simple equirectangular projection
// When turned off will use plain plate carrée projection

const NODE_FILL_COLOR = config.NODE_FILL_COLOR || "rgba(80,80,80, 0.25)";
const NODE_STROKE_COLOR = config.NODE_STROKE_COLOR || "rgba(0,0,0, 0.5)";
const NODE_STROKE_WIDTH = config.NODE_STROKE_WIDTH || 0.5;
const NODE_RADIUS = config.NODE_RADIUS || IMAGE_WIDTH / 500;

const VORONOI_CELL_STROKE_COLOR = config.VORONOI_CELL_STROKE_COLOR || "#333333";
const VORONOI_CELL_STROKE_WIDTH = config.VORONOI_CELL_STROKE_WIDTH || 0.5;

const BOUNDARY_STROKE_COLOR = config.BOUNDARY_STROKE_COLOR || "#000000";
const BOUNDARY_STROKE_WIDTH = config.BOUNDARY_STROKE_WIDTH || IMAGE_WIDTH / 2000;

const VORONOI_NODE_ACTIVE_FILL_COLOR = config.VORONOI_NODE_ACTIVE_FILL_COLOR || "#FF5555";
const VORONOI_NODE_INACTIVE_FILL_COLOR = config.VORONOI_NODE_INACTIVE_FILL_COLOR || "#555555";
const VORONOI_NODE_ACTIVE_STROKE_COLOR = config.VORONOI_NODE_ACTIVE_STROKE_COLOR || "#FF0000";
const VORONOI_NODE_INACTIVE_STROKE_COLOR = config.VORONOI_NODE_INACTIVE_STROKE_COLOR || "#000000";
const VORONOI_NODE_STROKE_WIDTH = config.VORONOI_NODE_STROKE_WIDTH || 0.5;
const VORONOI_NODE_RADIUS = config.VORONOI_NODE_RADIUS || IMAGE_WIDTH / 2000;

const BOUNDARY_VERTEX_FILL_COLOR = config.BOUNDARY_VERTEX_FILL_COLOR || "#55FF55";
const BOUNDARY_VERTEX_STROKE_COLOR = config.BOUNDARY_VERTEX_STROKE_COLOR || "#00FF00";
const BOUNDARY_VERTEX_STROKE_WIDTH = config.BOUNDARY_VERTEX_STROKE_WIDTH || 0.5;
const BOUNDARY_VERTEX_RADIUS = config.BOUNDARY_VERTEX_RADIUS || IMAGE_WIDTH / 2000;

const BOUNDARY_INTERSECTION_FILL_COLOR = config.BOUNDARY_INTERSECTION_FILL_COLOR || "#99FF99";
const BOUNDARY_INTERSECTION_STROKE_COLOR = config.BOUNDARY_INTERSECTION_STROKE_COLOR || "#00FF00";
const BOUNDARY_INTERSECTION_STROKE_WIDTH = config.BOUNDARY_INTERSECTION_STROKE_WIDTH || 0.5;
const BOUNDARY_INTERSECTION_RADIUS = config.BOUNDARY_INTERSECTION_RADIUS || IMAGE_WIDTH / 2000;

const FOUND_NODE_FILL_COLOR = config.FOUND_NODE_FILL_COLOR || "rgba(255,0,0,0.1)";
const FOUND_NODE_STROKE_COLOR = config.FOUND_NODE_STROKE_COLOR || "rgba(255,0,0,0.5)";
const FOUND_NODE_ARROW_STROKE_COLOR = config.FOUND_NODE_ARROW_STROKE_COLOR || "rgba(0,0,0,0.5)";
const FOUND_NODE_ARROW_STROKE_WIDTH = config.FOUND_NODE_ARROW_STROKE_WIDTH || 6;
const FOUND_NODE_STROKE_WIDTH = config.FOUND_NODE_STROKE_WIDTH || 3;
const FOUND_NODE_RADIUS = config.FOUND_NODE_RADIUS || IMAGE_WIDTH / 100;

const FOUND_NODE_FONT_SIZE = Math.max(15,Math.round(IMAGE_WIDTH/150));
const FOUND_NODE_FONT = config.FOUND_NODE_FONT || FOUND_NODE_FONT_SIZE + "px Arial";
const FOUND_NODE_FONT_FILL_COLOR = config.FOUND_NODE_FONT_FILL_COLOR || "#000000";
const FOUND_NODE_FONT_STROKE_COLOR = config.FOUND_NODE_FONT_STROKE_COLOR || "#FFFFFF";
const FOUND_NODE_FONT_STROKE_WIDTH = config.FOUND_NODE_FONT_STROKE_WIDTH || FOUND_NODE_FONT_SIZE/6;
const FOUND_NODE_TEXT_HEIGHT = config.FOUND_NODE_TEXT_HEIGHT || FOUND_NODE_FONT_SIZE*3.2;
// No way to get this automated using HTML5 Canvas

//requires
const { Delaunay } = require('d3-delaunay');
const { createCanvas } = require('canvas');
const turf = require('@turf/turf');
const LatLon = require('geodesy').LatLonEllipsoidal;
const jsdom = require('jsdom');
const C2S = require('canvas2svg');
if (!global.XMLSerializer) {
    global.XMLSerializer = require("w3c-xmlserializer/lib/XMLSerializer").interface;
}


const points = JSON.parse(fs.readFileSync(INPUT_FILE_NAME));
const boundary = JSON.parse(fs.readFileSync(BOUNDARY_FILE_NAME));

// figure out the boundaries
var minX = points[0][0];
var maxX = points[0][0];
var minY = points[0][1];
var maxY = points[0][1];

for (let p of points) {
    if (p[0] < minX) { minX = p[0]; }
    if (p[0] > maxX) { maxX = p[0]; }
    if (p[1] < minY) { minY = p[1]; }
    if (p[1] > maxY) { maxY = p[1]; }
}

for (let polygon of boundary) {
    for (let subpolygon of polygon) {
        for (let p of subpolygon) {
            if (p[0] < minX) { minX = p[0]; }
            if (p[0] > maxX) { maxX = p[0]; }
            if (p[1] < minY) { minY = p[1]; }
            if (p[1] > maxY) { maxY = p[1]; }
        }
    }
}

// add some leeway around the edges
let d = (maxX-minX)/50;
minX -= d; maxX += d;
d = (maxY-minY)/50;
minY -= d; maxY += d;

// skew the height values based on the latitude to make it more conformal
const HEIGHT_ADJUST = AUTO_ADJUST_COORDINATE_MAPPING ? 1 / Math.abs(Math.cos(Math.PI / 180 * (minY+((maxY-minY)/2)))) : 1;

if (AUTO_ADJUST_COORDINATE_MAPPING) {
    minY *= HEIGHT_ADJUST;
    maxY *= HEIGHT_ADJUST;

    for (let i=0; i<points.length; i++) {
        points[i][1] *= HEIGHT_ADJUST;
    }

    for (let polygon of boundary) {
        for (let subpolygon of polygon) {
            for (let i=0; i< subpolygon.length; i++) {
                subpolygon[i][1] *= HEIGHT_ADJUST;
            }
        }
    }
}

// set up the image
const WIDTH = maxX-minX;
const HEIGHT = maxY-minY;

const SIZE_X = IMAGE_WIDTH;
const SIZE_Y = Math.round(SIZE_X / WIDTH * HEIGHT);

const boundaryTurf = turf.multiPolygon(boundary);
const canvas = createCanvas(SIZE_X, SIZE_Y);
const ctx = canvas.getContext('2d');
const svgCtx = new C2S({width: SIZE_X, height: SIZE_Y, document: new jsdom.JSDOM().window.document});

console.log('Generating Voronoi Diagram');
// calculate the data
const delaunay = Delaunay.from(points);
const voronoi = delaunay.voronoi([minX, minY, maxX, maxY]);

// gets the X coordinate on the image from a longitude
function getX(lon) {
    return (lon - minX)/WIDTH * SIZE_X;
}

// gets the Y coordinate on the image from a latitude
function getY(lat) {
    return SIZE_Y - (lat - minY)/HEIGHT * SIZE_Y;
}

// draws a polygon
function drawPoly(ctx, poly) {
    ctx.beginPath();
    const lastPoly = poly[poly.length-1];
    ctx.moveTo(getX(lastPoly[0]), getY(lastPoly[1]));

    for (let i=0; i<poly.length; i++) {
        ctx.lineTo(getX(poly[i][0]), getY(poly[i][1]));
    }
    ctx.stroke();
}

// draws a circle
function drawCircle(ctx, point, radius) {
    ctx.beginPath();
    ctx.arc(getX(point[0]), getY(point[1]), radius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
}

// converts a point to a string to be used in hashes
function pointToKey(point) {
    return point[0]+' '+point[1];
}

// converts the string back to a point
function keyToPoint(key) {
    let data = key.split(" ");
    return [parseFloat(data[0]), parseFloat(data[1])];
}

console.log("Checking boundary conditions");
// gets all of the interesting points from the voronoi cells - these are the vertices of the cells
var locations = new Map();
for (let poly of voronoi.cellPolygons()) {
    for (let i=0; i<poly.length; i++) {
        locations.set(pointToKey(poly[i]), false);
    }
}

// check which of these points lie within our boundary, and which ones are outside
var locationsPoints = [];
for (let [key, _] of locations) {
    locationsPoints.push(keyToPoint(key));
}
var locationsTurf = turf.points(locationsPoints);
var pointsInBoundary = turf.pointsWithinPolygon(locationsTurf, boundaryTurf);

turf.featureEach(pointsInBoundary, (currentFeature, _) => {
    let point = turf.getCoord(currentFeature);
    locations.set(pointToKey(point), true);
});

console.log("Finding locations on boundary");
var intersectPoints = [];
// collects all points which intersect our boundary
for (let poly of voronoi.cellPolygons()) {
    for (let i=0; i<poly.length; i++) {
        if (BORDER_PROCESSING_MODE == 0 ||
            BORDER_PROCESSING_MODE == 1 && (!locations.get(pointToKey(poly[i])) || !locations.get(pointToKey(poly[(i + 1) % poly.length]))) ||
            BORDER_PROCESSING_MODE == 2 && (locations.get(pointToKey(poly[i])) != locations.get(pointToKey(poly[(i + 1) % poly.length])))
           ) {
            let lineTurf = turf.lineString([poly[i], poly[(i + 1) % poly.length]]);
            let intersects = turf.lineIntersect(lineTurf, boundaryTurf);
            turf.featureEach(intersects, (currentFeature, _) => {
                let point = turf.getCoord(currentFeature);
                intersectPoints.push(point);
            });
        }
    }
};

// collect all points that are potentially a furthest one
var potentialPoints = [];

// draw the points from the voronoi dataset
for (let [key, value] of locations) {
    let point = keyToPoint(key);
    if (value) {
        potentialPoints.push(point);
    }
}

// draw the vertices on the boundary
for (let polygon of boundary) {
    for (let subpolygon of polygon) {
        for (let point of subpolygon) {
            potentialPoints.push(point);
        }
    }
}

for (let point of intersectPoints) {
    potentialPoints.push(point);
}

console.log("Obtaining distance data");

// find the furthest away node from each of our selected points
var distanceMap = [];
for (let point of potentialPoints) {
    let otherPoint = points[delaunay.find(point[0],point[1])];
    let p1 = new LatLon(point[1]/HEIGHT_ADJUST, point[0]);
    let p2 = new LatLon(otherPoint[1]/HEIGHT_ADJUST, otherPoint[0]);
    let d = p1.distanceTo(p2);
    distanceMap.push([d, {
        point: point,
        destination: otherPoint
    }]);
}

// sort in order of decreasing distance
distanceMap.sort((a,b) => b[0] - a[0]);

// cluster points - only keep one in each cluster
console.log("Clustering points");
var distanceCluster = [];
var index = 0;

while (distanceCluster.length < NUMBER_OF_CLUSTERS && index < distanceMap.length) {
    let data = distanceMap[index];
    let minDist = Infinity;
    for (let i = 0; i < distanceCluster.length; i++) {
        let p1 = new LatLon(data[1].point[1]/HEIGHT_ADJUST, data[1].point[0]);
        let p2 = new LatLon(distanceCluster[i][1].point[1]/HEIGHT_ADJUST, distanceCluster[i][1].point[0]);
        let d = p1.distanceTo(p2);
        if (d < minDist) {
            minDist = d;
        }
    }
    if (minDist > CLUSTERING_MINIMUM_DISTANCE * 1000) {
        distanceCluster.push(data);
    }
    index++;
}

console.log("Generating image");
var turfFeatures = [];

// draw the nodes

for (let point of points) {
    svgCtx.fillStyle = ctx.fillStyle = NODE_FILL_COLOR;
    svgCtx.strokeStyle = ctx.strokeStyle = NODE_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = NODE_STROKE_WIDTH;
    drawCircle(ctx, point, NODE_RADIUS);
    drawCircle(svgCtx, point, NODE_RADIUS);

    turfFeatures.push(
        turf.point(
            [point[0], point[1]/HEIGHT_ADJUST],
            {
                "name": "Node",
                "marker-size": "small",
                "marker-color": "#666666",
            }
        )
    )
}

// draw all cells, and collect the cell boundaries
for (let poly of voronoi.cellPolygons()) {
    svgCtx.strokeStyle = ctx.strokeStyle = VORONOI_CELL_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = VORONOI_CELL_STROKE_WIDTH;
    drawPoly(ctx, poly);
    drawPoly(svgCtx, poly);
};

// draw the boundary
svgCtx.strokeStyle = ctx.strokeStyle = BOUNDARY_STROKE_COLOR;
svgCtx.lineWidth = ctx.lineWidth = BOUNDARY_STROKE_WIDTH;
for (let polygon of boundary) {
    for (let subpolygon of polygon) {
            drawPoly(ctx, subpolygon);
            drawPoly(svgCtx, subpolygon);
    }
}

boundary.forEach(poly =>
    turfFeatures.push(
        turf.multiLineString(
            poly.map(subpoly => subpoly.map(point => [point[0],point[1]/HEIGHT_ADJUST])),
            {
                "name":"Country Boundary",
                "stroke": "#000000",
                "stroke-width": 5
            }
        )
    )
);

// draw the points from the voronoi dataset
for (let [key, value] of locations) {
    let point = keyToPoint(key);
    svgCtx.fillStyle = ctx.fillStyle = value ? VORONOI_NODE_ACTIVE_FILL_COLOR : VORONOI_NODE_INACTIVE_FILL_COLOR;
    svgCtx.strokeStyle = ctx.strokeStyle = value ? VORONOI_NODE_ACTIVE_STROKE_COLOR : VORONOI_NODE_INACTIVE_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = VORONOI_NODE_STROKE_WIDTH;
    drawCircle(ctx, point, VORONOI_NODE_RADIUS);
    drawCircle(svgCtx, point, VORONOI_NODE_RADIUS);
}

// draw the vertices on the boundary
for (let polygon of boundary) {
    for (let subpolygon of polygon) {
        for (let point of subpolygon) {
            svgCtx.fillStyle = ctx.fillStyle = BOUNDARY_VERTEX_FILL_COLOR;
            svgCtx.strokeStyle = ctx.strokeStyle = BOUNDARY_VERTEX_STROKE_COLOR;
            svgCtx.lineWidth = ctx.lineWidth = BOUNDARY_VERTEX_STROKE_WIDTH;
            drawCircle(ctx, point, BOUNDARY_VERTEX_RADIUS);
            drawCircle(svgCtx, point, BOUNDARY_VERTEX_RADIUS);
        }
    }
}

// draw the intersections of the voronoi points with the boundary
for (let point of intersectPoints) {
    svgCtx.fillStyle = ctx.fillStyle = BOUNDARY_INTERSECTION_FILL_COLOR;
    svgCtx.strokeStyle = ctx.strokeStyle = BOUNDARY_INTERSECTION_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = BOUNDARY_INTERSECTION_STROKE_WIDTH;
    drawCircle(ctx, point, BOUNDARY_INTERSECTION_RADIUS);
    drawCircle(svgCtx, point, BOUNDARY_INTERSECTION_RADIUS);
}

var textBoxes = [];

textBoxes.push([-10000,-10000,10,SIZE_Y+10000]);
textBoxes.push([-10000,-10000,SIZE_X+10000,10]);
textBoxes.push([SIZE_X-10,-100000,SIZE_X+10000,SIZE_Y+10000]);
textBoxes.push([-10000,SIZE_Y-10,SIZE_X+10000,SIZE_Y+10000]);

for (let i = 0; i < distanceCluster.length; i++) {
    svgCtx.fillStyle = ctx.fillStyle = FOUND_NODE_FILL_COLOR;
    svgCtx.strokeStyle = ctx.strokeStyle = FOUND_NODE_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = FOUND_NODE_STROKE_WIDTH;
    let data = distanceCluster[i][1];
    drawCircle(ctx, data.point, FOUND_NODE_RADIUS);
    drawCircle(svgCtx, data.point, FOUND_NODE_RADIUS);
    console.log("Point from "+data.point[1]/HEIGHT_ADJUST+","+data.point[0]+" to "+data.destination[1]/HEIGHT_ADJUST+","+data.destination[0]+" is "+distanceCluster[i][0]/1000+"km");

    svgCtx.font = ctx.font = FOUND_NODE_FONT;
    svgCtx.fillStyle = ctx.fillStyle = FOUND_NODE_FONT_FILL_COLOR;
    svgCtx.strokeStyle = ctx.strokeStyle = FOUND_NODE_FONT_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = FOUND_NODE_FONT_STROKE_WIDTH;
    svgCtx.textBaseline = ctx.textBaseline = "top";
    svgCtx.textAlign = ctx.textAlign = "start";

    let textX = getX(data.point[0]) + FOUND_NODE_RADIUS;
    let textY = getY(data.point[1]) + FOUND_NODE_RADIUS;
    let text = data.point[1]/HEIGHT_ADJUST+"\n"+data.point[0]+"\n"+distanceCluster[i][0]/1000+"km ("+(i+1)+".)";
    let textWidth = ctx.measureText(text).width;

    // crappy algorithm to make the textboxes not overlap
    let okay = false;
    let tries = 50;
    while (!okay && tries > 0)  {
        okay = true;
        for (let ii = 0; ii < textBoxes.length; ii++) {
            if (! (textBoxes[ii][0] > textX + textWidth ||
                   textBoxes[ii][2] < textX ||
                   textBoxes[ii][1] > textY + FOUND_NODE_TEXT_HEIGHT ||
                   textBoxes[ii][3] < textY
                  )
               ) {
                textX += Math.random() * FOUND_NODE_TEXT_HEIGHT - (textX/SIZE_X) * FOUND_NODE_TEXT_HEIGHT;
                textY += Math.random() * FOUND_NODE_TEXT_HEIGHT - (textY/SIZE_Y) * FOUND_NODE_TEXT_HEIGHT;
                okay = false;
            }
        }
        tries--;
    }
    if (tries<=0) {
        console.log("WARN: Potential label overlap");
    }

    ctx.strokeText(text, textX, textY);
    ctx.fillText(text, textX, textY);

    let positionY = textY;
    for (let line of text.split("\n")) {
        svgCtx.strokeText(line, textX, positionY);
        svgCtx.fillText(line, textX, positionY);
        positionY += FOUND_NODE_FONT_SIZE;
    }

    svgCtx.strokeStyle = ctx.strokeStyle = FOUND_NODE_ARROW_STROKE_COLOR;
    svgCtx.lineWidth = ctx.lineWidth = FOUND_NODE_ARROW_STROKE_WIDTH;

    ctx.beginPath();
    ctx.moveTo(textX, textY + FOUND_NODE_TEXT_HEIGHT/2);
    ctx.lineTo(getX(data.point[0]), getY(data.point[1]));
    ctx.stroke();

    svgCtx.beginPath();
    svgCtx.moveTo(textX, textY + FOUND_NODE_TEXT_HEIGHT/2);
    svgCtx.lineTo(getX(data.point[0]), getY(data.point[1]));
    svgCtx.stroke();

    textBoxes.push([textX, textY, textX+textWidth, textY+FOUND_NODE_TEXT_HEIGHT]);

    let symbol = (i+1)+'';
    if (i>8) {
        symbol = String.fromCharCode(i + 97 - 10)
    }
    if (i>35) {
        symbol = 'cross';
    }

    turfFeatures.push(
        turf.point([data.point[0], data.point[1]/HEIGHT_ADJUST], {
            "name": "Destination",
            "marker-size": "large",
            "marker-color": "#00ff00",
            "marker-symbol": symbol,
            "info": text,
            "distance": distanceCluster[i][0]/1000,
            "opposite-point": [data.destination[0], data.destination[1]/HEIGHT_ADJUST],
            "position": i+1
        })
    );

    turfFeatures.push(
        turf.lineString([[data.point[0], data.point[1]/HEIGHT_ADJUST], [data.destination[0], data.destination[1]/HEIGHT_ADJUST]],
        {
            "name": "Distance",
            "stroke": "#33ff33",
            "stroke-width": 2.5,
            "distance": distanceCluster[i][0]/1000,
            "position": i+1
        })
    );
}

let geoJSONData = turf.featureCollection(turfFeatures);

console.log("Saving image");

// save image to file
var buf = canvas.toBuffer();
fs.writeFileSync(OUTPUT_FILE_NAME + ".png", buf);

fs.writeFileSync(OUTPUT_FILE_NAME + ".svg", svgCtx.getSerializedSvg().replace('xmlns:xlink="http://www.w3.org/1999/xlink"',""));

fs.writeFileSync(OUTPUT_FILE_NAME + ".geojson", JSON.stringify(geoJSONData));

console.log("Done");
