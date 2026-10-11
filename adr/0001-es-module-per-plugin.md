# One ES module per plugin

Kirby 6 imports each plugin's `index.js` as its own module ([getkirby/kirby#8603](https://github.com/getkirby/kirby/pull/8603)), and the Panel's import map resolves `vue`. kirbyup therefore emits a plain ES module that imports `vue` as a bare specifier, so every plugin shares the Panel's Vue instance without a global. The entry file may use top-level `await` and `export`.

## Considered Options

**An IIFE that takes Vue from `await import("vue")` through `output.globals`.** It was needed while Kirby concatenated all plugins into one module, where a duplicate top-level binding broke every plugin on the page. It ruled out top-level `await` and `export` in the entry, and the Rolldown 1.2.13 minifier rejects the `await` inside the wrapper.

## Consequences

The build stays one script (`output.codeSplitting: false`). Kirby serves a plugin's script at `media/plugins/{vendor}/{name}.js` and no other script beside it, so a chunk from a dynamic `import()` would 404.

Kirby awaits the plugins in order, so a top-level `await` in one plugin delays the Panel's mount.

Kirby 6 alphas before 6.0.0-beta.1 still concatenate the plugins, where two kirbyup 4 bundles collide on their top-level bindings. kirbyup 4 requires 6.0.0-beta.1 or later.
