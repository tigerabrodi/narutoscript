import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter errors', () => {
  it('throws on undefined variables', () => {
    expect(() => evaluate('missing')).toThrow(/undefined variable.*missing/i)
  })

  it('throws when calling a non function', () => {
    expect(() => evaluate('5(1)')).toThrow(
      /call.*non-function|only call functions/i
    )
  })
})
