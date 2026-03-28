import { describe, expect, it } from 'bun:test'
import { execute } from './helpers'

describe('Interpreter interpolation', () => {
  it('evaluates a simple interpolated expression', () => {
    const result = execute('`Two plus two is {2 + 2}`')

    expect(result.value).toEqual({
      type: 'string',
      value: 'Two plus two is 4',
    })
  })

  it('evaluates interpolation with variables', () => {
    const result = execute(
      ['jutsu name = `Naruto`', '`Hello {name}`'].join('\n')
    )

    expect(result.value).toEqual({
      type: 'string',
      value: 'Hello Naruto',
    })
  })

  it('evaluates multiple interpolations in one string', () => {
    const result = execute(
      [
        'jutsu name = `Naruto`',
        'jutsu age = 16',
        '`{name} is {age} years old`',
      ].join('\n')
    )

    expect(result.value).toEqual({
      type: 'string',
      value: 'Naruto is 16 years old',
    })
  })

  it('evaluates nested interpolations', () => {
    const result = execute(
      ['jutsu name = `Naruto`', '`Outer {`Inner {name}`}`'].join('\n')
    )

    expect(result.value).toEqual({
      type: 'string',
      value: 'Outer Inner Naruto',
    })
  })
})
