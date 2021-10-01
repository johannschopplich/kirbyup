// @ts-check

/*
 * Modified from https://github.com/vitejs/vite/blob/main/scripts/verifyCommit.js
 */
const fs = require('fs')
const colors = require('colorette')
const msgPath = process.argv[2]
const msg = fs.readFileSync(msgPath, 'utf-8').trim()

const RELEASE_RE = /^v\d/
const COMMIT_RE =
  /^(revert: )?(feat|fix|docs|dx|refactor|perf|test|workflow|build|ci|chore|types|wip|release|deps)(\(.+\))?: .{1,50}/

if (!RELEASE_RE.test(msg) && !COMMIT_RE.test(msg)) {
  console.log()
  console.error(
    `  ${colors.bgRed(colors.white(' ERROR '))} ${colors.red(
      `invalid commit message format.`
    )}\n\n` +
      colors.red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`
      ) +
      `    ${colors.green(`feat: add 'comments' option`)}\n` +
      `    ${colors.green(`fix: handle events on blur (close #28)`)}\n\n` +
      colors.red(`  See .github/commit-convention.md for more details.\n`)
  )

  process.exit(1)
}
