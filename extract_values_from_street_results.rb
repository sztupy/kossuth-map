#!/usr/bin/env ruby

name = nil
data = {}
ARGF.each_line do |line|
  case line.strip
  when /Running (.*)/
    name = $1
    data = {}
  when /Point from (.*),(.*) to (.*),(.*) is (.*)km/
    unless data[:fromlat]
      data[:fromlat] = $1.to_f.round(5).to_s
      data[:fromlon] = lon1 = $2.to_f.round(5).to_s
      data[:tolat] = lat2 = $3.to_f.round(5).to_s
      data[:tolon] = lon2 = $4.to_f.round(5).to_s
      data[:distance] = dest = $5.to_f.round(2).to_s
    end
  when /destMedian: (.*),/
    data[:median] = $1.to_f.round(2).to_s
  when /Finished/
    puts <<-"DATA"
      <li>
        <b>#{name}</b>:
        Furthest: #{data[:distance]}km,
        Average: #{data[:median]}km,
        from <a href="https://tools.wmflabs.org/geohack/geohack.php?pagename=Template:Coord&params=#{data[:fromlat]}_N_#{data[:fromlon]}_E_">#{data[:fromlat]},#{data[:fromlon]}</a>
        to <a href="https://tools.wmflabs.org/geohack/geohack.php?pagename=Template:Coord&params=#{data[:tolat]}_N_#{data[:tolon]}_E_">#{data[:tolat]},#{data[:tolon]}</a>
        <a href="https://github.com/sztupy/kossuth-map/blob/gh-pages/images/street_#{name}.geojson">(Interactive Map)</a>
      </li>
    DATA
    data = {}
  end
end
