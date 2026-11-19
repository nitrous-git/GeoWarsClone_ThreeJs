# Technical Direction

## Source material

Original repository: https://github.com/nitrous-git/GeometryWars_JavaGL_Prototype

Reference implementation: `GW_v1.06/src` on `main`.

The Java source is the primary reference for existing simulation and gameplay concepts. Particularly relevant files include `game/Game.java`, `entities/Player.java`, `manager/WeaponManager.java`, `entities/enemy/EnemyA.java` through `EnemyD.java`, `entities/particle_system/BlackholeSystem.java`, the other particle systems and `warping_grid/{Grid,Particle,Spring}.java`. Arena proportions are originally 1280 × 960 with a 1200 × 880 inner grid; these provide a sensible initial reference rather than a mandatory resolution.

The `src/res` directory contains player, projectile, enemy and background PNGs and `ExoSpace.ttf`. Reuse, reinterpret or replace assets as appropriate. 

## Deployment model

The intended deliverable is a self-contained static web project, exchangeable as a ZIP and publishable to GitHub Pages. Three.js can be loaded from a version-pinned CDN using browser ES modules and an import map; core and addon imports should resolve to the same release. No backend, package installation or production bundler is required for a native JavaScript implementation. An ordinary local HTTP server is sufficient for development and testing; direct `file://` execution is not assumed.

## Engineering principles

- **Separation of concerns:** gameplay state, simulation, input, rendering, audio and UI have clear responsibilities. Prefer a lightweight structure suitable for the project rather than a generic game engine.
- **Stable simulation:** frame-rate-independent motion, a bounded fixed-step simulation where useful, predictable collision resolution and consistent browser input mapping.
- **Rendering depth:** an orthographic Three.js scene is the preferred basis; custom shaders, dynamic buffer geometry, instancing, additive effects and post-processing are available to achieve the visual vision.
- **Physical identity:** the legacy grid uses a 45 × 61 lattice with spring constraints and Verlet integration. Retain its physically responsive character using a stable, efficient solver. Localized forces, bounded iterations and batched geometry can improve scalability. The black hole system is a natural companion to this simulation.
- **Performance and lifecycle:** shared resources, pooled or batched transient effects, explicit lifetimes, complete run resets and bounded workloads. Stress-test dense enemy waves and particle bursts on real hardware rather than assuming performance from theoretical budgets.
- **Practical quality:** prioritize smooth desktop browser gameplay, adaptable resolution, readable visuals and useful quality settings. A stable 60 FPS on representative hardware is an aspiration, not a measured guarantee.

The legacy implementation is not a compatibility contract. Known issues in collision handling, projectile cleanup, grid iteration, weapon reset and tightly coupled rendering/game logic are opportunities for redesign rather than behavior to preserve.

Astra retains authority over the detailed module structure, algorithms, dependency choices, visual techniques and tuning. No particular folder hierarchy, class design, shader implementation, library version or performance budget is prescribed here. The static delivery model, coherent gameplay identity and quality of the finished experience are the guiding constraints.
