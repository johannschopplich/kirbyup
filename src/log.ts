import colors from 'nanocolors'
import { name } from '../package.json'
import type { Colors as NanoColors } from 'nanocolors'

type LogLevel = 'info' | 'success' | 'error'
type Colors = Exclude<keyof NanoColors, 'isColorSupported'>

const colorMap = new Map<LogLevel, Colors>([
  ['info', 'yellow'],
  ['success', 'green'],
  ['error', 'red']
])

export function log(message: string, type: LogLevel = 'info') {
  const content = [
    colors.gray(`[${name}]`),
    colors[colorMap.get(type) ?? 'white'](message)
  ]

  if (type === 'error') {
    console.error(...content)
  } else {
    console.log(...content)
  }
}
