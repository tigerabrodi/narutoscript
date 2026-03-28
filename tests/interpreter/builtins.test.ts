import { describe, expect, it } from 'bun:test'
import { execute } from './helpers'

describe('Interpreter builtins', () => {
  describe('say', () => {
    it('outputs the rendered value and returns poof', () => {
      const result = execute('say(42)')

      expect(result.output).toEqual(['42'])
      expect(result.value).toEqual({
        type: 'poof',
      })
    })

    it('can print multiple values across a program', () => {
      const result = execute(['say(`hello`)', 'say(true)'].join('\n'))

      expect(result.output).toEqual(['hello', 'true'])
      expect(result.value).toEqual({
        type: 'poof',
      })
    })
  })

  describe('clone', () => {
    it('maps a function over a list', () => {
      const result = execute('clone([1, 2, 3], (n) -> n * 2)')

      expect(result.value).toEqual({
        type: 'list',
        value: [
          {
            type: 'number',
            value: 2,
          },
          {
            type: 'number',
            value: 4,
          },
          {
            type: 'number',
            value: 6,
          },
        ],
      })
    })

    it('returns an empty list when cloning an empty list', () => {
      const result = execute('clone([], (n) -> n)')

      expect(result.value).toEqual({
        type: 'list',
        value: [],
      })
    })
  })

  describe('pick', () => {
    it('filters a list with a predicate', () => {
      const result = execute('pick([1, 2, 3, 4], (n) -> n % 2 == 0)')

      expect(result.value).toEqual({
        type: 'list',
        value: [
          {
            type: 'number',
            value: 2,
          },
          {
            type: 'number',
            value: 4,
          },
        ],
      })
    })

    it('returns an empty list when nothing matches', () => {
      const result = execute('pick([1, 3, 5], (n) -> n % 2 == 0)')

      expect(result.value).toEqual({
        type: 'list',
        value: [],
      })
    })
  })

  describe('combine', () => {
    it('reduces a list into one value', () => {
      const result = execute('combine([1, 2, 3, 4], (acc, n) -> acc + n, 0)')

      expect(result.value).toEqual({
        type: 'number',
        value: 10,
      })
    })

    it('returns the initial value for an empty list', () => {
      const result = execute('combine([], (acc, n) -> acc + n, 10)')

      expect(result.value).toEqual({
        type: 'number',
        value: 10,
      })
    })
  })

  describe('length', () => {
    it('returns the length of a list', () => {
      const result = execute('length([1, 2, 3, 4])')

      expect(result.value).toEqual({
        type: 'number',
        value: 4,
      })
    })

    it('returns zero for an empty list', () => {
      const result = execute('length([])')

      expect(result.value).toEqual({
        type: 'number',
        value: 0,
      })
    })
  })

  describe('type', () => {
    it('returns number for numbers', () => {
      const result = execute('type(42)')

      expect(result.value).toEqual({
        type: 'string',
        value: 'number',
      })
    })

    it('returns string for strings', () => {
      const result = execute('type(`hello`)')

      expect(result.value).toEqual({
        type: 'string',
        value: 'string',
      })
    })

    it('returns boolean for booleans', () => {
      const result = execute('type(true)')

      expect(result.value).toEqual({
        type: 'string',
        value: 'boolean',
      })
    })

    it('returns poof for poof', () => {
      const result = execute('type(poof)')

      expect(result.value).toEqual({
        type: 'string',
        value: 'poof',
      })
    })

    it('returns list for lists', () => {
      const result = execute('type([1, 2, 3])')

      expect(result.value).toEqual({
        type: 'string',
        value: 'list',
      })
    })

    it('returns object for objects', () => {
      const result = execute('type({ name: `Naruto` })')

      expect(result.value).toEqual({
        type: 'string',
        value: 'object',
      })
    })

    it('returns function for functions', () => {
      const result = execute('type((x) -> x + 1)')

      expect(result.value).toEqual({
        type: 'string',
        value: 'function',
      })
    })
  })
})
