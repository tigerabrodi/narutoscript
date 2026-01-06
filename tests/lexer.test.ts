import { describe, it, expect } from "bun:test"
import { Lexer, type Token } from "../src/lexer"

describe("Lexer", () => {
  const tokenize = (source: string): Token[] => {
    const lexer = new Lexer({ source })
    return lexer.tokenize()
  }

  describe("keywords", () => {
    it("tokenizes jutsu keyword", () => {
      const tokens = tokenize("jutsu")
      expect(tokens[0].type).toBe("JUTSU")
      expect(tokens[0].value).toBe("jutsu")
    })

    it("tokenizes all keywords correctly", () => {
      const keywords = [
        "jutsu", "when", "otherwise", "train", "in",
        "dattebayo", "read", "victory", "defeat",
        "and", "or", "nani", "true", "false", "poof"
      ]

      for (const kw of keywords) {
        const tokens = tokenize(kw)
        expect(tokens[0].type).toBe(kw.toUpperCase())
      }
    })
  })

  describe("symbols", () => {
    it("tokenizes single-char symbols", () => {
      const tokens = tokenize("( ) { } [ ] , . : + * / %")
      const types = tokens.slice(0, -1).map(t => t.type)
      expect(types).toEqual([
        "LPAREN", "RPAREN", "LBRACE", "RBRACE",
        "LBRACKET", "RBRACKET", "COMMA", "DOT",
        "COLON", "PLUS", "STAR", "SLASH", "PERCENT"
      ])
    })

    it("tokenizes arrow ->", () => {
      const tokens = tokenize("->")
      expect(tokens[0].type).toBe("ARROW")
    })

    it("tokenizes spread ...", () => {
      const tokens = tokenize("...")
      expect(tokens[0].type).toBe("SPREAD")
    })

    it("tokenizes minus -", () => {
      const tokens = tokenize("5 - 3")
      expect(tokens[1].type).toBe("MINUS")
    })
  })

  describe("comparison operators", () => {
    it("tokenizes == and =", () => {
      const tokens = tokenize("= ==")
      expect(tokens[0].type).toBe("EQUALS")
      expect(tokens[1].type).toBe("EQ")
    })

    it("tokenizes != < > <= >=", () => {
      const tokens = tokenize("!= < > <= >=")
      const types = tokens.slice(0, -1).map(t => t.type)
      expect(types).toEqual(["NEQ", "LT", "GT", "LTE", "GTE"])
    })
  })

  describe("numbers", () => {
    it("tokenizes integers", () => {
      const tokens = tokenize("42")
      expect(tokens[0].type).toBe("NUMBER")
      expect(tokens[0].value).toBe("42")
    })

    it("tokenizes floats", () => {
      const tokens = tokenize("3.14159")
      expect(tokens[0].type).toBe("NUMBER")
      expect(tokens[0].value).toBe("3.14159")
    })
  })

  describe("strings", () => {
    it("tokenizes simple strings", () => {
      const tokens = tokenize("`hello world`")
      expect(tokens[0].type).toBe("STRING")
      expect(tokens[0].value).toBe("hello world")
    })

    it("tokenizes strings with interpolation markers", () => {
      const tokens = tokenize("`hello {name}`")
      expect(tokens[0].type).toBe("STRING")
      expect(tokens[0].value).toBe("hello {name}")
    })
  })

  describe("identifiers", () => {
    it("tokenizes simple identifiers", () => {
      const tokens = tokenize("myVar")
      expect(tokens[0].type).toBe("IDENTIFIER")
      expect(tokens[0].value).toBe("myVar")
    })

    it("tokenizes identifiers with numbers", () => {
      const tokens = tokenize("ninja2")
      expect(tokens[0].type).toBe("IDENTIFIER")
      expect(tokens[0].value).toBe("ninja2")
    })

    it("tokenizes underscore as wildcard when standalone", () => {
      const tokens = tokenize("_")
      expect(tokens[0].type).toBe("UNDERSCORE")
    })

    it("tokenizes _prefixed as identifier", () => {
      const tokens = tokenize("_private")
      expect(tokens[0].type).toBe("IDENTIFIER")
      expect(tokens[0].value).toBe("_private")
    })
  })

  describe("comments", () => {
    it("ignores line comments", () => {
      const tokens = tokenize("jutsu --- this is a comment\nx")
      expect(tokens[0].type).toBe("JUTSU")
      expect(tokens[1].type).toBe("IDENTIFIER")
      expect(tokens[1].value).toBe("x")
    })
  })

  describe("whitespace and newlines", () => {
    it("handles whitespace", () => {
      const tokens = tokenize("  jutsu   x  ")
      expect(tokens[0].type).toBe("JUTSU")
      expect(tokens[1].type).toBe("IDENTIFIER")
    })

    it("tracks line numbers", () => {
      const tokens = tokenize("jutsu\nx\ny")
      expect(tokens[0].line).toBe(1)
      expect(tokens[1].line).toBe(2)
      expect(tokens[2].line).toBe(3)
    })
  })

  describe("errors", () => {
    it("throws on unknown character", () => {
      expect(() => tokenize("@")).toThrow()
    })

    it("throws on unterminated string", () => {
      expect(() => tokenize("`hello")).toThrow(/unterminated/i)
    })
  })

  describe("complete expressions", () => {
    it("tokenizes a simple binding", () => {
      const tokens = tokenize("jutsu x = 5")
      const types = tokens.slice(0, -1).map(t => t.type)
      expect(types).toEqual(["JUTSU", "IDENTIFIER", "EQUALS", "NUMBER"])
    })

    it("tokenizes a function definition", () => {
      const tokens = tokenize("jutsu double = (x) -> x * 2")
      const types = tokens.slice(0, -1).map(t => t.type)
      expect(types).toEqual([
        "JUTSU", "IDENTIFIER", "EQUALS",
        "LPAREN", "IDENTIFIER", "RPAREN",
        "ARROW", "IDENTIFIER", "STAR", "NUMBER"
      ])
    })
  })
})
