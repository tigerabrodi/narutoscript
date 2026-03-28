import type { BuiltinValue, Value } from './interpreter'

export function createBuiltins({
  output,
  invokeCallable,
}: {
  invokeCallable: (callee: Value, args: Array<Value>) => Value
  output: (line: string) => void
}): Array<[string, Value]> {
  const say: BuiltinValue = {
    type: 'builtin',
    name: 'say',
    arity: 1,
    call: (args) => {
      output(renderValue(args[0]!))
      return { type: 'poof' }
    },
  }

  const clone: BuiltinValue = {
    type: 'builtin',
    name: 'clone',
    arity: 2,
    call: (args) => {
      const list = args[0]
      const mapper = args[1]

      if (list?.type !== 'list') {
        throw new Error('clone expects a list as the first argument')
      }

      if (mapper === undefined) {
        throw new Error('clone expects a mapper function')
      }

      return {
        type: 'list',
        value: list.value.map((item) => invokeCallable(mapper, [item])),
      }
    },
  }

  const pick: BuiltinValue = {
    type: 'builtin',
    name: 'pick',
    arity: 2,
    call: (args) => {
      const list = args[0]
      const predicate = args[1]

      if (list?.type !== 'list') {
        throw new Error('pick expects a list as the first argument')
      }

      if (predicate === undefined) {
        throw new Error('pick expects a predicate function')
      }

      return {
        type: 'list',
        value: list.value.filter((item) => {
          const result = invokeCallable(predicate, [item])

          if (result.type !== 'boolean') {
            throw new Error('pick predicate must return a boolean')
          }

          return result.value
        }),
      }
    },
  }

  const combine: BuiltinValue = {
    type: 'builtin',
    name: 'combine',
    arity: 3,
    call: (args) => {
      const list = args[0]
      const reducer = args[1]
      let accumulator = args[2]

      if (list?.type !== 'list') {
        throw new Error('combine expects a list as the first argument')
      }

      if (reducer === undefined) {
        throw new Error('combine expects a reducer function')
      }

      if (accumulator === undefined) {
        throw new Error('combine expects an initial value')
      }

      for (const item of list.value) {
        accumulator = invokeCallable(reducer, [accumulator, item])
      }

      return accumulator
    },
  }

  const length: BuiltinValue = {
    type: 'builtin',
    name: 'length',
    arity: 1,
    call: (args) => {
      const list = args[0]

      if (list?.type !== 'list') {
        throw new Error('length expects a list')
      }

      return {
        type: 'number',
        value: list.value.length,
      }
    },
  }

  const type: BuiltinValue = {
    type: 'builtin',
    name: 'type',
    arity: 1,
    call: (args) => {
      const value = args[0]

      if (value === undefined) {
        throw new Error('type expects a value')
      }

      return {
        type: 'string',
        value: typeName(value),
      }
    },
  }

  return [
    ['say', say],
    ['clone', clone],
    ['pick', pick],
    ['combine', combine],
    ['length', length],
    ['type', type],
  ]
}

function renderValue(value: Value): string {
  switch (value.type) {
    case 'number':
      return String(value.value)
    case 'string':
      return value.value
    case 'boolean':
      return value.value ? 'true' : 'false'
    case 'poof':
      return 'poof'
    case 'list':
      return `[${value.value.map(renderValue).join(', ')}]`
    case 'object': {
      const entries = Array.from(value.value.entries()).map(
        ([key, entryValue]) => `${key}: ${renderValue(entryValue)}`
      )

      return `{${entries.length === 0 ? '' : ` ${entries.join(', ')} `}}`
    }
    case 'function':
    case 'builtin':
      return '<function>'
    case 'victory':
      return `victory(${renderValue(value.value)})`
    case 'defeat':
      return `defeat(${renderValue(value.value)})`
    default:
      return assertNever(value)
  }
}

function typeName(value: Value): string {
  switch (value.type) {
    case 'builtin':
    case 'function':
      return 'function'
    default:
      return value.type
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}
