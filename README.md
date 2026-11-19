# VECTOR//NOVA — P1 Genesis

A twin-stick survival shooter from Nitrous Studio. Pilot a vector ship across a spring lattice, collect flux and turn collapsing gravity wells against approaching formations.

## Launch

Extract the archive into the root of your VectorNova_ThreeJs checkout. In WebStorm, open `index.html` using **Open in Browser** and choose your desktop browser. The address should begin with `http`.

Alternatively, from the extracted directory run:

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000/). On Windows, `py -m http.server 8000` also works. All game paths are relative. For GitHub Pages, serve the repository root.

The game runs directly as native JavaScript modules. Three.js r169 loads from a version-pinned CDN, with the identical file included for offline and slow-network launches. A WebGL 2 browser provides the full effects. Systems without WebGL 2 automatically use the Canvas renderer. Artwork, fonts and synthesis are local.

## Controls

| Action | Keyboard and mouse | Standard gamepad |
| --- | --- | --- |
| Move | WASD | Left stick |
| Aim and fire | Aim with the mouse, hold left button. Arrow keys also aim and fire. | Right stick. Right trigger fires along the current heading. |
| Nova pulse | Space or right mouse button | Either bumper |
| Pause or resume | Esc or P | Start |
| Launch or replay | Enter or the on-screen button | A |

Touch devices use two floating sticks. Drag on the left to move, drag on the right to aim and shoot, and tap **Nova pulse** to discharge. Landscape gives the most space.

## Scoring and survival

Three hull points carry a run. A hit clears nearby threats and grants a short recovery window. The Nova pulse clears a local radius and recharges in 12 seconds. Shoot a Singularity to collapse it and score every enemy caught in its blast. A red Spinner marks its charge lane before it accelerates.

Collect four gold flux shards to increase the score multiplier by one, up to ×9. Hull damage resets the multiplier. Firepower evolves automatically at 1,500, 4,500 and 12,000 points. Finish the run or choose **End run** from pause to record the result locally. Settings and personal best persist in the browser.

## Project notes

The three original briefs remain in `docs/`. [Architecture and validation](docs/04_GENESIS_IMPLEMENTATION.md) describes the shipped systems and test coverage. Dependency licenses are alongside the libraries and fonts in `assets/`. Optional regression checks run with Node 20 or newer:

```sh
node --test
```
