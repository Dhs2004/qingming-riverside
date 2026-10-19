入画 · 清明上河图

A small first-person reconstruction of the Rainbow Bridge and adjoining river market,
informed by Zhang Zeduan's Northern Song handscroll in the Palace Museum.

Run locally
  npm run dev
  Open http://127.0.0.1:18742/
  Or: python3 -m http.server 18742 --bind 127.0.0.1 --directory dist

Checks
  npm run check          JavaScript syntax, no dependencies required
  npm run check:world    Geometry, collision, route and reachability checks

The site is buildless. Everything needed at runtime is in dist/, including vendored
Three.js r169. No npm install or external API key is required. Serve over HTTP rather
than opening index.html directly, because browsers restrict ES modules on file URLs.

Controls
  WASD / up and down arrows: walk. Drag: look. Left/right arrows: turn.
  Shift: walk faster. E: inspect a nearby detail. Escape: pause/close a dialog.
  Touch or a narrow viewport: left joystick to walk, drag the scene to look.
  The map offers four arrival points. The tea houses have accessible interiors.
  Guided tour, optional synthesized ambience, original-painting comparisons and
  framed JPEG captures are included.
  Inspect the south tea house to sit at a table. Drag to look from the bench;
  Stand up, a walking key, or the touch joystick returns to walking.

Scene scope
  One continuous Rainbow Bridge neighbourhood, with market approaches on both
  banks, a landing, and two accessible tea interiors. Four map points are arrival
  positions in the same scene, not separate levels.
  More than 340 painted figures (including seated guests and bent boatmen), 12 animals,
  five boats, ceramic/cloth/fruit/food stalls, carts and individually drawn props.
  Thirty small social groups gather at counters, bridge stalls and the landing.
  Thirteen painted roles include elders, monks, basket carriers, scroll bearers
  and crouching workers; clothing shades and stature vary across the crowd.
  Figures have separate front, back and profile views. Walking gait follows
  distance travelled, including the elders, basket carriers and scroll bearers.
  Twenty-five walkers follow paths around stationary people and resting animals.
  Banners and water move gently; no external media is needed.

Spring hand-painted refinement
  Warm sunlight and soft contact shadows; a watercolor sky and real planar river
  reflections. Spring willows, painted leaf clusters, reeds, little wildflowers
  and a few swallows share the original compact neighbourhood.
  Four parasol papers, carved celadon and iron-painted wares, tea whisks, scales,
  steamers, produce, woven baskets, worn paving, joinery, hemp coils and repaired
  boat canopies add close-up detail. The animation-inspired palette is an artistic
  interpretation; the original scroll remains available for comparison.
  Indexed static batching keeps shared geometry vertices rather than expanding
  each triangle. Touch layouts use smaller shadow and reflection buffers.

Source and artistic limits
  Open dist/sources.html for museum links, public-domain image sources, and a clear
  distinction between painting evidence and spatial/artistic reconstruction.
  Figures and animals are four-view drawings on planes, not volumetric scans.
  Roof, water and silk texture samples are documented in research/reference-notes.txt.
  Three.js license is preserved in dist/assets/THREE-LICENSE.txt.

Structure
  world.js: landscape, bridge, architecture, boats, market placement and collision
  ink.js: geometry and brush/material helpers; static material batching
  people.js, townsfolk.js, animals.js, tableaux.js: painted figures and animals
  crowd-life.js, crowd-paths.js, crowd-shadows.js: groups, routes and foot washes
  main.js: camera, controls, paper pass, audio, dialogs, tour and capture
  atmosphere.js: watercolor sky, reflected water and kettle steam
  garden.js: layered painted foliage, bank plants, birds and breeze
  artisan.js: close-up market, architecture, bridge and boat craftsmanship
  index.html, style.css: responsive Chinese interface

Hosting
  Play: https://dhs2004.github.io/qingming-riverside/
  Push to main to validate and publish dist/ through GitHub Actions.
  See .github/workflows/pages.yml for the GitHub Pages deployment.
