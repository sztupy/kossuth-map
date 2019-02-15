#!/usr/bin/env ruby

require 'ruby_vor'
require 'pp'

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

    #x = (((lon - BOX[:minx]) / WIDTH) * SIZE).to_i
    #y = SIZE_2 - (((lat - BOX[:miny]) / HEIGHT) * SIZE_2).to_i

    points << [(lon*100).to_i.to_f,(lat*100).to_i.to_f] if lon > BOX2[:minx] && lon < BOX[:maxx] && lat > BOX[:miny] && lat < BOX[:maxy]

#    puts [lon,lat,x,y].join(" ")

#    point = Magick::Draw.new
#    point.point(x,y)
#    point.draw(canvas)
  end
end

p points.count
points.uniq!
points = points.map{|p| RubyVor::Point.new(p[0], p[1])}
p points.count

comp = RubyVor::VDDT::Computation.from_points(points)
#p comp.minimum_spanning_tree
#pp comp.nn_graph

vpoints = []
comp.voronoi_diagram_raw.each do |data|
  vpoints << [data[1],data[2]] if data[0] == :v
end

p vpoints.count

xxx = []

vpoints.each do |vp|
  next unless vp[0]/100 > BOX2[:minx] && vp[0]/100 < BOX[:maxx] && vp[1]/100 > BOX[:miny] && vp[1]/100 < BOX[:maxy]
  dist = 99999999999999999
  xx = 0
  yy = 0
  points.each do |po|
    d2 = (vp[0] - po.x)*(vp[0] - po.x) + (vp[1] - po.y)*(vp[1] - po.y)
    if d2 < dist
      dist = d2
      xx = po.x
      yy = po.y
    end
  end
  xxx << [dist,vp[1]/100,vp[0]/100, yy/100, xx/100] if vp[1].truncate(-2) == 4700 && vp[0].truncate(-2) == 2100
end

xxx.sort_by!{|x|x[0]}

pp xxx

RubyVor::Visualizer.make_svg(comp, :name => 'dia3.svg', :triangulation => false, :voronoi_diagram => true)
#RubyVor::Visualizer.make_svg(comp, :name => 'tri.svg')
#RubyVor::Visualizer.make_svg(comp, :name => 'mst.svg', :triangulation => false, :mst => true)

