#!/usr/bin/env python3
"""Inline the stylesheet and scripts into one self-contained HTML file.

Usage:  python3 build-standalone.py
Output: poke-arena.html — a single file that runs anywhere, offline.
"""

import pathlib
import re

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'poke-arena.html'

html = (HERE / 'index.html').read_text(encoding='utf-8')

# stylesheet -> <style>
css = (HERE / 'css' / 'style.css').read_text(encoding='utf-8')
html = html.replace(
    '<link rel="stylesheet" href="css/style.css" />',
    '<style>\n' + css + '\n</style>',
)

# scripts -> inline <script> blocks, in their original order
for src in re.findall(r'<script src="(js/[^"]+)"></script>', html):
    js = (HERE / src).read_text(encoding='utf-8')
    html = html.replace(
        f'<script src="{src}"></script>',
        '<script>\n' + js + '\n</script>',
    )

assert 'src="js/' not in html and 'href="css/' not in html, 'something failed to inline'

OUT.write_text(html, encoding='utf-8')
print(f'wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)')
