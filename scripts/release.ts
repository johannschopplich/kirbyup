/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Modified from https://github.com/vitejs/vite/blob/main/scripts/release.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import colors from 'picocolors'
import prompts from 'prompts'
import semver from 'semver'
import { execa } from 'execa'
import type { ReleaseType } from 'semver'
import type { ExecaChildProcess, Options as ExecaOptions } from 'execa'

const args = require('minimist')(process.argv.slice(2))

const pkgDir = process.cwd()
const pkgPath = path.resolve(pkgDir, 'package.json')
const pkg: { name: string; version: string } = require(pkgPath)
const currentVersion = pkg.version
const isDryRun: boolean = args.dry
const skipBuild: boolean = args.skipBuild

const versionIncrements: ReleaseType[] = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease'
]

const inc: (i: ReleaseType) => string = (i) =>
  semver.inc(currentVersion, i, 'beta')!

type RunFn = (
  bin: string,
  args: string[],
  opts?: ExecaOptions<string>
) => ExecaChildProcess<string>

const run: RunFn = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

type DryRunFn = (bin: string, args: string[], opts?: any) => void

const dryRun: DryRunFn = (bin, args, opts: any) =>
  console.log(colors.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)

const runIfNotDry = isDryRun ? dryRun : run

const step: (msg: string) => void = (msg) => console.log(colors.cyan(msg))

async function main(): Promise<void> {
  let targetVersion: string | undefined = args._[0]

  if (!targetVersion) {
    const { release }: { release: string } = await prompts({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements
        .map((i) => `${i} (${inc(i)})`)
        .concat(['custom'])
        .map((i) => ({ value: i, title: i }))
    })

    if (release === 'custom') {
      const res: { version: string } = await prompts({
        type: 'text',
        name: 'version',
        message: 'Input custom version',
        initial: currentVersion
      })
      targetVersion = res.version
    } else {
      targetVersion = release.match(/\((.*)\)/)![1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const tag = `v${targetVersion}`

  if (targetVersion.includes('beta') && !args.tag) {
    const { tagBeta }: { tagBeta: boolean } = await prompts({
      type: 'confirm',
      name: 'tagBeta',
      message: `Publish under dist-tag "beta"?`
    })

    if (tagBeta) args.tag = 'beta'
  }

  const { yes }: { yes: boolean } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `Releasing ${tag}. Confirm?`
  })

  if (!yes) {
    return
  }

  step('\nUpdating package version...')
  updateVersion(targetVersion)

  step('\nBuilding package...')
  if (!skipBuild && !isDryRun) {
    await run('pnpm', ['run', 'build'])
  } else {
    console.log(`(skipped)`)
  }

  step('\nGenerating changelog...')
  await run('pnpm', ['run', 'changelog'])
  await run('npx', ['prettier', '--write', 'CHANGELOG.md'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '*'])
    await runIfNotDry('git', ['commit', '-m', `release: ${tag}`])
    await runIfNotDry('git', ['tag', tag])
  } else {
    console.log('No changes to commit.')
  }

  step('\nPublishing package...')
  await publishPackage(targetVersion, runIfNotDry)

  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['push', 'origin', `refs/tags/${tag}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  console.log()
}

function updateVersion(version: string): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

async function publishPackage(
  version: string,
  runIfNotDry: RunFn | DryRunFn
): Promise<void> {
  const publicArgs = ['publish', '--access', 'public']
  if (args.tag) {
    publicArgs.push(`--tag`, args.tag)
  }
  try {
    await runIfNotDry('npm', publicArgs, {
      stdio: 'pipe'
    })
    console.log(colors.green(`Successfully published ${pkg.name}@${version}`))
  } catch (e: any) {
    if (e.stderr.match(/previously published/)) {
      console.log(colors.red(`Skipping already published: ${pkg.name}`))
    } else {
      throw e
    }
  }
}

main().catch((err) => {
  console.error(err)
})
