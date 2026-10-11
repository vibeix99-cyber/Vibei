#!/bin/bash
# Extra, if time allows: Close control at the configuration where 49ea1de reproduces it (375x667 @200 light), then R8; page-loss tally; remaining 150/100 configs
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-close2-ctl closecheck2.mjs 5305 -- {BASE} {REV} {OUT} '375x667@200:light' over-carried measure,closetap
$R c1-close2-r8 closecheck2.mjs 5306 -- {BASE} {REV} {OUT} '375x667@200:light,667x375@200:dark' over-carried measure,closetap
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '844x390@200:light,844x390@200:dark' wheel
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@150:dark,844x390@150:light' touch
$R c1-r8-accept accept.mjs 5306 -- {BASE} {REV} {OUT} '667x375@100:light,844x390@100:dark' wheel
