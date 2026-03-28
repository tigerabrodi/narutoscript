import { interpret, type Value } from '../../src/interpreter'

export const evaluate = (source: string): Value => interpret({ source })
