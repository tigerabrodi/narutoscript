import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter functions', () => {
  it('evaluates function definitions as closure values', () => {
    const value = evaluate('(x) -> x + 1')

    expect(value).toMatchObject({
      type: 'function',
      params: ['x'],
    })
    expect(value.type).toBe('function')
    if (value.type === 'function') {
      expect(value.closure).toBeDefined()
    }
  })

  it('evaluates function calls', () => {
    expect(
      evaluate(['jutsu double = (x) -> x * 2', 'double(6)'].join('\n'))
    ).toEqual({
      type: 'number',
      value: 12,
    })
  })

  it('captures outer scope in closures', () => {
    expect(
      evaluate(
        [
          'jutsu makeAdder = (x) -> (y) -> x + y',
          'jutsu addTwo = makeAdder(2)',
          'addTwo(5)',
        ].join('\n')
      )
    ).toEqual({
      type: 'number',
      value: 7,
    })
  })

  it('returns the last value from function blocks', () => {
    expect(
      evaluate(
        [
          'jutsu compute = (x) -> {',
          '  jutsu doubled = x * 2',
          '  doubled + 1',
          '}',
          'compute(3)',
        ].join('\n')
      )
    ).toEqual({
      type: 'number',
      value: 7,
    })
  })

  it('supports dattebayo for early return', () => {
    expect(
      evaluate(
        [
          'jutsu pick = (x) -> {',
          '  dattebayo x + 1',
          '  x + 100',
          '}',
          'pick(4)',
        ].join('\n')
      )
    ).toEqual({
      type: 'number',
      value: 5,
    })
  })

  it('keeps inner scope shadowing local', () => {
    expect(
      evaluate(
        [
          'jutsu x = 5',
          'jutsu getInner = () -> {',
          '  jutsu x = 10',
          '  x',
          '}',
          'jutsu y = getInner()',
          'y == 10 and x == 5',
        ].join('\n')
      )
    ).toEqual({
      type: 'boolean',
      value: true,
    })
  })
})
