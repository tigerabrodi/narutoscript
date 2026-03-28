# NarutoScript Development Plan

## Overview

Building NarutoScript in TypeScript with strict TDD using Bun.

## TDD Workflow (Strict)

Every feature follows this exact cycle — no exceptions:

1. **Write test** — describe the expected behavior
2. **See it fail** — `bun test` must show a red failure
3. **Write code** — minimal implementation to make it pass
4. **See it pass** — `bun test` must go green
5. **Repeat** — next test

No mocks needed anywhere. We own the entire stack:

- **Lexer tests**: string in → tokens out
- **Parser tests**: string in → AST out (uses the real lexer)
- **Interpreter tests**: full program string in → output out (uses real lexer + parser)

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run a specific test file
bun test tests/lexer.test.ts
```

---

## Parallelism & Dependencies

The phases have a dependency chain. Some can run in parallel when they share
no dependencies. Phases that touch the same file (e.g. `interpreter.ts`) need
isolated worktrees to avoid merge conflicts.

```
SEQUENTIAL — must be done in order, each depends on the previous:

  Phase 1 (Lexer)
      ↓
  Phase 2 (Parser)
      ↓
  Phase 3 (Interpreter Core)

PARALLEL BLOCK A — all three need Phase 3 done, but are independent of each other:

  ┌─ Phase 4 (Control Flow)
  ├─ Phase 5 (Data Structures)
  └─ Phase 8 (String Interpolation)

PARALLEL BLOCK B — both need Phase 5 done, but are independent of each other:

  ┌─ Phase 6 (Pattern Matching)
  └─ Phase 7 (Builtins)

SEQUENTIAL — needs everything above:

  Phase 9 (Integration & Polish)
```

**Why worktrees matter for parallel blocks:** Phases in the same parallel block
all modify `interpreter.ts` and `tests/interpreter.test.ts`. Each agent should
work in an isolated worktree so their changes don't conflict. Merge after each
block is complete.

---

## Project Structure

```
narutoscript/
  src/
    lexer.ts          ← Phase 1
    ast.ts            ← Phase 2
    parser.ts         ← Phase 2
    interpreter.ts    ← Phases 3-8
    builtins.ts       ← Phase 7
    errors.ts         ← All phases
    index.ts          ← Phase 9
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

## Phase 1: Lexer (Sequential — no deps)

**Files:** `src/lexer.ts`, `tests/lexer.test.ts`

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

## Phase 2: Parser (Sequential — needs Phase 1)

**Files:** `src/parser.ts`, `src/ast.ts`, `tests/parser.test.ts`

Turn tokens into AST. Tests use the real lexer — no mocks.

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
// parser.test.ts — all tests feed source strings through the real lexer
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

## Phase 3: Interpreter Core (Sequential — needs Phase 2)

**Files:** `src/interpreter.ts`, `tests/interpreter.test.ts`

Evaluate AST nodes. Tests feed full source strings through lexer + parser — no mocks.

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
// interpreter.test.ts (core) — all tests feed source strings through the full pipeline
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

## Phase 4: Control Flow (Parallel Block A — needs Phase 3)

**Files:** `src/interpreter.ts`, `tests/interpreter.test.ts`
**Parallel with:** Phase 5, Phase 8
**Worktree required:** Yes (shares files with 5 and 8)

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

## Phase 5: Data Structures (Parallel Block A — needs Phase 3)

**Files:** `src/interpreter.ts`, `tests/interpreter.test.ts`
**Parallel with:** Phase 4, Phase 8
**Worktree required:** Yes (shares files with 4 and 8)

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

## Phase 6: Pattern Matching (Parallel Block B — needs Phase 5)

**Files:** `src/interpreter.ts`, `tests/interpreter.test.ts`
**Parallel with:** Phase 7
**Worktree required:** Yes (shares files with 7)

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

## Phase 7: Builtins (Parallel Block B — needs Phase 5)

**Files:** `src/builtins.ts`, `src/interpreter.ts`, `tests/interpreter.test.ts`
**Parallel with:** Phase 6
**Worktree required:** Yes (shares files with 6)

### Tests to Write

```typescript
// interpreter.test.ts (builtins)
- say() outputs value (capture stdout)
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

## Phase 8: String Interpolation (Parallel Block A — needs Phase 3)

**Files:** `src/lexer.ts`, `src/parser.ts`, `src/interpreter.ts`, `tests/lexer.test.ts`, `tests/parser.test.ts`, `tests/interpreter.test.ts`
**Parallel with:** Phase 4, Phase 5
**Worktree required:** Yes (shares files with 4 and 5)

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

## Phase 9: Integration & Polish (Sequential — needs everything)

**Files:** `src/index.ts`, `tests/integration.test.ts`

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
- [ ] File runner (`narutoscript run file.naru`)
- [ ] Improve error messages
- [ ] Add more example programs
- [ ] Documentation
- [ ] Distribution (npm publish / GitHub releases with `bun build --compile`)

---

## Commands

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run a specific test file
bun test tests/lexer.test.ts

# Run a .naru file
bun run src/index.ts examples/hello.naru

# Start REPL (Phase 9)
bun run src/index.ts
```
