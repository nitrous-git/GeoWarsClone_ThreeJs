# Technical Direction

## Source material

Original repository: https://github.com/nitrous-git/GeometryWars_JavaGL_Prototype

Reference implementation: `GW_v1.06/src` on `main`.

The Java implementation is the primary behavioral, mathematical and asset reference. Inspect `game/Game.java`, `entities/Player.java`, `entities/Bullet.java`, `manager/WeaponManager.java`, `entities/enemy/EnemyA.java` through `EnemyD.java`, `entities/particle_system/BlackholeSystem.java`, the other particle systems and `warping_grid/{Grid,Particle,Spring}.java`. Original arena proportions are 1280 × 960 with a 1200 × 880 inner grid; preserve the recognizable composition while supporting responsive scaling.

The `src/res` directory contains player, projectile, enemy and background PNGs and `ExoSpace.ttf`. Prefer original assets when suitable and permitted; faithful enhanced variants are acceptable. Record any asset unavailable or replaced and the reason. Supplied Geometry Wars screenshots are a visual quality benchmark, not a source of assets to extract.

## Deployment model

Deliver a self-contained static project, exchangeable as a ZIP and publishable to GitHub Pages. Three.js may be loaded via a version-pinned CDN using native browser ES modules and an import map, with core and addon imports on the same release. No backend, package installation or production bundler is required for native JavaScript. An ordinary local HTTP server is sufficient; direct `file://` execution is not assumed. Preserve existing deployment compatibility.

## Incremental engineering and regression prevention

Use the latest available web implementation as the working baseline. The Java source and visual references guide fidelity; the current web code establishes the existing feature set and technical foundation. Review both before significant changes.

- Identify working gameplay mechanics, enemy archetypes, weapon and ability systems, progression, rendering features, menus, audio, persistence, settings and deployment behavior in the current implementation. Do not assume a feature exists without inspecting it.
- Extend and refactor functioning systems in place where practical. Replacement of internal architecture is acceptable when it materially improves quality, performance or maintainability and retains existing behavior except for explicitly requested corrections.
- Do not delete features, simplify progression or reduce enemy and weapon variety merely to match the Java feature set. Preserve successful remaster additions and integrate them with the restored movement, visual identity and physical effects.
- Record intentional behavior changes and any proposed loss of functionality, with justification. Obtain owner approval before removing working player-facing capabilities. Verify preserved functionality through regression checks as well as visual validation.

## Engineering principles

- **Separation of concerns:** clear gameplay state, simulation, input, rendering, audio and UI responsibilities; lightweight structure suited to this game.
- **Stable simulation:** frame-rate-independent movement and forces, bounded fixed-step simulation where useful, predictable collision and consistent browser input mapping. Preserve the original rotation/thrust response independently of aim.
- **Physical identity:** the legacy grid uses a 45 × 61 spring lattice with Verlet integration. Preserve coherent neighboring-point deformation and damped recoil, continuous local bullet forces, persistent attractive black hole forces, and propagating blast impulses. Use localized queries, bounded iterations, stable constraints and batched geometry. Equivalent GPU or hybrid approaches are acceptable if the visual and temporal behavior is preserved.
- **Rendering depth:** orthographic Three.js gameplay, HDR emissive/additive rendering, strong multi-scale bloom, dynamic geometry, crisp luminous cores, stretched particles, trails and layered shockwaves. Keep the resting grid and background subordinate to combat.
- **Performance and lifecycle:** shared resources, pooled/batched transient effects, bounded workloads, explicit lifetimes and complete run resets. Stress-test dense waves, simultaneous black holes and large particle eruptions. Tune quality settings rather than eliminate signature effects by default.
- **Validation:** use a developer-only VFX test mode or reproducible scenarios to inspect individual effects and combined stress cases. Verify browser rendering, input, HUD and static deployment, and regression-test the existing feature inventory, gameplay loop, progression, menus, settings, audio and persistence where present. Capture real gameplay screenshots and record checks actually performed, measured performance when available and known limitations. A stable 60 FPS on representative desktop hardware is a target, not a guaranteed measurement.

Legacy bugs, inefficient iteration and tightly coupled rendering/game logic are opportunities for redesign rather than behavior to preserve. Astra retains authority over detailed module structure, algorithms, shader implementation, dependency choices and tuning. Static delivery, original gameplay identity, preservation of successful remaster features and demonstrable visual quality remain the governing constraints.
