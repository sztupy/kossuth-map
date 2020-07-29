#!/usr/bin/env ruby

require 'csv'
require 'json'

data = {
  type: "FeatureCollection",
  features: CSV.parse(File.read("g-n-kossuth.txt"), headers: true, col_sep: "\t", liberal_parsing: true).map do |d|
    r = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [d['lon'].to_f, d['lat'].to_f]
      },
      properties: {}
    }

    d.each_pair do |k,v|
      r[:properties][k] = v
    end

    r
  end
}


File.open("osmnnames_kossuth.geojson", "w+") do |out|
  out.print data.to_json
end
