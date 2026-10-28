# Performance Notes

## 3D explorer budget
- Max nodes: 50 (API pageSize limit)
- Triangles per node: ~320 (detail 2) desktop, ~80 mobile
- Mobile: dpr 1, antialias off, fewer sparkles, no autoRotate
- Reduced motion: no rotation, pulse, or auto-rotate
- Three.js sirf lazy chunks mein; main bundle mein nahi

## Baseline (day 5 build ke numbers)
| Check | Result |
|---|---|
| Main entry JS (gzip) | 96.86 KB |
| Three.js chunk (gzip) | 243.10 KB |
| Explorer FPS, 14 nodes, desktop | 60 (FPS counter) |
| Explorer FPS, 50 nodes, desktop | verify Day 26 |
| Explorer FPS, mobile emulation | verify Day 26 |
| Lighthouse performance (/) | run separately |

## Known limitations (Day 26 par fix)
- Har node apna mesh/material; 50+ nodes ke liye InstancedMesh
- Edges abhi nearest-neighbour placeholder
- frameloop hamesha "always"; idle par "demand" mode optimization
