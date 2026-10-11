import { execFile } from 'node:child_process'
import * as fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { serve } from '../src/node/index.ts'
import { runCli } from './utils.ts'

const execFileAsync = promisify(execFile)

// Script for a real Node process that imports each bundle as its own module, in
// order and each in its own `try`, the way the Panel loads plugins. `vue`
// resolves from `node_modules` as the import map would resolve it, outside
// Vite's module runner.
const RUNNER_SOURCE = `const registered = []
const failed = []
globalThis.window = { panel: { plugin: name => registered.push(name) } }
for (const modulePath of process.argv.slice(2)) {
  try {
    await import(modulePath)
  }
  catch {
    failed.push(modulePath)
  }
}
process.stdout.write(JSON.stringify({ registered, failed }))
`

// Shaped like `vue.esm-browser.js`, which the Panel's import map points `vue`
// at: named exports, no default export.
const VUE_STUB_SOURCE = `export const ref = value => ({ value })
`

describe('plugin modules', () => {
  it('a built plugin registers with `vue` resolved from outside the bundle', async () => {
    const root = await createRoot()
    await buildPlugin(root, 'alpha')

    const { registered } = await evaluate(root, [bundlePath(root, 'alpha')])

    expect(registered).toEqual(['test/alpha'])
  })

  // Node rejects the dev bundle's `http:` import before connecting, so this
  // covers the rethrow, not a dead server as such.
  it('a failing dev bundle rejects its own import and leaves alpha registered', async () => {
    const { registered, failed } = await withDeadDevBundle()

    expect.soft(registered).toEqual(['test/alpha'])
    expect.soft(failed).toHaveLength(1)
    expect.soft(failed[0]).toMatch(/index\.dev\.js$/)
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
  // Kept for the run, since closing the server removes the dev bundle.
  const devBundlePath = resolve(root, 'beta-index.dev.js')
  await fsp.copyFile(resolve(devDirectory, 'index.dev.js'), devBundlePath)
  // Leaves the dev bundle pointing at a dead URL.
  await server.close()

  return evaluate(root, [devBundlePath, bundlePath(root, 'alpha')])
}

async function createRoot() {
  const root = await fsp.mkdtemp(join(tmpdir(), 'kirbyup-modules-'))
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

function bundlePath(root: string, name: string) {
  return resolve(root, name, 'index.js')
}

function pluginEntry(name: string) {
  return `import { ref } from 'vue'

const count = ref(1)

window.panel.plugin('test/${name}', { components: { '${name}': { count } } })
`
}

interface EvaluationResult {
  registered: string[]
  failed: string[]
  stderr: string
}

async function evaluate(root: string, bundlePaths: string[]): Promise<EvaluationResult> {
  const runner = resolve(root, 'runner.mjs')
  await write(runner, RUNNER_SOURCE)

  const { stdout, stderr } = await execFileAsync(process.execPath, [runner, ...bundlePaths])

  return { ...JSON.parse(stdout) as Omit<EvaluationResult, 'stderr'>, stderr }
}

async function write(path: string, content: string) {
  await fsp.mkdir(dirname(path), { recursive: true })
  await fsp.writeFile(path, content, 'utf8')
}
