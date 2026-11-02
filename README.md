# SHED OF SHADOWS
**The night shift never clocked out.**

A standalone, free, original retro-noir arcade horror side story set near the world of [BLACKOUT](https://github.com/MichaelWave369/Blackout). The story takes place in 1947 at Chicago's South Branch docks and does not change or spoil BLACKOUT's established mystery.

## Rung 1: Night Shift (playable browser prototype)
- Three original procedural noir locations: Dock Gate, Freight Hall, and Sealed Hold
- Six waves, escalating shadows, heavy enemies, and a final Warehouse Warden
- Six-shot revolver with reload, mouse/touch/controller aiming, score, headshots, combos and health
- Accessible enemy buttons as an alternative to aiming precisely at the canvas
- Local high score, pause/restart, optional original synthesized effects
- Win-screen JSON receipt for a fictional K-marked ledger fragment
- Zero runtime dependencies and no accounts, ads, telemetry or paid service
- MIT license, DOM-free seeded engine, Node unit tests, and GitHub Actions

**Current scope:** Rung 1 is a flat-screen *single-player* browser game. Quest 3 VR, local/online co-op and two-way BLACKOUT save integration are future rungs, not features of this version.

## Controls
| Action | Mouse/touch | Keyboard | Gamepad |
| --- | --- | --- | --- |
| Aim | Point/touch gallery | Position from last pointer location | Left stick |
| Fire | Click/tap canvas or Fire button | Space | Right trigger or A |
| Reload | Reload button | R | B |
| Pause/resume | Pause button | Esc | Pause button on screen |

The caseboard also provides labeled enemy-target buttons for keyboard and assistive technology users.

## Run and test
The game consists of static HTML/CSS/ES modules. Serve the repository root over HTTP to play locally. No installation is needed for GitHub Pages.

Node 20+ is only needed to run tests:
- `npm run check` (JS syntax)
- `npm test` (engine and receipt tests)

### GitHub Pages
1. Merge the PR once CI checks and the diff are reviewed.
2. Go to **Repository Settings → Pages** and select **GitHub Actions** as the build/deployment source.
3. Go to **Actions → Deploy game to GitHub Pages → Run workflow**, selecting main. Deployment is manual initially to prevent a premature failure in a repository where Pages has not been enabled.
4. Future deploy automation can be enabled after the first Pages deployment is working.

## Story compatibility
This side game references the South Branch setting and mysterious K-marked cargo without resolving BLACKOUT's unrevealed identity or changing any detective save. The downloadable receipt is explicitly **unverified player-editable narrative data**; BLACKOUT has no importer for it. See [sidecar contract](docs/sidecar-contract.md).

## Roadmap
- **Rung 2:** Quest 3 WebXR hand/controller aiming, comfort settings and spatial sound
- **Rung 3:** opt-in two-player co-op with explicit session security
- **Rung 4:** reviewed, consent-based evidence transfer if BLACKOUT independently adopts the contract

MIT licensed. © 2026 MichaelWave369.
