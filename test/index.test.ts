import { resolve } from 'pathe'
import { remove } from 'fs-extra'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { cacheDir, runCli } from './utils'

beforeAll(async () => {
  await remove(cacheDir)
})

afterAll(async () => {
  await remove(cacheDir)
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

it('supports postcss plugins', async () => {
  const { output, getFileContent } = await runCli({
    'src/input.js': 'import \'./input.css\'',
    'src/input.css': `
      .foo { inset: logical 0 5px 10px; }
      .bar:dir(rtl) { margin-right: 10px; }
    `,
  })

  expect(output).toMatchSnapshot()

  const css = await getFileContent('index.css')
  expect(css).toMatchSnapshot()
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
      import { kirbyup } from '${resolve(__dirname, '../dist/plugin.mjs')}'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
    'src/components/blocks/Foo.vue': '<template><k-header>Bar</k-header></template>',
  })

  expect(output).toMatchSnapshot()
})

it('supports kirbyup.config.js', async () => {
  const { output } = await runCli({
    'src/input.js': 'import foo from \'__ALIAS__/foo\'\nexport default foo',
    'src/foo.js': 'export default \'bar\'',
    'kirbyup.config.js': `
      import { resolve } from 'path'
      export default {
        alias: {
          '__ALIAS__/': resolve(__dirname, 'src') + '/'
        },
        extendViteConfig: {
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
