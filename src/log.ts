import colors from 'chalk'
import { name } from '../package.json'

const label = colors.gray(`[${name}]`)

export const makeMessage = (
  input: string,
  type: 'info' | 'success' | 'error'
) =>
  colors[type === 'info' ? 'yellow' : type === 'error' ? 'red' : 'green'](input)

export function log(type: 'info' | 'success' | 'error', message: string) {
  switch (type) {
    case 'error': {
      return console.error(label, makeMessage(message, type))
    }
    default:
      console.log(label, makeMessage(message, type))
  }
}
