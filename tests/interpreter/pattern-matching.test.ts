import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter pattern matching', () => {
  describe('literal and wildcard matches', () => {
    it('matches number literals in read expressions', () => {
      expect(
        evaluate(
          [
            'read 2 {',
            '  1 -> `one`',
            '  2 -> `two`',
            '  _ -> `many`',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'string',
        value: 'two',
      })
    })

    it('matches boolean and poof literals', () => {
      expect(
        evaluate(
          ['read true {', '  false -> `no`', '  true -> `yes`', '}'].join('\n')
        )
      ).toEqual({
        type: 'string',
        value: 'yes',
      })

      expect(
        evaluate(
          ['read poof {', '  poof -> `empty`', '  _ -> `filled`', '}'].join(
            '\n'
          )
        )
      ).toEqual({
        type: 'string',
        value: 'empty',
      })
    })

    it('uses wildcard as the fallback arm', () => {
      expect(
        evaluate(['read 99 {', '  1 -> `one`', '  _ -> `many`', '}'].join('\n'))
      ).toEqual({
        type: 'string',
        value: 'many',
      })
    })

    it('throws when no pattern matches', () => {
      expect(() =>
        evaluate(['read 3 {', '  1 -> `one`', '  2 -> `two`', '}'].join('\n'))
      ).toThrow(/no pattern matched/i)
    })
  })

  describe('identifier bindings and guards', () => {
    it('binds identifiers from matched values', () => {
      expect(evaluate(['read 7 {', '  n -> n + 1', '}'].join('\n'))).toEqual({
        type: 'number',
        value: 8,
      })
    })

    it('uses guards after a successful pattern match', () => {
      expect(
        evaluate(
          [
            'read 5 {',
            '  n when n < 3 -> `small`',
            '  n when n < 10 -> `medium`',
            '  _ -> `large`',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'string',
        value: 'medium',
      })
    })
  })

  describe('list and object patterns', () => {
    it('matches list patterns with rest bindings', () => {
      expect(
        evaluate(
          ['read [1, 2, 3] {', '  [head, ...tail] -> tail', '}'].join('\n')
        )
      ).toEqual({
        type: 'list',
        value: [
          {
            type: 'number',
            value: 2,
          },
          {
            type: 'number',
            value: 3,
          },
        ],
      })
    })

    it('matches object patterns and binds nested values', () => {
      expect(
        evaluate(
          [
            'read { rank: `Hokage`, village: `Leaf` } {',
            '  { rank: `Hokage`, village: village } -> village',
            '  _ -> `Unknown`',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'string',
        value: 'Leaf',
      })
    })
  })

  describe('constructor patterns', () => {
    it('matches victory constructor patterns', () => {
      expect(
        evaluate(
          [
            'read victory(7) {',
            '  victory(value) -> value',
            '  defeat(reason) -> 0',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'number',
        value: 7,
      })
    })

    it('matches defeat constructor patterns', () => {
      expect(
        evaluate(
          [
            'read defeat(`bad`) {',
            '  victory(value) -> value',
            '  defeat(reason) -> reason',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'string',
        value: 'bad',
      })
    })
  })
})
