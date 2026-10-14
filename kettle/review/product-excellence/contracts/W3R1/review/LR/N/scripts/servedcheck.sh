#!/bin/bash
# servedcheck.sh <worktree> <port>: scene files served by dev == committed blobs
W=$1; P=$2
for f in src/scene/engine/palette.ts src/scene/engine/chai.ts src/scene/engine/chaiModel.ts src/scene/engine/Engine.ts tests/chai3d.spec.ts; do
  want=$(git -C $W show HEAD:kettle/$f | sha256sum | cut -c1-16)
  got=$(curl -s "http://127.0.0.1:$P/$f?raw" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.match(/^export default (".*")\s*;?\s*$/s);process.stdout.write(m?JSON.parse(m[1]):"<no-raw>")})' | sha256sum | cut -c1-16)
  [ "$want" = "$got" ] && r=OK || r=MISMATCH
  echo "  $f $r want=$want got=$got"
done
echo "HEAD $(git -C $W rev-parse --short HEAD) src $(git -C $W rev-parse --short HEAD:kettle/src)"
