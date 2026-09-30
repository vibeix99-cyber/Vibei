#!/usr/bin/env python3
"""One approved Higgsfield generation, safely.

usage: run.py <job-name> <endpoint-id> <body.json>

- The Idempotency-Key is created once and stored in <job>.state.json before anything is sent.
- If the state already has a request_id, nothing is submitted again: it only polls and downloads.
- A timeout / network error / 5xx on submission is retried with the SAME key (Higgsfield returns the
  original request instead of creating or charging a new one). 4xx is never retried.
- No Authorization header is sent: the Cloud credential proxy adds it. No headers are printed.
"""
import json, os, random, sys, time, uuid, urllib.request, urllib.error

job, endpoint, body_path = sys.argv[1:4]
state_path = f"{job}.state.json"
state = json.load(open(state_path)) if os.path.exists(state_path) else {}
body = open(body_path, "rb").read()
if "key" not in state:
    state.update(key=str(uuid.uuid4()), endpoint=endpoint, body_sha=__import__("hashlib").sha256(body).hexdigest())
    json.dump(state, open(state_path, "w"), indent=1)
assert state["endpoint"] == endpoint and state["body_sha"] == __import__("hashlib").sha256(body).hexdigest(), "body/endpoint changed: refusing to reuse this job"

UA = {"User-Agent": "kettle-media/1.0"}
def call(method, url, data=None, headers=None, timeout=60):
    req = urllib.request.Request(url, data=data, method=method, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()

if "estimate" not in state:
    _, raw = call("POST", f"https://api.higgsfield.ai/estimate/{endpoint}", body, {"Content-Type": "application/json"})
    state["estimate"] = json.loads(raw); json.dump(state, open(state_path, "w"), indent=1)
    print("estimate:", state["estimate"].get("credits"), "credits /", state["estimate"].get("usd"), "USD")
if "request_id" not in state:
    for attempt in range(4):
        try:
            code, raw = call("POST", f"https://api.higgsfield.ai/{endpoint}", body,
                             {"Content-Type": "application/json", "Idempotency-Key": state["key"]})
            res = json.loads(raw)
            state.update(request_id=res["request_id"], status_url=res["status_url"], submitted_http=code)
            json.dump(state, open(state_path, "w"), indent=1)
            print("submitted:", code, res.get("status"), res["request_id"])
            break
        except urllib.error.HTTPError as e:
            msg = e.read()[:400].decode("utf8", "replace")
            if e.code < 500:
                print("rejected:", e.code, msg); sys.exit(2)          # never retried
            print("server error, retrying with the same key:", e.code)
        except (urllib.error.URLError, TimeoutError) as e:
            print("network/timeout, retrying with the same key:", type(e).__name__)
        time.sleep(2 ** (attempt + 1))
    else:
        print("could not confirm submission; state kept, re-run to resume with the same key"); sys.exit(3)
else:
    print("already submitted:", state["request_id"], "- polling only")

# The credential proxy authenticates api.higgsfield.ai only; the documented status path lives there too.
status_url = f"https://api.higgsfield.ai/requests/{state['request_id']}/status"
delay, t0 = 2.0, time.time()
while True:
    try:
        _, raw = call("GET", status_url, timeout=30)
        res = json.loads(raw)
    except urllib.error.HTTPError as e:
        if e.code in (401, 404): print("status error:", e.code); sys.exit(4)
        res = {"status": "retry"}
    except (urllib.error.URLError, TimeoutError):
        res = {"status": "retry"}
    st = res.get("status")
    if st in ("completed", "failed", "nsfw", "canceled"):
        break
    if time.time() - t0 > 900: print("still", st, "after 15 min; re-run later to resume"); sys.exit(5)
    time.sleep(delay + random.uniform(0, 0.5)); delay = min(delay * 1.5, 10.0)

state.update(final_status=st); json.dump(state, open(state_path, "w"), indent=1)
extra = {k: v for k, v in res.items() if k not in ("images", "status", "request_id", "status_url", "cancel_url")}
if extra: print("other status fields:", json.dumps(extra)[:300])
if not os.path.exists(f"{job}.ledgered"):
    charged = st == "completed"
    open("ledger.jsonl", "a").write(json.dumps({"job": job, "endpoint": endpoint, "request_id": state["request_id"], "status": st,
        "credits": state["estimate"].get("credits") if charged else "0", "usd": state["estimate"].get("usd") if charged else "0"}) + "\n")
    open(f"{job}.ledgered", "w").write("1")
print("final status:", st, "| error:", res.get("error"))
if st == "completed":
    urls = [i["url"] for i in res.get("images", [])] + ([res["video"]["url"]] if isinstance(res.get("video"), dict) else [])
    state.update(output_urls=urls); json.dump(state, open(state_path, "w"), indent=1)
    for i, u in enumerate(urls):
        _, data = call("GET", u, timeout=120)
        out = f"{job}-{i}{os.path.splitext(u.split('?')[0])[1] or '.bin'}"
        open(out, "wb").write(data)
        print("downloaded:", out, len(data), "bytes")
