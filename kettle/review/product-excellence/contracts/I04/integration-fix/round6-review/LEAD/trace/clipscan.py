# Scan a webm clip (25 fps): mean gray of a crop per frame, via PNG crops (the only encoder here) and a tiny PNG decoder.
# Usage: clipscan.py clip.webm x y w h outdir
import subprocess, sys, zlib, struct, glob, os
clip, x, y, w, h, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
os.makedirs(out, exist_ok=True)
subprocess.run(['/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux', '-loglevel', 'error', '-y', '-i', clip, '-vf', f'crop={w}:{h}:{x}:{y},format=gray', f'{out}/c%04d.png'], check=True)
def gray_mean(p):
    b = open(p, 'rb').read(); i = 8; idat = b''; W = H = 0
    while i < len(b):
        L, t = struct.unpack('>I4s', b[i:i + 8]); d = b[i + 8:i + 8 + L]
        if t == b'IHDR': W, H, bd, ct = struct.unpack('>IIBB', d[:10]); assert bd == 8 and ct == 0, (bd, ct)
        if t == b'IDAT': idat += d
        i += 12 + L
    raw = zlib.decompress(idat); prev = bytearray(W); tot = 0
    for r in range(H):
        f = raw[r * (W + 1)]; line = bytearray(raw[r * (W + 1) + 1:(r + 1) * (W + 1)])
        for k in range(W):
            a = line[k - 1] if k else 0; up = prev[k]; c = prev[k - 1] if k else 0
            if f == 1: line[k] = (line[k] + a) & 255
            elif f == 2: line[k] = (line[k] + up) & 255
            elif f == 3: line[k] = (line[k] + (a + up) // 2) & 255
            elif f == 4:
                pa, pb, pc = abs(up - c), abs(a - c), abs(a + up - 2 * c)
                line[k] = (line[k] + (a if pa <= pb and pa <= pc else up if pb <= pc else c)) & 255
        tot += sum(line); prev = line
    return tot / (W * H)
for n, p in enumerate(sorted(glob.glob(f'{out}/c*.png'))):
    print(f'{n:4d} {n/25:6.2f}s {gray_mean(p):6.1f}')
