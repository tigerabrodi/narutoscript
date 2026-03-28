import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter primitives', () => {
  it('evaluates number literals', () => {
    expect(evaluate('42')).toEqual({
      type: 'number',
      value: 42,
    })
  })

  it('evaluates string literals', () => {
    expect(evaluate('`Believe it`')).toEqual({
      type: 'string',
      value: 'Believe it',
    })
  })

  it('evaluates boolean literals', () => {
    expect(evaluate('true')).toEqual({
      type: 'boolean',
      value: true,
    })

    expect(evaluate('false')).toEqual({
      type: 'boolean',
      value: false,
    })
  })

  it('evaluates poof', () => {
    expect(evaluate('poof')).toEqual({
      type: 'poof',
    })
  })

  it('evaluates victory and defeat expressions', () => {
    expect(evaluate('victory(7)')).toEqual({
      type: 'victory',
      value: {
        type: 'number',
        value: 7,
      },
    })

    expect(evaluate('defeat(`nope`)')).toEqual({
      type: 'defeat',
      value: {
        type: 'string',
        value: 'nope',
      },
    })
  })
})
