#!/usr/bin/env ruby

require 'csv'
require 'json'

data = {
  type: "FeatureCollection",
  features: CSV.parse(File.read("streets.csv"), liberal_parsing: true).map do |d|
    r = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [d[0].to_f, d[1].to_f]
      },
      properties: {}
    }

    r[:properties] = {
      name: d[2].to_s
    } unless d[2].to_s == ''

    r
  end
}


File.open("world_kossuth.geojson", "w+") do |out|
  out.print data.to_json
end
