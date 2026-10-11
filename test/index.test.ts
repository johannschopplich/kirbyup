import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { useBuildFixtures } from './utils.ts'

const buildFixture = useBuildFixtures()

describe('kirbyup build', () => {
  beforeAll(() => {
    // Unset so kirbyup applies its default environment setting.
    vi.stubEnv('NODE_ENV', '')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('inlines a relative import', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import foo from \'./foo\'\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
      'src/foo.js': 'export default \'bar\'',
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toMatch(/from\s+['"]\.\/foo/)
  })

  it('imports vue as a bare specifier', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import { ref } from \'vue\'\nwindow.panel.plugin(\'kirbyup/test\', { count: ref(1) })',
    })

    expect.soft(output).toMatch(/from\s*["'`]vue["'`]/)
    expect.soft(output).not.toMatch(/import\(\s*["'`]vue/)
  })

  it('keeps an export in the entry', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'export const foo = \'bar\'\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
    })

    expect(output).toMatch(/export\s*\{/)
  })

  it('keeps top-level await in the entry', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'const foo = await Promise.resolve(\'bar\')\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
    })

    expect(output).toMatch(/await\s*Promise\.resolve/)
  })

  it('inlines a dynamic import into index.js', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'const { foo } = await import(\'./lazy.js\')\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
      'src/lazy.js': 'export const foo = \'bar\'',
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toMatch(/import\(/)
  })

  it('strips whitespace from index.js', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import { ref } from \'vue\'\nconst count = ref(1)\nwindow.panel.plugin(\'kirbyup/test\', { count })',
    })

    expect.soft(output).toContain('panel.plugin')
    expect.soft(output.trimEnd()).not.toContain('\n')
  })

  it('emits imported CSS as index.css', async () => {
    const { getFileContent } = await buildFixture({
      'src/input.js': 'import \'./input.css\'',
      'src/input.css': '.foo { content: "bar"; }',
    })

    const css = await getFileContent('index.css')
    expect(css).toMatchSnapshot()
  })

  it('resolves the ~/ alias', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import foo from \'~/foo\'\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
      'src/foo.js': 'export default \'bar\'',
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toContain('~/foo')
  })

  it('inlines import.meta.env.MODE as production', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'window.panel.plugin(\'kirbyup/test\', { mode: import.' + 'meta.env.MODE })',
    })

    expect.soft(output).toMatch(/["'`]production["'`]/)
    expect.soft(output).not.toMatch(/import\.meta\.env/)
  })

  it('inlines a KIRBYUP_-prefixed variable from .env', async () => {
    const { output } = await buildFixture({
      '.env': 'KIRBYUP_FOO=bar',
      'src/input.js': 'window.panel.plugin(\'kirbyup/test\', { foo: import.' + 'meta.env.KIRBYUP_FOO })',
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toContain('KIRBYUP_FOO')
  })

  it('inlines a field component into the panel.plugin call', async () => {
    const { output } = await buildFixture({
      'src/input.js': `
      import Demo from './fields/demo.js'
      window.panel.plugin('kirbyup/test', {
        fields: {
          demo: Demo
        }
      })
    `,
      'src/fields/demo.js': 'export default { extends: \'k-info-field\' }',
    })

    expect.soft(output).toMatch(/panel\.plugin\(["'`]kirbyup\/test/)
    expect.soft(output).toContain('k-info-field')
    expect.soft(output).not.toMatch(/from\s+['"]\.\/fields\/demo/)
  })

  it('compiles Vue single-file components', async () => {
    const { output } = await buildFixture({
      'src/input.js': `
      import DemoSection from './fields/DemoSection.vue'
      window.panel.plugin('kirbyup/test', {
        sections: {
          demo: DemoSection
        }
      })
    `,
      'src/fields/DemoSection.vue': `
      <template>
        <section class="k-demo-section">
          <header class="k-section-header">
            <h2 class="k-headline">Custom section</h2>
          </header>
        </section>
      </template>

      <script>
      export default {
        created() {
          console.log('created')
        }
      };
      </script>

      <style>
      .k-demo-section {
        padding: 20px;
      }
      </style>
    `,
    })

    expect(output).toMatchSnapshot()
  })

  it('expands kirbyup.import() into a component map', async () => {
    const { output } = await buildFixture({
      'src/input.js': `
      import { kirbyup } from '${resolve(import.meta.dirname, '../src/client/plugin.ts')}'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
      'src/components/blocks/Foo.vue': '<template><k-header>Foo</k-header></template>',
      'src/components/blocks/Bar.vue': '<template><k-header>Bar</k-header></template>',
    })

    expect.soft(output).not.toMatch(/kirbyup\.import\(\s*['"`]/)
    expect.soft(output).toContain('Foo')
    expect.soft(output).toContain('Bar')
  })

  it('skips kirbyup.import() inside string literals', async () => {
    const { output } = await buildFixture({
      'src/input.js': `
      const helpText = "Call kirbyup.import('./blocks/*.vue') to load all blocks"
      window.panel.plugin('kirbyup/example', { help: helpText })
    `,
    })

    expect(output).not.toContain('import.meta.glob')
    expect(output).toMatch(/Call kirbyup\.import\(/)
  })

  it('keeps whitespace when the config turns minify off', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import { ref } from \'vue\'\nconst count = ref(1)\nwindow.panel.plugin(\'kirbyup/test\', { count })',
      'kirbyup.config.js': 'export default { vite: { build: { minify: false } } }',
    })

    expect(output.trimEnd()).toContain('\n')
  })

  it('keeps whitespace when the config sets output.minify to false', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import { ref } from \'vue\'\nconst count = ref(1)\nwindow.panel.plugin(\'kirbyup/test\', { count })',
      'kirbyup.config.js': 'export default { vite: { build: { rolldownOptions: { output: { minify: false } } } } }',
    })

    expect(output.trimEnd()).toContain('\n')
  })

  it('merges the deprecated rollupOptions from the config', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import { ref } from \'vue\'\nimport foo from \'some-external\'\nwindow.panel.plugin(\'kirbyup/test\', { count: ref(1), foo })',
      'kirbyup.config.js': 'export default { vite: { build: { rollupOptions: { external: [\'some-external\'] } } } }',
    })

    expect.soft(output).toMatch(/from\s*["'`]some-external["'`]/)
    expect.soft(output).toMatch(/from\s*["'`]vue["'`]/)
  })

  it('applies the alias from a config exporting an object', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import foo from \'__ALIAS__/foo\'\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
      'src/foo.js': 'export default \'bar\'',
      'kirbyup.config.js': `
      import { fileURLToPath } from 'node:url'
      import { resolve } from 'path'
      const currentDir = fileURLToPath(new URL('.', import.meta.url))
      export default {
        alias: {
          '__ALIAS__/': resolve(currentDir, 'src') + '/'
        }
      }
    `,
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toContain('__ALIAS__/foo')
  })

  it('applies the alias from a config exporting defineConfig()', async () => {
    const { output } = await buildFixture({
      'src/input.js': 'import foo from \'__ALIAS__/foo\'\nwindow.panel.plugin(\'kirbyup/test\', { foo })',
      'src/foo.js': 'export default \'bar\'',
      'kirbyup.config.js': `
      import { fileURLToPath } from 'node:url'
      import { resolve } from 'path'
      import { defineConfig } from '${resolve(import.meta.dirname, '../src/client/config.ts')}'
      const currentDir = fileURLToPath(new URL('.', import.meta.url))
      export default defineConfig({
        alias: {
          '__ALIAS__/': resolve(currentDir, 'src') + '/'
        }
      })
    `,
    })

    expect.soft(output).toMatch(/["'`]bar["'`]/)
    expect.soft(output).not.toContain('__ALIAS__/foo')
  })
})
