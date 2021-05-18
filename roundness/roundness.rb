#!/usr/bin/env ruby

require 'json'
require 'open3'

data = JSON.parse(File.read("geometries.json"))

result = {}

def get_polygon_data(polygon)
  num = 0
  perim = 0
  area = 0

  Open3.popen3("planimeter -w -E -r") do |input, out|
    polygon[0].each do |c|
      input.puts "#{c[0]} #{c[1]}"
    end
    input.close
    res = out.read.chomp
    num,perim,area = *res.split.map(&:to_f)
  end

  [perim, area]
end

data.each_pair do |key, value|
  perim = 0
  area = 0

  case value["geometry"]["type"]
  when "Polygon"
    p,a = *get_polygon_data(value["geometry"]["coordinates"])
    perim += p.abs
    area += a.abs
  when "MultiPolygon"
    value["geometry"]["coordinates"].each do |coords|
      p,a = *get_polygon_data(coords)
      perim += p.abs
      area += a.abs
    end
  end

  roundness = (Math::PI * 4 * area) / (perim * perim)

  result["#{key} #{value["name"]}"] = roundness
end

result.to_h.sort_by{|a| a[1]}.each do |name, round|
  puts "#{name}: #{round}"
end
