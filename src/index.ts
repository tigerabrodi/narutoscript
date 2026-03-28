import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as consoleOutput } from 'node:process'
import { renderValue } from './builtins'
import {
  createEnvironment,
  interpret,
  interpretWithEnvironment,
  type Environment,
  type Value,
} from './interpreter'
import { parse } from './parser'

const VERSION = '0.1.0'

export function run({
  output = (line: string) => {
    console.log(line)
  },
  source,
}: {
  output?: (line: string) => void
  source: string
}): Value {
  return interpret({
    source,
    output,
  })
}

export async function runFile({
  filePath,
  output = (line: string) => {
    console.log(line)
  },
}: {
  filePath: string
  output?: (line: string) => void
}): Promise<Value> {
  const source = await Bun.file(filePath).text()

  return run({
    source,
    output,
  })
}

export function createReplSession({
  output = (line: string) => {
    console.log(line)
  },
  errorOutput = (line: string) => {
    console.error(line)
  },
}: {
  errorOutput?: (line: string) => void
  output?: (line: string) => void
}) {
  let env = createEnvironment({
    output,
  })

  return {
    runLine(line: string): { exit: boolean } {
      const trimmed = line.trim()

      if (trimmed === '') {
        return { exit: false }
      }

      if (trimmed === 'exit') {
        return { exit: true }
      }

      try {
        const program = parse({ source: line })
        const result = interpretWithEnvironment({
          source: line,
          env,
        })
        env = result.env

        if (shouldPrintReplValue(program, result.value)) {
          output(renderValue(result.value))
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown NarutoScript error'
        errorOutput(`REPL error. ${message}`)
      }

      return { exit: false }
    },
    getEnvironment(): Environment {
      return env
    },
  }
}

export async function runRepl({
  errorOutput = (line: string) => {
    console.error(line)
  },
  inputLines,
  output = (line: string) => {
    console.log(line)
  },
}: {
  errorOutput?: (line: string) => void
  inputLines?: AsyncIterable<string> | Iterable<string>
  output?: (line: string) => void
}): Promise<number> {
  output(`NarutoScript v${VERSION} REPL`)
  output('Type exit to quit.')

  const session = createReplSession({
    output,
    errorOutput,
  })

  if (inputLines !== undefined) {
    for await (const line of toAsyncIterable(inputLines)) {
      if (session.runLine(line).exit) {
        return 0
      }
    }

    return 0
  }

  const readline = createInterface({
    input,
    output: consoleOutput,
  })

  try {
    while (true) {
      let line: string

      try {
        line = await readline.question('naru> ')
      } catch {
        return 0
      }

      if (session.runLine(line).exit) {
        return 0
      }
    }
  } finally {
    readline.close()
  }
}

export async function runCli({
  args,
  errorOutput = (line: string) => {
    console.error(line)
  },
  input,
  output = (line: string) => {
    console.log(line)
  },
}: {
  args: string[]
  errorOutput?: (line: string) => void
  input?: AsyncIterable<string> | Iterable<string>
  output?: (line: string) => void
}): Promise<number> {
  const filePath = args[0]

  if (filePath === undefined) {
    return runRepl({
      inputLines: input,
      output,
      errorOutput,
    })
  }

  try {
    await runFile({
      filePath,
      output,
    })

    return 0
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown NarutoScript error'

    errorOutput(`Failed to run ${filePath}. ${message}`)
    return 1
  }
}

function shouldPrintReplValue(
  program: ReturnType<typeof parse>,
  value: Value
): boolean {
  const lastStatement = program.body[program.body.length - 1]

  if (lastStatement === undefined) {
    return false
  }

  if (
    lastStatement.type === 'JutsuBinding' ||
    lastStatement.type === 'DattebayoStatement'
  ) {
    return false
  }

  return value.type !== 'poof'
}

async function* toAsyncIterable(
  lines: AsyncIterable<string> | Iterable<string>
): AsyncIterable<string> {
  if (Symbol.asyncIterator in lines) {
    for await (const line of lines) {
      yield line
    }

    return
  }

  for (const line of lines) {
    yield line
  }
}

if (import.meta.main) {
  const exitCode = await runCli({
    args: process.argv.slice(2),
  })

  if (exitCode !== 0) {
    process.exitCode = exitCode
  }
}
