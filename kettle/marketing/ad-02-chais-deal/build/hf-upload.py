#!/usr/bin/env python3
"""Upload one local reference file to Higgsfield storage and print only its public URL.

usage: hf-upload.py <file> <content-type>      e.g. hf-upload.py opening-first.png image/png

POST /files/generate-upload-url → PUT the bytes to the presigned upload_url with the returned headers.
The presigned upload URL is never printed or stored. No Authorization header is sent: the Cloud credential
proxy adds it for api.higgsfield.ai. Results are cached in uploads.json (file sha256 → public_url), so a
re-run never uploads the same bytes twice.
"""
import hashlib, json, os, sys, urllib.request

path, ctype = sys.argv[1:3]
data = open(path, "rb").read()
sha = hashlib.sha256(data).hexdigest()
cache = json.load(open("uploads.json")) if os.path.exists("uploads.json") else {}
if sha in cache:
    print(cache[sha]["public_url"]); sys.exit(0)

UA = {"User-Agent": "kettle-media/1.0"}
req = urllib.request.Request("https://api.higgsfield.ai/files/generate-upload-url", method="POST",
                             data=json.dumps({"content_type": ctype}).encode(), headers={**UA, "Content-Type": "application/json"})
res = json.loads(urllib.request.urlopen(req, timeout=60).read())
put = urllib.request.Request(res["upload_url"], method="PUT", data=data, headers={**UA, **(res.get("upload_headers") or {"Content-Type": ctype})})
code = urllib.request.urlopen(put, timeout=120).status
assert 200 <= code < 300, f"upload failed: HTTP {code}"
cache[sha] = {"file": os.path.basename(path), "public_url": res["public_url"], "bytes": len(data)}
json.dump(cache, open("uploads.json", "w"), indent=1)
print(res["public_url"])
