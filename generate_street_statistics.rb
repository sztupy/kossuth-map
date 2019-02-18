#!/usr/bin/env ruby

system('osmconvert hungary2.osm --all-to-nodes --csv="@lon @lat name" --csv-separator=, > dataset.csv')

DATASETS = {
  "kossuth" => "kossuth",
  "petofi" => "pet[őöo]fi",
  "ady" => "\\bady",
  "jattila" => "j[óo]zsef attila",
  "fout" => "\\bf[őo]\\b\\|f[őöo][úu]t\\|f[őöo]t[ée]r",
  "szabadsag" => "szabads[áa]g",
  "szechenyi" => "sz[ée]ch[ée]nyi",
  "dozsa" => "d[óo]zsa",
  "szent" => "\\bszent",
  "hunyadi" => "hunyadi",
  "matyas" => "m[áa]ty[áa]s kir",
  "lenin" => "\\blenin",
  "deak" => "de[áa]k",
  "babits" => "babits",
  "csokonai" => "csokonai",
  "arpad" => ",[Ááa]rp[áa]d",
  "jokai" => "j[óo]kai",
  "arany" => "arany j[áa]nos",
  "vorosmarty" => "v[öo]r[öo]smarty",
  "beke" => "b[ée]ke",
  "zrinyi" => "zr[íi]nyi",
  "majus" => "m[áa]jus 1",
  "marcius" => "m[áa]rcius 15",
  "hosok" => "h[őöo]s[öo]k"
  "rakoczi" => "r[áa]k[óo]czi"
}

DATASETS.each do |key, value|
  puts "Running #{key}"
  system("grep -i '"+value+"' dataset.csv > datasets/street_#{key}.csv")
  File.open("datasets/street_#{key}.csv") do |f|
    File.open("datasets/street_#{key}.json","w+") do |out|
      out.print("[")
      first = true
      f.each_line do |line|
        out.print(",") unless first
        out.print("[",line.strip.split(",")[0..1].join(","),"]")
        first=false
      end
      out.print("]")
    end
  end

  File.open("configs/street_#{key}.json","w+") do |out|
    out.puts <<-"CONFIG"
    {
      "INPUT_FILE_NAME": "datasets/street_#{key}.json",
      "BOUNDARY_FILE_NAME": "boundaries/hungary.json",
      "OUTPUT_FILE_NAME": "images/street_#{key}",
      "CLUSTERING_MINIMUM_DISTANCE": 15,
      "NUMBER_OF_CLUSTERS": 40,
      "IMAGE_WIDTH": 10000,
      "SAVE_PNG": false,
      "SAVE_SVG": false,
      "SAVE_JSON": false
    }
    CONFIG
  end
  system("rm datasets/street_#{key}.csv")

  system("./generate_data.js configs/street_#{key}.json")
  puts "Finished #{key}"
end

system('rm dataset.csv')
