# SHED OF SHADOWS
**The night shift never clocked out.**

A standalone, free, original retro-noir arcade horror side story set near the world of [BLACKOUT](https://github.com/MichaelWave369/Blackout). The story takes place in 1947 at Chicago's South Branch docks and does not change or spoil BLACKOUT's established mystery.

## Rung 2: Quest 3 WebXR foundation (experimental)
- Detects immersive-vr support at runtime, never by browser user-agent.
- Offers an **ENTER QUEST 3 VR** button only when the browser reports support.
- Creates a separate WebGL stereo scene with a fixed, stationary 1947 warehouse gallery. No locomotion or forced camera rotation.
- Uses both tracked controller target rays to aim; trigger/select fires. Controller squeeze/grip reloads.
- Reuses the desktop engine's ammo, scoring, waves, bosses and sidecar receipt without altering the original Canvas game.
- Provides a headset-visible status panel and replay from inside VR.
- Includes pure coordinate/raycast tests, no new runtime dependencies.

### Quest 3 field test
1. Merge Rung 2 only after checking Actions and the PR diff.
2. Enable GitHub Pages **Settings → Pages → Build and deployment → GitHub Actions** and run the manual **Deploy game to GitHub Pages** workflow on main.
3. Open the HTTPS Pages URL in **Meta Quest Browser**, not a desktop browser's VR emulator.
4. Select **ENTER QUEST 3 VR**. Approve the immersive session request.
5. Try both controllers: target rays, trigger to shoot, squeeze/grip to reload. After a loss/win, trigger restarts the run. Exit via Quest system controls.
6. Report any ray offset, HUD clipping, frame-rate issues, controller mappings and seated/standing height mismatch. These require hardware field testing.

**Important:** This is an initial WebXR implementation, not a verified Quest 3 playtest. VR support varies by device/browser. The 2D game stays playable when immersive-vr is unsupported. No online co-op or automatic BLACKOUT save integration.

## Rung 1: Night Shift (playable browser prototype)
- Three original procedural noir locations: Dock Gate, Freight Hall, and Sealed Hold
- Six waves, escalating shadows, heavy enemies, and a final Warehouse Warden
- Six-shot revolver with reload, mouse/touch/controller aiming, score, headshots, combos and health
- Accessible enemy buttons as an alternative to aiming precisely at the canvas
- Local high score, pause/restart, optional original synthesized effects
- Win-screen JSON receipt for a fictional K-marked ledger fragment
- Zero runtime dependencies and no accounts, ads, telemetry or paid service
- MIT license, DOM-free seeded engine, Node unit tests, and GitHub Actions

**Current scope:** Single-player desktop is stable in Rung 1; Rung 2 adds an opt-in experimental Quest 3 WebXR rendering path. Multiplayer and BLACKOUT save imports remain future work.

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
- **Rung 2:** experimental Quest 3 WebXR controller aiming, fixed comfort gallery and in-headset HUD (this PR); spatial sound and hand-tracking polish follow hardware tests
- **Rung 3:** opt-in two-player co-op with explicit session security
- **Rung 4:** reviewed, consent-based evidence transfer if BLACKOUT independently adopts the contract

MIT licensed. © 2026 MichaelWave369.
