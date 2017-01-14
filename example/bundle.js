(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var subdivide = require("../index.js");

document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.getElementById("test-canvas");
  var context = canvas.getContext("2d");

  var curve = [[100, 200], [200, 50], [50, 100], [200, 200]];
  var points = subdivide(curve);

  context.beginPath();
  context.lineWidth = 4;
  context.strokeStyle = "red";
  points.forEach(function (point, i) {
    if (i === 0) {
      context.moveTo(point[0], point[1]);
    } else {
      context.lineTo(point[0], point[1]);
    }
  });
  context.stroke();

  context.lineWidth = 2;
  context.strokeStyle = "grey";
  for (var line of [[curve[0], curve[1]], [curve[2], curve[3]]]) {
    context.beginPath();
    context.moveTo(line[0][0], line[0][1]);
    context.lineTo(line[1][0], line[1][1]);
    context.stroke();
  }

  context.lineWidth = 2;
  context.strokeStyle = "black";
  context.fillStyle = "white";

  for (var point of curve) {
    context.beginPath();
    context.ellipse(point[0], point[1], 5, 5, 0, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  }
});

},{"../index.js":2}],2:[function(require,module,exports){
//----------------------------------------------------------------------------
// Anti-Grain Geometry - Version 2.4
// Copyright (C) 2002-2005 Maxim Shemanarev (http://www.antigrain.com)
//
// Permission to copy, use, modify, sell and distribute this software
// is granted provided this copyright notice appears in all copies.
// This software is provided "as is" without express or implied
// warranty, and with no claim as to its suitability for any purpose.
//
//----------------------------------------------------------------------------
// Contact: mcseem@antigrain.com
//          mcseemagg@yahoo.com
//          http://www.antigrain.com
//----------------------------------------------------------------------------

var RECURSION_LIMIT = 32
var ANGLE_TOLERANCE_EPSILON = 0.01
var COLLINEARITY_EPSILON = 1e-30

var π = Math.PI
var abs = Math.abs
var atan2 = Math.atan2
var pow = Math.pow

module.exports = subdivide

function subdivide (curve, opts) {
  opts = opts || {}

  var x1 = curve[0][0]
  var y1 = curve[0][1]
  var x2 = curve[1][0]
  var y2 = curve[1][1]
  var x3 = curve[2][0]
  var y3 = curve[2][1]
  var x4 = curve[3][0]
  var y4 = curve[3][1]

  var ctx = {}
  var points = ctx.points = []
  var approximationScale = opts.approximationScale || 1
  ctx.angleTolerance = opts.angleTolerance || 0
  ctx.cuspLimit = opts.cuspLimit || 0
  ctx.distanceToleranceSquare = pow(0.5 / approximationScale, 2)

  points[points.length] = [x1, y1]
  bezier(ctx, x1, y1, x2, y2, x3, y3, x4, y4, 0)
  points[points.length] = [x4, y4]

  return points
}

function bezier (ctx, x1, y1, x2, y2, x3, y3, x4, y4, level) {
  if (level > RECURSION_LIMIT) return

  var points = ctx.points
  var angleTolerance = ctx.angleTolerance
  var cuspLimit = ctx.cuspLimit
  var distanceToleranceSquare = ctx.distanceToleranceSquare

  // Calculate all the mid - points of the line segments
  var x12 = (x1 + x2) / 2
  var y12 = (y1 + y2) / 2
  var x23 = (x2 + x3) / 2
  var y23 = (y2 + y3) / 2
  var x34 = (x3 + x4) / 2
  var y34 = (y3 + y4) / 2
  var x123 = (x12 + x23) / 2
  var y123 = (y12 + y23) / 2
  var x234 = (x23 + x34) / 2
  var y234 = (y23 + y34) / 2
  var x1234 = (x123 + x234) / 2
  var y1234 = (y123 + y234) / 2


  // Try to approximate the full cubic curve by a single straight line
  var dx = x4 - x1
  var dy = y4 - y1

  var d2 = abs(((x2 - x4) * dy - (y2 - y4) * dx))
  var d3 = abs(((x3 - x4) * dy - (y3 - y4) * dx))
  var da1, da2, k

  var sum = ((d2 > COLLINEARITY_EPSILON) << 1) + (d3 > COLLINEARITY_EPSILON)

  if (sum === 0) {
    // All collinear OR p1==p4
    k = dx * dx + dy * dy
    if (k == 0) {
      d2 = distanceSquare(x1, y1, x2, y2)
      d3 = distanceSquare(x4, y4, x3, y3)
    }
    else {
      k = 1 / k
      da1 = x2 - x1
      da2 = y2 - y1
      d2 = k * (da1 * dx + da2 * dy)
      da1 = x3 - x1
      da2 = y3 - y1
      d3 = k * (da1 * dx + da2 * dy)

      // Simple collinear case, 1---2---3---4
      // We can leave just two endpoints
      if (d2 > 0 && d2 < 1 && d3 > 0 && d3 < 1) return

      if (d2 <= 0) d2 = distanceSquare(x2, y2, x1, y1)
      else if (d2 >= 1) d2 = distanceSquare(x2, y2, x4, y4)
      else d2 = distanceSquare(x2, y2, x1 + d2 * dx, y1 + d2 * dy)

      if (d3 <= 0) d3 = distanceSquare(x3, y3, x1, y1)
      else if (d3 >= 1) d3 = distanceSquare(x3, y3, x4, y4)
      else d3 = distanceSquare(x3, y3, x1 + d3 * dx, y1 + d3 * dy)
    }
    if (d2 > d3 && d2 < distanceToleranceSquare) {
      points[points.length] = [x2, y2]
      return
    }
    if (d3 < distanceToleranceSquare) {
      points[points.length] = [x3, y3]
      return
    }
  }
  else if (sum === 1) {
    // p1,p2,p4 are collinear, p3 is significant
    if (d3 * d3 <= distanceToleranceSquare * (dx * dx + dy * dy)) {
      if (angleTolerance < ANGLE_TOLERANCE_EPSILON) {
        points[points.length] = [x23, y23]
        return
      }

      // Angle Condition
      da1 = abs(atan2(y4 - y3, x4 - x3) - atan2(y3 - y2, x3 - x2))
      if (da1 >= π) da1 = 2 * π - da1
      if (da1 < angleTolerance) {
        points[points.length] = [x2, y2]
        points[points.length] = [x3, y3]
        return
      }
      if (cuspLimit !== 0 && da1 > cuspLimit) {
        points[points.length] = [x3, y3]
        return
      }
    }
  }
  else if (sum === 2) {
    // p1, p3, p4 are collinear, p2 is significant
    if (d2 * d2 <= distanceToleranceSquare * (dx * dx + dy * dy)) {
      if (angleTolerance < ANGLE_TOLERANCE_EPSILON) {
        points[points.length] = [x23, y23]
        return
      }

      // Angle Condition
      da1 = abs(atan2(y3 - y2, x3 - x2) - atan2(y2 - y1, x2 - x1))
      if (da1 >= π) da1 = 2 * π - da1
      if (da1 < angleTolerance) {
        points[points.length] = [x2, y2]
        points[points.length] = [x3, y3]
        return
      }
      if (cuspLimit !== 0 && da1 > cuspLimit) {
        points[points.length] = [x2, y2]
        return
      }
    }
  }
  else if (sum === 3) {
    // Regular case
    if ((d2 + d3) * (d2 + d3) <= distanceToleranceSquare * (dx * dx + dy * dy)) {
      // If the curvature doesn't exceed the distance_tolerance value
      // we tend to finish subdivisions.
      if (angleTolerance < ANGLE_TOLERANCE_EPSILON) {
        points[points.length] = [x23, y23]
        return
      }

      // Angle & Cusp Condition
      k = atan2(y3 - y2, x3 - x2)
      da1 = abs(k - atan2(y2 - y1, x2 - x1))
      da2 = abs(atan2(y4 - y3, x4 - x3) - k)
      if (da1 >= π) da1 = 2 * π - da1
      if (da2 >= π) da2 = 2 * π - da2

      if (da1 + da2 < angleTolerance) {
        // Finally we can stop the recursion
        points[points.length] = [x23, y23]
        return
      }
      if (cuspLimit !== 0) {
        if (da1 > cuspLimit) {
          points[points.length] = [x2, y2]
          return
        }
        if (da2 > cuspLimit) {
          points[points.length] = [x3, y3]
          return
        }
      }
    }
  }

  // Continue subdivision
  bezier(ctx, x1, y1, x12, y12, x123, y123, x1234, y1234, level + 1)
  bezier(ctx, x1234, y1234, x234, y234, x34, y34, x4, y4, level + 1)
}

function distanceSquare (x1, y1, x2, y2) {
  var dx = x2 - x1
  var dy = y2 - y1
  return dx * dx + dy * dy
}

},{}]},{},[1]);
