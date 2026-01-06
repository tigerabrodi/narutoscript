# NarutoScript Development Plan

## Overview

Building NarutoScript in TypeScript with TDD using Bun.

## Project Structure

```
narutoscript/
  src/
    lexer.ts
    parser.ts
    ast.ts
    interpreter.ts
    builtins.ts
    errors.ts
    index.ts
  tests/
    lexer.test.ts
    parser.test.ts
    interpreter.test.ts
    integration.test.ts
  examples/
    hello.naru
    power.naru
  package.json
  tsconfig.json
```

---

## Phase 1: Lexer

Turn source code into tokens.

### Token Types to Support

**Keywords:**
`jutsu`, `when`, `otherwise`, `train`, `in`, `dattebayo`, `read`, `victory`, `defeat`, `and`, `or`, `nani`, `true`, `false`, `poof`

**Symbols:**
`=`, `->`, `{`, `}`, `(`, `)`, `[`, `]`, `,`, `.`, `...`, `:`

**Operators:**
`==`, `!=`, `<`, `>`, `<=`, `>=`, `+`, `-`, `*`, `/`, `%`

**Literals:**

- Numbers: `42`, `3.14`
- Strings: `` `hello` ``, `` `hello {name}` ``
- Identifiers: `myVar`, `camelCase`

**Other:**

- Comments: `---` to end of line
- Whitespace handling
- Newlines (may need for statement separation)

### Tests to Write

```typescript
// lexer.test.ts
- tokenizes keywords correctly
- tokenizes single-char symbols
- tokenizes multi-char symbols (==, !=, <=, >=, ->)
- tokenizes spread operator (...)
- tokenizes numbers (integers and floats)
- tokenizes simple strings
- tokenizes strings with interpolation (outputs string parts + expressions)
- tokenizes identifiers
- ignores comments
- handles whitespace
- tracks line and column numbers
- throws error on unknown character
```

### Output Structure

```typescript
type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};
```

---

## Phase 2: Parser

Turn tokens into AST.

### AST Node Types

```typescript
type ASTNode =
  | Program
  | JutsuBinding
  | FunctionExpr
  | FunctionCall
  | BinaryExpr
  | UnaryExpr
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | PoofLiteral
  | Identifier
  | ListLiteral
  | ObjectLiteral
  | SpreadExpr
  | PropertyAccess
  | Block
  | WhenExpr
  | TrainLoop
  | ReadExpr
  | MatchArm
  | DattebayoStatement
  | VictoryExpr
  | DefeatExpr
  | InterpolatedString;
```

### Tests to Write

```typescript
// parser.test.ts
- parses number literal
- parses string literal
- parses boolean literals (true/false)
- parses poof literal
- parses identifier
- parses simple binding: jutsu x = 5
- parses function binding: jutsu f = (x) -> x
- parses multi-param function: jutsu f = (x, y) -> x + y
- parses function with block body
- parses function call: f(1, 2)
- parses nested function calls: f(g(x))
- parses binary expressions with correct precedence
- parses unary nani expression
- parses list literal
- parses object literal
- parses spread in object
- parses property access: obj.prop
- parses when/otherwise
- parses when without otherwise
- parses train loop
- parses read expression with arms
- parses match arm with guard
- parses match with variable binding
- parses match with wildcard
- parses match with list patterns
- parses match with object patterns
- parses victory/defeat constructors
- parses dattebayo statement
- parses interpolated string
- parses complex nested expressions
- throws syntax error with line number
```

### Operator Precedence (low to high)

1. `or`
2. `and`
3. `==`, `!=`
4. `<`, `>`, `<=`, `>=`
5. `+`, `-`
6. `*`, `/`, `%`
7. `nani` (unary)
8. Function call, property access

---

## Phase 3: Interpreter (Core)

Evaluate AST nodes.

### Environment

```typescript
type Environment = {
  bindings: Map<string, Value>;
  parent: Environment | null;
};
```

### Value Types

```typescript
type Value =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "poof" }
  | { type: "list"; value: Value[] }
  | { type: "object"; value: Map<string, Value> }
  | { type: "function"; params: string[]; body: ASTNode; closure: Environment }
  | { type: "victory"; value: Value }
  | { type: "defeat"; value: Value };
```

### Tests to Write

```typescript
// interpreter.test.ts (core)
- evaluates number literal
- evaluates string literal
- evaluates boolean literals
- evaluates poof
- evaluates binding and variable lookup
- evaluates arithmetic: +, -, *, /
- evaluates comparison: ==, !=, <, >, <=, >=
- evaluates logical: and, or, nani
- evaluates function definition (creates closure)
- evaluates function call
- evaluates closure capturing outer scope
- evaluates block, returns last expression
- evaluates dattebayo (early return)
- scoping: inner scope shadows outer
- error: undefined variable
- error: reassignment attempt (if we track this)
- error: calling non-function
```

---

## Phase 4: Interpreter (Control Flow)

### Tests to Write

```typescript
// interpreter.test.ts (control flow)
- when with true condition executes body
- when with false condition skips body
- when/otherwise executes otherwise on false
- train loop iterates over list
- train loop binds item correctly
- train loop with empty list does nothing
- nested when statements
- nested train loops
```

---

## Phase 5: Interpreter (Data Structures)

### Tests to Write

```typescript
// interpreter.test.ts (data structures)
- evaluates object literal
- evaluates property access
- evaluates nested property access: a.b.c
- evaluates spread operator in object
- spread merges objects correctly
- spread with overrides
- evaluates list literal
- evaluates empty list
- evaluates nested lists
```

---

## Phase 6: Interpreter (Pattern Matching)

### Tests to Write

```typescript
// interpreter.test.ts (pattern matching)
- read matches number literal
- read matches string literal
- read matches boolean literal
- read matches poof
- read binds variable in pattern
- read wildcard _ matches anything
- read with guard condition
- read guard can reference bound variable
- read first matching arm wins
- read matches victory(x)
- read matches defeat(e)
- read matches empty list []
- read matches single element [x]
- read matches [head, ...tail]
- read matches object { key: value }
- read matches partial object
- read nested patterns
- error: no pattern matched
```

---

## Phase 7: Builtins

### Tests to Write

```typescript
// interpreter.test.ts (builtins)
- say() outputs value (mock/capture output)
- clone() maps function over list
- clone() with empty list
- pick() filters list by predicate
- pick() with no matches returns empty
- combine() reduces list
- combine() with empty list returns initial
- length() returns list length
- length() of empty list is 0
- type() returns "number" for numbers
- type() returns "string" for strings
- type() returns "boolean" for booleans
- type() returns "poof" for poof
- type() returns "list" for lists
- type() returns "object" for objects
- type() returns "function" for functions
```

---

## Phase 8: String Interpolation

### Tests to Write

```typescript
// lexer.test.ts (additions)
- tokenizes interpolated string as segments

// parser.test.ts (additions)
- parses interpolated string into InterpolatedString node

// interpreter.test.ts (additions)
- evaluates simple interpolated string
- evaluates interpolation with variable
- evaluates interpolation with expression
- evaluates multiple interpolations in one string
- evaluates nested interpolations
```

---

## Phase 9: Integration & Polish

### Tests to Write

```typescript
// integration.test.ts
- runs hello world program
- runs ninja power calculator example
- runs program with all features combined
- error messages include line numbers
- error messages are helpful
```

### Polish Tasks

- [ ] REPL implementation
- [ ] File runner (narutoscript run file.naru)
- [ ] Improve error messages
- [ ] Add more example programs
- [ ] Documentation

---

## Commands

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Run a file
bun run src/index.ts examples/hello.naru

# Start REPL
bun run src/index.ts
```
