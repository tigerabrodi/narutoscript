import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCli } from '../src/index'

async function runProgram({
  fileName,
  source,
}: {
  fileName: string
  source: string
}): Promise<{
  errors: string[]
  exitCode: number
  filePath: string
  output: string[]
}> {
  const directory = mkdtempSync(join(tmpdir(), 'narutoscript-integration-'))
  const filePath = join(directory, fileName)
  writeFileSync(filePath, source)

  const output: string[] = []
  const errors: string[] = []

  try {
    const exitCode = await runCli({
      args: [filePath],
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
      filePath,
      output,
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('Integration', () => {
  it('runs a hello world program', async () => {
    const result = await runProgram({
      fileName: 'hello.naru',
      source: 'say(`Believe it`)',
    })

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual(['Believe it'])
    expect(result.errors).toEqual([])
  })

  it('runs a ninja power calculator example', async () => {
    const result = await runProgram({
      fileName: 'power-calculator.naru',
      source: [
        'jutsu ninjas = [',
        '  { name: `Naruto`, power: 9000 },',
        '  { name: `Sasuke`, power: 8500 },',
        '  { name: `Sakura`, power: 7800 }',
        ']',
        'jutsu totalPower = combine(ninjas, (acc, ninja) -> acc + ninja.power, 0)',
        'say(`Total power is {totalPower}`)',
      ].join('\n'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual(['Total power is 25300'])
    expect(result.errors).toEqual([])
  })

  it('runs a program with combined language features', async () => {
    const result = await runProgram({
      fileName: 'all-features.naru',
      source: [
        'jutsu warriors = [',
        '  { name: `Naruto`, power: 9000 },',
        '  { name: `Sakura`, power: 7800 },',
        '  { name: `Konohamaru`, power: 4200 }',
        ']',
        'jutsu boosted = clone(warriors, (warrior) -> {',
        '  { ...warrior, power: warrior.power + 500 }',
        '})',
        'jutsu elites = pick(boosted, (warrior) -> warrior.power >= 8000)',
        'jutsu classify = (warrior) -> when warrior.power >= 9500 {',
        '  victory({ name: warrior.name, label: `legendary` })',
        '} otherwise {',
        '  defeat({ name: warrior.name, label: `rising` })',
        '}',
        'say(`Elite count {length(elites)}`)',
        'train warrior in elites {',
        '  read classify(warrior) {',
        '    victory({ name: name, label: label }) -> say(`{name} is {label}`)',
        '    defeat({ name: name, label: label }) -> say(`{name} is {label}`)',
        '  }',
        '}',
        'say(`Elite total {combine(elites, (acc, warrior) -> acc + warrior.power, 0)}`)',
      ].join('\n'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.output).toEqual([
      'Elite count 2',
      'Naruto is legendary',
      'Sakura is rising',
      'Elite total 17800',
    ])
    expect(result.errors).toEqual([])
  })

  it('includes line numbers in syntax error messages', async () => {
    const result = await runProgram({
      fileName: 'broken-syntax.naru',
      source: ['jutsu broken = (x -> x + 1', 'say(`never gets here`)'].join(
        '\n'
      ),
    })

    expect(result.exitCode).toBe(1)
    expect(result.output).toEqual([])
    expect(result.errors.join('\n')).toMatch(/broken-syntax\.naru/i)
    expect(result.errors.join('\n')).toMatch(/line 1/i)
  })

  it('shows helpful runtime errors', async () => {
    const result = await runProgram({
      fileName: 'missing-name.naru',
      source: 'say(missing)',
    })

    expect(result.exitCode).toBe(1)
    expect(result.output).toEqual([])
    expect(result.errors.join('\n')).toMatch(/missing-name\.naru/i)
    expect(result.errors.join('\n')).toMatch(/undefined variable.*missing/i)
  })
})
