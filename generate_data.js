#!/usr/bin/env node

console.log('Preparing data');

// configuration
const INPUT_FILE_NAME = 'datasets/uk_pubs.json';
const BOUNDARY_FILE_NAME = 'datasets/gb_mainland.json';
const OUTPUT_FILE_NAME = 'images/uk_pubs.png';

const IMAGE_WIDTH = 10000; // px

const NUMBER_OF_CLUSTERS = 40;
const CLUSTERING_MINIMUM_DISTANCE = 100; //km

const NODE_FILL_COLOR = "rgba(80,80,80, 0.25)";
const NODE_STROKE_COLOR = "rgba(0,0,0, 0.5)";
const NODE_STROKE_WIDTH = 0.5;
const NODE_RADIUS = IMAGE_WIDTH / 1000;

const VORONOI_CELL_STROKE_COLOR = "#333333";
const VORONOI_CELL_STROKE_WIDTH = 0.5;

const BOUNDARY_STROKE_COLOR = "#000000";
const BOUNDARY_STROKE_WIDTH = IMAGE_WIDTH / 2000;

const VORONOI_NODE_ACTIVE_FILL_COLOR = "#FF5555";
const VORONOI_NODE_INACTIVE_FILL_COLOR = "#555555";
const VORONOI_NODE_ACTIVE_STROKE_COLOR = "#FF0000";
const VORONOI_NODE_INACTIVE_STROKE_COLOR = "#000000";
const VORONOI_NODE_STROKE_WIDTH = 0.5;
const VORONOI_NODE_RADIUS = IMAGE_WIDTH / 2000;

const BOUNDARY_VERTEX_FILL_COLOR = "#55FF55";
const BOUNDARY_VERTEX_STROKE_COLOR = "#00FF00";
const BOUNDARY_VERTEX_STROKE_WIDTH = 0.5;
const BOUNDARY_VERTEX_RADIUS = IMAGE_WIDTH / 2000;

const BOUNDARY_INTERSECTION_FILL_COLOR = "#99FF99";
const BOUNDARY_INTERSECTION_STROKE_COLOR = "#00FF00";
const BOUNDARY_INTERSECTION_STROKE_WIDTH = 0.5;
const BOUNDARY_INTERSECTION_RADIUS = IMAGE_WIDTH / 2000;

const FOUND_NODE_FILL_COLOR = "rgba(255,0,0,0.1)";
const FOUND_NODE_STROKE_COLOR = "rgba(255,0,0,0.5)";
const FOUND_NODE_ARROW_STROKE_COLOR = "rgba(0,0,0,0.5)";
const FOUND_NODE_ARROW_STROKE_WIDTH = 6;
const FOUND_NODE_STROKE_WIDTH = 3;
const FOUND_NODE_RADIUS = IMAGE_WIDTH / 100;

const FOUND_NODE_FONT = "60px Arial";
const FOUND_NODE_FONT_FILL_COLOR = "#000000";
const FOUND_NODE_FONT_STROKE_COLOR = "#FFFFFF";
const FOUND_NODE_FONT_STROKE_WIDTH = 10;
const FOUND_NODE_TEXT_HEIGHT = 200; // No way to get this automated using HTML5 Canvas

//requires
const { Delaunay } = require('d3-delaunay');
const fs = require('fs');
const { createCanvas } = require('canvas');
const turf = require('@turf/turf');
const LatLon = require('geodesy').LatLonEllipsoidal;

const points = JSON.parse(fs.readFileSync(INPUT_FILE_NAME));
const boundary = JSON.parse(fs.readFileSync(BOUNDARY_FILE_NAME));

const boundaryTurf = turf.polygon([boundary]);

const delaunay = Delaunay.from(points);

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

for (let p of boundary) {
    if (p[0] < minX) { minX = p[0]; }
    if (p[0] > maxX) { maxX = p[0]; }
    if (p[1] < minY) { minY = p[1]; }
    if (p[1] > maxY) { maxY = p[1]; }
}

// add some leeway around the edges
let d = (maxX-minX)/50;
minX -= d; maxX += d;
d = (maxY-minY)/50;
minY -= d; maxY += d;

// set up the image
const WIDTH = maxX-minX;
const HEIGHT = maxY-minY;

const SIZE_X = IMAGE_WIDTH;
const SIZE_Y = Math.round(SIZE_X / WIDTH * HEIGHT);

const canvas = createCanvas(SIZE_X, SIZE_Y);
const ctx = canvas.getContext('2d');

console.log('Generating Voronoi Diagram');
// calculate the data
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
        if (locations.get(pointToKey(poly[i])) != locations.get(pointToKey(poly[(i + 1) % poly.length]))) {
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
for (let point of boundary) {
    potentialPoints.push(point);
}

for (let point of intersectPoints) {
    potentialPoints.push(point);
}

console.log("Obtaining distance data");

// find the furthest away node from each of our selected points
var distanceMap = [];
for (let point of potentialPoints) {
    let otherPoint = points[delaunay.find(point[0],point[1])];
    let p1 = new LatLon(point[0], point[1]);
    let p2 = new LatLon(otherPoint[0], otherPoint[1]);
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
        let p1 = new LatLon(data[1].point[0], data[1].point[1]);
        let p2 = new LatLon(distanceCluster[i][1].point[0], distanceCluster[i][1].point[1]);
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

// draw the nodes
for (let point of points) {
    ctx.fillStyle = NODE_FILL_COLOR;
    ctx.strokeStyle = NODE_STROKE_COLOR;
    ctx.lineWidth = NODE_STROKE_WIDTH;
    drawCircle(ctx, point, NODE_RADIUS);
}

// draw all cells, and collect the cell boundaries
for (let poly of voronoi.cellPolygons()) {
    ctx.strokeStyle = VORONOI_CELL_STROKE_COLOR;
    ctx.lineWidth = VORONOI_CELL_STROKE_WIDTH;
    drawPoly(ctx, poly);
};

// draw the boundary
ctx.strokeStyle = BOUNDARY_STROKE_COLOR;
ctx.lineWidth = BOUNDARY_STROKE_WIDTH;
drawPoly(ctx, boundary);

// draw the points from the voronoi dataset
for (let [key, value] of locations) {
    let point = keyToPoint(key);
    ctx.fillStyle = value ? VORONOI_NODE_ACTIVE_FILL_COLOR : VORONOI_NODE_INACTIVE_FILL_COLOR;
    ctx.strokeStyle = value ? VORONOI_NODE_ACTIVE_STROKE_COLOR : VORONOI_NODE_INACTIVE_STROKE_COLOR;
    ctx.lineWidth = VORONOI_NODE_STROKE_WIDTH;
    drawCircle(ctx, point, VORONOI_NODE_RADIUS);
}

// draw the vertices on the boundary
for (let point of boundary) {
    ctx.fillStyle = BOUNDARY_VERTEX_FILL_COLOR;
    ctx.strokeStyle = BOUNDARY_VERTEX_STROKE_COLOR;
    ctx.lineWidth = BOUNDARY_VERTEX_STROKE_WIDTH;
    drawCircle(ctx, point, BOUNDARY_VERTEX_RADIUS);
}

// draw the intersections of the voronoi points with the boundary
for (let point of intersectPoints) {
    ctx.fillStyle = BOUNDARY_INTERSECTION_FILL_COLOR;
    ctx.strokeStyle = BOUNDARY_INTERSECTION_STROKE_COLOR;
    ctx.lineWidth = BOUNDARY_INTERSECTION_STROKE_WIDTH;
    drawCircle(ctx, point, BOUNDARY_INTERSECTION_RADIUS);
}

var textBoxes = [];

for (let i = 0; i < distanceCluster.length; i++) {
    ctx.fillStyle = FOUND_NODE_FILL_COLOR;
    ctx.strokeStyle = FOUND_NODE_STROKE_COLOR;
    ctx.lineWidth = FOUND_NODE_STROKE_WIDTH;
    let data = distanceCluster[i][1];
    drawCircle(ctx, data.point, FOUND_NODE_RADIUS);
    console.log("Point from "+data.point[1]+","+data.point[0]+" to "+data.destination[1]+","+data.destination[0]+" is "+distanceCluster[i][0]/1000+"km");

    ctx.font = FOUND_NODE_FONT;
    ctx.fillStyle = FOUND_NODE_FONT_FILL_COLOR;
    ctx.strokeStyle = FOUND_NODE_FONT_STROKE_COLOR;
    ctx.lineWidth = FOUND_NODE_FONT_STROKE_WIDTH;
    ctx.textBaseline = "top";
    ctx.textAlign = "start";

    let textX = getX(data.point[0]) + FOUND_NODE_RADIUS;
    let textY = getY(data.point[1]) + FOUND_NODE_RADIUS;
    let text = data.point[1]+"\n"+data.point[0]+"\n"+distanceCluster[i][0]/1000+"km";
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
                textX += Math.random() * FOUND_NODE_TEXT_HEIGHT - FOUND_NODE_TEXT_HEIGHT/2;
                textY += Math.random() * FOUND_NODE_TEXT_HEIGHT - FOUND_NODE_TEXT_HEIGHT/2;
                okay = false;
            }
        }
        tries--;
    }

    ctx.strokeText(text, textX, textY);
    ctx.fillText(text, textX, textY);

    ctx.strokeStyle = FOUND_NODE_ARROW_STROKE_COLOR;
    ctx.lineWidth = FOUND_NODE_ARROW_STROKE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(textX, textY + FOUND_NODE_TEXT_HEIGHT/2);
    ctx.lineTo(getX(data.point[0]), getY(data.point[1]));
    ctx.stroke();

    textBoxes.push([textX, textY, textX+textWidth, textY+FOUND_NODE_TEXT_HEIGHT]);
}

console.log("Saving image");

// save image to file
var buf = canvas.toBuffer();
fs.writeFileSync(OUTPUT_FILE_NAME, buf);

console.log("Done");
