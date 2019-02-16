#!/usr/bin/env node

console.log('Preparing data');

const { Delaunay } = require('d3-delaunay');
const fs = require('fs');
const { createCanvas } = require('canvas');
const turf = require('@turf/turf');
const LatLon = require('geodesy').LatLonEllipsoidal;

const points = JSON.parse(fs.readFileSync('kossuth_points.json'));
const boundary = JSON.parse(fs.readFileSync('hungary.json'));

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

const SIZE_X = 5000;
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

distanceMap.sort((a,b) => b[0] - a[0]);

console.log("Generating image");

// draw the nodes
for (let point of points) {
    ctx.fillStyle = "#AAAAAA";
    ctx.strokeStyle = "#EEEEEE";
    ctx.lineWidth = 0.5;
    drawCircle(ctx, point, 5);
}

// draw all cells, and collect the cell boundaries
for (let poly of voronoi.cellPolygons()) {
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 0.5;
    drawPoly(ctx, poly);
};

// draw the boundary
ctx.strokeStyle = "#000000";
ctx.lineWidth = 3;
drawPoly(ctx, boundary);

// draw the points from the voronoi dataset
for (let [key, value] of locations) {
    let point = keyToPoint(key);
    ctx.fillStyle = value ? "#FF5555" : "#555555";
    ctx.strokeStyle = value ? "#FF0000" : "#000000";
    ctx.lineWidth = 0.5;
    drawCircle(ctx, point, 3);
}

// draw the vertices on the boundary
for (let point of boundary) {
    ctx.fillStyle = "#55FF55";
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 0.5;
    drawCircle(ctx, point, 3);
}

// draw the intersections of the voronoi points with the boundary
for (let point of intersectPoints) {
    ctx.fillStyle = "#55FFFF";
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 0.5;
    drawCircle(ctx, point, 3);
}

for (let i = 0; i < Math.min(40, distanceMap.length); i++) {
    ctx.fillStyle = "rgba(255,0,0,"+((40-i)/40)+")";
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 0.5;
    let data = distanceMap[i][1];
    drawCircle(ctx, data.point, 40);
    console.log("Point from "+data.point[1]+","+data.point[0]+" to "+data.destination[1]+","+data.destination[0]+" is "+distanceMap[i][0]/1000+"km")
}

console.log("Saving image");

// save image to file
var buf = canvas.toBuffer();
fs.writeFileSync("kossuth.png", buf);

console.log("Done");
