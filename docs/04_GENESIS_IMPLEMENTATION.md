# Genesis implementation

## Runtime

`index.html` starts a native ES module application. `src/main.js` owns the flight deck, active run, pause, death animation and results. The device profile lives in one versioned local-storage record. Rendering and input survive run resets. The world, encounter score, cooldowns, particle pool and delayed effects reset together. Losing focus pauses a live run.

| Module | Responsibility |
| --- | --- |
| `src/game/rules.js` | Arena dimensions, enemy properties, weapon tiers and seeded randomness |
| `src/game/world.js` | Movement, steering, evasion, bounce, gravity, hits, scoring, flux, hull and pulse |
| `src/game/director.js` | Six authored 22-second encounter sequences with wings, files, crossfires, pincer arrivals and interior wells |
| `src/game/lattice.js` | Anchored membrane with local radial and tangential impulses |
| `src/game/spatial.js` | Uniform spatial bins and swept segment–circle hit tests |
| `src/render/` | Three.js renderer, GLSL, dynamic triangle batches, shared craft shapes, particle pool and Canvas compatibility renderer |
| `src/platform/` | Gesture-unlocked synthesis, controls, settings, HUD, overlays and pinned Three.js loading |

## Simulation and encounter design

The simulation advances at 60 Hz. A frame contributes at most 100 ms of elapsed time so returning from a stall stays bounded. Shooting follows an independent aim heading. Swept tests choose the nearest valid hit along each projectile segment. Dead entities are marked immediately and compacted after the tick. Replacement spawns stay at least 15 arena units from the player and give a timed arrival cue.

The 83 × 51 lattice stores two displacement and two velocity fields in typed arrays. A four-neighbor spring stencil propagates disturbances. A separate integration pass applies damping and an anchor force. Every perimeter point is fixed. Radial and swirling forces visit only cells in their affected rectangle. Travel and velocity clamps bound simultaneous well and detonation impulses.

A six-sector cycle varies formation timing, approach angles and recovery windows. Later sectors increase formation size and pursuit speed within caps. Redline Spinners join from sector three. They commit to a visible lane before charging and can ricochet on a wall. At most 84 enemies and two wells coexist. Flux encourages deliberate collection routes. Shooting a well pays for its collapse and any resulting chain kills.

## Graphics and sound

The primary renderer uses Three.js r169 with an orthographic camera. Threats use faceted geometry, contrasting strokes and local light. An indexed line mesh follows the membrane. Oriented triangles batch ships, shots and particles. The transient pool holds 2,600 sparks, with separate short-lived flashes and rings. A quarter-resolution separable bloom pass softens energy cores. A final lens pass bends the rendered scene around up to two live wells. HUD text remains outside the post-processing chain.

The title and live wells share an analytical accretion shader with a tilted disk, foreground occlusion, a photon ring, two lensed arcs and flowing emission bands. This is a visual approximation. The Canvas compatibility renderer shares the simulation, glyphs and effects and uses baked images of the original shaders. Its well still pulls objects and deforms the grid. Screen-space lensing and post-process bloom belong to the WebGL path.

Web Audio builds oscillator sweeps, filtered noise, stereo panning, a low environmental drone and a compressed master bus. Short-lived voices disconnect on completion. Repeated effects are rate-limited. Sound starts after interaction. Original procedural graphics and synthesis replace the legacy PNGs and font. Three.js carries an MIT license. Barlow Condensed, IBM Plex Mono and Space Grotesk include their OFL texts in the archive.

## Prototype lineage

The implementation was informed by the Java repository at `6caecdb`, including `Game.java`, the four enemy classes, weapon and particle systems, grid classes and the original sprite sheet components. The target briefs were read from `e5b65fe`. The cyan Hunter, spinning blades, agile green pursuer and red-ringed well retain their recognizable roles. New systems include actual Stalker evasion, a collapse reward and chain reaction, a red Spinner intercept, score multipliers, four weapon tiers, three hull points and a rechargeable pulse.

## Validation

- Fourteen automated regressions cover normalized movement, arena bounds, nearest swept hits, spawn safety, Spinner bounce, Stalker evasion, red charge commitment, well attraction, chain scoring, pulse cooldown, flux, tiers, damage, expiry, replay, particle cleanup and profile recovery. Run `node --test` from the repository root.
- A seeded six-minute simulated flight reached sector 17, unlocked all four weapons, dispatched 701 enemies and collapsed 13 wells. It used normal player inputs and no invulnerability override. A separate one-minute lattice stress test repeatedly applied two wells and large opposing detonations, checking finite displacements and pinned edges.
- The extracted build was served under a repository subdirectory. Desktop Chrome exercised the Canvas path with movement, held fire, pulse, pause, settings, hull loss, results and replay. The layout was also inspected in portrait and landscape viewports.
- The preview browser disabled WebGL. For the primary path, a dense frame from the renderer's actual scene submission was captured with its geometry, transforms, uniforms and textures. All six distinct shader programs linked and the arena plus post-processing passes rendered on an offscreen OpenGL ES 3.2 software driver without GL errors. Browser-driver behavior and frame pacing on a physical GPU still need local verification.
- Physical controllers, real touch hardware and listening-level balance need a hands-on pass. The release contains one endless arena. High scores remain local to the browser origin.

## Next playtest

Time the first weapon upgrade, first hull loss and first successful well collapse over several runs. Compare a perimeter-only route with active flux collection. Those results will inform the first difficulty pass. Measure frame times during simultaneous collapses at native resolution before expanding the roster.
