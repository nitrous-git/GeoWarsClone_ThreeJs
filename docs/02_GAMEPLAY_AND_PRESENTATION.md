# Gameplay & Presentation

## Core experience

Enter the arena, maneuver a spacecraft, aim independently, destroy formations, improve firepower, accumulate score and survive increasingly dangerous encounters. Death concludes the run with a satisfying effect, clear results and immediate replay access.

The default input model is the original rotation-and-thrust style with updated keyboard bindings: A/D rotate, W applies forward thrust, release W progressively decelerates, and the mouse independently directs held-left-button firing. Preserve the original response and movement feel with frame-rate-independent tuning. Mouse aim must not rotate the ship. Additional input schemes are secondary and must not replace the default.

## Original gameplay foundation

The Java prototype contains four principal enemies, a score-based weapon upgrade, overlapping waves, death particles, thruster effects and a gravity-driven black hole system.

| Archetype | Original behavior | Direction |
|---|---|---|
| Hunter (A) | Blue enemy pursuing the player; 50 points | Preserve recognizable pursuit and appearance |
| Spinner (B) | Rotating, wall-bouncing purple/red variants; 25 points | Preserve recognizable trajectories and variants |
| Singularity (C) | Black hole with orbiting particles and grid attraction; intended 100-point reward | Persistent gravitational distortion and rich orbital effects |
| Stalker (D) | Green pursuer, often spawned in sequential groups; 50 points | Preserve recognizable behavior; evasion was not implemented in Java |
| Snake | Geometry Wars-inspired addition | Articulated luminous orange chain, distinct head, flowing motion and readable collision behavior |

Preserve the single-shot and three-projectile spread upgrade (above 4,000 points) as the reference baseline. Retain the existing web remaster’s additional weapon tiers, abilities, progression, scoring systems and enemy archetypes wherever present; the Java baseline must not replace a richer working system. Integrate restored behaviors and new content into the current gameplay loop. Balance and exact tuning remain open to iteration. Nova Pulse is a major emergency weapon, distinguished from normal combat by arena-scale coverage and spectacular effects.

## Remaster feature continuity

The original roster and weapon progression above are foundations, not an exhaustive feature list. Build on all functioning gameplay additions in the current web version, including any additional enemies, weapons, abilities, pickups, scoring or progression mechanics. Their exact inventory is established by inspecting the current implementation rather than assuming which features exist.

Preserve useful menu functionality, high-score tracking, settings, audio, input options and other player-facing improvements. Revise their visual presentation and correct default ship controls to match the established direction without discarding unrelated functionality. Additional control schemes may remain optional. Preserve the accessibility and quality options already available.

Prefer extending, integrating and polishing existing systems rather than creating redundant replacements. Any intentional reduction in player-facing capabilities requires owner approval. The goal is a richer experience with a more faithful identity, not a narrower reproduction of the Java version.

## Intensity and encounter design

Preserve the arcade rhythm of escalating, overlapping waves. Mixed enemy encounters, sequential formations and black holes should create emergent situations. Fair spawn telegraphing and readable silhouettes matter more than arbitrary difficulty increases. Additional modes and unrelated content are secondary to the quality and fidelity of the core survival experience.

## Presentation and feedback

The arena features a dark cosmic background, dense electric-blue elastic lattice and bright neon boundary. Preserve the original spacecraft and projectile silhouettes. Projectiles are prominent orange/gold double bolts with brilliant cores and continuous deformation along their path. Thrusters emit directional trails. Enemy deaths generate dense, velocity-stretched multicolored particles, flashes, local grid impulses and residual trails.

Black holes continuously attract and deform the grid while luminous particles orbit and spiral around their cores. Their destruction produces a dramatic release and grid recoil. Nova Pulse is a near-arena-scale event with expanding shockwaves, a dense particle eruption, strong grid deformation and secondary destruction effects. Visual scale should be markedly greater than a routine explosion.

Use deliberately strong bloom and emissive rendering while preserving crisp geometric cores and readable threats. The default aesthetic is blue/cyan, not green. Provide reduced-flashing, bloom and screen-shake settings where feasible without weakening the default target.

Use the original ExoSpace typography where available and permitted. The main menu is a full-screen, animated cosmic arcade presentation with a large title, simple vertically arranged actions and coherent neon-blue styling. HUD, pause, settings, results and high scores share this identity. Avoid generic web dashboard styling. Sound design should reinforce weapons, impacts, warnings and detonations.
