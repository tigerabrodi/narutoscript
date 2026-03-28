# narutoscript

To install dependencies:

```bash
bun install
```

To run a file:

```bash
bun run src/index.ts examples/hello.naru
bun run src/index.ts run examples/hello.naru
```

To start the REPL:

```bash
bun run src/index.ts
bun run src/index.ts repl
```

More examples:

```bash
bun run src/index.ts examples
bun run src/index.ts examples/ninja-power-calculator.naru
bun run src/index.ts examples/all-features.naru
```

To see CLI help:

```bash
bun run src/index.ts --help
```

Helpful REPL commands:

```text
:help
:examples
:builtins
:env
:type <expression>
:load <file>
:reset
exit
```
