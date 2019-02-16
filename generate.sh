#!/usr/bin/env bash

export NODE_OPTIONS="--max-old-space-size=8192"

generate_details() {
    ./generate_data.js "configs/$1.json"
    convert "images/$1.png" -background white -alpha Remove -quality 70 "images/$1.jpg"
    rm "images/$1.png"
    gzip -f "images/$1.svg"
    gzip -f "images/$1.json"
}

echo "Kossuth"
generate_details "kossuth"

echo "Kossuth Small"
generate_details "kossuth_small"

echo "Sport"
generate_details "stadionok"

echo "Sport Small"
generate_details "stadionok_small"

echo "Distilleries"
generate_details "scottish_distilleries"

echo "Pubs"
generate_details "gb_pubs"
