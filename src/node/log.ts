import { name } from '../../package.json'
import { yellow, green, red, gray, white } from 'colorette'
import type { Color } from 'colorette'

type LogLevel = 'info' | 'success' | 'error'

const colorMap = new Map<LogLevel, Color>([
  ['info', yellow],
  ['success', green],
  ['error', red]
])

export function log(message: string, type: LogLevel = 'info') {
  const content = [gray(`[${name}]`), (colorMap.get(type) ?? white)(message)]

  if (type === 'error') {
    console.error(...content)
  } else {
    console.log(...content)
  }
}
