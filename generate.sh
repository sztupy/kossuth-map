#!/usr/bin/env bash

./generate_data.js configs/kossuth.json
convert images/kossuth.png -background white -alpha Remove -quality 70 images/kossuth.jpg
rm images/kossuth.png

./generate_data.js configs/kossuth_small.json

./generate_data.js configs/stadionok.json
convert images/stadionok.png -background white -alpha Remove -quality 70 images/stadionok.jpg
rm images/stadionok.png

./generate_data.js configs/stadionok_small.json

./generate_data.js configs/scottish_distilleries.json
convert images/scottish_distilleries.png -background white -alpha Remove -quality 70 images/scottish_distilleries.jpg
rm images/scottish_distilleries.png

#./generate_data.js configs/gb_pubs.json
#convert images/gb_pubs.png -background white -alpha Remove -quality 70 images/gb_pubs.jpg
#rm images/gb_pubs.png
