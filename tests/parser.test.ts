import { describe, expect, it } from "bun:test"
import { parse } from "../src/parser"

const parseProgram = (source: string) => parse({ source })

const parseSingle = (source: string) => {
  const program = parseProgram(source)
  expect(program.body).toHaveLength(1)
  return program.body[0]
}

describe("Parser", () => {
  describe("literals and identifiers", () => {
    it("parses number literals", () => {
      expect(parseSingle("42")).toEqual({
        type: "NumberLiteral",
        value: 42,
        raw: "42",
      })
    })

    it("parses string literals", () => {
      expect(parseSingle("`hello`")).toEqual({
        type: "StringLiteral",
        value: "hello",
      })
    })

    it("parses boolean literals", () => {
      expect(parseSingle("true")).toEqual({
        type: "BooleanLiteral",
        value: true,
      })

      expect(parseSingle("false")).toEqual({
        type: "BooleanLiteral",
        value: false,
      })
    })

    it("parses poof", () => {
      expect(parseSingle("poof")).toEqual({
        type: "PoofLiteral",
      })
    })

    it("parses identifiers", () => {
      expect(parseSingle("shadowClone")).toEqual({
        type: "Identifier",
        name: "shadowClone",
      })
    })
  })

  describe("bindings and functions", () => {
    it("parses a simple binding", () => {
      expect(parseSingle("jutsu power = 9000")).toEqual({
        type: "JutsuBinding",
        name: {
          type: "Identifier",
          name: "power",
        },
        value: {
          type: "NumberLiteral",
          value: 9000,
          raw: "9000",
        },
      })
    })

    it("parses a function binding with one parameter", () => {
      expect(parseSingle("jutsu double = (x) -> x * 2")).toEqual({
        type: "JutsuBinding",
        name: {
          type: "Identifier",
          name: "double",
        },
        value: {
          type: "FunctionExpr",
          params: [
            {
              type: "Identifier",
              name: "x",
            },
          ],
          body: {
            type: "BinaryExpr",
            operator: "*",
            left: {
              type: "Identifier",
              name: "x",
            },
            right: {
              type: "NumberLiteral",
              value: 2,
              raw: "2",
            },
          },
        },
      })
    })

    it("parses a function binding with multiple parameters", () => {
      expect(parseSingle("jutsu add = (x, y) -> x + y")).toEqual({
        type: "JutsuBinding",
        name: {
          type: "Identifier",
          name: "add",
        },
        value: {
          type: "FunctionExpr",
          params: [
            {
              type: "Identifier",
              name: "x",
            },
            {
              type: "Identifier",
              name: "y",
            },
          ],
          body: {
            type: "BinaryExpr",
            operator: "+",
            left: {
              type: "Identifier",
              name: "x",
            },
            right: {
              type: "Identifier",
              name: "y",
            },
          },
        },
      })
    })

    it("parses a function with a block body", () => {
      expect(
        parseSingle(
          [
            "jutsu process = (x) -> {",
            "  jutsu doubled = x * 2",
            "  jutsu tripled = x * 3",
            "  doubled + tripled",
            "}",
          ].join("\n")
        )
      ).toEqual({
        type: "JutsuBinding",
        name: {
          type: "Identifier",
          name: "process",
        },
        value: {
          type: "FunctionExpr",
          params: [
            {
              type: "Identifier",
              name: "x",
            },
          ],
          body: {
            type: "Block",
            body: [
              {
                type: "JutsuBinding",
                name: {
                  type: "Identifier",
                  name: "doubled",
                },
                value: {
                  type: "BinaryExpr",
                  operator: "*",
                  left: {
                    type: "Identifier",
                    name: "x",
                  },
                  right: {
                    type: "NumberLiteral",
                    value: 2,
                    raw: "2",
                  },
                },
              },
              {
                type: "JutsuBinding",
                name: {
                  type: "Identifier",
                  name: "tripled",
                },
                value: {
                  type: "BinaryExpr",
                  operator: "*",
                  left: {
                    type: "Identifier",
                    name: "x",
                  },
                  right: {
                    type: "NumberLiteral",
                    value: 3,
                    raw: "3",
                  },
                },
              },
              {
                type: "BinaryExpr",
                operator: "+",
                left: {
                  type: "Identifier",
                  name: "doubled",
                },
                right: {
                  type: "Identifier",
                  name: "tripled",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("calls and precedence", () => {
    it("parses function calls", () => {
      expect(parseSingle("double(5)")).toEqual({
        type: "FunctionCall",
        callee: {
          type: "Identifier",
          name: "double",
        },
        args: [
          {
            type: "NumberLiteral",
            value: 5,
            raw: "5",
          },
        ],
      })
    })

    it("parses nested function calls", () => {
      expect(parseSingle("f(g(x), h(2))")).toEqual({
        type: "FunctionCall",
        callee: {
          type: "Identifier",
          name: "f",
        },
        args: [
          {
            type: "FunctionCall",
            callee: {
              type: "Identifier",
              name: "g",
            },
            args: [
              {
                type: "Identifier",
                name: "x",
              },
            ],
          },
          {
            type: "FunctionCall",
            callee: {
              type: "Identifier",
              name: "h",
            },
            args: [
              {
                type: "NumberLiteral",
                value: 2,
                raw: "2",
              },
            ],
          },
        ],
      })
    })

    it("parses binary expressions with precedence", () => {
      expect(parseSingle("1 + 2 * 3")).toEqual({
        type: "BinaryExpr",
        operator: "+",
        left: {
          type: "NumberLiteral",
          value: 1,
          raw: "1",
        },
        right: {
          type: "BinaryExpr",
          operator: "*",
          left: {
            type: "NumberLiteral",
            value: 2,
            raw: "2",
          },
          right: {
            type: "NumberLiteral",
            value: 3,
            raw: "3",
          },
        },
      })
    })

    it("parses grouping to override precedence", () => {
      expect(parseSingle("(1 + 2) * 3")).toEqual({
        type: "BinaryExpr",
        operator: "*",
        left: {
          type: "BinaryExpr",
          operator: "+",
          left: {
            type: "NumberLiteral",
            value: 1,
            raw: "1",
          },
          right: {
            type: "NumberLiteral",
            value: 2,
            raw: "2",
          },
        },
        right: {
          type: "NumberLiteral",
          value: 3,
          raw: "3",
        },
      })
    })

    it("parses unary nani with the correct precedence", () => {
      expect(parseSingle("nani true and false")).toEqual({
        type: "BinaryExpr",
        operator: "and",
        left: {
          type: "UnaryExpr",
          operator: "nani",
          argument: {
            type: "BooleanLiteral",
            value: true,
          },
        },
        right: {
          type: "BooleanLiteral",
          value: false,
        },
      })
    })
  })

  describe("collections and property access", () => {
    it("parses list literals", () => {
      expect(parseSingle("[1, true, poof]")).toEqual({
        type: "ListLiteral",
        elements: [
          {
            type: "NumberLiteral",
            value: 1,
            raw: "1",
          },
          {
            type: "BooleanLiteral",
            value: true,
          },
          {
            type: "PoofLiteral",
          },
        ],
      })
    })

    it("parses object literals", () => {
      expect(parseSingle("{ name: `Naruto`, age: 16 }")).toEqual({
        type: "ObjectLiteral",
        entries: [
          {
            type: "ObjectProperty",
            key: "name",
            value: {
              type: "StringLiteral",
              value: "Naruto",
            },
          },
          {
            type: "ObjectProperty",
            key: "age",
            value: {
              type: "NumberLiteral",
              value: 16,
              raw: "16",
            },
          },
        ],
      })
    })

    it("parses object literals with spread properties", () => {
      expect(parseSingle("{ ...ninja, power: 9001 }")).toEqual({
        type: "ObjectLiteral",
        entries: [
          {
            type: "SpreadProperty",
            argument: {
              type: "Identifier",
              name: "ninja",
            },
          },
          {
            type: "ObjectProperty",
            key: "power",
            value: {
              type: "NumberLiteral",
              value: 9001,
              raw: "9001",
            },
          },
        ],
      })
    })

    it("parses chained property access", () => {
      expect(parseSingle("team.leader.name")).toEqual({
        type: "PropertyAccess",
        object: {
          type: "PropertyAccess",
          object: {
            type: "Identifier",
            name: "team",
          },
          property: "leader",
        },
        property: "name",
      })
    })
  })

  describe("control flow and statements", () => {
    it("parses when without otherwise", () => {
      expect(parseSingle("when ready { go() }")).toEqual({
        type: "WhenExpr",
        condition: {
          type: "Identifier",
          name: "ready",
        },
        thenBranch: {
          type: "Block",
          body: [
            {
              type: "FunctionCall",
              callee: {
                type: "Identifier",
                name: "go",
              },
              args: [],
            },
          ],
        },
        otherwiseBranch: null,
      })
    })

    it("parses when with otherwise", () => {
      expect(parseSingle("when ready { go() } otherwise { wait() }")).toEqual({
        type: "WhenExpr",
        condition: {
          type: "Identifier",
          name: "ready",
        },
        thenBranch: {
          type: "Block",
          body: [
            {
              type: "FunctionCall",
              callee: {
                type: "Identifier",
                name: "go",
              },
              args: [],
            },
          ],
        },
        otherwiseBranch: {
          type: "Block",
          body: [
            {
              type: "FunctionCall",
              callee: {
                type: "Identifier",
                name: "wait",
              },
              args: [],
            },
          ],
        },
      })
    })

    it("parses train loops", () => {
      expect(parseSingle("train name in names { say(name) }")).toEqual({
        type: "TrainLoop",
        iterator: {
          type: "Identifier",
          name: "name",
        },
        iterable: {
          type: "Identifier",
          name: "names",
        },
        body: {
          type: "Block",
          body: [
            {
              type: "FunctionCall",
              callee: {
                type: "Identifier",
                name: "say",
              },
              args: [
                {
                  type: "Identifier",
                  name: "name",
                },
              ],
            },
          ],
        },
      })
    })

    it("parses dattebayo statements", () => {
      expect(parseSingle("dattebayo victory(42)")).toEqual({
        type: "DattebayoStatement",
        value: {
          type: "VictoryExpr",
          value: {
            type: "NumberLiteral",
            value: 42,
            raw: "42",
          },
        },
      })
    })

    it("parses multiple top level statements", () => {
      expect(parseProgram("jutsu x = 5\nx")).toEqual({
        type: "Program",
        body: [
          {
            type: "JutsuBinding",
            name: {
              type: "Identifier",
              name: "x",
            },
            value: {
              type: "NumberLiteral",
              value: 5,
              raw: "5",
            },
          },
          {
            type: "Identifier",
            name: "x",
          },
        ],
      })
    })
  })

  describe("results and pattern matching syntax", () => {
    it("parses victory and defeat expressions", () => {
      expect(parseProgram("victory(7)\ndefeat(`nope`)")).toEqual({
        type: "Program",
        body: [
          {
            type: "VictoryExpr",
            value: {
              type: "NumberLiteral",
              value: 7,
              raw: "7",
            },
          },
          {
            type: "DefeatExpr",
            value: {
              type: "StringLiteral",
              value: "nope",
            },
          },
        ],
      })
    })

    it("parses read expressions with literal and wildcard arms", () => {
      expect(
        parseSingle([
          "read n {",
          "  0 -> `zero`",
          "  _ -> `many`",
          "}",
        ].join("\n"))
      ).toEqual({
        type: "ReadExpr",
        value: {
          type: "Identifier",
          name: "n",
        },
        arms: [
          {
            type: "MatchArm",
            pattern: {
              type: "NumberPattern",
              value: 0,
              raw: "0",
            },
            guard: null,
            body: {
              type: "StringLiteral",
              value: "zero",
            },
          },
          {
            type: "MatchArm",
            pattern: {
              type: "WildcardPattern",
            },
            guard: null,
            body: {
              type: "StringLiteral",
              value: "many",
            },
          },
        ],
      })
    })

    it("parses match arms with guards", () => {
      expect(
        parseSingle([
          "read age {",
          "  n when n < 13 -> `child`",
          "  _ -> `adult`",
          "}",
        ].join("\n"))
      ).toEqual({
        type: "ReadExpr",
        value: {
          type: "Identifier",
          name: "age",
        },
        arms: [
          {
            type: "MatchArm",
            pattern: {
              type: "IdentifierPattern",
              name: "n",
            },
            guard: {
              type: "BinaryExpr",
              operator: "<",
              left: {
                type: "Identifier",
                name: "n",
              },
              right: {
                type: "NumberLiteral",
                value: 13,
                raw: "13",
              },
            },
            body: {
              type: "StringLiteral",
              value: "child",
            },
          },
          {
            type: "MatchArm",
            pattern: {
              type: "WildcardPattern",
            },
            guard: null,
            body: {
              type: "StringLiteral",
              value: "adult",
            },
          },
        ],
      })
    })

    it("parses list and object patterns", () => {
      expect(
        parseSingle([
          "read input {",
          "  [head, ...tail] -> head",
          "  { rank: `Hokage`, village: village } -> village",
          "}",
        ].join("\n"))
      ).toEqual({
        type: "ReadExpr",
        value: {
          type: "Identifier",
          name: "input",
        },
        arms: [
          {
            type: "MatchArm",
            pattern: {
              type: "ListPattern",
              elements: [
                {
                  type: "IdentifierPattern",
                  name: "head",
                },
              ],
              rest: {
                type: "IdentifierPattern",
                name: "tail",
              },
            },
            guard: null,
            body: {
              type: "Identifier",
              name: "head",
            },
          },
          {
            type: "MatchArm",
            pattern: {
              type: "ObjectPattern",
              properties: [
                {
                  key: "rank",
                  pattern: {
                    type: "StringPattern",
                    value: "Hokage",
                  },
                },
                {
                  key: "village",
                  pattern: {
                    type: "IdentifierPattern",
                    name: "village",
                  },
                },
              ],
            },
            guard: null,
            body: {
              type: "Identifier",
              name: "village",
            },
          },
        ],
      })
    })

    it("parses constructor patterns", () => {
      expect(
        parseSingle([
          "read result {",
          "  victory(value) -> value",
          "  defeat(reason) -> reason",
          "}",
        ].join("\n"))
      ).toEqual({
        type: "ReadExpr",
        value: {
          type: "Identifier",
          name: "result",
        },
        arms: [
          {
            type: "MatchArm",
            pattern: {
              type: "ConstructorPattern",
              name: "victory",
              args: [
                {
                  type: "IdentifierPattern",
                  name: "value",
                },
              ],
            },
            guard: null,
            body: {
              type: "Identifier",
              name: "value",
            },
          },
          {
            type: "MatchArm",
            pattern: {
              type: "ConstructorPattern",
              name: "defeat",
              args: [
                {
                  type: "IdentifierPattern",
                  name: "reason",
                },
              ],
            },
            guard: null,
            body: {
              type: "Identifier",
              name: "reason",
            },
          },
        ],
      })
    })
  })

  describe("complex programs and errors", () => {
    it("parses complex nested programs", () => {
      expect(
        parseSingle(
          "jutsu result = process(read value { victory(n) -> n _ -> 0 }, (x) -> x + 1).score"
        )
      ).toEqual({
        type: "JutsuBinding",
        name: {
          type: "Identifier",
          name: "result",
        },
        value: {
          type: "PropertyAccess",
          object: {
            type: "FunctionCall",
            callee: {
              type: "Identifier",
              name: "process",
            },
            args: [
              {
                type: "ReadExpr",
                value: {
                  type: "Identifier",
                  name: "value",
                },
                arms: [
                  {
                    type: "MatchArm",
                    pattern: {
                      type: "ConstructorPattern",
                      name: "victory",
                      args: [
                        {
                          type: "IdentifierPattern",
                          name: "n",
                        },
                      ],
                    },
                    guard: null,
                    body: {
                      type: "Identifier",
                      name: "n",
                    },
                  },
                  {
                    type: "MatchArm",
                    pattern: {
                      type: "WildcardPattern",
                    },
                    guard: null,
                    body: {
                      type: "NumberLiteral",
                      value: 0,
                      raw: "0",
                    },
                  },
                ],
              },
              {
                type: "FunctionExpr",
                params: [
                  {
                    type: "Identifier",
                    name: "x",
                  },
                ],
                body: {
                  type: "BinaryExpr",
                  operator: "+",
                  left: {
                    type: "Identifier",
                    name: "x",
                  },
                  right: {
                    type: "NumberLiteral",
                    value: 1,
                    raw: "1",
                  },
                },
              },
            ],
          },
          property: "score",
        },
      })
    })

    it("throws syntax errors with line numbers", () => {
      expect(() =>
        parseProgram([
          "jutsu broken = (x -> x + 1",
          "jutsu next = 2",
        ].join("\n"))
      ).toThrow(/line 1/i)
    })
  })
})
