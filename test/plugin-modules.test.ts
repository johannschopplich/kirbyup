import { execFile } from 'node:child_process'
import * as fsp from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { serve } from '../src/node/index.ts'
import { runCli, useTemporaryDirectories } from './utils.ts'

const execFileAsync = promisify(execFile)
const createDirectory = useTemporaryDirectories('kirbyup-modules-')

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
process.stdout.write(JSON.stringify({ registered, failed, vueEvaluations: globalThis.vueEvaluations ?? 0 }))
`

// Shaped like `vue.esm-browser.js`, which the Panel's import map points `vue`
// at: named exports, no default export. Counts its evaluations, so a bundled
// copy shows up as a second one.
const VUE_STUB_SOURCE = `globalThis.vueEvaluations = (globalThis.vueEvaluations ?? 0) + 1
export const ref = value => ({ value })
`

describe('plugin modules', () => {
  it('two built plugins share one evaluation of vue', async () => {
    const root = createRoot()
    await buildPlugin(root, 'alpha')
    await buildPlugin(root, 'beta')

    const { registered, vueEvaluations } = await evaluate(root, [
      bundlePath(root, 'alpha'),
      bundlePath(root, 'beta'),
    ])

    expect.soft(registered).toEqual(['test/alpha', 'test/beta'])
    expect.soft(vueEvaluations).toBe(1)
  })

  // Node rejects the dev bundle's `http:` import before connecting, so this
  // covers the rethrow, not a dead server as such.
  it('a failing dev bundle rejects its own import and leaves the other plugin registered', async () => {
    const { registered, failed } = await withDeadDevBundle()

    expect.soft(registered).toEqual(['test/alpha'])
    expect.soft(failed).toHaveLength(1)
    expect.soft(failed[0]).toMatch(/index\.dev\.js$/)
  })

  it('a failing dev bundle names the serve command in its console error', async () => {
    const { stderr } = await withDeadDevBundle()

    expect.soft(stderr).toContain('Couldn\'t load the plugin from the development server at http://localhost:5199')
    expect.soft(stderr).toMatch(/run dev/)
  })
})

/** Memoized, because the two cases share one Vite server start. */
let deadDevBundleRun: Promise<EvaluationResult> | undefined
function withDeadDevBundle() {
  deadDevBundleRun ??= evaluateDeadDevBundle()
  return deadDevBundleRun
}

async function evaluateDeadDevBundle() {
  const root = createRoot()
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
  try {
    await fsp.copyFile(resolve(devDirectory, 'index.dev.js'), devBundlePath)
  }
  finally {
    await server.close()
  }

  return evaluate(root, [devBundlePath, bundlePath(root, 'alpha')])
}

function createRoot() {
  return createDirectory({
    // `plugin-vue` reads `version` from whichever `vue` sits next to the entry
    // and throws without one, before falling back to the `vue` it resolves
    // from itself.
    'node_modules/vue/package.json': '{ "name": "vue", "version": "3.5.42", "type": "module", "main": "index.js" }',
    'node_modules/vue/index.js': VUE_STUB_SOURCE,
  })
}

async function buildPlugin(root: string, name: string) {
  const cwd = resolve(root, name)
  await write(resolve(cwd, 'package.json'), `{ "name": "test-${name}", "type": "module" }`)
  await write(resolve(cwd, 'src/input.js'), pluginEntry(name))
  const { exitCode, stderr } = await runCli(['src/input.js'], { cwd })
  if (exitCode !== 0)
    throw new Error(`Building ${name} failed: ${stderr}`)
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
  vueEvaluations: number
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
