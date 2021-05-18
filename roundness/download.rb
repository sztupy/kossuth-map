#!/usr/bin/env ruby

require 'json'
require 'net/http'

areas = JSON.parse(File.read("areas.json"))

areas.each do |key, value|
  p key
  data = JSON.parse(Net::HTTP.get(URI("https://global.mapit.mysociety.org/area/#{key}.geojson")))
  areas[key][:geometry] = data
end

File.open("geometries.json","w+") do |out|
  out.print areas.to_json
end
