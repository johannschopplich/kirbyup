// @ts-check

/*
 * Modified from https://github.com/vitejs/vite/blob/main/scripts/verifyCommit.js
 */
const fs = require('fs')
const msgPath = process.argv[2]
const msg = fs.readFileSync(msgPath, 'utf-8').trim()
const consola = require('consola')
const { green, red } = require('colorette')

const RELEASE_RE = /^v\d/
const COMMIT_RE =
  /^(revert: )?(feat|fix|docs|dx|refactor|perf|test|workflow|build|ci|chore|types|wip|release|deps)(\(.+\))?: .{1,50}/

if (!RELEASE_RE.test(msg) && !COMMIT_RE.test(msg)) {
  consola.error(
    `${red('Invalid commit message format.')}\n\n` +
      red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`
      ) +
      `    ${green(`feat: add 'comments' option`)}\n` +
      `    ${green(`fix: handle events on blur (close #28)`)}\n\n` +
      red(`  See .github/commit-convention.md for more details.\n`)
  )

  process.exit(1)
}
