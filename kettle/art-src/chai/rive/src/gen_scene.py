"""Generates ../scene.rml for Chai.

All coordinates are written in reference-image space (992x1586, the same as the
artboard); the emitter converts them to each element's parent space. Children
lists are written back-to-front and reversed on output, since RML draws the
first sibling on top.
"""
import math
import os
import sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scene.rml")

# ---------------------------------------------------------------- palette
C = dict(
    bg="FDF9F1", body="CC8754", muzzle="B17144", band="A5663E", bandMuzzle="9B5F3A",
    rim="B07246", earOuter="8C5231", earInner="62381F", paw="814C2D", pawHl="985B38",
    nose="2C190E", noseHl="B8B7B6", eye="2A180D", lid="804B2B", brow="2C180E",
    mouth="341D10", cheek="F5827D", sheen="E0A578", fur="B07045",
    yuzu="FEBB21", yuzuShade="F69613", yuzuHl="FDDE85", dot="F59510", stem="5E341C",
    leaf="4BAA46", leafDark="3E913D", cover="4D9647", coverLight="5DAE56",
    coverDark="417E3D", page="FEF5E0", pageGrey="D4C7A6", shadow="EEE6DC",
    white="FFFFFF", mug="FD5E20", mugDark="E54C17", coffee="A34216", mugHl="FC8B58", emblem="FEF9F0",
    steam="FDF8F0", pageTurn="F7EDD6", tongue="F37D79", mouthIn="572525", sparkle="FDB51D",
)


def argb(hex6, alpha=1.0):
    return "%02X%s" % (round(alpha * 255), hex6)


# ---------------------------------------------------------------- ids
_next = [10]


def new_id():
    _next[0] += 1
    return "0:%d" % _next[0]


# ---------------------------------------------------------------- element model
class El:
    def __init__(self, tag, attrs=None, children=None, wx=0.0, wy=0.0, drawable=False):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.children = list(children or [])
        self.wx, self.wy = wx, wy          # world position (for Node-like elements)
        self.drawable = drawable           # children are draw-ordered
        self.positioned = tag in ("Node", "Shape", "Solo")
        self.local = None                  # explicit local position, for parents that rotate
        self.parent = None


def fmt(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float):
        s = ("%.4f" % v).rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s
    return str(v)


def emit(el, px=0.0, py=0.0, depth=1):
    attrs = dict(el.attrs)
    if el.positioned:
        lx, ly = el.local if el.local is not None else (el.wx - px, el.wy - py)
        if abs(lx) > 1e-6:
            attrs["x"] = lx
        if abs(ly) > 1e-6:
            attrs["y"] = ly
    order = ["name", "id"]
    keys = [k for k in attrs if k not in order] + [k for k in order if k in attrs]
    a = " ".join('%s="%s"' % (k, fmt(attrs[k])) for k in keys)
    pad = "    " * depth
    open_ = "<%s%s" % (el.tag, (" " + a) if a else "")
    kids = list(reversed(el.children)) if el.drawable else el.children
    if not kids:
        return pad + open_ + "/>\n"
    cx, cy = (el.wx, el.wy) if el.positioned else (px, py)
    s = pad + open_ + ">\n"
    for k in kids:
        if isinstance(k, str):
            s += k
        else:
            s += emit(k, cx, cy, depth + 1)
    return s + pad + "</%s>\n" % el.tag


# ---------------------------------------------------------------- builders
REG = {}  # name -> El, for clipping / animation lookups


def reg(el):
    REG[el.attrs["name"]] = el
    return el


def node(name, pivot, children, tag="Node", **attrs):
    attrs.update(name=name, id=new_id())
    el = reg(El(tag, attrs, children, pivot[0], pivot[1], drawable=True))
    for c in children:
        c.parent = el
    return el


def solo(name, pivot, children, active):
    el = node(name, pivot, children, tag="Solo")
    el.attrs["activeComponentId"] = REG[active].attrs["id"]
    return el


def paints(fill=None, stroke=None, width=10, alpha=1.0):
    out = []
    if fill:
        out.append(El("Fill", {"name": "Fill"}, [El("SolidColor", {"colorValue": argb(fill, alpha), "name": "Color"})]))
    if stroke:
        out.append(El("Stroke", {"thickness": float(width), "cap": "round", "join": "round", "name": "Stroke"},
                      [El("SolidColor", {"colorValue": argb(stroke, alpha), "name": "Color"})]))
    return out


def clips(names):
    return [El("ClippingShape", {"sourceId": REG[n].attrs["id"], "name": "Clip " + n}) for n in names]


def shape(name, pos, geom, fill=None, stroke=None, width=10, alpha=1.0, clip=(), rot=0.0, opacity=1.0):
    attrs = dict(name=name, id=new_id())
    if rot:
        attrs["rotation"] = rot
    if opacity != 1.0:
        attrs["opacity"] = opacity
    kids = [geom] + paints(fill, stroke, width, alpha) + clips(clip)
    return reg(El("Shape", attrs, kids, pos[0], pos[1]))


def ellipse(name, cx, cy, w, h, color, **kw):
    return shape(name, (cx, cy), El("Ellipse", {"width": float(w), "height": float(h), "name": "Path"}), fill=color, **kw)


def rrect(name, cx, cy, w, h, r, color, **kw):
    g = El("Rectangle", {"width": float(w), "height": float(h), "cornerRadiusTL": float(r), "name": "Path"})
    return shape(name, (cx, cy), g, fill=color, **kw)


def _vertices(pts, closed, tension, ox, oy):
    """pts: (x, y) smooth or (x, y, 'c') corner, in world space."""
    n = len(pts)
    out = []
    for i, p in enumerate(pts):
        x, y = p[0], p[1]
        corner = len(p) > 2 and p[2] == "c"
        has_prev = closed or i > 0
        has_next = closed or i < n - 1
        prv = pts[(i - 1) % n] if has_prev else None
        nxt = pts[(i + 1) % n] if has_next else None
        lx, ly = x - ox, y - oy
        if corner or not (has_prev and has_next):
            if corner or (prv is None and nxt is None):
                out.append(El("StraightVertex", {"x": lx, "y": ly}))
                continue
            # open-path end: handle aims at the single neighbour
            q = nxt if nxt else prv
            ang = math.atan2(q[1] - y, q[0] - x)
            d = math.hypot(q[0] - x, q[1] - y) * tension
            if nxt:
                out.append(El("CubicDetachedVertex", {"x": lx, "y": ly, "inRotation": ang + math.pi, "inDistance": 0.0,
                                                      "outRotation": ang, "outDistance": d}))
            else:
                out.append(El("CubicDetachedVertex", {"x": lx, "y": ly, "inRotation": ang, "inDistance": d,
                                                      "outRotation": ang + math.pi, "outDistance": 0.0}))
            continue
        tx, ty = nxt[0] - prv[0], nxt[1] - prv[1]
        ang = math.atan2(ty, tx)
        din = math.hypot(x - prv[0], y - prv[1]) * tension
        dout = math.hypot(nxt[0] - x, nxt[1] - y) * tension
        out.append(El("CubicDetachedVertex", {"x": lx, "y": ly, "inRotation": ang + math.pi, "inDistance": din,
                                              "outRotation": ang, "outDistance": dout}))
    return out


def path(name, pts, fill=None, stroke=None, width=10, closed=True, tension=0.36, pos=None, **kw):
    if pos is None:
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        pos = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
    attrs = {"isClosed": closed, "name": "Path"}
    g = El("PointsPath", attrs, _vertices(pts, closed, tension, pos[0], pos[1]))
    return shape(name, pos, g, fill=fill, stroke=stroke, width=width, **kw)


def ribbon(name, centre, widths, color, alpha=1.0, offset=(0, 0)):
    """A tapered stroke: a filled outline either side of a centre line."""
    n = len(centre)
    left, right = [], []
    for i, (x, y) in enumerate(centre):
        a, b = centre[max(i - 1, 0)], centre[min(i + 1, n - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        d = math.hypot(tx, ty) or 1.0
        nx, ny = -ty / d, tx / d
        h = widths[i] / 2.0
        left.append((x + nx * h + offset[0], y + ny * h + offset[1]))
        right.append((x - nx * h + offset[0], y - ny * h + offset[1]))
    pts = left + right[::-1]
    return path(name, pts, fill=color, alpha=alpha, tension=0.34)


def sparkle(name, cx, cy, w, h, color):
    """Four-point star with soft concave sides."""
    rx, ry = w / 2.0, h / 2.0
    ix, iy = rx * 0.36, ry * 0.36
    pts = [(cx, cy - ry, "c"), (cx + ix, cy - iy), (cx + rx, cy, "c"), (cx + ix, cy + iy),
           (cx, cy + ry, "c"), (cx - ix, cy + iy), (cx - rx, cy, "c"), (cx - ix, cy - iy)]
    return path(name, pts, fill=color, tension=0.4, pos=(cx, cy))


def mirror(pts, axis=491.0):
    return [((2 * axis - p[0]), p[1]) + tuple(p[2:]) for p in reversed(pts)]


# ================================================================ the character
GROUND = (491.0, 1430.0)
# Content is authored in the 992-wide reference space and shifted right to sit
# centred on a wider artboard, which gives the raised arms room.
ARTBOARD_W, ARTBOARD_H = 1312, 1586
OFFSET_X = (ARTBOARD_W - 992) / 2


def build_head():
    head_pts = [
        (491, 329), (570, 330), (640, 342), (675, 353), (705, 365), (735, 383), (765, 411), (781, 431),
        (788, 440), (797, 460), (811, 500), (820, 540), (827, 600), (832, 700), (833, 800), (832, 900),
        (826, 980), (810, 1039), (770, 1080), (690, 1120), (491, 1150), (300, 1120), (215, 1075),
        (172, 1015), (155, 950), (150, 850), (151, 720), (156, 600), (163, 540), (172, 500), (187, 460),
        (196, 440), (210, 420), (228, 400), (251, 380), (278, 362), (302, 353), (335, 343), (390, 332),
    ]
    head = path("headBase", head_pts, fill=C["body"], tension=0.33)

    arc = [(150, 790), (180, 773), (230, 748), (280, 732), (330, 722), (380, 715), (430, 712), (491, 711),
           (555, 715), (605, 720), (655, 729), (705, 741), (755, 760), (780, 771), (834, 797)]
    muzzle = path("muzzle", [(60, 800, "c")] + arc + [(920, 800, "c"), (920, 1250, "c"), (60, 1250, "c")],
                  fill=C["muzzle"], clip=["headBase"], tension=0.33)

    inner = [(700, 352), (716, 370), (728, 395), (741, 420), (749, 440), (763, 480), (771, 510),
             (776, 540), (779, 570), (783, 620), (786, 700), (786, 800), (782, 870), (774, 930), (760, 985),
             (735, 1035), (690, 1085), (640, 1125)]
    band_pts = [(690, 300, "c")] + inner + [(640, 1200, "c"), (950, 1200, "c"), (950, 300, "c")]
    band = path("headShade", band_pts, fill=C["band"], clip=["headBase"], tension=0.33)
    band_m = path("muzzleShade", band_pts, fill=C["bandMuzzle"], clip=["headBase", "muzzle"], tension=0.33)

    msheen = path("muzzleSheen", [(190, 833), (232, 795), (300, 760), (380, 735), (455, 723)],
                  stroke=C["body"], width=24, closed=False, alpha=0.85, tension=0.36)

    sheen_pts = [(373, 375, "c"), (333, 384), (308, 396), (291, 408), (277, 420), (265, 432), (247, 456),
                 (233, 480), (223, 504), (216, 528), (211, 552), (208, 572), (207, 586, "c"), (253, 592, "c"),
                 (256, 570), (260, 552), (267, 528), (276, 504), (287, 480), (300, 456), (316, 432),
                 (336, 408), (352, 393)]
    sheen = path("sheen", sheen_pts, fill=C["sheen"], tension=0.33)

    fur = node("fur", (491, 400), [
        path("fur1", [(433, 383), (449, 422)], stroke=C["fur"], width=18, closed=False),
        path("fur2", [(491, 381), (491, 416)], stroke=C["fur"], width=19, closed=False),
        path("fur3", [(549, 383), (533, 422)], stroke=C["fur"], width=18, closed=False),
    ])

    def ear(side, cx, icx, icy):
        return node("ear" + side, (cx, 400), [
            ellipse("ear%sOuter" % side, cx, 400, 140, 140, C["earOuter"]),
            ellipse("ear%sInner" % side, icx, icy, 56, 56, C["earInner"]),
        ])

    earL = ear("L", 229, 218, 390)
    earR = ear("R", 761, 772, 396)

    face = build_face()
    yuzu = build_yuzu()
    return node("head", (491, 1120), [earL, earR, head, muzzle, band, band_m, msheen, sheen, fur, face, yuzu])


def build_eye(side, cx):
    s = "eye" + side
    open_ = ellipse(s + "Open", cx, 644, 84, 76, C["eye"])
    half = ellipse(s + "Half", cx, 630, 88, 88, C["eye"], clip=[s + "Mask"])
    closed = path(s + "Closed", [(cx - 53, 620), (cx - 41, 640), (cx - 22, 654), (cx, 658), (cx + 22, 654),
                                 (cx + 41, 640), (cx + 53, 620)], stroke=C["eye"], width=18, closed=False)
    happy = path(s + "ClosedHappy", [(cx - 53, 666), (cx - 41, 641), (cx - 22, 624), (cx, 619), (cx + 22, 624),
                                     (cx + 41, 641), (cx + 53, 666)], stroke=C["eye"], width=20, closed=False)
    return solo(s, (cx, 644), [open_, half, closed, happy], active=s + "Half")


def build_face():
    # paint-less masks: the half-lidded eye is a circle cut along the lid line
    masks = [shape(n, (cx, 690), El("Rectangle", {"width": 140.0, "height": 126.0, "name": "Path"}))
             for n, cx in (("eyeLMask", 300.5), ("eyeRMask", 680))]
    eyeL = build_eye("L", 300.5)
    eyeR = build_eye("R", 680)
    lidL = rrect("lidL", 300.5, 624, 123, 22, 11, C["lid"])
    lidR = rrect("lidR", 680.5, 624.5, 123, 22, 11, C["lid"])
    brow = [(264, 594), (270, 585), (282, 578), (301, 574.5), (320, 578), (332, 585), (338, 594), (336, 599),
            (330, 598.5), (318, 594), (301, 592), (284, 594), (272, 598.5), (266, 599)]
    browL = path("browL", brow, fill=C["brow"], tension=0.34)
    browR = path("browR", [(p[0] + 380, p[1] + 1) + tuple(p[2:]) for p in brow],
                 fill=C["brow"], tension=0.34)
    shineL = ellipse("eyeLShine", 288.5, 634.5, 20, 19, C["white"])
    shineR = ellipse("eyeRShine", 668, 635.5, 20, 19, C["white"])
    blushL = ellipse("blushL", 257.5, 877.5, 101, 73, C["cheek"])
    blushR = ellipse("blushR", 725, 878.5, 102, 73, C["cheek"])
    nose = path("nose", [(489, 729), (555, 731), (598, 742), (617, 764), (614, 791), (590, 815), (545, 832),
                         (489, 839), (433, 832), (388, 815), (364, 791), (361, 764), (380, 742), (423, 731)],
                fill=C["nose"], tension=0.36)
    nose_hl = ellipse("noseHighlight", 432, 757, 66, 24, C["noseHl"])
    smile = node("mouthSmile", (489, 862), [
        path("mouthSmileStem", [(489, 832), (489, 874)], stroke=C["mouth"], width=18, closed=False),
        path("mouthSmileCurve", [(443, 866), (453, 880), (470, 886), (489, 877), (508, 886), (525, 880),
                                 (535, 866)], stroke=C["mouth"], width=15, closed=False),
    ])
    open_base = path("mouthOpenBase", [(423, 857, "c"), (456, 861), (489, 862), (522, 861), (555, 857, "c"),
                                       (552, 885), (538, 915), (515, 936), (489, 943), (463, 936), (440, 915),
                                       (426, 885)], fill=C["mouthIn"], tension=0.34)
    mouth_open = node("mouthOpen", (489, 890), [
        path("mouthOpenStem", [(489, 832), (489, 860)], stroke=C["mouth"], width=14, closed=False),
        open_base,
        ellipse("mouthOpenTongue", 494, 940, 104, 64, C["tongue"], clip=["mouthOpenBase"]),
    ])
    mouth = solo("mouth", (489, 862), [smile, mouth_open], active="mouthSmile")
    return node("face", (491, 750), masks + [blushL, blushR, browL, browR, eyeL, eyeR, lidL, lidR, shineL, shineR, mouth, nose, nose_hl])


def build_yuzu():
    lower = [(711, 71, "c"), (701, 87), (690, 103), (674, 119), (654, 135), (627, 151), (600, 160), (560, 163)]
    leaf_pts = [(505, 161, "c"), (503, 150), (508, 140), (516, 127), (528, 111), (545, 95), (570, 79), (600, 67),
                (640, 60), (678, 62)] + lower
    leaf_dark_pts = [(505, 161, "c"), (528, 151), (556, 143), (581, 135), (603, 127), (623, 119), (641, 111),
                     (657, 103), (672, 95), (687, 87)] + lower
    leaf = node("leaf", (505, 160), [
        path("leafLight", leaf_pts, fill=C["leaf"], tension=0.34),
        path("leafDark", leaf_dark_pts, fill=C["leafDark"], tension=0.34),
    ])
    dots = [(520, 233), (504, 297), (542, 273), (452, 281)]
    fruit = node("yuzuFruit", (482, 257), [
        ellipse("yuzuShade", 482, 257, 238, 196, C["yuzuShade"]),
        ellipse("yuzuBody", 463.5, 245, 203, 172, C["yuzu"]),
        ellipse("yuzuHighlight", 429, 214, 64, 50, C["yuzuHl"], rot=-0.3),
    ] + [ellipse("yuzuDot%d" % (i + 1), x, y, 14, 14, C["dot"]) for i, (x, y) in enumerate(dots)])
    stem = rrect("yuzuStem", 481.5, 158, 25, 37, 12, C["stem"])
    return node("yuzu", (482, 352), [node("yuzuSway", (482, 352), [leaf, fruit, stem])])


def build_body():
    lower_pts = [
        (491, 800), (680, 815), (790, 860), (836, 920), (864, 960), (886, 1000), (905, 1040), (919, 1080),
        (929, 1120), (935, 1160), (937, 1192), (934, 1240), (925, 1280), (900, 1329), (860, 1372),
        (820, 1396), (740, 1419), (640, 1430), (491, 1435), (340, 1430), (220, 1416), (180, 1403),
        (140, 1379), (100, 1343), (74, 1300), (59, 1260), (51, 1220), (49, 1185), (50, 1160), (56, 1120),
        (65, 1080), (79, 1040), (97, 1000), (120, 960), (148, 920), (200, 860), (300, 815),
    ]
    lower = path("bodyLower", lower_pts, fill=C["rim"], tension=0.33)
    light_pts = [(20, 760, "c"), (960, 760, "c"), (929, 1080), (922, 1160), (914, 1205), (900, 1244),
                 (860, 1300), (820, 1328), (780, 1347), (740, 1359), (640, 1376), (491, 1385), (340, 1377),
                 (220, 1365), (180, 1354), (140, 1338), (100, 1313), (60, 1263), (20, 1210, "c")]
    light = path("bodyLowerLight", light_pts, fill=C["body"], clip=["bodyLower"], tension=0.33)
    return node("body", GROUND, [lower, light])


def build_book():
    cover_l = [(208, 972, "c"), (299, 984), (344, 996), (379, 1008), (407, 1020), (431, 1032), (451, 1044),
               (463, 1052, "c"), (463, 1272, "c"), (420, 1248), (367, 1224), (297, 1200), (252, 1188, "c")]
    cover_r = [(768, 975, "c"), (729, 1188, "c"), (686, 1200), (610, 1224), (556, 1248), (520, 1265, "c"),
               (520, 1047, "c"), (541, 1032), (566, 1020), (596, 1008), (633, 996), (681, 984)]
    pages_back = [(240, 930, "c"), (300, 937), (360, 950), (410, 970), (455, 997), (488, 1028, "c"),
                  (521, 997), (566, 970), (616, 950), (676, 937), (737, 930, "c"), (742, 975, "c"),
                  (560, 990), (488, 1034), (416, 990), (236, 975, "c")]
    pages_front = [(223, 946, "c"), (300, 953), (360, 964), (410, 982), (452, 1006), (488, 1032, "c"),
                   (524, 1006), (566, 982), (616, 964), (676, 953), (753, 947, "c"), (756, 1000, "c"),
                   (526, 1036), (512, 1052), (491, 1058), (470, 1052), (456, 1036), (220, 1000, "c")]
    return node("book", (488, 1110), [
        path("bookPagesBack", pages_back, fill=C["pageGrey"], tension=0.33),
        path("bookSpine", [(463, 1050, "c"), (520, 1045, "c"), (520, 1262), (512, 1278), (491, 1286), (470, 1280),
                           (463, 1268)], fill=C["cover"], tension=0.3),
        path("bookPages", pages_front, fill=C["page"], tension=0.33),
        # the right-hand page, hinged on the spine, that the reading loop flips
        node("bookPageTurn", (488, 1040), [
            path("bookPageTurnLeaf", [(488, 1032, "c"), (524, 1006), (566, 982), (616, 964), (676, 953),
                                      (753, 947, "c"), (756, 1000, "c"), (526, 1036), (512, 1052),
                                      (491, 1058, "c")], fill=C["pageTurn"], tension=0.33),
        ], opacity=0.0),
        path("bookCoverL", cover_l, fill=C["cover"], tension=0.33),
        path("bookCoverR", cover_r, fill=C["cover"], tension=0.33),
        path("bookEdgeL", [(211, 974), (299, 985), (379, 1009), (431, 1033), (461, 1052)],
             stroke=C["coverLight"], width=4, closed=False, alpha=0.8),
        path("bookEdgeR", [(522, 1047), (566, 1021), (633, 997), (681, 985), (765, 976)],
             stroke=C["coverLight"], width=4, closed=False, alpha=0.8),
        path("bookSpineLight", [(463, 1052, "c"), (482, 1056, "c"), (482, 1285, "c"), (471, 1280), (463, 1268, "c")],
             fill=C["coverLight"], tension=0.3),
        path("bookSpineDark", [(510, 1049, "c"), (520, 1045, "c"), (520, 1262, "c"), (515, 1275), (510, 1280, "c")],
             fill=C["coverDark"], tension=0.3),
    ])


# Each arm is one tapered, gently curved limb hung from a shoulder hidden inside
# the body, with its paw at the tip. The limb sits behind the body; the paw sits
# in front of the props on a twin mount keyed with the same rotation, so the two
# never part. Outside cheering the arm hangs down inside the body, folded to the
# resting paw's reach, where the body hides it; reading and sipping place their
# paws in that resting frame, so they glide in straight lines as before.
SHOULDER = {"L": (225.0, 900.0), "R": (757.0, 900.0)}
CHEER_ANGLE = math.radians(32.0)  # the raised arm, from vertical
CHEER_REACH = 495.0               # shoulder to paw centre when raised
_up = (CHEER_REACH * math.sin(CHEER_ANGLE), CHEER_REACH * math.cos(CHEER_ANGLE))
PAW_AT = {  # paw centre per pose: reading, sipping, cheering, rest
    "L": ((233.0, 1102.5), (309.0, 1146.0), (225.0 - _up[0], 900.0 - _up[1]), (262.0, 1188.0)),
    "R": ((747.0, 1098.5), (644.0, 1146.0), (757.0 + _up[0], 900.0 - _up[1]), (720.0, 1188.0)),
}
CHEER_POSE, REST_POSE, MID_POSE = 2, 3, 4  # MID: arms swung up but not yet reaching
MID_REACH = 270.0
ARM_WIDTH = (124.0, 94.0)  # at the shoulder, at the wrist
ARM_BOW = 30.0             # how far the limb curves outward


def _norm_side(side, a):
    """Keep each arm's angles on the side of the circle that swings it outward."""
    two_pi = 2 * math.pi
    if side == "L":
        return a % two_pi                # left arm: 0..2pi, passing through 3pi/2 (left)
    return -((-a) % two_pi)              # right arm: -2pi..0, passing through -3pi/2 (right)


def _aim(side, pose):
    sx, sy = SHOULDER[side]
    px_, py_ = PAW_AT[side][pose]
    return _norm_side(side, math.atan2(px_ - sx, -(py_ - sy))), math.hypot(px_ - sx, py_ - sy)


def arm_frame(side, pose):
    """(rotation, reach) of the arm for a pose."""
    if pose == CHEER_POSE:
        return _aim(side, CHEER_POSE)
    if pose == MID_POSE:
        return _aim(side, CHEER_POSE)[0], MID_REACH
    return _aim(side, REST_POSE)


def paw_local(side, pose):
    """The paw centre for `pose`, in the arm's frame for that pose."""
    a, reach = arm_frame(side, pose)
    if pose in (CHEER_POSE, REST_POSE, MID_POSE):
        return 0.0, -reach
    sx, sy = SHOULDER[side]
    px_, py_ = PAW_AT[side][pose]
    dx, dy = px_ - sx, py_ - sy
    c, s_ = math.cos(-a), math.sin(-a)
    return dx * c - dy * s_, dx * s_ + dy * c


def full_reach(side):
    return _aim(side, CHEER_POSE)[1]


def build_arm(side):
    a, reach = arm_frame(side, 0)
    length = full_reach(side)
    sx, sy = SHOULDER[side]
    bow = -ARM_BOW if side == "L" else ARM_BOW
    left, right = [], []
    steps = 14
    for i in range(steps + 1):
        u = -0.08 + 1.08 * i / steps
        k = min(max(u, 0.0), 1.0)
        x, y = bow * math.sin(math.pi * k), -u * length
        half = (ARM_WIDTH[0] + (ARM_WIDTH[1] - ARM_WIDTH[0]) * k) / 2
        # the centre line barely turns, so its normal is close enough to horizontal
        tx = bow * math.pi * math.cos(math.pi * k) / length
        n = math.hypot(1.0, tx)
        left.append((sx + x - half / n, sy + y - half * tx / n))
        right.append((sx + x + half / n, sy + y + half * tx / n))
    limb = path("arm%sLimb" % side, left + right[::-1], fill=C["paw"], tension=0.34, pos=(sx, sy))
    limb.local = (0.0, 0.0)
    limb.attrs["scaleY"] = reach / length
    wave = node("arm%sWave" % side, (sx, sy), [limb])
    wave.local = (0.0, 0.0)
    return node("arm" + side, (sx, sy), [wave], rotation=a)


def build_paw(side):
    a, _ = arm_frame(side, 0)
    cx, cy = PAW_AT[side][0]
    paw = node("paw" + side, (cx, cy), [
        ellipse("paw%sBase" % side, cx, cy, 140, 139, C["paw"]),
        ellipse("paw%sHighlight" % side, cx - 16, cy - 27, 58, 36, C["pawHl"], rot=-0.5),
    ], rotation=-a)
    paw.local = paw_local(side, 0)
    wave = node("paw%sWave" % side, (cx, cy), [paw])
    wave.local = (0.0, 0.0)
    return node("paw%sMount" % side, SHOULDER[side], [wave], rotation=a)


def build_mug():
    body_pts = [(332, 1022, "c"), (621, 1022, "c"), (618, 1150), (612, 1235), (598, 1268), (565, 1282),
                (476, 1284), (387, 1282), (354, 1268), (340, 1235), (335, 1150)]
    emblem = [(448, 1166, "c"), (452, 1138), (470, 1114), (494, 1102), (525, 1098, "c"), (523, 1126),
              (510, 1150), (485, 1164)]
    return node("mug", (476, 1150), [
        ellipse("mugHandle", 636, 1071, 112, 84, C["mugDark"]),
        path("mugBody", body_pts, fill=C["mug"], tension=0.33),
        path("mugShade", [(586, 1030, "c"), (700, 1030, "c"), (700, 1320, "c"), (300, 1320, "c"),
                          (300, 1235, "c"), (545, 1235), (580, 1222), (586, 1190)],
             fill=C["mugDark"], clip=["mugBody"], tension=0.33),
        ellipse("mugRim", 476.5, 1024, 289, 52, C["mug"]),
        ellipse("mugInner", 477, 1031, 250, 40, C["mugDark"]),
        ellipse("mugCoffee", 477, 1027, 244, 31, C["coffee"]),
        rrect("mugHighlight", 382.5, 1134, 31, 144, 15.5, C["mugHl"]),
        path("mugEmblem", emblem, fill=C["emblem"], tension=0.34),
    ], opacity=0.0)


def build_steam():
    a = [(490, 1020), (488, 990), (497, 963), (522, 935), (556, 911), (590, 887), (612, 861), (624, 835),
         (630, 820)]
    aw = [3, 14, 22, 27, 29, 27, 22, 14, 3]
    b = [(635, 885), (650, 855), (668, 815), (668, 780), (652, 740), (640, 707), (645, 680), (652, 660)]
    b = [(x, 885 - (885 - y) * 0.82) for x, y in b]
    bw = [3, 16, 24, 26, 24, 18, 10, 3]
    out = []
    for name, pivot, centre, widths, trail_from, trail_off in (
            ("steam1", (560, 1020), a, aw, 2, (-24, -10)), ("steam2", (652, 885), b, bw, 1, (-24, 8))):
        rise = node(name + "Rise", pivot, [
            ribbon(name + "Trail", centre[trail_from:], [w * 0.8 for w in widths[trail_from:]], C["steam"],
                   alpha=0.35, offset=trail_off),
            ribbon(name + "Wisp", centre, widths, C["steam"], alpha=0.92),
        ])
        out.append(node(name, pivot, [rise], opacity=0.0))
    return out


def build_foot(side, cx, cy):
    return node("foot" + side, (cx, cy), [
        ellipse("foot%sBase" % side, cx, cy, 145, 126, C["paw"]),
        ellipse("foot%sHighlight" % side, cx - 18, cy - 23, 58, 36, C["pawHl"], rot=-0.45),
    ])


def build_artboard():
    shadow = ellipse("groundShadow", 495, 1437, 832, 78, C["shadow"])
    body = build_body()
    head = build_head()
    feet = [build_foot("L", 326, 1388), build_foot("R", 644.5, 1387.5)]
    book = build_book()
    arms = [build_arm("L"), build_arm("R")]
    carry = node("carry", (476, 1150), [build_mug()] + build_steam() + [build_paw("L"), build_paw("R")])
    pops = []
    for side, cx, cy, w, h in (("L", 210, 260, 117, 121), ("R", 794, 274, 110, 116)):
        sp = sparkle("sparkle" + side, cx, cy, w, h, C["sparkle"])
        sp.attrs["opacity"] = 0.0
        pops.append(node("sparkle%sPop" % side, (cx, cy), [sp]))
    breath = node("breath", GROUND, arms + [body, head] + feet + [book, carry] + pops)
    chai = node("chai", GROUND, [breath])
    return [shadow, chai]


def loc(name):
    el = REG[name]
    if el.local is not None:
        return el.local
    p = el.parent
    return (el.wx - p.wx, el.wy - p.wy) if p is not None else (el.wx, el.wy)


# ---------------------------------------------------------------- keyframes
EASES = {"inout": (0.42, 0.0, 0.58, 1.0), "out": (0.0, 0.0, 0.58, 1.0), "in": (0.42, 0.0, 1.0, 1.0),
         "soft": (0.37, 0.0, 0.63, 1.0)}


class Anim:
    def __init__(self, name, frames, loop="loop"):
        self.name, self.frames, self.loop = name, frames, loop
        self.tracks = {}
        self.id = new_id()

    def key(self, target, prop, frame, value, ease="inout", kf="KeyFrameDouble"):
        frame = int(round(frame))
        assert 0 <= frame <= self.frames, (self.name, target, prop, frame)
        self.tracks.setdefault((target, prop, kf), {})[frame] = (value, ease)

    def keys(self, target, prop, pts, offset=0):
        for p in pts:
            f, v = p[0], p[1]
            self.key(target, prop, f + offset, v, p[2] if len(p) > 2 else "inout")

    def periodic(self, target, prop, pts, period, offset=0, step=4):
        """Sample a smooth repeating curve (pts over 0..period, eased between) as linear keys."""
        def at(t):
            t %= period
            for (f0, v0), (f1, v1) in zip(pts, pts[1:]):
                if f0 <= t <= f1:
                    u = 0.0 if f1 == f0 else (t - f0) / (f1 - f0)
                    return v0 + (v1 - v0) * (0.5 - 0.5 * math.cos(math.pi * u))
            return pts[-1][1]
        for f in list(range(0, self.frames, step)) + [self.frames]:
            self.key(target, prop, f, at(f - offset), "linear")

    def emit(self):
        s = '        <LinearAnimation loopValue="%s" duration="%d" name="%s" id="%s">\n' % (
            self.loop, self.frames, self.name, self.id)
        by_target = {}
        for (target, prop, kf), frames in self.tracks.items():
            by_target.setdefault(target, []).append((prop, kf, frames))
        for target, props in by_target.items():
            s += '            <KeyedObject objectId="%s">\n' % REG[target].attrs["id"]
            for prop, kf, frames in props:
                s += '                <KeyedProperty property="%s">\n' % prop
                for f in sorted(frames):
                    v, ease = frames[f]
                    if kf == "KeyFrameId" or ease == "hold":
                        s += '                    <%s value="%s" frame="%d" interpolationType="hold"/>\n' % (
                            kf, fmt(v), f)
                    elif ease == "linear":
                        s += '                    <%s value="%s" frame="%d" interpolationType="linear"/>\n' % (
                            kf, fmt(v), f)
                    else:
                        x1, y1, x2, y2 = EASES[ease]
                        s += ('                    <%s value="%s" frame="%d" interpolationType="cubic">'
                              '<CubicEaseInterpolator x1="%s" y1="%s" x2="%s" y2="%s"/></%s>\n'
                              % (kf, fmt(v), f, fmt(x1), fmt(y1), fmt(x2), fmt(y2), kf))
                s += '                </KeyedProperty>\n'
            s += '            </KeyedObject>\n'
        return s + '        </LinearAnimation>\n'


# ---------------------------------------------------------------- poses
POSES = ("reading", "sipping", "cheering")
REST = 3
PROP_DROP = 50.0  # hidden props sink this far as they fade


def pose_table():
    """(target, property, keyframe element, (reading, sipping, cheering, rest[, mid]))."""
    t = []

    def ids(*names):
        return tuple(REG[n].attrs["id"] for n in names)

    def same(target, prop, v):
        t.append((target, prop, "KeyFrameDouble", (v, v, v, v)))

    for side in "LR":
        e = "eye" + side
        t.append((e, "activeComponentId", "KeyFrameId",
                  ids(e + "Half", e + "Closed", e + "ClosedHappy", e + "Closed")))
        for part in ("lid" + side, "brow" + side, e + "Shine"):
            t.append((part, "opacity", "KeyFrameDouble", (1.0, 0.0, 0.0, 0.0)))
        frames = [arm_frame(side, i) for i in range(5)]
        rots = tuple(f[0] for f in frames)
        t.append(("arm" + side, "rotation", "KeyFrameDouble", rots))
        t.append(("paw%sMount" % side, "rotation", "KeyFrameDouble", rots))
        t.append(("arm%sLimb" % side, "scaleY", "KeyFrameDouble", tuple(f[1] / full_reach(side) for f in frames)))
        locs = [paw_local(side, i) for i in range(5)]
        t.append(("paw" + side, "x", "KeyFrameDouble", tuple(l[0] for l in locs)))
        t.append(("paw" + side, "y", "KeyFrameDouble", tuple(l[1] for l in locs)))
        t.append(("paw" + side, "rotation", "KeyFrameDouble", tuple(-r for r in rots)))
        t.append(("sparkle" + side, "opacity", "KeyFrameDouble", (0.0, 0.0, 1.0, 0.0)))
        # neutral values for everything only the action layer moves
        same("arm%sWave" % side, "rotation", 0.0)
        same("paw%sWave" % side, "rotation", 0.0)
        for prop, v in (("scaleX", 1.0), ("scaleY", 1.0), ("rotation", 0.0), ("opacity", 1.0)):
            same("sparkle%sPop" % side, prop, v)
    t.append(("mouth", "activeComponentId", "KeyFrameId", ids("mouthSmile", "mouthSmile", "mouthOpen", "mouthSmile")))
    by, my = loc("book")[1], loc("mug")[1]
    t.append(("book", "opacity", "KeyFrameDouble", (1.0, 0.0, 0.0, 0.0)))
    t.append(("book", "y", "KeyFrameDouble", (by, by + PROP_DROP, by + PROP_DROP, by + PROP_DROP)))
    t.append(("mug", "opacity", "KeyFrameDouble", (0.0, 1.0, 0.0, 0.0)))
    t.append(("mug", "y", "KeyFrameDouble", (my + PROP_DROP, my, my + PROP_DROP, my + PROP_DROP)))
    t.append(("steam1", "opacity", "KeyFrameDouble", (0.0, 1.0, 0.0, 0.0)))
    t.append(("steam2", "opacity", "KeyFrameDouble", (0.0, 1.0, 0.0, 0.0)))
    t.append(("yuzu", "rotation", "KeyFrameDouble", (0.0, -0.06, 0.04, 0.0)))
    same("chai", "y", GROUND[1])
    same("chai", "scaleX", 1.0)
    same("chai", "scaleY", 1.0)
    same("groundShadow", "scaleX", 1.0)
    same("groundShadow", "opacity", 1.0)
    same("carry", "y", loc("carry")[1])
    same("carry", "rotation", 0.0)
    same("yuzuSway", "rotation", 0.0)
    same("yuzuSway", "y", 0.0)
    same("leaf", "rotation", 0.0)
    same("bookPageTurn", "scaleX", 1.0)
    same("bookPageTurn", "opacity", 0.0)
    same("bookPageTurn", "y", loc("bookPageTurn")[1])
    for st in ("steam1Rise", "steam2Rise"):
        same(st, "y", 0.0)
        same(st, "opacity", 1.0)
        same(st, "scaleX", 1.0)
    return t


def pose_anims(table):
    """pose_reading, pose_sipping, pose_cheering, rest, cheer_raise, cheer_fold.

    The last two hold the mid pose (cheering face, arms swung up but short); a
    value with no mid entry takes its cheering one."""
    out = []
    for name, frames, i in (("pose_reading", 1, 0), ("pose_sipping", 1, 1), ("pose_cheering", 1, 2),
                            ("rest", 54, REST), ("cheer_raise", 42, MID_POSE), ("cheer_fold", 27, MID_POSE)):
        a = Anim(name, frames, loop="oneShot")
        for target, prop, kf, values in table:
            v = values[i] if i < len(values) else values[CHEER_POSE]
            a.key(target, prop, 0, v, "hold" if kf == "KeyFrameId" else "linear", kf)
        out.append(a)
    return out


def breath_anim():
    a = Anim("breath", 216)  # 3.6 s
    a.keys("breath", "scaleY", [(0, 1.0), (108, 1.009), (216, 1.0)])
    a.keys("breath", "scaleX", [(0, 1.0), (108, 0.997), (216, 1.0)])
    return a


def blink_anim():
    a = Anim("blink", 600)  # 10 s, blinks 4.6 s and 5.4 s apart
    lids = {s: loc("lid" + s)[1] for s in "LR"}
    squash = ["eyeLHalf", "eyeLOpen", "eyeRHalf", "eyeROpen", "eyeLShine", "eyeRShine"]
    for target in squash:
        a.key(target, "scaleY", 0, 1.0)
        a.key(target, "scaleY", 600, 1.0)
    for s, base in lids.items():
        a.key("lid" + s, "y", 0, base)
        a.key("lid" + s, "y", 600, base)
    for b in (240, 516):
        for target in squash:
            a.keys(target, "scaleY", [(b, 1.0, "in"), (b + 5, 0.08, "hold"), (b + 7, 0.08, "out"), (b + 15, 1.0)])
        for s, base in lids.items():
            a.keys("lid" + s, "y", [(b, base, "in"), (b + 5, base + 16, "hold"), (b + 7, base + 16, "out"),
                                    (b + 15, base)])
    return a


def reading_anim():
    a = Anim("reading_loop", 720)  # 12 s
    amp = 0.05
    a.keys("leaf", "rotation", [(0, 0.0), (60, amp), (180, -amp), (300, amp), (420, -amp), (540, amp),
                                (660, -amp), (720, 0.0)])
    py = loc("bookPageTurn")[1]
    a.keys("bookPageTurn", "opacity", [(0, 0.0, "hold"), (420, 1.0, "hold"), (512, 0.0, "hold"), (720, 0.0)])
    a.keys("bookPageTurn", "scaleX", [(0, 1.0), (420, 1.0), (510, -1.0, "hold"), (720, -1.0)])
    a.keys("bookPageTurn", "y", [(0, py), (420, py), (465, py - 12), (510, py), (720, py)])
    return a


def sipping_anim():
    a = Anim("sipping_loop", 360)  # 6 s, one sip
    cy = loc("carry")[1]
    # prepare -> lift -> contact -> hold -> return
    a.keys("carry", "y", [(0, cy), (200, cy), (228, cy + 8), (272, cy - 115, "out"), (286, cy - 111),
                          (316, cy - 111), (352, cy), (360, cy)])
    a.keys("carry", "rotation", [(0, 0.0), (200, 0.0), (228, 0.025), (272, -0.05, "out"), (286, -0.045),
                                 (316, -0.045), (352, 0.0), (360, 0.0)])

    def steam(t, phase):
        p = ((t - phase) % 180) / 180.0
        fade = min(1.0, p / 0.3) if p < 0.3 else (1.0 if p < 0.6 else max(0.0, 1 - (p - 0.6) / 0.4))
        lift = 1.0 if t < 205 or t > 350 else (max(0.0, 1 - (t - 205) / 15) if t < 300 else min(1.0, (t - 300) / 50))
        return fade * lift, -50 * p, 1 + 0.06 * p

    for name, phase in (("steam1Rise", 0), ("steam2Rise", 90)):
        for f in list(range(0, 360, 6)) + [360]:
            o, y, sx = steam(f, phase)
            a.key(name, "opacity", f, o, "linear")
            a.key(name, "y", f, y, "linear")
            a.key(name, "scaleX", f, sx, "linear")
    return a


def cheering_anim():
    a = Anim("cheering_loop", 168)  # 2.8 s, two soft hops
    gy = GROUND[1]
    for o in (0, 84):
        a.keys("chai", "y", [(0, gy), (12, gy, "out"), (36, gy - 28, "in"), (60, gy), (84, gy)], o)
        a.keys("chai", "scaleY", [(0, 1.0), (12, 0.965, "out"), (28, 1.025), (44, 1.0), (56, 1.0, "out"),
                                  (64, 0.97), (80, 1.0), (84, 1.0)], o)
        a.keys("chai", "scaleX", [(0, 1.0), (12, 1.025, "out"), (28, 0.985), (44, 1.0), (56, 1.0, "out"),
                                  (64, 1.02), (80, 1.0), (84, 1.0)], o)
        a.keys("groundShadow", "scaleX", [(0, 1.0), (12, 1.01), (36, 0.9), (60, 1.01), (84, 1.0)], o)
        a.keys("groundShadow", "opacity", [(0, 1.0), (36, 0.7), (60, 1.0), (84, 1.0)], o)
        # the yuzu lags the body by a beat, then settles
        a.keys("yuzuSway", "y", [(0, 0.0), (24, 0.0), (44, 7.0), (66, -6.0), (84, 0.0)], o)
        a.keys("yuzuSway", "rotation", [(0, 0.0), (46, -0.045), (70, 0.035), (84, 0.0)], o)
    for side, sign in (("L", 1.0), ("R", -1.0)):
        for target in ("arm%sWave" % side, "paw%sWave" % side):
            a.keys(target, "rotation", [(0, 0.0), (42, 0.05 * sign), (84, 0.0), (126, 0.05 * sign), (168, 0.0)])
    pop = [(0, 0.5), (16, 1.12), (28, 1.0), (60, 1.0), (80, 0.5), (84, 0.5)]
    fade = [(0, 0.0), (10, 1.0), (60, 1.0), (80, 0.0), (84, 0.0)]
    turn = [(0, -0.15), (28, 0.0), (80, 0.1), (84, -0.15)]
    for side, phase in (("L", 0), ("R", 42)):
        t = "sparkle%sPop" % side
        a.periodic(t, "scaleX", pop, 84, phase)
        a.periodic(t, "scaleY", pop, 84, phase)
        a.periodic(t, "opacity", fade, 84, phase)
        a.periodic(t, "rotation", turn, 84, phase)
    return a


# ---------------------------------------------------------------- state machine
def ease_xml(name="inout"):
    x1, y1, x2, y2 = EASES[name]
    return '<CubicEaseInterpolator x1="%s" y1="%s" x2="%s" y2="%s"/>' % (fmt(x1), fmt(y1), fmt(x2), fmt(y2))


class Wiring:
    def __init__(self):
        self.vm_id, self.prop_id, self.inst_id = new_id(), new_id(), new_id()
        self.input_id = new_id()

    def vm_cond(self, value):
        return ('<TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator>'
                '<BindablePropertyNumber propertyValue="-1"><DataBindContext sourcePathIds="%s-%s" propertyKey="636"/>'
                '</BindablePropertyNumber></TransitionPropertyViewModelComparator>'
                '<TransitionValueNumberComparator value="%s"/></TransitionViewModelCondition>'
                % (self.vm_id, self.prop_id, fmt(float(value))))

    def input_cond(self, value):
        return '<TransitionNumberCondition inputId="%s" opValue="equal" value="%d"/>' % (self.input_id, value)

    def to_pose(self, state_to, pose, duration, exit_full=False, pad="                    "):
        """Two transitions: the view model says `pose`, or it is unset (-1) and the input says `pose`."""
        flags = ' enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"' if exit_full else ""
        head = '<StateTransition stateToId="%s" duration="%d" interpolationType="cubic"%s>%s' % (
            state_to, duration, flags, ease_xml())
        return (pad + head + self.vm_cond(pose) + '</StateTransition>\n' +
                pad + head + self.vm_cond(-1) + self.input_cond(pose) + '</StateTransition>\n')


def emit_layer(name, layer_id, states, entry_to):
    """states: [(state_id, anim, x, y, reset, [transition xml...])]."""
    s = '            <StateMachineLayer name="%s" id="%s">\n' % (name, layer_id)
    s += '                <AnyState x="0" y="-220"/>\n                <ExitState x="900" y="-220"/>\n'
    s += '                <EntryState x="0" y="0"><StateTransition stateToId="%s"/></EntryState>\n' % entry_to
    for sid, anim, x, y, reset, transitions in states:
        s += '                <AnimationState x="%d" y="%d"%s animationId="%s" id="%s">\n' % (
            x, y, ' reset="true"' if reset else "", anim.id, sid)
        s += "".join(transitions)
        s += '                </AnimationState>\n'
    return s + '            </StateMachineLayer>\n'


def main():
    start_pose = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
    content = build_artboard()
    table = pose_table()
    w = Wiring()
    sm_id, style_id = new_id(), new_id()
    poses = pose_anims(table)
    loops = [reading_anim(), sipping_anim(), cheering_anim()]
    idle = Anim("action_idle", 96, loop="oneShot")
    breath, blink = breath_anim(), blink_anim()
    # Pose layer: hold a pose; any change goes pose -> rest -> new pose. Cheering
    # is entered and left through the mid pose, so the arms swing up from the
    # shoulders short, then reach; and fold the same way on the way out.
    p_ids, r_id, up_id, down_id = [new_id() for _ in POSES], new_id(), new_id(), new_id()
    calm = [m for m in range(3) if m != CHEER_POSE]
    pose_states = []
    for i in calm:
        tr = [w.to_pose(r_id, m, 700) for m in range(3) if m != i]
        pose_states.append((p_ids[i], poses[i], 260, -160 + 320 * i, False, tr))
    pose_states.append((p_ids[CHEER_POSE], poses[CHEER_POSE], 1100, 0, False,
                        [w.to_pose(down_id, m, 450) for m in calm]))
    pose_states.append((r_id, poses[REST], 560, 0, True,
                        [w.to_pose(p_ids[j], j, 700, exit_full=True) for j in calm] +
                        [w.to_pose(up_id, CHEER_POSE, 650, exit_full=True)]))
    pose_states.append((up_id, poses[4], 830, -140, True,
                        [w.to_pose(down_id, m, 400) for m in calm] +
                        ['                    <StateTransition stateToId="%s" duration="500" interpolationType="cubic" '
                         'enableExitTime="true" exitTimeIsPercetange="true" exitTime="100">%s</StateTransition>\n'
                         % (p_ids[CHEER_POSE], ease_xml())]))
    pose_states.append((down_id, poses[5], 830, 140, True,
                        ['                    <StateTransition stateToId="%s" duration="650" interpolationType="cubic" '
                         'enableExitTime="true" exitTimeIsPercetange="true" exitTime="100">%s</StateTransition>\n'
                         % (r_id, ease_xml())]))

    # Action layer: the pose's own loop, faded out during a change and back in once the pose has landed.
    l_ids, i_id, wait_id = [new_id() for _ in POSES], new_id(), new_id()
    wait = Anim("action_wait_cheer", 30, loop="oneShot")  # cheering lands half a second later
    action_states = [(i_id, idle, 260, 0, True, [w.to_pose(l_ids[j], j, 600, exit_full=True) for j in calm] +
                      [w.to_pose(wait_id, CHEER_POSE, 0, exit_full=True)])]
    action_states.append((wait_id, wait, 560, 220, True, [w.to_pose(i_id, m, 0) for m in calm] + [
        '                    <StateTransition stateToId="%s" duration="600" interpolationType="cubic" '
        'enableExitTime="true" exitTimeIsPercetange="true" exitTime="100">%s</StateTransition>\n'
        % (l_ids[CHEER_POSE], ease_xml())]))
    for i, lid in enumerate(l_ids):
        tr = [w.to_pose(i_id, m, 400) for m in range(3) if m != i]
        action_states.append((lid, loops[i], 860, -160 + 160 * i, True, tr))

    s = '<Rive version="1" kind="fragment">\n'
    s += ('    <Artboard defaultStateMachineId="%s" viewModelId="%s" viewModelInstanceId="%s" styleId="%s" '
          'width="%d" height="%d" name="Chai" id="%s">\n'
          % (sm_id, w.vm_id, w.inst_id, style_id, ARTBOARD_W, ARTBOARD_H, new_id()))
    s += '        <LayoutComponentStyle name="Artboard Style" id="%s"/>\n' % style_id
    s += ('        <Fill name="Background">\n            <SolidColor colorValue="%s" name="Color"/>\n'
          '        </Fill>\n' % argb(C["bg"]))
    for el in reversed(content):
        s += emit(el, -OFFSET_X, 0, 2)
    s += '        <StateMachine name="Chai" id="%s">\n' % sm_id
    s += '            <StateMachineNumber name="pose" value="%s" id="%s"/>\n' % (fmt(start_pose), w.input_id)
    s += emit_layer("Pose", new_id(), pose_states, p_ids[0])
    s += emit_layer("Action", new_id(), action_states, i_id)
    for name, anim in (("Breath", breath), ("Blink", blink)):
        sid = new_id()
        s += emit_layer(name, new_id(), [(sid, anim, 260, 0, False, [])], sid)
    s += '        </StateMachine>\n'
    for a in poses + loops + [idle, wait, breath, blink]:
        s += a.emit()
    s += '    </Artboard>\n'
    s += ('    <ViewModel defaultInstanceId="%s" name="Chai" id="%s">\n'
          '        <ViewModelPropertyNumber name="pose" id="%s"/>\n'
          '        <ViewModelInstance exports="true" name="Default" id="%s">\n'
          '            <ViewModelInstanceNumber propertyValue="-1" viewModelPropertyId="%s"/>\n'
          '        </ViewModelInstance>\n'
          '    </ViewModel>\n' % (w.inst_id, w.vm_id, w.prop_id, w.inst_id, w.prop_id))
    s += '</Rive>\n'
    with open(OUT, "w", newline="\n") as f:
        f.write(s)
    print("wrote", OUT, "input pose =", start_pose)


if __name__ == "__main__":
    main()
