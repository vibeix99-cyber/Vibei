"""LEAD-4 · W3R1 N: native-pixel crops, BASE | TRIAL side by side (stdlib only).
python3 -I pairs.py out.png x y w h [scale] A.png B.png [C.png ...]  -> crops each at (x,y,w,h), nearest-upscaled by
an integer scale (default 1 = native), stacked left to right with an 8 px gap."""
import struct
import sys
import zlib

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from pngdiff import load  # noqa: E402


def crop(img, x, y, w, h, s):
    W, H, b, px = img
    rows = []
    for yy in range(y, y + h):
        r = bytearray()
        for xx in range(x, x + w):
            i = (yy * W + xx) * b
            r += bytes(px[i:i + 3]) * s
        for _ in range(s):
            rows.append(r)
    return rows


def write(path, rows):
    h, w = len(rows), len(rows[0]) // 3
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b''))


if __name__ == '__main__':
    out, x, y, w, h = sys.argv[1], *map(int, sys.argv[2:6])
    rest = sys.argv[6:]
    s = 1
    if rest and rest[0].isdigit():
        s = int(rest[0]); rest = rest[1:]
    crops = [crop(load(p), x, y, w, h, s) for p in rest]
    gap = bytearray(b'\xff\xff\xff' * 8)
    rows = [gap.join(c[i] for c in crops) for i in range(len(crops[0]))]
    write(out, rows)
    print(out, len(rows[0]) // 3, len(rows))
