#!/usr/bin/env bash

# convert planet data to o5m format
osmconvert planet-200720.osm.pbf -o=planet.o5m

# filter out anythinng that does not have any relevant tags. Ue tricks as check is case-sennsitive
# this is only a pre-filter we're going to go another go later
osmfilter planet.o5m --keep="*=*kossuth* or *=*KOSSUTH* or *=*Kossuth*" --drop-author -o="kossuth-filtered.o5m"

# convert all polygons to points
osmconvert kossuth-filtered.o5m --all-to-nodes -o="kossuth-nodes.o5m"

# second phase filtering, now with some additional restrictions
osmfilter kossuth-nodes.o5m --keep="*name*=*kossuth* or *name*=*KOSSUTH* or *name*=*Kossuth* or *inscription*=*ossuth* or *description*=*ossuth* or *ref*=*ossuth*" --drop-author --ignore-dependencies -o="kossuth-nodes-filtered.osm"

# Convert result to geojson
osmtogeojson kossuth-nodes-filtered.osm > kossuth.geojson


osmfilter planet.o5m --keep="*=*budapest* or *=*BUDAPEST* or *=*Budapest*" --drop-author -o="budapest-filtered.o5m"
osmconvert budapest-filtered.o5m --all-to-nodes -o="budapest-nodes.o5m"
osmfilter budapest-nodes.o5m --keep="*name*=*budapest* or *name*=*BUDAPEST* or *name*=*Budapest* or *inscription*=*udapest* or *description*=*udapest* or *ref*=*udapest*" --drop-author --ignore-dependencies -o="budapest-nodes-filtered.osm"
osmtogeojson budapest-nodes-filtered.osm > budapest.geojson


osmfilter planet.o5m --keep="*=*petofi* or *=*PETOFI* or *=*Petofi* or *=*petőfi* or *=*Petőfi* or *=*PETŐFI* or *=*petöfi* or *=*PETÖFI* or *=*Petöfi*" --drop-author -o="petofi-filtered.o5m"
osmconvert petofi-filtered.o5m --all-to-nodes -o="petofi-nodes.o5m"
osmfilter petofi-nodes.o5m --keep="*=*petofi* or *=*PETOFI* or *=*Petofi* or *=*petőfi* or *=*Petőfi* or *=*PETŐFI* or *=*petöfi* or *=*PETÖFI* or *=*Petöfi*" --drop-author --ignore-dependencies -o="petofi-nodes-filtered.osm"
osmtogeojson petofi-nodes-filtered.osm > petofi.geojson


osmfilter planet.o5m --keep="*=*rakoczi* or *=*RAKOCZI* or *=*Rakoczi* or *=*rákóczi* or *=*Rákóczi* or *=*RÁKÓCZI*" --drop-author -o="rakoczi-filtered.o5m"
osmconvert rakoczi-filtered.o5m --all-to-nodes -o="rakoczi-nodes.o5m"
osmfilter rakoczi-nodes.o5m --keep="*=*rakoczi* or *=*RAKOCZI* or *=*Rakoczi* or *=*rákóczi* or *=*Rákóczi* or *=*RÁKÓCZI*" --drop-author --ignore-dependencies -o="rakoczi-nodes-filtered.osm"
osmtogeojson rakoczi-nodes-filtered.osm > rakoczi.geojson


osmfilter planet.o5m --keep="*=*Balaton* or *=*balaton* or *=*BALATON*" --drop-author -o="balaton-filtered.o5m"
osmconvert balaton-filtered.o5m --all-to-nodes -o="balaton-nodes.o5m"
osmfilter balaton-nodes.o5m --keep="*name*=*balaton* or *name*=*BALATON* or *name*=*Balaton* or *inscription*=*Balaton* or *description*=*Balaton* or *ref*=*Balaton*" --drop-author --ignore-dependencies -o="balaton-nodes-filtered.osm"
osmtogeojson balaton-nodes-filtered.osm > balaton.geojson


osmfilter planet.o5m --keep="*=*Borsod* or *=*borsod* or *=*BORSOD*" --drop-author -o="borsod-filtered.o5m"
osmconvert borsod-filtered.o5m --all-to-nodes -o="borsod-nodes.o5m"
osmfilter borsod-nodes.o5m --keep="*name*=*borsod* or *name*=*BORSOD* or *name*=*Borsod* or *inscription*=*Borsod* or *description*=*Borsod* or *ref*=*Borsod*" --drop-author --ignore-dependencies -o="borsod-nodes-filtered.osm"
osmtogeojson borsod-nodes-filtered.osm > borsod.geojson


osmfilter planet.o5m --keep="*=*London* or *=*london* or *=*LONDON*" --drop-author -o="london-filtered.o5m"
osmconvert london-filtered.o5m --all-to-nodes -o="london-nodes.o5m"
osmfilter london-nodes.o5m --keep="*name*=*london* or *name*=*LONDON* or *name*=*London* or *inscription*=*London* or *description*=*London* or *ref*=*London*" --drop-author --ignore-dependencies -o="london-nodes-filtered.osm"
osmtogeojson london-nodes-filtered.osm > london.geojson


osmfilter planet.o5m --keep="*=*Edinburgh* or *=*edinburgh* or *=*EDINBURGH* or *=*Dunedin* or *=*DUNEDIN* or *=*dunedin*" --drop-author -o="edinburgh-filtered.o5m"
osmconvert edinburgh-filtered.o5m --all-to-nodes -o="edinburgh-nodes.o5m"
osmfilter edinburgh-nodes.o5m --keep="*name*=*edinburgh* or *name*=*EDINBURGH* or *name*=*Edinburgh* or *inscription*=*Edinburgh* or *description*=*Edinburgh* or *ref*=*Edinburgh* or *name*=*dunedin* or *name*=*Dunedin* or *name*=*DUNEDIN* or *inscription*=*Dunedin* or *ref*=*Dunedin*" --drop-author --ignore-dependencies -o="edinburgh-nodes-filtered.osm"
osmtogeojson edinburgh-nodes-filtered.osm > edinburgh.geojson


osmfilter planet.o5m --keep="*=*Lenin* or *=*lenin* or *=*LENIN*" --drop-author -o="lenin-filtered.o5m"
osmconvert lenin-filtered.o5m --all-to-nodes -o="lenin-nodes.o5m"
osmfilter lenin-nodes.o5m --keep="*name*=*lenin* or *name*=*LENIN* or *name*=*Lenin* or *inscription*=*Lenin* or *description*=*Lenin* or *ref*=*Lenin*" --drop-author --ignore-dependencies -o="lenin-nodes-filtered.osm"
osmtogeojson lenin-nodes-filtered.osm > lenin.geojson


osmfilter planet.o5m --keep="*=*Marx* or *=*marx* or *=*MARX*" --drop-author -o="marx-filtered.o5m"
osmconvert marx-filtered.o5m --all-to-nodes -o="marx-nodes.o5m"
osmfilter marx-nodes.o5m --keep="*name*=*marx* or *name*=*MARX* or *name*=*Marx* or *inscription*=*Marx* or *description*=*Marx* or *ref*=*Marx*" --drop-author --ignore-dependencies -o="marx-nodes-filtered.osm"
osmtogeojson marx-nodes-filtered.osm > marx.geojson


osmfilter planet.o5m --keep="*=*Trump* or *=*trump* or *=*TRUMP*" --drop-author -o="trump-filtered.o5m"
osmconvert trump-filtered.o5m --all-to-nodes -o="trump-nodes.o5m"
osmfilter trump-nodes.o5m --keep="*name*=*trump* or *name*=*TRUMP* or *name*=*Trump* or *inscription*=*Trump* or *description*=*Trump* or *ref*=*Trump*" --drop-author --ignore-dependencies -o="trump-nodes-filtered.osm"
osmtogeojson trump-nodes-filtered.osm > trump.geojson


osmfilter planet.o5m --keep="*=*Soros* or *=*soros* or *=*SOROS*" --drop-author -o="soros-filtered.o5m"
osmconvert soros-filtered.o5m --all-to-nodes -o="soros-nodes.o5m"
osmfilter soros-nodes.o5m --keep="*name*=*soros* or *name*=*SOROS* or *name*=*Soros* or *inscription*=*Soros* or *description*=*Soros* or *ref*=*Soros*" --drop-author --ignore-dependencies -o="soros-nodes-filtered.osm"
osmtogeojson soros-nodes-filtered.osm > soros.geojson
