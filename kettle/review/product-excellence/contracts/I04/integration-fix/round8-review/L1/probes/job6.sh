#!/bin/bash
# Check 3b: LEAD-D1 (markdone-a3; KEY unset = markdone-a2): control e866118 :5304 first, then R8 :5306 x2 per configuration
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
C1='375x667@200:light,375x667@200:dark,844x390@200:light'
C2='375x667@200:light,375x667@200:dark'
$R leadd1-case1-ctl markdone-a3.mjs 5304 -- {BASE} {REV} {OUT} $C1 0 0 7
$R leadd1-case2-ctl markdone-a3.mjs 5304 -- {BASE} {REV} {OUT} $C2 1 0 11
KEY=1 $R leadd1-case2key-ctl markdone-a3.mjs 5304 -- {BASE} {REV} {OUT} 844x390@200:light 1 0 11
$R leadd1-case1-r8 markdone-a3.mjs 5306 -- {BASE} {REV} {OUT} $C1,$C1 0 0 7
$R leadd1-case2-r8 markdone-a3.mjs 5306 -- {BASE} {REV} {OUT} $C2,$C2 1 0 11
KEY=1 $R leadd1-case2key-r8 markdone-a3.mjs 5306 -- {BASE} {REV} {OUT} 844x390@200:light,844x390@200:light 1 0 11
