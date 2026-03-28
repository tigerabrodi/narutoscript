import { interpret, type Value } from '../../src/interpreter'

export const evaluate = (source: string): Value => interpret({ source })

export const execute = (
  source: string
): { output: Array<string>; value: Value } => {
  const output: Array<string> = []
  const value = interpret({
    source,
    output: (line) => {
      output.push(line)
    },
  })

  return {
    output,
    value,
  }
}
