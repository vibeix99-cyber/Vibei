#!/bin/bash
# R8 :5306 — M8 accept.mjs at 150 % and 100 % (4 configs each; inputs alternate so each size x theme x text has one input and each size has both)
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@150:light,844x390@150:dark' wheel
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@150:dark,844x390@150:light' touch
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@100:dark,844x390@100:light' wheel
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@100:light,844x390@100:dark' touch
