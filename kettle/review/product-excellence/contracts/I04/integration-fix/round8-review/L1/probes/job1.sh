#!/bin/bash
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-control-toastroom2 toastroom2.mjs 5301 -- {BASE} {REV} {OUT} '667x375@200:light,844x390@200:dark' update
$R c1-control-accept accept.mjs 5301 -- {BASE} {REV} {OUT} '667x375@200:light' wheel
$R c1-control-accept accept.mjs 5301 -- {BASE} {REV} {OUT} '844x390@200:dark' touch
