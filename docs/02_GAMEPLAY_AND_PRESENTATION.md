# Gameplay & Presentation

## Core experience

The central loop is immediate: enter the arena, evade enemies, aim independently, destroy formations, improve firepower, accumulate score and survive increasingly dangerous encounters. Death concludes the run with a satisfying visual payoff, a clear results screen and immediate replay access.

Modern twin-stick-style controls are the preferred default: keyboard movement and mouse aiming with held-button firing, with gamepad support where practical. The original rotation-and-thrust movement remains a possible alternative, not a requirement. The arcade experience should favor readable threats, responsive handling and player skill over complex progression menus.

## Original gameplay foundation

The Java prototype contains four principal enemies, a score-based weapon upgrade, overlapping waves, death particles, thruster effects and a gravity-driven black hole system.

| Archetype | Original behavior | Creative direction |
|---|---|---|
| Hunter (A) | Blue enemy pursuing the player; 50 points | Coordinated pursuit and swarm pressure |
| Spinner (B) | Rotating, wall-bouncing purple/red variants; 25 points | Unpredictable trajectories and arena occupation |
| Singularity (C) | Black hole with orbiting particles and grid attraction; intended 100-point reward | Gravitational hazard, evolving visual intensity and chain reactions |
| Stalker (D) | Green pursuer, often spawned in sequential groups; 50 points | Agile movement and projectile evasion; evasion was not implemented in Java |

These are a recognizable core roster, not a limit. Distinct visual shapes, motion signatures, spawn warnings and destruction effects should communicate each enemy's behavior. Additional archetypes such as dash attackers, splitters, shielded enemies or repulsors are potential extensions when they add meaningful tactical variety.

The original single-shot and three-projectile spread upgrade (above 4,000 points) provides a baseline for weapon evolution. Additional weapon tiers, score multipliers, energy fragments, emergency bombs or limited lives are optional refinements to the survival loop. Balance and exact thresholds remain open to iteration.

## Intensity and encounter design

Enemy formations and spawn timing should create an evolving rhythm: pressure, escalation, brief recovery and renewed intensity. Mixed enemy encounters, converging formations and black holes can create emergent situations. Fair spawn telegraphing and sufficient reaction time matter more than arbitrary difficulty increases. A wave director can support these patterns without imposing rigid breaks in the action.

## Presentation and feedback

The player, projectiles and enemies should read instantly against a darker, physically responsive arena. Layered emissive geometry, controlled bloom, additive particles and shockwaves can produce a rich sense of energy. Large detonations should be distinguished from routine kills through scale, timing, physical grid response and sound. Black holes should feel spatially disruptive, with coherent gravitational effects and animated cores rather than generic particle clouds.

A minimal HUD, cohesive start/pause/results screens, personal best tracking and responsive fullscreen presentation support the arcade flow. Sound design should provide the same intentional differentiation as the visuals: weapon cadence, impacts, enemy warnings, powerful detonations and subtle environmental ambience. Reduced-flashing and screen-shake controls are desirable for comfort and accessibility.

The long-term aspiration is a highly replayable, polished survival mode. Further modes, elaborate menus and online services are secondary to the quality of the core experience.
