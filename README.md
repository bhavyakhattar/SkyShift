# THE DRONE QUEST: Pick · Carry · Drop

A neon-night-city drone delivery game that runs in the browser. Fly a drone, pick up cargo, drop it in the matching zone, and beat the clock. Built for Saturnalia 2026 (Thapar University).

## Run it

**Locally:** open `index.html` in any modern browser (double-click it). No install, no build, no server.

**Online (GitHub Pages):** push this repo, then go to *Settings → Pages → Deploy from a branch → `main` / `(root)`*. The game appears at `https://<your-username>.github.io/<repo-name>/`.

## How to play

1. Enter a pilot name, pick a difficulty (Cadet, Pilot or Ace) and press **Start mission** (or choose an unlocked level in Level Select).
2. Fly over a glowing crate and press **E** or **Space** to pick it up.
3. Fly to the zone with the matching letter (A, B or C) and press **E** or **Space** to drop it.
4. Deliver every crate before the timer runs out and without destroying your drone.

| Key | Action |
|---|---|
| `W A S D` / arrow keys | Fly |
| `E` or `Space` | Pick up / drop |
| `Shift` | Turbo (drains the turbo bar, refills when released) |
| `P` or `Esc` | Pause |
| `R` | Restart the level |

On touch devices, drag on the screen to fly and use the PICK/DROP button.

## Rules

- **Win:** deliver all cargo before time runs out. **Lose:** the timer hits zero or the hull reaches zero.
- **Hazards:** towers and red patrol drones damage the hull and reset your combo. Red restricted zones drain time while you are inside.
- **Weather:** rain, fog and storm change visibility and push the drone with wind. Later levels use more weather types.
- **Levels:** three maps (Neo City, Sky Port, Cyber Zone) with more cargo, restricted zones and patrols each level. Clearing a level unlocks the next.
- **Difficulty:** Cadet (5 hull, longer timer), Pilot (3 hull), Ace (2 hull, shorter timer, more patrols).

## Scoring

- Delivery: 100 points, or 300 for gold ★ VIP cargo.
- Speed bonus: up to 100 extra points (doubled for VIP), shrinking by 3 per second between pickup and drop.
- Combo: each consecutive clean delivery adds ×0.25 to the multiplier, up to ×2.5. Collisions and restricted-zone entries reset it.
- Mission clear: 10 points per second of time left.
- The end screen shows rank, delivered count, best combo, fastest delivery, collisions and zone breaches.

## Project structure

```
index.html   page layout (menu container, HUD, canvas)
style.css    all styling: HUD, menus, end screens, responsive rules
game.js      all game logic, no libraries
README.md    this file
```

`game.js` is split into labelled sections: helpers, data, state, map generation, game flow, update, render, radar, HUD, and the main loop with input handling. The only external resource is the Orbitron font from Google Fonts, which falls back to a system font offline. Sound effects are generated with the Web Audio API.

## Notes and limits

- The leaderboard is stored in your browser's `localStorage` (plus a few placeholder rivals). It is per device, not global.
- Rendering uses a 2D canvas; the city is drawn once to an offscreen canvas for performance.
