// @ts-check

/*
 * Modified from https://github.com/vuejs/vue-next/blob/master/scripts/release.js
 */
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const prompts = require('prompts')
const execa = require('execa')
const { cyan } = require('colorette')
const { version: currentVersion } = require('../package.json')

/**
 * @type {import('semver').ReleaseType[]}
 */
const versionIncrements = ['patch', 'minor', 'major']

/**
 * @param {import('semver').ReleaseType} i
 */
const inc = (i) => semver.inc(currentVersion, i)

/**
 * @param {string} bin
 * @param {string[]} args
 * @param {object} opts
 */
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

/**
 * @param {string} msg
 */
const step = (msg) => console.log(cyan(msg))

async function main() {
  let targetVersion

  /**
   * @type {{ release: string }}
   */
  const { release } = await prompts({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements
      .map((i) => `${i} (${inc(i)})`)
      .concat(['custom'])
      .map((i) => ({ value: i, title: i }))
  })

  if (release === 'custom') {
    /**
     * @type {{ version: string }}
     */
    const res = await prompts({
      type: 'text',
      name: 'version',
      message: 'Input custom version',
      initial: currentVersion
    })
    targetVersion = res.version
  } else {
    targetVersion = release.match(/\((.*)\)/)[1]
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid target version: ${targetVersion}`)
  }

  const { yes: tagOk } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`
  })

  if (!tagOk) {
    return
  }

  // Update the package version.
  step('\nUpdating the package version...')
  updatePackage(targetVersion)

  // Build the package.
  step('\nBuilding the package...')
  await run('npm', ['install'])
  await run('npm', ['run', 'build'])

  // Generate the changelog.
  step('\nGenerating the changelog...')
  await run('npm', ['run', 'changelog'])
  await run('npx', ['prettier', '--write', 'CHANGELOG.md'])

  const { yes: changelogOk } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `Changelog generated. Does it look good?`
  })

  if (!changelogOk) {
    return
  }

  // Commit changes to the Git and create a tag.
  step('\nCommitting changes...')
  await run('git', ['add', 'CHANGELOG.md', 'package.json', 'package-lock.json'])
  await run('git', ['commit', '-m', `release: v${targetVersion}`])
  await run('git', ['tag', `v${targetVersion}`])

  // Publish the package.
  step('\nPublishing the package...')
  await run('npm', ['publish', '--no-commit-hooks', '--no-git-tag-version'])

  // Push to GitHub.
  step('\nPushing to GitHub...')
  await run('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await run('git', ['push'])
}

function updatePackage(version) {
  const pkgPath = path.resolve(__dirname, '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  pkg.version = version

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

main().catch((err) => console.error(err))
