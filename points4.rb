#!/usr/bin/env ruby

require 'ruby_vor'
require 'pp'
require 'json'

BOX = {
  minx: 16.1133,
  miny: 45.7371,
  maxx: 22.8966,
  maxy: 48.5853
}

BOX2 = {
  minx: 20.59,
  miny: 46.95,
  maxx: 21.33,
  maxy: 47.70
}

WIDTH = BOX[:maxx] - BOX[:minx]
HEIGHT = BOX[:maxy] - BOX[:miny]

SIZE = 2000
SIZE_2 = (SIZE*(HEIGHT.to_f/WIDTH)).to_i

points = []

File.open("streets.csv") do |f|
  f.each_line do |line|
    pts = line.strip.split("\t")
    lon = pts[1].to_f
    lat = pts[2].to_f

    points << [lon,lat]
  end
end

puts points.to_json
