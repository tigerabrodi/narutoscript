import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter control flow', () => {
  describe('when', () => {
    it('evaluates the true branch', () => {
      expect(evaluate(['when true {', '  42', '}'].join('\n'))).toEqual({
        type: 'number',
        value: 42,
      })
    })

    it('returns poof when false without otherwise', () => {
      expect(evaluate(['when false {', '  42', '}'].join('\n'))).toEqual({
        type: 'poof',
      })
    })

    it('evaluates the otherwise branch when false', () => {
      expect(
        evaluate(
          ['when false {', '  1', '} otherwise {', '  2', '}'].join('\n')
        )
      ).toEqual({
        type: 'number',
        value: 2,
      })
    })
  })

  describe('train', () => {
    it('iterates through a list and returns the last body value', () => {
      expect(
        evaluate(['train n in [1, 2, 3] {', '  n * 2', '}'].join('\n'))
      ).toEqual({
        type: 'number',
        value: 6,
      })
    })

    it('binds the current item inside the loop body', () => {
      expect(
        evaluate(
          [
            'jutsu suffix = 10',
            'train n in [1, 2, 3] {',
            '  n + suffix',
            '}',
          ].join('\n')
        )
      ).toEqual({
        type: 'number',
        value: 13,
      })
    })

    it('returns poof for an empty list', () => {
      expect(evaluate(['train n in [] {', '  n', '}'].join('\n'))).toEqual({
        type: 'poof',
      })
    })
  })
})
