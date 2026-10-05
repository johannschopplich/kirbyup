# IIFE output for Kirby 6 plugin concatenation

Kirby 6 concatenates every plugin's `index.js` into one ES module, where a
duplicate top-level binding is a parse error that takes down every plugin on
the page rather than just the offending one. kirbyup therefore builds each
plugin as an IIFE, which contributes no top-level name, and passes Vue in as
the wrapper's argument via a `globals` function that returns
`await import("vue")` so the Panel's import map resolves it.

## Considered options

**Hand-written scope isolation.** A Vite plugin that walked the emitted ES
module and renamed every top-level binding to something collision-free. It
worked, at 273 lines of AST surgery that had to keep pace with whatever
Rolldown emitted next. The IIFE gets the same guarantee from the format.

**Keeping `formats: ['es']` and living with it.** Only viable if plugin
authors never collide, which is not a property anyone can enforce across
third-party plugins installed side by side.

**An IIFE with `window.Vue`, as in kirbyup 3.x.** Kirby 6 has no Vue global;
`vue` resolves through the Panel's `<script type="importmap">`. Rollup's
`output.globals` accepts a function whose return value is parsed as an
expression, so a dynamic import can take the global's place.

## Consequences

Plugin entries can no longer use top-level `await` or export anything.
Rolldown rejects both outright at build time, which is the right place to
learn about it, and `exports: 'none'` keeps the wrapper unassigned. Neither
is a real loss: Kirby loads plugins for their side effects only.

An external imported as a default or namespace binding now goes through
Rolldown's CJS interop shim and resolves to the module namespace. For `vue`
this is more permissive than plain ESM rather than broken, since
`vue.esm-browser.js` has no default export to disagree with, but a
user-added external that does have one will behave differently than under
`es`.

A silent failure mode is worth knowing about: an unparsable `globals`
expression yields a zero-length chunk with no error and no warning. The
concatenation tests evaluate the built bundles in a real Node process and
assert that plugins register, which catches an empty bundle as well as a
duplicate binding.
