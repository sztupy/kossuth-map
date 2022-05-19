#!/usr/bin/env ruby

codes = []

require 'json'

ARGF.each_line do |line|
  id,code,lat,lon = *line.strip.split(',',-1)
  next if lat == '' || lon == ''
  c = code.scan(/\A([A-Z]*)([0-9]*)( )([0-9]*)([A-Z]*)\Z/)
  if c
    c = c[0]
    if c
      c[1] = c[1].to_i
      c[3] = c[3].to_i
      codes << [c,lat,lon]
    end
  end
end

puts "var lines = " + codes.sort_by!{|c| c[0]}.map{|c| [c[0].join,c[1].to_f,c[2].to_f] }.to_json
