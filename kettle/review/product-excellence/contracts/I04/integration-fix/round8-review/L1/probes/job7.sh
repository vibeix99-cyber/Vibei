#!/bin/bash
# Check 1 (independent L1 probe l1dock.mjs): control b39202f first, then R8; 667x375@200 light and 844x390@200 dark, wheel and touch
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
$R c1-l1dock-ctl l1dock.mjs 5301 -- {BASE} {REV} {OUT} '667x375@200:light' touch
$R c1-l1dock-r8 l1dock.mjs 5306 -- {BASE} {REV} {OUT} '667x375@200:light,844x390@200:light' touch
$R c1-l1dock-r8 l1dock.mjs 5306 -- {BASE} {REV} {OUT} '844x390@200:dark,667x375@200:dark' wheel
# Diagnostic (labelled): the 844x390 @200 dark wheel run lost its page to a full navigation on R8 (as M8's did); repeat with navigation/console logging
$R c1-r8-accept-diag accept-diag.mjs 5306 -- {BASE} {REV} {OUT} '844x390@200:dark' wheel
$R c1-r8-accept-diag accept-diag.mjs 5306 -- {BASE} {REV} {OUT} '844x390@200:dark' wheel
