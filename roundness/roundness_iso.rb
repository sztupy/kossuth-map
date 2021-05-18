#!/usr/bin/env ruby

require 'json'
require 'open3'

data = JSON.parse(File.read("geometries.json"))

result = {}

def get_polygon_data(polygon)
  Open3.popen3("./max-circle.js") do |input, out, err|
    polygon[0].each do |c|
      input.puts "#{c[0]} #{c[1]}"
    end
    input.close
    data = out.read.chomp
    p data
    p err.read.chomp
    res = JSON.parse(data) rescue { 'properties' => { 'radius' => 0, 'maxRadius' => 1 } }
    return res['properties']['radius'].to_f / res['properties']['maxRadius'].to_f
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
