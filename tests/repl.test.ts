import { describe, expect, it } from 'bun:test'
import { runCli } from '../src/index'

async function runRepl(lines: string[]): Promise<{
  errors: string[]
  exitCode: number
  output: string[]
}> {
  const output: string[] = []
  const errors: string[] = []

  const exitCode = await runCli({
    args: [],
    input: lines,
    output: (line) => {
      output.push(line)
    },
    errorOutput: (line) => {
      errors.push(line)
    },
  })

  return {
    errors,
    exitCode,
    output,
  }
}

describe('REPL', () => {
  it('starts REPL mode when no file path is given', async () => {
    const result = await runRepl(['exit'])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
    ])
    expect(result.errors).toEqual([])
  })

  it('keeps state between lines', async () => {
    const result = await runRepl([
      'jutsu name = `Naruto`',
      'name',
      'say(`Hello {name}`)',
      'exit',
    ])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
      'Naruto',
      'Hello Naruto',
    ])
    expect(result.errors).toEqual([])
  })

  it('keeps running after an error', async () => {
    const result = await runRepl(['say(missing)', 'say(`Still here`)', 'exit'])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
      'Still here',
    ])
    expect(result.errors).toEqual(["REPL error. Undefined variable 'missing'"])
  })

  it('ignores empty lines', async () => {
    const result = await runRepl(['', '   ', '42', 'exit'])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
      '42',
    ])
    expect(result.errors).toEqual([])
  })

  it('shows REPL help and discovery commands', async () => {
    const result = await runRepl([':help', ':examples', ':builtins', 'exit'])

    expect(result.exitCode).toBe(0)
    expect(result.output.join('\n')).toMatch(/:help/i)
    expect(result.output.join('\n')).toMatch(/:examples/i)
    expect(result.output.join('\n')).toMatch(/:builtins/i)
    expect(result.output.join('\n')).toMatch(/:load <file>/i)
    expect(result.output.join('\n')).toMatch(/examples\/hello\.naru/i)
    expect(result.output.join('\n')).toMatch(
      /say, clone, pick, combine, length, type/i
    )
    expect(result.errors).toEqual([])
  })

  it('supports env, type, and reset helper commands', async () => {
    const result = await runRepl([
      'jutsu name = `Naruto`',
      ':env',
      ':type name',
      ':reset',
      ':env',
      'exit',
    ])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
      'name = Naruto',
      'string',
      'Environment reset.',
      'No user bindings yet.',
    ])
    expect(result.errors).toEqual([])
  })

  it('can load a file into the current session', async () => {
    const result = await runRepl([':load examples/hello.naru', 'name', 'exit'])

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'NarutoScript v0.1.0 REPL',
      'Type :help for REPL commands. Type exit to quit.',
      'Hello, NarutoScript!',
      'Welcome, Naruto!',
      'Loaded examples/hello.naru',
      'Naruto',
    ])
    expect(result.errors).toEqual([])
  })
})
