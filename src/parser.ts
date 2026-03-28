import { Lexer, type Token, type TokenType } from './lexer'
import type {
  Block,
  ConstructorPattern,
  DattebayoStatement,
  DefeatExpr,
  Expression,
  FunctionExpr,
  Identifier,
  IdentifierPattern,
  JutsuBinding,
  ListPattern,
  MatchArm,
  ObjectEntry,
  ObjectPattern,
  Pattern,
  PoofPattern,
  Program,
  ReadExpr,
  Statement,
  TrainLoop,
  VictoryExpr,
  WhenExpr,
  WildcardPattern,
} from './ast'

export function parse({ source }: { source: string }): Program {
  const lexer = new Lexer({ source })
  const tokens = lexer.tokenize()
  const parser = new Parser(tokens)
  return parser.parseProgram()
}

export class Parser {
  private current = 0

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): Program {
    const body: Statement[] = []

    while (!this.isAtEnd()) {
      body.push(this.parseStatement())
    }

    return {
      type: 'Program',
      body,
    }
  }

  private parseStatement(): Statement {
    if (this.match('JUTSU')) {
      return this.parseJutsuBinding()
    }

    if (this.match('DATTEBAYO')) {
      return this.parseDattebayoStatement()
    }

    return this.parseExpression()
  }

  private parseJutsuBinding(): JutsuBinding {
    const name = this.parseIdentifier("Expected binding name after 'jutsu'")
    this.consume('EQUALS', "Expected '=' after binding name")

    return {
      type: 'JutsuBinding',
      name,
      value: this.parseExpression(),
    }
  }

  private parseDattebayoStatement(): DattebayoStatement {
    return {
      type: 'DattebayoStatement',
      value: this.parseExpression(),
    }
  }

  private parseExpression(): Expression {
    if (this.match('WHEN')) {
      return this.parseWhenExpr()
    }

    if (this.match('TRAIN')) {
      return this.parseTrainLoop()
    }

    if (this.match('READ')) {
      return this.parseReadExpr()
    }

    return this.parseOr()
  }

  private parseWhenExpr(): WhenExpr {
    const condition = this.parseExpression()
    const thenBranch = this.parseBlock()
    let otherwiseBranch: Block | null = null

    if (this.match('OTHERWISE')) {
      otherwiseBranch = this.parseBlock()
    }

    return {
      type: 'WhenExpr',
      condition,
      thenBranch,
      otherwiseBranch,
    }
  }

  private parseTrainLoop(): TrainLoop {
    const iterator = this.parseIdentifier(
      "Expected loop variable after 'train'"
    )
    this.consume('IN', "Expected 'in' after loop variable")
    const iterable = this.parseExpression()
    const body = this.parseBlock()

    return {
      type: 'TrainLoop',
      iterator,
      iterable,
      body,
    }
  }

  private parseReadExpr(): ReadExpr {
    const value = this.parseExpression()
    this.consume('LBRACE', "Expected '{' to start read arms")

    const arms: MatchArm[] = []

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      arms.push(this.parseMatchArm())
    }

    this.consume('RBRACE', "Expected '}' after read arms")

    return {
      type: 'ReadExpr',
      value,
      arms,
    }
  }

  private parseMatchArm(): MatchArm {
    const pattern = this.parsePattern()
    let guard: Expression | null = null

    if (this.match('WHEN')) {
      guard = this.parseExpression()
    }

    this.consume('ARROW', "Expected '->' after match pattern")

    const body = this.check('LBRACE')
      ? this.parseBlock()
      : this.parseExpression()

    return {
      type: 'MatchArm',
      pattern,
      guard,
      body,
    }
  }

  private parsePattern(): Pattern {
    if (this.match('UNDERSCORE')) {
      return {
        type: 'WildcardPattern',
      }
    }

    if (this.match('NUMBER')) {
      return {
        type: 'NumberPattern',
        value: Number(this.previous().value),
        raw: this.previous().value,
      }
    }

    if (this.match('STRING')) {
      return {
        type: 'StringPattern',
        value: this.previous().value,
      }
    }

    if (this.match('TRUE')) {
      return {
        type: 'BooleanPattern',
        value: true,
      }
    }

    if (this.match('FALSE')) {
      return {
        type: 'BooleanPattern',
        value: false,
      }
    }

    if (this.match('POOF')) {
      const pattern: PoofPattern = {
        type: 'PoofPattern',
      }

      return pattern
    }

    if (this.check('LBRACKET')) {
      return this.parseListPattern()
    }

    if (this.check('LBRACE')) {
      return this.parseObjectPattern()
    }

    if (this.isConstructorPatternStart()) {
      return this.parseConstructorPattern()
    }

    if (this.match('IDENTIFIER')) {
      return {
        type: 'IdentifierPattern',
        name: this.previous().value,
      }
    }

    throw this.errorAtCurrent('Expected pattern')
  }

  private parseListPattern(): ListPattern {
    this.consume('LBRACKET', "Expected '[' to start list pattern")
    const elements: Pattern[] = []
    let rest: IdentifierPattern | WildcardPattern | null = null

    while (!this.check('RBRACKET') && !this.isAtEnd()) {
      if (this.match('SPREAD')) {
        rest = this.parseRestPattern()
        break
      }

      elements.push(this.parsePattern())

      if (!this.match('COMMA')) {
        break
      }
    }

    this.consume('RBRACKET', "Expected ']' after list pattern")

    return {
      type: 'ListPattern',
      elements,
      rest,
    }
  }

  private parseRestPattern(): IdentifierPattern | WildcardPattern {
    if (this.match('IDENTIFIER')) {
      return {
        type: 'IdentifierPattern',
        name: this.previous().value,
      }
    }

    if (this.match('UNDERSCORE')) {
      return {
        type: 'WildcardPattern',
      }
    }

    throw this.errorAtCurrent("Expected identifier or '_' after '...'")
  }

  private parseObjectPattern(): ObjectPattern {
    this.consume('LBRACE', "Expected '{' to start object pattern")
    const properties: ObjectPattern['properties'] = []

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const key = this.parseObjectKey('Expected object pattern key')
      this.consume('COLON', "Expected ':' after object pattern key")
      properties.push({
        key,
        pattern: this.parsePattern(),
      })

      if (!this.match('COMMA')) {
        break
      }
    }

    this.consume('RBRACE', "Expected '}' after object pattern")

    return {
      type: 'ObjectPattern',
      properties,
    }
  }

  private parseConstructorPattern(): ConstructorPattern {
    const token = this.advance()
    const name = token.value
    this.consume('LPAREN', "Expected '(' after constructor pattern name")
    const args: Pattern[] = []

    if (!this.check('RPAREN')) {
      do {
        args.push(this.parsePattern())
      } while (this.match('COMMA'))
    }

    this.consume('RPAREN', "Expected ')' after constructor pattern")

    return {
      type: 'ConstructorPattern',
      name,
      args,
    }
  }

  private parseOr(): Expression {
    let expression = this.parseAnd()

    while (this.match('OR')) {
      const operator = this.previous().value
      const right = this.parseAnd()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseAnd(): Expression {
    let expression = this.parseEquality()

    while (this.match('AND')) {
      const operator = this.previous().value
      const right = this.parseEquality()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseEquality(): Expression {
    let expression = this.parseComparison()

    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().value
      const right = this.parseComparison()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseComparison(): Expression {
    let expression = this.parseTerm()

    while (this.match('LT', 'GT', 'LTE', 'GTE')) {
      const operator = this.previous().value
      const right = this.parseTerm()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseTerm(): Expression {
    let expression = this.parseFactor()

    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value
      const right = this.parseFactor()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseFactor(): Expression {
    let expression = this.parseUnary()

    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const operator = this.previous().value
      const right = this.parseUnary()
      expression = {
        type: 'BinaryExpr',
        operator,
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseUnary(): Expression {
    if (this.match('NANI')) {
      return {
        type: 'UnaryExpr',
        operator: this.previous().value,
        argument: this.parseUnary(),
      }
    }

    return this.parsePostfix()
  }

  private parsePostfix(): Expression {
    let expression = this.parsePrimary()

    while (true) {
      if (this.match('LPAREN')) {
        const args: Expression[] = []

        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpression())
          } while (this.match('COMMA'))
        }

        this.consume('RPAREN', "Expected ')' after arguments")
        expression = {
          type: 'FunctionCall',
          callee: expression,
          args,
        }
        continue
      }

      if (this.match('DOT')) {
        const property = this.parseIdentifier(
          "Expected property name after '.'"
        )
        expression = {
          type: 'PropertyAccess',
          object: expression,
          property: property.name,
        }
        continue
      }

      break
    }

    return expression
  }

  private parsePrimary(): Expression {
    if (this.match('NUMBER')) {
      return {
        type: 'NumberLiteral',
        value: Number(this.previous().value),
        raw: this.previous().value,
      }
    }

    if (this.match('STRING')) {
      return {
        type: 'StringLiteral',
        value: this.previous().value,
      }
    }

    if (this.match('TRUE')) {
      return {
        type: 'BooleanLiteral',
        value: true,
      }
    }

    if (this.match('FALSE')) {
      return {
        type: 'BooleanLiteral',
        value: false,
      }
    }

    if (this.match('POOF')) {
      return {
        type: 'PoofLiteral',
      }
    }

    if (this.match('VICTORY')) {
      return this.parseResultExpr('VictoryExpr')
    }

    if (this.match('DEFEAT')) {
      return this.parseResultExpr('DefeatExpr')
    }

    if (this.match('IDENTIFIER')) {
      return {
        type: 'Identifier',
        name: this.previous().value,
      }
    }

    if (this.check('LPAREN') && this.isFunctionExpression()) {
      return this.parseFunctionExpression()
    }

    if (this.match('LPAREN')) {
      const expression = this.parseExpression()
      this.consume('RPAREN', "Expected ')' after expression")
      return expression
    }

    if (this.check('LBRACKET')) {
      return this.parseListLiteral()
    }

    if (this.check('LBRACE')) {
      return this.parseObjectLiteral()
    }

    throw this.errorAtCurrent('Expected expression')
  }

  private parseFunctionExpression(): FunctionExpr {
    this.consume('LPAREN', "Expected '(' to start function parameters")
    const params: Identifier[] = []

    if (!this.check('RPAREN')) {
      do {
        params.push(this.parseIdentifier('Expected parameter name'))
      } while (this.match('COMMA'))
    }

    this.consume('RPAREN', "Expected ')' after parameters")
    this.consume('ARROW', "Expected '->' after parameters")

    return {
      type: 'FunctionExpr',
      params,
      body: this.check('LBRACE') ? this.parseBlock() : this.parseExpression(),
    }
  }

  private parseResultExpr(type: VictoryExpr['type'] | DefeatExpr['type']) {
    this.consume('LPAREN', "Expected '(' after result constructor")
    const value = this.parseExpression()
    this.consume('RPAREN', "Expected ')' after result value")

    return {
      type,
      value,
    }
  }

  private parseListLiteral() {
    this.consume('LBRACKET', "Expected '[' to start list literal")
    const elements: Expression[] = []

    if (!this.check('RBRACKET')) {
      do {
        elements.push(this.parseExpression())
      } while (this.match('COMMA'))
    }

    this.consume('RBRACKET', "Expected ']' after list literal")

    return {
      type: 'ListLiteral',
      elements,
    } as const
  }

  private parseObjectLiteral() {
    this.consume('LBRACE', "Expected '{' to start object literal")
    const entries: ObjectEntry[] = []

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      if (this.match('SPREAD')) {
        entries.push({
          type: 'SpreadProperty',
          argument: this.parseExpression(),
        })
      } else {
        const key = this.parseObjectKey('Expected object key')
        this.consume('COLON', "Expected ':' after object key")
        entries.push({
          type: 'ObjectProperty',
          key,
          value: this.parseExpression(),
        })
      }

      if (!this.match('COMMA')) {
        break
      }
    }

    this.consume('RBRACE', "Expected '}' after object literal")

    return {
      type: 'ObjectLiteral',
      entries,
    } as const
  }

  private parseBlock(): Block {
    this.consume('LBRACE', "Expected '{' to start block")
    const body: Statement[] = []

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement())
    }

    this.consume('RBRACE', "Expected '}' after block")

    return {
      type: 'Block',
      body,
    }
  }

  private parseObjectKey(message: string): string {
    if (this.match('IDENTIFIER', 'STRING')) {
      return this.previous().value
    }

    throw this.errorAtCurrent(message)
  }

  private parseIdentifier(message: string): Identifier {
    this.consume('IDENTIFIER', message)

    return {
      type: 'Identifier',
      name: this.previous().value,
    }
  }

  private isConstructorPatternStart(): boolean {
    if (this.check('VICTORY') || this.check('DEFEAT')) {
      return this.checkNext('LPAREN')
    }

    return this.check('IDENTIFIER') && this.checkNext('LPAREN')
  }

  private isFunctionExpression(): boolean {
    if (!this.check('LPAREN')) {
      return false
    }

    let index = this.current + 1

    if (this.tokens[index]?.type === 'RPAREN') {
      return this.tokens[index + 1]?.type === 'ARROW'
    }

    while (index < this.tokens.length) {
      const token = this.tokens[index]

      if (token?.type !== 'IDENTIFIER') {
        return false
      }

      index += 1

      const separator = this.tokens[index]

      if (separator?.type === 'COMMA') {
        index += 1
        continue
      }

      if (separator?.type === 'RPAREN') {
        return this.tokens[index + 1]?.type === 'ARROW'
      }

      return false
    }

    return false
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance()
    }

    throw this.errorAtCurrent(message)
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false
    }

    return this.peek().type === type
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) {
      return false
    }

    return this.tokens[this.current + 1]?.type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current += 1
    }

    return this.tokens[this.current - 1]!
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF'
  }

  private peek(): Token {
    return this.tokens[this.current]!
  }

  private previous(): Token {
    return this.tokens[this.current - 1]!
  }

  private errorAtCurrent(message: string): Error {
    const token = this.peek()
    return new Error(
      `Parse error at line ${token.line}, column ${token.column}. ${message}`
    )
  }
}
