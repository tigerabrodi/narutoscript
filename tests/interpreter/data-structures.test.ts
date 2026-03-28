import { describe, expect, it } from 'bun:test'
import { evaluate } from './helpers'

describe('Interpreter data structures', () => {
  describe('lists', () => {
    it('evaluates list literals', () => {
      expect(evaluate('[1, 2 + 3, true]')).toEqual({
        type: 'list',
        value: [
          {
            type: 'number',
            value: 1,
          },
          {
            type: 'number',
            value: 5,
          },
          {
            type: 'boolean',
            value: true,
          },
        ],
      })
    })

    it('evaluates empty lists', () => {
      expect(evaluate('[]')).toEqual({
        type: 'list',
        value: [],
      })
    })

    it('evaluates nested lists', () => {
      expect(evaluate('[[1], [2, 3]]')).toEqual({
        type: 'list',
        value: [
          {
            type: 'list',
            value: [
              {
                type: 'number',
                value: 1,
              },
            ],
          },
          {
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
          },
        ],
      })
    })
  })

  describe('objects', () => {
    it('evaluates object literals', () => {
      expect(evaluate('{ name: `Naruto`, age: 12 + 4 }')).toEqual({
        type: 'object',
        value: new Map([
          [
            'name',
            {
              type: 'string',
              value: 'Naruto',
            },
          ],
          [
            'age',
            {
              type: 'number',
              value: 16,
            },
          ],
        ]),
      })
    })

    it('evaluates empty objects', () => {
      expect(evaluate('{}')).toEqual({
        type: 'object',
        value: new Map(),
      })
    })

    it('evaluates property access', () => {
      expect(evaluate('{ name: `Naruto`, age: 16 }.name')).toEqual({
        type: 'string',
        value: 'Naruto',
      })
    })

    it('evaluates nested property access', () => {
      expect(
        evaluate('{ team: { leader: { name: `Kakashi` } } }.team.leader.name')
      ).toEqual({
        type: 'string',
        value: 'Kakashi',
      })
    })

    it('spreads objects into new objects', () => {
      expect(
        evaluate(
          [
            'jutsu ninja = { name: `Naruto`, village: `Leaf` }',
            '{ ...ninja, rank: `Genin` }',
          ].join('\n')
        )
      ).toEqual({
        type: 'object',
        value: new Map([
          [
            'name',
            {
              type: 'string',
              value: 'Naruto',
            },
          ],
          [
            'village',
            {
              type: 'string',
              value: 'Leaf',
            },
          ],
          [
            'rank',
            {
              type: 'string',
              value: 'Genin',
            },
          ],
        ]),
      })
    })

    it('lets later object properties override spread values', () => {
      expect(
        evaluate(
          [
            'jutsu base = { power: 9000, rank: `Genin` }',
            '{ ...base, power: 9001 }',
          ].join('\n')
        )
      ).toEqual({
        type: 'object',
        value: new Map([
          [
            'power',
            {
              type: 'number',
              value: 9001,
            },
          ],
          [
            'rank',
            {
              type: 'string',
              value: 'Genin',
            },
          ],
        ]),
      })
    })
  })
})
