import { name } from '../../package.json'
import { yellow, green, red, gray, white } from 'colorette'
import type { Color } from 'colorette'

export const enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  ERROR = 'error'
}

export const colorMap: Record<LogLevel, Color> = {
  [LogLevel.INFO]: yellow,
  [LogLevel.SUCCESS]: green,
  [LogLevel.ERROR]: red
}

export function log(message: string, type?: LogLevel) {
  const content = [
    gray(`[${name}]`),
    type ? (colorMap[type] ?? white)(message) : message
  ]

  if (type === LogLevel.ERROR) {
    console.error(...content)
  } else {
    console.log(...content)
  }
}
