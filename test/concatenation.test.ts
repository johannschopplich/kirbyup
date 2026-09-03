import { execFile } from 'node:child_process'
import * as fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { serve } from '../src/node/index.ts'
import { runCli } from './utils.ts'

const execFileAsync = promisify(execFile)

// Vitest resolves a dynamic import through Vite's module runner, which
// transforms the source and never reaches the duplicate-declaration early error
// these tests exist to catch. Only a real Node process does.
const RUNNER_SOURCE = `const registered = []
globalThis.window = { panel: { plugin: name => registered.push(name) } }
await import('./bundle.mjs')
process.stdout.write(JSON.stringify(registered))
`

// Shaped like `vue.esm-browser.js`, which the Panel's import map points `vue`
// at: named exports, no default export.
const VUE_STUB_SOURCE = `export const ref = value => ({ value })
`

describe('concatenated plugin bundles', () => {
  it('register two plugins that import the same vue binding', async () => {
    const root = await createRoot()
    await buildPlugin(root, 'alpha')
    await buildPlugin(root, 'beta')

    const { registered } = await evaluate(root, [
      await readBundle(root, 'alpha'),
      await readBundle(root, 'beta'),
    ])

    expect(registered).toEqual(['test/alpha', 'test/beta'])
  })

  it('register a plugin that imports no vue beside one that does', async () => {
    const root = await createRoot()
    await buildPlugin(root, 'alpha')
    // Rolldown passes an argument only for externals the entry actually
    // imports, so this bundle's IIFE has a different arity from alpha's.
    await buildPlugin(root, 'gamma', standalonePluginEntry('gamma'))

    const { registered } = await evaluate(root, [
      await readBundle(root, 'alpha'),
      await readBundle(root, 'gamma'),
    ])

    expect(registered).toEqual(['test/alpha', 'test/gamma'])
  })

  it('a dead dev bundle leaves the other plugins registered', async () => {
    const { registered } = await withDeadDevBundle()
    expect(registered).toEqual(['test/alpha'])
  })

  it('a dead dev bundle names the serve command in its console error', async () => {
    const { stderr } = await withDeadDevBundle()

    expect.soft(stderr).toContain('development server at http://localhost:5199')
    expect.soft(stderr).toMatch(/run dev/)
  })
})

/** Memoised, because the two cases share one Vite server start. */
let deadDevBundleRun: Promise<EvaluationResult> | undefined
function withDeadDevBundle() {
  deadDevBundleRun ??= evaluateDeadDevBundle()
  return deadDevBundleRun
}

async function evaluateDeadDevBundle() {
  const root = await createRoot()
  await buildPlugin(root, 'alpha')

  const devDirectory = resolve(root, 'beta')
  await write(resolve(devDirectory, 'src/input.js'), pluginEntry('beta'))
  const server = await serve({
    cwd: devDirectory,
    entry: 'src/input.js',
    outDir: devDirectory,
    port: 5199,
    watch: false,
  })
  const devBundle = await fsp.readFile(resolve(devDirectory, 'index.dev.js'), 'utf8')
  // Leaves the dev bundle pointing at a dead URL.
  await server.close()

  return evaluate(root, [devBundle, await readBundle(root, 'alpha')])
}

async function createRoot() {
  const root = await fsp.mkdtemp(join(tmpdir(), 'kirbyup-concat-'))
  // `plugin-vue` reads the major from whichever `vue` sits next to the entry
  // before falling back to its own. Without a version it never gets that far.
  await write(resolve(root, 'node_modules/vue/package.json'), '{ "name": "vue", "version": "3.5.42", "type": "module", "main": "index.js" }')
  await write(resolve(root, 'node_modules/vue/index.js'), VUE_STUB_SOURCE)
  return root
}

async function buildPlugin(root: string, name: string, entry = pluginEntry(name)) {
  const cwd = resolve(root, name)
  await write(resolve(cwd, 'package.json'), `{ "name": "test-${name}", "type": "module" }`)
  await write(resolve(cwd, 'src/input.js'), entry)
  await runCli(['src/input.js'], { cwd })
}

function readBundle(root: string, name: string) {
  return fsp.readFile(resolve(root, name, 'index.js'), 'utf8')
}

function pluginEntry(name: string) {
  return `import { ref } from 'vue'

const count = ref(1)

window.panel.plugin('test/${name}', { components: { '${name}': { count } } })
`
}

function standalonePluginEntry(name: string) {
  return `window.panel.plugin('test/${name}', { components: { '${name}': {} } })
`
}

interface EvaluationResult {
  registered: string[]
  stderr: string
}

/**
 * Joins the bundles the way `Plugins::read()` does and imports the result as one
 * module. An empty bundle registers nothing, so this also catches a `globals`
 * expression that silently failed to parse.
 */
async function evaluate(root: string, bundles: string[]): Promise<EvaluationResult> {
  const directory = await fsp.mkdtemp(join(root, 'run-'))

  await write(resolve(directory, 'bundle.mjs'), bundles.join('\n\n'))
  await write(resolve(directory, 'runner.mjs'), RUNNER_SOURCE)

  const { stdout, stderr } = await execFileAsync(process.execPath, [resolve(directory, 'runner.mjs')])

  return { registered: JSON.parse(stdout) as string[], stderr }
}

async function write(path: string, content: string) {
  await fsp.mkdir(dirname(path), { recursive: true })
  await fsp.writeFile(path, content, 'utf8')
}
