#!/usr/bin/env ruby

require 'csv'
require 'json'

data = {
  type: "FeatureCollection",
  features: CSV.parse(File.read("a-c-kossuth.txt"), col_sep: "\t", liberal_parsing: true).map do |d|
    r = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [d[5].to_f, d[4].to_f]
      },
      properties: {}
    }

    r[:properties][:name] = d[1].to_s unless d[1].to_s == ''
    r[:properties][:asciiname] = d[2].to_s unless d[2].to_s == ''
    r[:properties][:altname] = d[3].to_s unless d[3].to_s == ''

    r
  end
}


File.open("geonames_kossuth.geojson", "w+") do |out|
  out.print data.to_json
end
