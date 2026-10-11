#!/bin/bash
# R8 :5306 — lead's probe (update + arrive) at 200 %, then M8 accept.mjs at 200 % (4 configs x wheel,touch)
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-r8-toastroom2 toastroom2.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark' update
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light,844x390@200:dark' wheel,touch
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:dark,844x390@200:light' wheel,touch
