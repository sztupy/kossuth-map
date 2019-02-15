#!/usr/bin/env ruby

require 'rmagick'
include Magick


BOX = {
  minx: 16.1133,
  miny: 45.7371,
  maxx: 22.8966,
  maxy: 48.5853
}

WIDTH = BOX[:maxx] - BOX[:minx]
HEIGHT = BOX[:maxy] - BOX[:miny]

SIZE = 250
SIZE_2 = (SIZE*(HEIGHT.to_f/WIDTH)).to_i

canvas = Magick::ImageList.new
canvas.new_image(SIZE, SIZE_2)
File.open("streets.csv") do |f|
  f.each_line do |line|
    pts = line.strip.split("\t")
    lon = pts[1].to_f
    lat = pts[2].to_f

    x = (((lon - BOX[:minx]) / WIDTH) * SIZE).to_i
    y = (((lat - BOX[:miny]) / HEIGHT) * SIZE_2).to_i

    puts [lon,lat,x,y].join(" ")

    point = Magick::Draw.new
    point.point(x,y)
    point.draw(canvas)
  end
end

canvas.flip!
canvas.write("hungary.png")
