#!/bin/bash
# Close / Ambience / Mute sweep (Lane C closecheck2.mjs, unedited): control 49ea1de :5305 first (1 config), then R8 :5306 (2 configs)
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-close-ctl closecheck2.mjs 5305 -- {BASE} {REV} {OUT} '667x375@200:light' focus,paused,over-carried measure,tap,closetap
$R c1-close-r8 closecheck2.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light,844x390@200:dark' focus,paused,over-carried measure,tap,closetap
