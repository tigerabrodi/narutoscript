import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter operators', () => {
  it('evaluates bindings and variable lookup', () => {
    expect(evaluate(['jutsu power = 9000', 'power'].join('\n'))).toEqual({
      type: 'number',
      value: 9000,
    })
  })

  it('evaluates arithmetic operators', () => {
    expect(evaluate('1 + 2 * 3 - 4 / 2')).toEqual({
      type: 'number',
      value: 5,
    })
  })

  it('evaluates comparison operators', () => {
    expect(evaluate('3 < 5')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('5 <= 5')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('9 > 12')).toEqual({
      type: 'boolean',
      value: false,
    })

    expect(evaluate('8 >= 8')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('7 == 7')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('7 != 8')).toEqual({
      type: 'boolean',
      value: true,
    })
  })

  it('evaluates logical operators', () => {
    expect(evaluate('true and false')).toEqual({
      type: 'boolean',
      value: false,
    })

    expect(evaluate('true or false')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('nani false')).toEqual({
      type: 'boolean',
      value: true,
    })
  })

  it('short circuits logical operators', () => {
    expect(evaluate('false and missing')).toEqual({
      type: 'boolean',
      value: false,
    })

    expect(evaluate('true or missing')).toEqual({
      type: 'boolean',
      value: true,
    })
  })
})
