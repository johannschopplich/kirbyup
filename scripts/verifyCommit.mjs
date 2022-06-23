// @ts-check
// Invoked on the `commit-msg` git hook by simple-git-hooks
// Modified from https://github.com/vitejs/vite/blob/main/scripts/verifyCommit.ts

import { readFileSync } from 'node:fs'
import colors from 'picocolors'

// Get $1 from commit-msg script
const msgPath = process.argv[2]
const msg = readFileSync(msgPath, 'utf-8').trim()

const RELEASE_RE = /^v\d/
const COMMIT_RE = /^(revert: )?(feat|fix|docs|dx|refactor|perf|test|workflow|build|ci|chore|types|wip|release|deps)(\(.+\))?: .{1,50}/

if (!RELEASE_RE.test(msg) && !COMMIT_RE.test(msg)) {
  console.log()
  console.error(
    `  ${colors.bgRed(colors.white(' ERROR '))} ${colors.red(
      'invalid commit message format.',
    )}\n\n${
      colors.red(
        '  Proper commit message format is required for automated changelog generation. Examples:\n\n',
      )
      }    ${colors.green('feat: add \'comments\' option')}\n`
      + `    ${colors.green('fix: handle events on blur (close #28)')}\n\n${
      colors.red('  See .github/commit-convention.md for more details.\n')}`,
  )

  process.exit(1)
}
