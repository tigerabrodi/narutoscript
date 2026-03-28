import { interpret, type Value } from './interpreter'

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

export async function runCli({
  args,
  errorOutput = (line: string) => {
    console.error(line)
  },
  output = (line: string) => {
    console.log(line)
  },
}: {
  args: string[]
  errorOutput?: (line: string) => void
  output?: (line: string) => void
}): Promise<number> {
  const filePath = args[0]

  if (filePath === undefined) {
    output(`NarutoScript v${VERSION}`)
    output('Usage: bun run src/index.ts <file.naru>')
    return 1
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

if (import.meta.main) {
  const exitCode = await runCli({
    args: process.argv.slice(2),
  })

  if (exitCode !== 0) {
    process.exitCode = exitCode
  }
}
