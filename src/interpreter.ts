import type {
  BinaryExpr,
  Block,
  Expression,
  InterpolatedString,
  Pattern,
  Program,
  Statement,
  UnaryExpr,
} from './ast'
import { createBuiltins, renderValue } from './builtins'
import { parse } from './parser'

export type BuiltinValue = {
  type: 'builtin'
  name: string
  arity: number
  call: (args: Array<Value>) => Value
}

export type Value =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'poof' }
  | { type: 'list'; value: Value[] }
  | { type: 'object'; value: Map<string, Value> }
  | BuiltinValue
  | {
      type: 'function'
      params: string[]
      body: Expression | Block
      closure: Environment
    }
  | { type: 'victory'; value: Value }
  | { type: 'defeat'; value: Value }

const POOF: Value = { type: 'poof' }

class ReturnSignal {
  constructor(
    readonly value: Value,
    readonly env: Environment
  ) {}
}

export class Environment {
  constructor(
    private readonly parent: Environment | null = null,
    private readonly bindings: Map<string, Value> = new Map()
  ) {}

  child(): Environment {
    return new Environment(this)
  }

  define(name: string, value: Value): Environment {
    // Each binding creates a new frame so closures keep the environment they saw.
    return new Environment(this, new Map([[name, value]]))
  }

  lookup(name: string): Value {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!
    }

    if (this.parent) {
      return this.parent.lookup(name)
    }

    throw new Error(`Undefined variable '${name}'`)
  }

  visibleEntries(): Array<[string, Value]> {
    const entries = new Map<string, Value>()
    this.collectVisibleEntries(entries)
    return Array.from(entries.entries())
  }

  private collectVisibleEntries(entries: Map<string, Value>): void {
    if (this.parent) {
      this.parent.collectVisibleEntries(entries)
    }

    for (const [name, value] of this.bindings.entries()) {
      entries.set(name, value)
    }
  }
}

type EvalResult = {
  value: Value
  env: Environment
}

export function interpret({
  source,
  output = (line: string) => {
    console.log(line)
  },
}: {
  output?: (line: string) => void
  source: string
}): Value {
  return interpretWithEnvironment({
    source,
    env: createEnvironment({
      output,
    }),
  }).value
}

export function evaluateProgram(
  program: Program,
  env: Environment = new Environment()
): Value {
  return evaluateProgramWithEnvironment(program, env).value
}

export function createEnvironment({
  output = (line: string) => {
    console.log(line)
  },
}: {
  output?: (line: string) => void
} = {}): Environment {
  return createGlobalEnvironment(output)
}

export function interpretWithEnvironment({
  source,
  env,
}: {
  env: Environment
  source: string
}): EvalResult {
  const program = parse({ source })
  return evaluateProgramWithEnvironment(program, env)
}

function evaluateProgramWithEnvironment(
  program: Program,
  env: Environment
): EvalResult {
  try {
    return evaluateStatements(program.body, env)
  } catch (error) {
    if (error instanceof ReturnSignal) {
      return {
        value: error.value,
        env: error.env,
      }
    }

    throw error
  }
}

function createGlobalEnvironment(output: (line: string) => void): Environment {
  let env = new Environment()

  for (const [name, value] of createBuiltins({ output, invokeCallable })) {
    env = env.define(name, value)
  }

  return env
}

function evaluateStatements(
  statements: Statement[],
  env: Environment
): EvalResult {
  let currentEnv = env
  let lastValue = POOF

  for (const statement of statements) {
    const result = evaluateStatement(statement, currentEnv)
    currentEnv = result.env
    lastValue = result.value
  }

  return {
    value: lastValue,
    env: currentEnv,
  }
}

function evaluateStatement(statement: Statement, env: Environment): EvalResult {
  switch (statement.type) {
    case 'JutsuBinding': {
      const value = evaluateExpression(statement.value, env)
      return {
        value,
        env: env.define(statement.name.name, value),
      }
    }
    case 'DattebayoStatement': {
      const value = evaluateExpression(statement.value, env)
      throw new ReturnSignal(value, env)
    }
    default: {
      return {
        value: evaluateExpression(statement, env),
        env,
      }
    }
  }
}

function evaluateExpression(expression: Expression, env: Environment): Value {
  switch (expression.type) {
    case 'NumberLiteral':
      return {
        type: 'number',
        value: expression.value,
      }
    case 'StringLiteral':
      return {
        type: 'string',
        value: expression.value,
      }
    case 'InterpolatedString':
      return evaluateInterpolatedString(expression, env)
    case 'BooleanLiteral':
      return {
        type: 'boolean',
        value: expression.value,
      }
    case 'PoofLiteral':
      return POOF
    case 'Identifier':
      return env.lookup(expression.name)
    case 'UnaryExpr':
      return evaluateUnaryExpr(expression, env)
    case 'BinaryExpr':
      return evaluateBinaryExpr(expression, env)
    case 'FunctionExpr':
      return {
        type: 'function',
        params: expression.params.map((param) => param.name),
        body: expression.body,
        closure: env,
      }
    case 'FunctionCall':
      return evaluateFunctionCall(expression, env)
    case 'Block':
      return evaluateBlock(expression, env)
    case 'VictoryExpr':
      return {
        type: 'victory',
        value: evaluateExpression(expression.value, env),
      }
    case 'DefeatExpr':
      return {
        type: 'defeat',
        value: evaluateExpression(expression.value, env),
      }
    case 'ListLiteral':
      return {
        type: 'list',
        value: expression.elements.map((element) =>
          evaluateExpression(element, env)
        ),
      }
    case 'ObjectLiteral':
      return {
        type: 'object',
        value: expression.entries.reduce((map, entry) => {
          if (entry.type === 'SpreadProperty') {
            const spreadValue = evaluateExpression(entry.argument, env)

            if (spreadValue.type !== 'object') {
              throw new Error('Can only spread objects into objects')
            }

            for (const [key, value] of spreadValue.value.entries()) {
              map.set(key, value)
            }

            return map
          }

          map.set(entry.key, evaluateExpression(entry.value, env))
          return map
        }, new Map<string, Value>()),
      }
    case 'PropertyAccess':
      return evaluatePropertyAccess(expression, env)
    case 'WhenExpr':
      return evaluateWhenExpr(expression, env)
    case 'TrainLoop':
      return evaluateTrainLoop(expression, env)
    case 'ReadExpr':
      return evaluateReadExpr(expression, env)
    default:
      return assertNever(expression)
  }
}

function evaluateUnaryExpr(expression: UnaryExpr, env: Environment): Value {
  const argument = evaluateExpression(expression.argument, env)

  switch (expression.operator) {
    case 'nani':
      return booleanValue(!expectBoolean(argument, 'nani'))
    default:
      throw new Error(`Unsupported unary operator '${expression.operator}'`)
  }
}

function evaluateInterpolatedString(
  expression: InterpolatedString,
  env: Environment
): Value {
  return {
    type: 'string',
    value: expression.parts
      .map((part) => {
        if (part.type === 'StringText') {
          return part.value
        }

        return renderValue(evaluateExpression(part.expression, env))
      })
      .join(''),
  }
}

function evaluateBinaryExpr(expression: BinaryExpr, env: Environment): Value {
  if (expression.operator === 'and') {
    const left = evaluateExpression(expression.left, env)
    const leftValue = expectBoolean(left, 'and')

    if (!leftValue) {
      return booleanValue(false)
    }

    const right = evaluateExpression(expression.right, env)
    return booleanValue(expectBoolean(right, 'and'))
  }

  if (expression.operator === 'or') {
    const left = evaluateExpression(expression.left, env)
    const leftValue = expectBoolean(left, 'or')

    if (leftValue) {
      return booleanValue(true)
    }

    const right = evaluateExpression(expression.right, env)
    return booleanValue(expectBoolean(right, 'or'))
  }

  const left = evaluateExpression(expression.left, env)
  const right = evaluateExpression(expression.right, env)

  switch (expression.operator) {
    case '+':
      return numberValue(expectNumber(left, '+') + expectNumber(right, '+'))
    case '-':
      return numberValue(expectNumber(left, '-') - expectNumber(right, '-'))
    case '*':
      return numberValue(expectNumber(left, '*') * expectNumber(right, '*'))
    case '/':
      return numberValue(expectNumber(left, '/') / expectNumber(right, '/'))
    case '%':
      return numberValue(expectNumber(left, '%') % expectNumber(right, '%'))
    case '<':
      return booleanValue(expectNumber(left, '<') < expectNumber(right, '<'))
    case '>':
      return booleanValue(expectNumber(left, '>') > expectNumber(right, '>'))
    case '<=':
      return booleanValue(expectNumber(left, '<=') <= expectNumber(right, '<='))
    case '>=':
      return booleanValue(expectNumber(left, '>=') >= expectNumber(right, '>='))
    case '==':
      return booleanValue(isEqual(left, right))
    case '!=':
      return booleanValue(!isEqual(left, right))
    default:
      throw new Error(`Unsupported binary operator '${expression.operator}'`)
  }
}

function evaluateFunctionCall(
  expression: Extract<Expression, { type: 'FunctionCall' }>,
  env: Environment
): Value {
  const callee = evaluateExpression(expression.callee, env)
  const args = expression.args.map((arg) => evaluateExpression(arg, env))

  return invokeCallable(callee, args)
}

function invokeCallable(callee: Value, args: Array<Value>): Value {
  if (callee.type === 'builtin') {
    if (args.length !== callee.arity) {
      throw new Error(
        `Expected ${callee.arity} arguments but got ${args.length}`
      )
    }

    return callee.call(args)
  }

  if (callee.type !== 'function') {
    throw new Error(
      'Can only call functions. Tried to call a non-function value'
    )
  }

  if (args.length !== callee.params.length) {
    throw new Error(
      `Expected ${callee.params.length} arguments but got ${args.length}`
    )
  }

  let callEnv = callee.closure.child()

  for (let index = 0; index < callee.params.length; index += 1) {
    callEnv = callEnv.define(callee.params[index]!, args[index]!)
  }

  try {
    if (callee.body.type === 'Block') {
      return evaluateBlock(callee.body, callEnv)
    }

    return evaluateExpression(callee.body, callEnv)
  } catch (error) {
    if (error instanceof ReturnSignal) {
      return error.value
    }

    throw error
  }
}

function evaluateBlock(block: Block, env: Environment): Value {
  return evaluateStatements(block.body, env.child()).value
}

function evaluatePropertyAccess(
  expression: Extract<Expression, { type: 'PropertyAccess' }>,
  env: Environment
): Value {
  const object = evaluateExpression(expression.object, env)

  if (object.type !== 'object') {
    throw new Error('Can only access properties on objects')
  }

  return object.value.get(expression.property) ?? POOF
}

function evaluateWhenExpr(
  expression: Extract<Expression, { type: 'WhenExpr' }>,
  env: Environment
): Value {
  const condition = evaluateExpression(expression.condition, env)

  if (expectBoolean(condition, 'when')) {
    return evaluateBlock(expression.thenBranch, env)
  }

  if (expression.otherwiseBranch !== null) {
    return evaluateBlock(expression.otherwiseBranch, env)
  }

  return POOF
}

function evaluateTrainLoop(
  expression: Extract<Expression, { type: 'TrainLoop' }>,
  env: Environment
): Value {
  const iterable = evaluateExpression(expression.iterable, env)

  if (iterable.type !== 'list') {
    throw new Error('Can only train over lists')
  }

  let lastValue: Value = POOF

  for (const item of iterable.value) {
    const loopEnv = env.child().define(expression.iterator.name, item)
    lastValue = evaluateBlock(expression.body, loopEnv)
  }

  return lastValue
}

function evaluateReadExpr(
  expression: Extract<Expression, { type: 'ReadExpr' }>,
  env: Environment
): Value {
  const value = evaluateExpression(expression.value, env)

  for (const arm of expression.arms) {
    const matchedEnv = matchPattern(arm.pattern, value, env)

    if (matchedEnv === null) {
      continue
    }

    if (arm.guard !== null) {
      const guardValue = evaluateExpression(arm.guard, matchedEnv)

      if (!expectBoolean(guardValue, 'read guard')) {
        continue
      }
    }

    if (arm.body.type === 'Block') {
      return evaluateBlock(arm.body, matchedEnv)
    }

    return evaluateExpression(arm.body, matchedEnv)
  }

  throw new Error('No pattern matched')
}

function matchPattern(
  pattern: Pattern,
  value: Value,
  env: Environment
): Environment | null {
  switch (pattern.type) {
    case 'NumberPattern':
      return value.type === 'number' && value.value === pattern.value
        ? env
        : null
    case 'StringPattern':
      return value.type === 'string' && value.value === pattern.value
        ? env
        : null
    case 'BooleanPattern':
      return value.type === 'boolean' && value.value === pattern.value
        ? env
        : null
    case 'PoofPattern':
      return value.type === 'poof' ? env : null
    case 'IdentifierPattern':
      return env.define(pattern.name, value)
    case 'ListPattern':
      return matchListPattern(pattern, value, env)
    case 'ObjectPattern':
      return matchObjectPattern(pattern, value, env)
    case 'ConstructorPattern':
      return matchConstructorPattern(pattern, value, env)
    case 'WildcardPattern':
      return env
    default:
      return assertNever(pattern)
  }
}

function matchListPattern(
  pattern: Extract<Pattern, { type: 'ListPattern' }>,
  value: Value,
  env: Environment
): Environment | null {
  if (value.type !== 'list') {
    return null
  }

  if (value.value.length < pattern.elements.length) {
    return null
  }

  if (pattern.rest === null && value.value.length !== pattern.elements.length) {
    return null
  }

  let currentEnv = env

  for (let index = 0; index < pattern.elements.length; index += 1) {
    const nextEnv = matchPattern(
      pattern.elements[index]!,
      value.value[index]!,
      currentEnv
    )

    if (nextEnv === null) {
      return null
    }

    currentEnv = nextEnv
  }

  if (pattern.rest !== null) {
    const restValue: Value = {
      type: 'list',
      value: value.value.slice(pattern.elements.length),
    }

    return matchPattern(pattern.rest, restValue, currentEnv)
  }

  return currentEnv
}

function matchObjectPattern(
  pattern: Extract<Pattern, { type: 'ObjectPattern' }>,
  value: Value,
  env: Environment
): Environment | null {
  if (value.type !== 'object') {
    return null
  }

  let currentEnv = env

  for (const property of pattern.properties) {
    if (!value.value.has(property.key)) {
      return null
    }

    const propertyValue = value.value.get(property.key)

    if (propertyValue === undefined) {
      return null
    }

    const nextEnv = matchPattern(property.pattern, propertyValue, currentEnv)

    if (nextEnv === null) {
      return null
    }

    currentEnv = nextEnv
  }

  return currentEnv
}

function matchConstructorPattern(
  pattern: Extract<Pattern, { type: 'ConstructorPattern' }>,
  value: Value,
  env: Environment
): Environment | null {
  if (pattern.name === 'victory') {
    if (value.type !== 'victory' || pattern.args.length !== 1) {
      return null
    }

    return matchPattern(pattern.args[0]!, value.value, env)
  }

  if (pattern.name === 'defeat') {
    if (value.type !== 'defeat' || pattern.args.length !== 1) {
      return null
    }

    return matchPattern(pattern.args[0]!, value.value, env)
  }

  return null
}

function numberValue(value: number): Value {
  return {
    type: 'number',
    value,
  }
}

function booleanValue(value: boolean): Value {
  return {
    type: 'boolean',
    value,
  }
}

function expectNumber(value: Value, operator: string): number {
  if (value.type !== 'number') {
    throw new Error(`Operator '${operator}' expects numbers`)
  }

  return value.value
}

function expectBoolean(value: Value, operator: string): boolean {
  if (value.type !== 'boolean') {
    throw new Error(`Operator '${operator}' expects booleans`)
  }

  return value.value
}

function isEqual(left: Value, right: Value): boolean {
  if (left.type !== right.type) {
    return false
  }

  switch (left.type) {
    case 'number':
      return left.value === (right as Extract<Value, { type: 'number' }>).value
    case 'string':
      return left.value === (right as Extract<Value, { type: 'string' }>).value
    case 'boolean':
      return left.value === (right as Extract<Value, { type: 'boolean' }>).value
    case 'poof':
      return true
    case 'list': {
      const rightList = right as Extract<Value, { type: 'list' }>

      return (
        left.value.length === rightList.value.length &&
        left.value.every((item, index) =>
          isEqual(item, rightList.value[index]!)
        )
      )
    }
    case 'object': {
      const rightObject = right as Extract<Value, { type: 'object' }>

      if (left.value.size !== rightObject.value.size) {
        return false
      }

      for (const [key, value] of left.value.entries()) {
        const otherValue = rightObject.value.get(key)

        if (!otherValue || !isEqual(value, otherValue)) {
          return false
        }
      }

      return true
    }
    case 'victory':
      return isEqual(
        left.value,
        (right as Extract<Value, { type: 'victory' }>).value
      )
    case 'defeat':
      return isEqual(
        left.value,
        (right as Extract<Value, { type: 'defeat' }>).value
      )
    case 'builtin':
      return left === right
    case 'function':
      return left === right
    default:
      return assertNever(left)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected node: ${JSON.stringify(value)}`)
}
