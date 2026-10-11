#!/bin/bash
# Check 2: portrait geometry (accept.mjs geom mode), control b39202f first, then R8; same session
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
CFG='375x667@100:light,375x667@100:dark,375x667@200:light,375x667@200:dark,390x844@100:light,390x844@100:dark,390x844@200:light,390x844@200:dark'
$R c2-geom accept.mjs 5301 -- {BASE} {REV} {OUT} "$CFG" geom
$R c2-geom accept.mjs 5306 -- {BASE} {REV} {OUT} "$CFG" geom
