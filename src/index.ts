import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as consoleOutput } from 'node:process'
import { BUILTIN_NAMES, renderValue } from './builtins'
import {
  createEnvironment,
  interpret,
  interpretWithEnvironment,
  type Environment,
  type Value,
} from './interpreter'
import { parse } from './parser'

const VERSION = '0.1.0'

const EXAMPLE_FILES = [
  'examples/hello.naru',
  'examples/ninja-power-calculator.naru',
  'examples/all-features.naru',
] as const

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
  const source = await readProgramFile(filePath)

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

  const resetEnvironment = () => {
    env = createEnvironment({
      output,
    })
  }

  return {
    runLine(line: string): { exit: boolean } {
      const trimmed = line.trim()

      if (trimmed === '') {
        return { exit: false }
      }

      if (trimmed === 'exit' || trimmed === ':exit' || trimmed === ':quit') {
        return { exit: true }
      }

      if (trimmed.startsWith(':')) {
        return handleReplCommand(trimmed)
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

  function handleReplCommand(commandLine: string): { exit: boolean } {
    const [command] = commandLine.split(/\s+/, 1)

    if (command === undefined) {
      errorOutput('REPL command error. Unknown command. Try :help.')
      return { exit: false }
    }

    const argument = commandLine.slice(command.length).trim()

    switch (command) {
      case ':help':
        printLines(output, getReplHelpLines())
        return { exit: false }
      case ':examples':
        printLines(output, EXAMPLE_FILES)
        return { exit: false }
      case ':builtins':
        output(BUILTIN_NAMES.join(', '))
        return { exit: false }
      case ':env': {
        const userBindings = env
          .visibleEntries()
          .filter(([, value]) => value.type !== 'builtin')

        if (userBindings.length === 0) {
          output('No user bindings yet.')
          return { exit: false }
        }

        for (const [name, value] of userBindings) {
          output(`${name} = ${renderValue(value)}`)
        }

        return { exit: false }
      }
      case ':type':
        if (argument === '') {
          errorOutput('REPL command error. Usage. :type <expression>')
          return { exit: false }
        }

        try {
          const result = interpretWithEnvironment({
            source: `type(${argument})`,
            env,
          })
          output(renderValue(result.value))
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown NarutoScript error'
          errorOutput(`REPL error. ${message}`)
        }

        return { exit: false }
      case ':load':
        if (argument === '') {
          errorOutput('REPL command error. Usage. :load <file>')
          return { exit: false }
        }

        try {
          const source = readProgramFileSync(argument)
          const result = interpretWithEnvironment({
            source,
            env,
          })
          env = result.env
          output(`Loaded ${argument}`)
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown NarutoScript error'
          errorOutput(`REPL error. ${message}`)
        }

        return { exit: false }
      case ':reset':
        resetEnvironment()
        output('Environment reset.')
        return { exit: false }
      default:
        errorOutput(
          `REPL command error. Unknown command '${command}'. Try :help.`
        )
        return { exit: false }
    }
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
  output('Type :help for REPL commands. Type exit to quit.')

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
  const command = args[0]

  if (command === undefined) {
    return runRepl({
      inputLines: input,
      output,
      errorOutput,
    })
  }

  if (command === '--help' || command === '-h' || command === 'help') {
    printLines(output, getCliHelpLines())
    return 0
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    output(`NarutoScript v${VERSION}`)
    return 0
  }

  if (command === 'examples') {
    printLines(output, EXAMPLE_FILES)
    return 0
  }

  if (command === 'repl') {
    return runRepl({
      inputLines: input,
      output,
      errorOutput,
    })
  }

  if (command === 'run') {
    const filePath = args[1]

    if (filePath === undefined) {
      errorOutput('Missing file path for run <file>.')
      errorOutput('Try bun run src/index.ts --help')
      return 1
    }

    return runFileCommand({
      filePath,
      output,
      errorOutput,
    })
  }

  if (command.startsWith('-')) {
    errorOutput(`Unknown option '${command}'.`)
    errorOutput('Try bun run src/index.ts --help')
    return 1
  }

  if (args.length > 1) {
    errorOutput(`Unknown command '${command}'.`)
    errorOutput('Try bun run src/index.ts --help')
    return 1
  }

  return runFileCommand({
    filePath: command,
    output,
    errorOutput,
  })
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

function getCliHelpLines(): string[] {
  return [
    `NarutoScript v${VERSION}`,
    'Usage.',
    '  bun run src/index.ts <file.naru>',
    '  bun run src/index.ts run <file.naru>',
    '  bun run src/index.ts repl',
    '  bun run src/index.ts examples',
    '  bun run src/index.ts --help',
    'Commands.',
    '  run <file>. Run a NarutoScript file.',
    '  repl. Start the interactive REPL.',
    '  examples. List example programs.',
    '  help. Show this help text.',
    'Examples.',
    ...EXAMPLE_FILES,
  ]
}

function getReplHelpLines(): string[] {
  return [
    'REPL commands.',
    '  :help. Show this help text.',
    '  :examples. Show example programs.',
    '  :builtins. Show builtin functions.',
    '  :env. Show current user bindings.',
    '  :type <expression>. Show the runtime type of an expression.',
    '  :load <file>. Load a file into the current session.',
    '  :reset. Clear user bindings and start fresh.',
    '  exit or :exit. Leave the REPL.',
  ]
}

function printLines(
  output: (line: string) => void,
  lines: readonly string[]
): void {
  for (const line of lines) {
    output(line)
  }
}

async function runFileCommand({
  filePath,
  output,
  errorOutput,
}: {
  errorOutput: (line: string) => void
  filePath: string
  output: (line: string) => void
}): Promise<number> {
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

async function readProgramFile(filePath: string): Promise<string> {
  ensureFileExists(filePath)
  return await Bun.file(filePath).text()
}

function readProgramFileSync(filePath: string): string {
  ensureFileExists(filePath)
  return readFileSync(filePath, 'utf8')
}

function ensureFileExists(filePath: string): void {
  if (existsSync(filePath)) {
    return
  }

  throw new Error(
    `Could not find file '${filePath}'. Try bun run src/index.ts examples or bun run src/index.ts --help`
  )
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
