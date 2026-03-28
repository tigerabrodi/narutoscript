export type Program = {
  type: "Program"
  body: Statement[]
}

export type Statement =
  | JutsuBinding
  | DattebayoStatement
  | Expression

export type Expression =
  | FunctionExpr
  | FunctionCall
  | BinaryExpr
  | UnaryExpr
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | PoofLiteral
  | Identifier
  | ListLiteral
  | ObjectLiteral
  | PropertyAccess
  | Block
  | WhenExpr
  | TrainLoop
  | ReadExpr
  | VictoryExpr
  | DefeatExpr

export type NumberLiteral = {
  type: "NumberLiteral"
  value: number
  raw: string
}

export type StringLiteral = {
  type: "StringLiteral"
  value: string
}

export type BooleanLiteral = {
  type: "BooleanLiteral"
  value: boolean
}

export type PoofLiteral = {
  type: "PoofLiteral"
}

export type Identifier = {
  type: "Identifier"
  name: string
}

export type JutsuBinding = {
  type: "JutsuBinding"
  name: Identifier
  value: Expression
}

export type FunctionExpr = {
  type: "FunctionExpr"
  params: Identifier[]
  body: Expression | Block
}

export type FunctionCall = {
  type: "FunctionCall"
  callee: Expression
  args: Expression[]
}

export type BinaryExpr = {
  type: "BinaryExpr"
  operator: string
  left: Expression
  right: Expression
}

export type UnaryExpr = {
  type: "UnaryExpr"
  operator: string
  argument: Expression
}

export type ListLiteral = {
  type: "ListLiteral"
  elements: Expression[]
}

export type ObjectLiteral = {
  type: "ObjectLiteral"
  entries: ObjectEntry[]
}

export type ObjectEntry = ObjectProperty | SpreadProperty

export type ObjectProperty = {
  type: "ObjectProperty"
  key: string
  value: Expression
}

export type SpreadProperty = {
  type: "SpreadProperty"
  argument: Expression
}

export type PropertyAccess = {
  type: "PropertyAccess"
  object: Expression
  property: string
}

export type Block = {
  type: "Block"
  body: Statement[]
}

export type WhenExpr = {
  type: "WhenExpr"
  condition: Expression
  thenBranch: Block
  otherwiseBranch: Block | null
}

export type TrainLoop = {
  type: "TrainLoop"
  iterator: Identifier
  iterable: Expression
  body: Block
}

export type ReadExpr = {
  type: "ReadExpr"
  value: Expression
  arms: MatchArm[]
}

export type MatchArm = {
  type: "MatchArm"
  pattern: Pattern
  guard: Expression | null
  body: Expression | Block
}

export type DattebayoStatement = {
  type: "DattebayoStatement"
  value: Expression
}

export type VictoryExpr = {
  type: "VictoryExpr"
  value: Expression
}

export type DefeatExpr = {
  type: "DefeatExpr"
  value: Expression
}

export type Pattern =
  | NumberPattern
  | StringPattern
  | BooleanPattern
  | PoofPattern
  | IdentifierPattern
  | WildcardPattern
  | ListPattern
  | ObjectPattern
  | ConstructorPattern

export type NumberPattern = {
  type: "NumberPattern"
  value: number
  raw: string
}

export type StringPattern = {
  type: "StringPattern"
  value: string
}

export type BooleanPattern = {
  type: "BooleanPattern"
  value: boolean
}

export type PoofPattern = {
  type: "PoofPattern"
}

export type IdentifierPattern = {
  type: "IdentifierPattern"
  name: string
}

export type WildcardPattern = {
  type: "WildcardPattern"
}

export type ListPattern = {
  type: "ListPattern"
  elements: Pattern[]
  rest: IdentifierPattern | WildcardPattern | null
}

export type ObjectPattern = {
  type: "ObjectPattern"
  properties: ObjectPatternProperty[]
}

export type ObjectPatternProperty = {
  key: string
  pattern: Pattern
}

export type ConstructorPattern = {
  type: "ConstructorPattern"
  name: string
  args: Pattern[]
}
