import { consola } from 'consola'

export class PrettyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export function handleError(error: unknown): void {
  consola.error((error as Error).message)
  process.exitCode = 1
}
