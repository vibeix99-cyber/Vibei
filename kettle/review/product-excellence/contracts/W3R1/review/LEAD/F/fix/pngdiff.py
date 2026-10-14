"""LEAD-4 · W3R1 N: stdlib-only PNG decode + pixel compare (8-bit RGB/RGBA, non-interlaced).
python3 -I pngdiff.py A.png B.png   -> size, differing pixels, max channel diff, bbox of differences
"""
import sys
import struct
import zlib


def load(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    pos, idat, w = 8, b'', None
    while pos < len(data):
        ln, = struct.unpack('>I', data[pos:pos + 4])
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', body)
            assert depth == 8 and inter == 0 and ctype in (2, 6), (path, depth, ctype, inter)
            bpp = 3 if ctype == 2 else 4
        elif typ == b'IDAT':
            idat += body
        pos += 12 + ln
    raw = zlib.decompress(idat)
    stride = w * bpp
    out = bytearray(h * stride)
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        f = raw[i]
        line = bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        if f == 1:
            for x in range(bpp, stride):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, bpp, bytes(out)


def diff(a, b):
    wa, ha, ba, pa = load(a)
    wb, hb, bb, pb = load(b)
    if (wa, ha) != (wb, hb):
        return {'size': [(wa, ha), (wb, hb)], 'note': 'size differs'}
    n, mx = 0, 0
    x0, y0, x1, y1 = wa, ha, -1, -1
    for y in range(ha):
        for x in range(wa):
            ia, ib = (y * wa + x) * ba, (y * wa + x) * bb
            d = max(abs(pa[ia + c] - pb[ib + c]) for c in range(3))
            if d:
                n += 1
                mx = max(mx, d)
                x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
    return {'size': (wa, ha), 'differing_px': n, 'max_channel_diff': mx, 'bbox': (x0, y0, x1, y1) if n else None}


if __name__ == '__main__':
    print(diff(sys.argv[1], sys.argv[2]))
