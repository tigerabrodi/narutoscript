import { describe, expect, it } from 'bun:test'
import { Lexer, type Token, type TokenType } from '../src/lexer'

describe('Lexer', () => {
  const tokenize = (source: string): Token[] => {
    const lexer = new Lexer({ source })
    return lexer.tokenize()
  }

  const getToken = (tokens: Array<Token>, index: number): Token => {
    const token = tokens[index]

    if (token === undefined) {
      throw new Error(`Expected token at index ${index}`)
    }

    return token
  }

  describe('keywords', () => {
    it('tokenizes jutsu keyword', () => {
      const tokens = tokenize('jutsu')
      expect(getToken(tokens, 0).type).toBe('JUTSU')
      expect(getToken(tokens, 0).value).toBe('jutsu')
    })

    it('tokenizes all keywords correctly', () => {
      const keywords: Array<[string, TokenType]> = [
        ['jutsu', 'JUTSU'],
        ['when', 'WHEN'],
        ['otherwise', 'OTHERWISE'],
        ['train', 'TRAIN'],
        ['in', 'IN'],
        ['dattebayo', 'DATTEBAYO'],
        ['read', 'READ'],
        ['victory', 'VICTORY'],
        ['defeat', 'DEFEAT'],
        ['and', 'AND'],
        ['or', 'OR'],
        ['nani', 'NANI'],
        ['true', 'TRUE'],
        ['false', 'FALSE'],
        ['poof', 'POOF'],
      ]

      for (const [source, expectedType] of keywords) {
        const tokens = tokenize(source)
        expect(getToken(tokens, 0).type).toBe(expectedType)
      }
    })
  })

  describe('symbols', () => {
    it('tokenizes single-char symbols', () => {
      const tokens = tokenize('( ) { } [ ] , . : + * / %')
      const types = tokens.slice(0, -1).map((t) => t.type)
      expect(types).toEqual([
        'LPAREN',
        'RPAREN',
        'LBRACE',
        'RBRACE',
        'LBRACKET',
        'RBRACKET',
        'COMMA',
        'DOT',
        'COLON',
        'PLUS',
        'STAR',
        'SLASH',
        'PERCENT',
      ])
    })

    it('tokenizes arrow ->', () => {
      const tokens = tokenize('->')
      expect(getToken(tokens, 0).type).toBe('ARROW')
    })

    it('tokenizes spread ...', () => {
      const tokens = tokenize('...')
      expect(getToken(tokens, 0).type).toBe('SPREAD')
    })

    it('tokenizes minus -', () => {
      const tokens = tokenize('5 - 3')
      expect(getToken(tokens, 1).type).toBe('MINUS')
    })
  })

  describe('comparison operators', () => {
    it('tokenizes == and =', () => {
      const tokens = tokenize('= ==')
      expect(getToken(tokens, 0).type).toBe('EQUALS')
      expect(getToken(tokens, 1).type).toBe('EQ')
    })

    it('tokenizes != < > <= >=', () => {
      const tokens = tokenize('!= < > <= >=')
      const types = tokens.slice(0, -1).map((t) => t.type)
      expect(types).toEqual(['NEQ', 'LT', 'GT', 'LTE', 'GTE'])
    })
  })

  describe('numbers', () => {
    it('tokenizes integers', () => {
      const tokens = tokenize('42')
      expect(getToken(tokens, 0).type).toBe('NUMBER')
      expect(getToken(tokens, 0).value).toBe('42')
    })

    it('tokenizes floats', () => {
      const tokens = tokenize('3.14159')
      expect(getToken(tokens, 0).type).toBe('NUMBER')
      expect(getToken(tokens, 0).value).toBe('3.14159')
    })
  })

  describe('strings', () => {
    it('tokenizes simple strings', () => {
      const tokens = tokenize('`hello world`')
      expect(getToken(tokens, 0).type).toBe('STRING')
      expect(getToken(tokens, 0).value).toBe('hello world')
    })

    it('tokenizes strings with interpolation markers', () => {
      const tokens = tokenize('`hello {name}`')
      expect(getToken(tokens, 0).type).toBe('STRING')
      expect(getToken(tokens, 0).value).toBe('hello {name}')
    })
  })

  describe('identifiers', () => {
    it('tokenizes simple identifiers', () => {
      const tokens = tokenize('myVar')
      expect(getToken(tokens, 0).type).toBe('IDENTIFIER')
      expect(getToken(tokens, 0).value).toBe('myVar')
    })

    it('tokenizes identifiers with numbers', () => {
      const tokens = tokenize('ninja2')
      expect(getToken(tokens, 0).type).toBe('IDENTIFIER')
      expect(getToken(tokens, 0).value).toBe('ninja2')
    })

    it('tokenizes underscore as wildcard when standalone', () => {
      const tokens = tokenize('_')
      expect(getToken(tokens, 0).type).toBe('UNDERSCORE')
    })

    it('tokenizes _prefixed as identifier', () => {
      const tokens = tokenize('_private')
      expect(getToken(tokens, 0).type).toBe('IDENTIFIER')
      expect(getToken(tokens, 0).value).toBe('_private')
    })
  })

  describe('comments', () => {
    it('ignores line comments', () => {
      const tokens = tokenize('jutsu --- this is a comment\nx')
      expect(getToken(tokens, 0).type).toBe('JUTSU')
      expect(getToken(tokens, 1).type).toBe('IDENTIFIER')
      expect(getToken(tokens, 1).value).toBe('x')
    })
  })

  describe('whitespace and newlines', () => {
    it('handles whitespace', () => {
      const tokens = tokenize('  jutsu   x  ')
      expect(getToken(tokens, 0).type).toBe('JUTSU')
      expect(getToken(tokens, 1).type).toBe('IDENTIFIER')
    })

    it('tracks line numbers', () => {
      const tokens = tokenize('jutsu\nx\ny')
      expect(getToken(tokens, 0).line).toBe(1)
      expect(getToken(tokens, 1).line).toBe(2)
      expect(getToken(tokens, 2).line).toBe(3)
    })
  })

  describe('errors', () => {
    it('throws on unknown character', () => {
      expect(() => tokenize('@')).toThrow()
    })

    it('throws on unterminated string', () => {
      expect(() => tokenize('`hello')).toThrow(/unterminated/i)
    })
  })

  describe('complete expressions', () => {
    it('tokenizes a simple binding', () => {
      const tokens = tokenize('jutsu x = 5')
      const types = tokens.slice(0, -1).map((t) => t.type)
      expect(types).toEqual(['JUTSU', 'IDENTIFIER', 'EQUALS', 'NUMBER'])
    })

    it('tokenizes a function definition', () => {
      const tokens = tokenize('jutsu double = (x) -> x * 2')
      const types = tokens.slice(0, -1).map((t) => t.type)
      expect(types).toEqual([
        'JUTSU',
        'IDENTIFIER',
        'EQUALS',
        'LPAREN',
        'IDENTIFIER',
        'RPAREN',
        'ARROW',
        'IDENTIFIER',
        'STAR',
        'NUMBER',
      ])
    })
  })
})
