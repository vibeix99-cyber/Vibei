viewport 390x844@3, SwiftShader (CPU), runs per variant: 3
| variant | frame ms median (per-run medians) | frame ms p90 (median) | draw calls | triangles | geometries | textures | programs | JS heap MB after GC | ready ms | Chai final ms | longest task ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 5430:procedural:low | 246 (246, 257, 232) | 317 | 111 | 76752 | 114 | 8 | 19 | 10.66 | 6280 | 6280 | 794 |
| 5433:procedural:low | 240 (251, 240, 221) | 334 | 111 | 76752 | 114 | 8 | 19 | 10.75 | 6323 | 6323 | 709 |
| 5433:model:low | 233 (250, 233, 212) | 340 | 108 | 74910 | 111 | 10 | 23 | 11.21 | 5223 | 5251 | 799 |
| 5430:procedural:high | 486 (481, 486, 548) | 636 | 161 | 129040 | 114 | 10 | 19 | 10.94 | 6860 | 6860 | 963 |
| 5433:procedural:high | 501 (487, 582, 501) | 628 | 161 | 129040 | 114 | 10 | 19 | 11.03 | 6070 | 6070 | 756 |
| 5433:model:high | 521 (485, 530, 521) | 684 | 155 | 125748 | 111 | 12 | 25 | 11.61 | 5941 | 5961 | 660 |
