import consola from 'consola'

export class PrettyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

export function handleError(error: unknown) {
  consola.error((error as Error).message)
  process.exitCode = 1
}
