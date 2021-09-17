import colors from 'chalk'
import { name } from '../package.json'
import type { Color } from 'chalk'

type MessageType = 'info' | 'success' | 'error'

const colorMap = new Map<MessageType, typeof Color>([
  ['info', 'yellow'],
  ['success', 'green'],
  ['error', 'red']
])

export function log(message: string, type: MessageType = 'info') {
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
