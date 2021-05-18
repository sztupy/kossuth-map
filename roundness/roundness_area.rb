#!/usr/bin/env ruby

require 'json'
require 'open3'

data = JSON.parse(File.read("geometries.json"))

result = {}

def get_polygon_data(polygon)
  circle = 0
  Open3.popen3("./max-circle.js skipinside") do |input, out, err|
    polygon[0].each do |c|
      input.puts "#{c[0]} #{c[1]}"
    end
    input.close
    data = out.read.chomp
    res = JSON.parse(data) rescue { 'properties' => { 'radius' => 0, 'maxRadius' => 0 } }
    circle = res['properties']['maxRadius'].to_f
  end

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

  if circle > 0
    area.abs / (circle * 1000 * circle * 1000 * Math::PI)
  else
    0
  end
end

data.each_pair do |key, value|
  p "#{key} #{value["name"]}"

  roundness = 0

  case value["geometry"]["type"]
  when "Polygon"
    roundness = get_polygon_data(value["geometry"]["coordinates"])
  when "MultiPolygon"
    coords = value["geometry"]["coordinates"][0]
    roundness = get_polygon_data(coords)
  end

  p roundness

  result["#{key} #{value["name"]}"] = roundness
end

p "-----------"

result.to_h.sort_by{|a| a[1]}.each do |name, round|
  puts "#{name}: #{round}"
end
