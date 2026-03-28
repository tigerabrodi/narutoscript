import { describe, expect, it } from 'bun:test'
import { interpret, type Value } from '../src/interpreter'

const evaluate = (source: string): Value => interpret({ source })

describe('Interpreter', () => {
  describe('primitive values', () => {
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

  describe('bindings and operators', () => {
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

  describe('functions and scope', () => {
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

  describe('errors', () => {
    it('throws on undefined variables', () => {
      expect(() => evaluate('missing')).toThrow(/undefined variable.*missing/i)
    })

    it('throws when calling a non function', () => {
      expect(() => evaluate('5(1)')).toThrow(
        /call.*non-function|only call functions/i
      )
    })
  })
})
