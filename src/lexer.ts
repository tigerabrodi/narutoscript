// NarutoScript Lexer - Tokenizes source code

export type TokenType =
  // Keywords
  | 'JUTSU'
  | 'WHEN'
  | 'OTHERWISE'
  | 'TRAIN'
  | 'IN'
  | 'DATTEBAYO'
  | 'READ'
  | 'VICTORY'
  | 'DEFEAT'
  | 'AND'
  | 'OR'
  | 'NANI'
  | 'TRUE'
  | 'FALSE'
  | 'POOF'
  // Literals
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  // Symbols
  | 'EQUALS'
  | 'ARROW'
  | 'LBRACE'
  | 'RBRACE'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'DOT'
  | 'SPREAD'
  | 'COLON'
  // Operators
  | 'EQ'
  | 'NEQ'
  | 'LT'
  | 'GT'
  | 'LTE'
  | 'GTE'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  // Special
  | 'UNDERSCORE'
  | 'EOF'

export type Token = {
  type: TokenType
  value: string
  line: number
  column: number
}

const KEYWORDS: Record<string, TokenType> = {
  jutsu: 'JUTSU',
  when: 'WHEN',
  otherwise: 'OTHERWISE',
  train: 'TRAIN',
  in: 'IN',
  dattebayo: 'DATTEBAYO',
  read: 'READ',
  victory: 'VICTORY',
  defeat: 'DEFEAT',
  and: 'AND',
  or: 'OR',
  nani: 'NANI',
  true: 'TRUE',
  false: 'FALSE',
  poof: 'POOF',
}

export class Lexer {
  private source: string
  private tokens: Token[] = []
  private start = 0
  private current = 0
  private line = 1
  private column = 1

  constructor({ source }: { source: string }) {
    this.source = source
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      column: this.column,
    })

    return this.tokens
  }

  private scanToken(): void {
    const c = this.advance()

    switch (c) {
      case '(':
        this.addToken('LPAREN')
        break
      case ')':
        this.addToken('RPAREN')
        break
      case '{':
        this.addToken('LBRACE')
        break
      case '}':
        this.addToken('RBRACE')
        break
      case '[':
        this.addToken('LBRACKET')
        break
      case ']':
        this.addToken('RBRACKET')
        break
      case ',':
        this.addToken('COMMA')
        break
      case ':':
        this.addToken('COLON')
        break
      case '+':
        this.addToken('PLUS')
        break
      case '*':
        this.addToken('STAR')
        break
      case '/':
        this.addToken('SLASH')
        break
      case '%':
        this.addToken('PERCENT')
        break
      case '.':
        if (this.peek() === '.' && this.peekNext() === '.') {
          this.advance()
          this.advance()
          this.addToken('SPREAD')
        } else {
          this.addToken('DOT')
        }
        break
      case '-':
        if (this.peek() === '-' && this.peekNext() === '-') {
          // Comment - skip until end of line
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance()
          }
        } else if (this.peek() === '>') {
          this.advance()
          this.addToken('ARROW')
        } else {
          this.addToken('MINUS')
        }
        break
      case '=':
        if (this.peek() === '=') {
          this.advance()
          this.addToken('EQ')
        } else {
          this.addToken('EQUALS')
        }
        break
      case '!':
        if (this.peek() === '=') {
          this.advance()
          this.addToken('NEQ')
        } else {
          throw new Error(
            `Unexpected character '!' at line ${this.line}, column ${
              this.column - 1
            }`
          )
        }
        break
      case '<':
        if (this.peek() === '=') {
          this.advance()
          this.addToken('LTE')
        } else {
          this.addToken('LT')
        }
        break
      case '>':
        if (this.peek() === '=') {
          this.advance()
          this.addToken('GTE')
        } else {
          this.addToken('GT')
        }
        break
      case '_':
        if (this.isAlphaNumeric(this.peek())) {
          this.identifier()
        } else {
          this.addToken('UNDERSCORE')
        }
        break
      case '`':
        this.string()
        break
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break
      case '\n':
        this.line++
        this.column = 1
        break
      default:
        if (this.isDigit(c)) {
          this.number()
        } else if (this.isAlpha(c)) {
          this.identifier()
        } else {
          throw new Error(
            `Unexpected character '${c}' at line ${this.line}, column ${
              this.column - 1
            }`
          )
        }
    }
  }

  private string(): void {
    const startLine = this.line
    const startColumn = this.column - 1

    while (this.peek() !== '`' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++
        this.column = 0
      }
      this.advance()
    }

    if (this.isAtEnd()) {
      throw new Error(
        `Unterminated string at line ${startLine}, column ${startColumn}`
      )
    }

    // Consume closing backtick
    this.advance()

    // Extract string value (without backticks)
    const value = this.source.substring(this.start + 1, this.current - 1)
    this.addToken('STRING', value)
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance()
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance() // consume the dot
      while (this.isDigit(this.peek())) {
        this.advance()
      }
    }

    const value = this.source.substring(this.start, this.current)
    this.addToken('NUMBER', value)
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance()
    }

    const text = this.source.substring(this.start, this.current)
    const type = KEYWORDS[text] ?? 'IDENTIFIER'
    this.addToken(type, text)
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private advance(): string {
    const c = this.source[this.current]
    this.current++
    this.column++
    return c
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'
    return this.source[this.current]
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source[this.current + 1]
  }

  private addToken(type: TokenType, value?: string): void {
    const text = value ?? this.source.substring(this.start, this.current)
    this.tokens.push({
      type,
      value: text,
      line: this.line,
      column: this.column - text.length,
    })
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9'
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c)
  }
}
