#!/bin/bash

mkdir dist

python3 tools/build.py -n -t browser
cp build/highlight.pack.js ./dist/highlight-browser.js

#python3 tools/build.py -n -t node

#python3 tools/build.py -n -t cdn

python3 tools/build.py -n -t umd
cp build/highlight.pack.js ./dist/highlight-umd.js
