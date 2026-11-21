# GeoWarsClone — Web

## Vision

GeoWarsClone is an unofficial, fan-made, non-commercial educational project inspired by Geometry Wars and continuing the original Java/LWJGL prototype. It is not affiliated with or endorsed by the original game's rights holders.

A visually spectacular browser-based arcade survival shooter and fidelity-first remaster of the original Java/LWJGL Geometry Wars prototype. Preserve the original game's recognizable gameplay, movement, visual identity, physical simulation and arcade rhythm, while substantially elevating rendering, effects, presentation and polish.

This is not a line-by-line port, nor a free reinterpretation. The Java prototype is the primary reference for existing behavior and art direction; the supplied Geometry Wars screenshots are the visual benchmark for intensity, composition and effects. Improvements should make the original experience richer rather than replace its identity. The Java prototype establishes the baseline identity, not the upper limit of the game. A single exceptional survival arena is more valuable than many unfinished modes.

## Evolution and feature preservation

GeoWarsClone evolves from the existing web remaster. Each iteration should build upon its successful gameplay additions, visual effects, presentation, systems and technical improvements. Fidelity means restoring the original identity where it has drifted, not rolling back the remaster to the legacy feature set.

Preserve and enhance functioning mechanics, weapons, abilities, progression, enemy archetypes, audio, interface features and supporting infrastructure already introduced in the web implementation. A feature's absence from Java is not a reason to remove it. When an addition conflicts with the established art direction, adapt its presentation before considering changes to its functionality. Explicitly requested behavior corrections take precedence over conflicting behavior, without discarding unrelated improvements.

New ideas are encouraged when they enrich the core experience. Creative freedom remains substantial within the established gameplay and artistic identity. Feature removal or substantial redesign that reduces existing capabilities requires explicit owner approval; necessary internal replacements are welcome when functionality is preserved.

## Creative pillars

- **Fidelity:** recognizable original ship, controls, geometric enemies, projectiles, cosmic setting, typography and reactive blue grid.
- **Precision:** responsive rotation and thrust, independent mouse aiming, clear hitboxes and immediate combat feedback.
- **Spectacle:** white-hot emissive cores, strong bloom, luminous trails, dense multicolored particle explosions and dramatic large-scale effects.
- **A living arena:** a physically reactive lattice that bends, oscillates and responds continuously to bullets and black holes, as well as explosions and major shockwaves.
- **Arcade mastery:** escalating pressure, varied enemy interactions, scoring and rapid replay.

## Visual identity

The arena is predominantly cosmic black, deep electric blue and neon cyan, with white-hot highlights. Gold/orange projectiles and varied highly saturated enemy colors create contrast. Green may identify particular enemies but must not dominate the arena, HUD or menus. Bright geometric outlines should remain readable against the dark environment even with deliberately excessive combat luminosity.

The original sprites, cosmic background and ExoSpace typography are the preferred visual baseline. Enhance or faithfully recreate them where necessary rather than replacing them with unrelated designs. Geometry Wars is the benchmark for the density and energy of particles, grid distortions, black holes, snake silhouettes and large detonations. Menus should feel like a polished arcade game, not a generic web dashboard.

## Creative and technical authority

Astra acts as senior lead developer and retains authority over architecture, simulation techniques, shaders, rendering pipelines, optimization, implementation and tuning. The established gameplay and art direction are constraints, not optional suggestions. Changes to identity-defining behaviors or visuals beyond the established direction require explicit owner approval; technical improvements and correction of incidental legacy bugs remain encouraged. Preserve the successful capabilities of the current web build while correcting deviations from the intended identity.

The intended outcome is a polished standalone browser game and portfolio showcase titled GeoWarsClone.

## Camera modes

- **Static / Full Arena:** existing orthographic framing; the entire arena remains visible. Default for existing and new profiles.
- **Follow Player:** 1.65× closer orthographic framing, smooth tracking and arena-edge clamping. Camera shake is applied after tracking; reduced effects disables smoothing and shake. Both renderers use the same camera projection for mouse aiming. Switch in Settings or with C during play. The selected mode is saved locally; simulation, HUD and menus are unchanged.
