import { resolve } from 'pathe'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { runCli } from './utils'

describe('kirbyup build', () => {
  beforeAll(() => {
    // Unset so kirbyup applies its default environment setting
    vi.stubEnv('NODE_ENV', '')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('builds index.js', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'./foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
    })

    expect.soft(output).toContain('"bar"')
    expect.soft(output).not.toMatch(/from\s+['"]\.\/foo/)
    expect.soft(output).toMatch(/export\s*\{/)
  })

  it('builds index.css', async () => {
    const { getFileContent } = await runCli({
      'src/input.js': 'import \'./input.css\'',
      'src/input.css': '.foo { content: "bar"; }',
    })

    const css = await getFileContent('index.css')
    expect(css).toMatchSnapshot()
  })

  it('resolves path aliases', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'~/foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
    })

    expect.soft(output).toContain('"bar"')
    expect.soft(output).not.toContain('~/foo')
  })

  it('injects built-in environment variables', async () => {
    const { output } = await runCli({
      'src/input.js': 'export const mode = import.' + 'meta.env.MODE',
    })

    expect.soft(output).toContain('"production"')
    expect.soft(output).not.toMatch(/import\.meta\.env/)
  })

  it('injects custom environment variables', async () => {
    const { output } = await runCli({
      '.env': 'KIRBYUP_FOO=bar',
      'src/input.js': 'export const foo = import.' + 'meta.env.KIRBYUP_FOO',
    })

    expect.soft(output).toContain('"bar"')
    expect.soft(output).not.toContain('KIRBYUP_FOO')
  })

  it('builds Kirby Panel plugins', async () => {
    const { output } = await runCli({
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

    expect.soft(output).toMatch(/panel\.plugin\(["']kirbyup\/test/)
    expect.soft(output).toContain('k-info-field')
    expect.soft(output).not.toMatch(/from\s+['"]\.\/fields\/demo/)
  })

  it('compiles Vue single-file components', async () => {
    const { output } = await runCli({
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
    const { output } = await runCli({
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
    const { output } = await runCli({
      'src/input.js': `
      const helpText = "Call kirbyup.import('./blocks/*.vue') to load all blocks"
      window.panel.plugin('kirbyup/example', { help: helpText })
    `,
    })

    expect(output).not.toContain('import.meta.glob')
    expect(output).toMatch(/Call kirbyup\.import\(/)
  })

  it('loads config file with object export', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'__ALIAS__/foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
      'kirbyup.config.js': `
      import { fileURLToPath } from 'node:url'
      import { resolve } from 'path'
      const currentDir = fileURLToPath(new URL('.', import.meta.url))
      export default {
        alias: {
          '__ALIAS__/': resolve(currentDir, 'src') + '/'
        },
        vite: {
          build: {
            lib: {
              name: 'test'
            }
          }
        }
      }
    `,
    })

    expect.soft(output).toContain('"bar"')
    expect.soft(output).not.toContain('__ALIAS__/foo')
  })

  it('loads config file with function export', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'__ALIAS__/foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
      'kirbyup.config.js': `
      import { fileURLToPath } from 'node:url'
      import { resolve } from 'path'
      import { defineConfig } from '${resolve(import.meta.dirname, '../src/client/config.ts')}'
      const currentDir = fileURLToPath(new URL('.', import.meta.url))
      export default defineConfig({
        alias: {
          '__ALIAS__/': resolve(currentDir, 'src') + '/'
        },
        vite: {
          build: {
            lib: {
              name: 'test'
            }
          }
        }
      })
    `,
    })

    expect.soft(output).toContain('"bar"')
    expect.soft(output).not.toContain('__ALIAS__/foo')
  })
})
