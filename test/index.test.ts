import * as fsp from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { cacheDir, runCli } from './utils'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

describe('kirbyup build', () => {
  beforeAll(async () => {
    // Unset so kirbyup applies its default environment setting
    vi.stubEnv('NODE_ENV', '')
    await fsp.rm(cacheDir, { recursive: true, force: true })
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await fsp.rm(cacheDir, { recursive: true, force: true })
  })

  it('builds index.js', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'./foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
    })

    expect(output).toMatchSnapshot()
  })

  it('builds index.css', async () => {
    const { output, getFileContent } = await runCli({
      'src/input.js': 'import \'./input.css\'',
      'src/input.css': '.foo { content: "bar"; }',
    })

    expect(output).toMatchSnapshot()

    const css = await getFileContent('index.css')
    expect(css).toMatchSnapshot()
  })

  it('resolves path aliases', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'~/foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
    })

    expect(output).toMatchSnapshot()
  })

  it('injects built-in environment variables', async () => {
    const { output } = await runCli({
      'src/input.js': 'export const mode = import.' + 'meta.env.MODE',
    })

    expect(output).toMatchSnapshot()
  })

  it('injects custom environment variables', async () => {
    const { output } = await runCli({
      '.env': 'KIRBYUP_FOO=bar',
      'src/input.js': 'export const foo = import.' + 'meta.env.KIRBYUP_FOO',
    })

    expect(output).toMatchSnapshot()
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

    expect(output).toMatchSnapshot()
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

    expect(output).toMatchSnapshot()
  })

  it('loads config file with function export', async () => {
    const { output } = await runCli({
      'src/input.js': 'import foo from \'__ALIAS__/foo\'\nexport default foo',
      'src/foo.js': 'export default \'bar\'',
      'kirbyup.config.js': `
      import { fileURLToPath } from 'node:url'
      import { resolve } from 'path'
      import { defineConfig } from '${resolve(currentDir, '../dist/client/config.mjs')}'
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

    expect(output).toMatchSnapshot()
  })
})
