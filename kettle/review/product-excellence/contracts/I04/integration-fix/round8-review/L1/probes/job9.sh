#!/bin/bash
# Combined remaining queue, in priority order (check 1 rest, check 2, check 3). One browser at a time.
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
L=/home/user/wt/r8-trial/kettle/.tmp/L1
# check 1 follow-up (timeline): l1dock2 at 667x375 @200 touch, where l1dock found settled partly-visible toast frames on R8
$R c1-l1dock2-r8 l1dock2.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light,667x375@200:light,667x375@200:dark' touch
# diagnostic (labelled): 844x390 @200 dark wheel lost its page in 3 of 5 runs; ask the page what document it is after the failure
$R c1-r8-accept-diag2 accept-diag2.mjs 5306 -- {BASE} {REV} {OUT} '844x390@200:dark,844x390@200:dark,844x390@200:dark' wheel
$R c1-ctl-accept-diag2 accept-diag2.mjs 5301 -- {BASE} {REV} {OUT} '844x390@200:dark,844x390@200:dark' wheel
# check 1: accept.mjs at 150 % and 100 % on R8 (one input per config, both inputs per size)
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@150:light,844x390@150:dark' wheel
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@100:dark,844x390@100:light' touch
# check 1: Close / Ambience / Mute sweep, control 49ea1de first, then R8, same configuration
$R c1-close-ctl closecheck2.mjs 5305 -- {BASE} {REV} {OUT} '667x375@200:light' focus,paused,over-carried measure,tap
$R c1-close-r8 closecheck2.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light' focus,paused,over-carried measure,tap
# check 2: portrait geometry, b39202f then R8
CFG='375x667@100:light,375x667@100:dark,375x667@200:light,375x667@200:dark,390x844@100:light,390x844@100:dark,390x844@200:light,390x844@200:dark'
$R c2-geom accept.mjs 5301 -- {BASE} {REV} {OUT} "$CFG" geom
$R c2-geom accept.mjs 5306 -- {BASE} {REV} {OUT} "$CFG" geom
# check 3a/3b
$L/job5.sh
$L/job6.sh
