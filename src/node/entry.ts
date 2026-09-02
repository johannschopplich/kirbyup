import process from 'node:process'
import { mainCommand, normalizeArgs } from './cli.ts'
import { runMain } from './errors.ts'

void runMain(mainCommand, normalizeArgs(process.argv.slice(2)))
