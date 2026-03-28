import { describe, expect, it } from 'bun:test'
import { runCli } from '../src/index'

async function runCommand(args: string[]): Promise<{
  errors: string[]
  exitCode: number
  output: string[]
}> {
  const output: string[] = []
  const errors: string[] = []

  const exitCode = await runCli({
    args,
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

describe('CLI', () => {
  it('shows help text', async () => {
    const result = await runCommand(['--help'])

    expect(result.exitCode).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.output.join('\n')).toMatch(/NarutoScript v0.1.0/i)
    expect(result.output.join('\n')).toMatch(/Commands/i)
    expect(result.output.join('\n')).toMatch(/run <file>/i)
    expect(result.output.join('\n')).toMatch(/repl/i)
    expect(result.output.join('\n')).toMatch(/examples/i)
  })

  it('lists example programs', async () => {
    const result = await runCommand(['examples'])

    expect(result.exitCode).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.output).toContain('examples/hello.naru')
    expect(result.output).toContain('examples/ninja-power-calculator.naru')
    expect(result.output).toContain('examples/all-features.naru')
  })

  it('supports the explicit run subcommand', async () => {
    const result = await runCommand(['run', 'examples/hello.naru'])

    expect(result.exitCode).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.output).toEqual(['Hello, NarutoScript!', 'Welcome, Naruto!'])
  })

  it('shows a helpful error when run is missing a file path', async () => {
    const result = await runCommand(['run'])

    expect(result.exitCode).toBe(1)
    expect(result.output).toEqual([])
    expect(result.errors.join('\n')).toMatch(/missing file path/i)
    expect(result.errors.join('\n')).toMatch(/run <file>/i)
  })

  it('shows a helpful error when the file does not exist', async () => {
    const result = await runCommand(['missing-file.naru'])

    expect(result.exitCode).toBe(1)
    expect(result.output).toEqual([])
    expect(result.errors.join('\n')).toMatch(/could not find file/i)
    expect(result.errors.join('\n')).toMatch(/missing-file\.naru/i)
    expect(result.errors.join('\n')).toMatch(/examples|help/i)
  })
})
