import * as fsp from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { cacheDir, runCli } from './utils'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

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

it('supports resolve aliases', async () => {
  const { output } = await runCli({
    'src/input.js': 'import foo from \'~/foo\'\nexport default foo',
    'src/foo.js': 'export default \'bar\'',
  })

  expect(output).toMatchSnapshot()
})

it('supports built-in env variables', async () => {
  const { output } = await runCli({
    'src/input.js': 'export const mode = import.' + 'meta.env.MODE',
  })

  expect(output).toMatchSnapshot()
})

it('supports custom env variables', async () => {
  const { output } = await runCli({
    '.env': 'KIRBYUP_FOO=bar',
    'src/input.js': 'export const foo = import.' + 'meta.env.KIRBYUP_FOO',
  })

  expect(output).toMatchSnapshot()
})

it('builds panel plugins', async () => {
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

it('compiles vue templates', async () => {
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

it('supports auto-importing components', async () => {
  const { output } = await runCli({
    'src/input.js': `
      import { kirbyup } from '${resolve(currentDir, '../dist/client/plugin.mjs')}'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
    'src/components/blocks/Foo.vue': '<template><k-header>Foo</k-header></template>',
    'src/components/blocks/Bar.vue': '<template><k-header>Bar</k-header></template>',
  })

  expect(output).toMatchSnapshot()
})

it('supports kirbyup.config.js with object', async () => {
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

it('supports kirbyup.config.js with function', async () => {
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
