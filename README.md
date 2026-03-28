# NarutoScript

NarutoScript is a small programming language with anime flavored syntax.
It now has a real lexer. parser. interpreter. CLI. REPL. examples. and release workflow.

If you want the full language details. read [SPECIFICATION.md](/Users/tigerabrodi/Desktop/narutoscript/SPECIFICATION.md).

## 1. Get NarutoScript

### Option A. Download a release binary

When you publish a tag like `v0.1.0`. the release workflow builds compiled binaries for these targets.

- Linux x64
- Linux arm64
- macOS x64
- macOS arm64
- Windows x64

Each release archive includes the `narutoscript` binary. this README. and the example `.naru` programs.

Basic install flow on macOS or Linux.

```bash
tar -xzf narutoscript-v0.1.0-linux-x64.tar.gz
chmod +x narutoscript
./narutoscript --help
```

Basic install flow on Windows.

```powershell
Expand-Archive narutoscript-v0.1.0-windows-x64.zip
.\narutoscript.exe --help
```

### Option B. Run from source with Bun

```bash
bun install
bun run src/index.ts --help
```

## 2. Run something immediately

Run the hello world example.

```bash
bun run src/index.ts examples/hello.naru
```

Or with the explicit command form.

```bash
bun run src/index.ts run examples/hello.naru
```

List the bundled example programs.

```bash
bun run src/index.ts examples
```

## 3. Start the REPL

```bash
bun run src/index.ts
```

Or.

```bash
bun run src/index.ts repl
```

Useful REPL commands.

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

Simple REPL session.

```text
naru> jutsu name = `Naruto`
naru> say(`Hello {name}`)
Hello Naruto
naru> :type [1, 2, 3]
list
```

## 4. Write your first file

Create a file named `hello.naru`.

```text
say(`Believe it`)

jutsu name = `Naruto`
say(`Welcome, {name}!`)
```

Run it.

```bash
bun run src/index.ts hello.naru
```

## 5. Learn the language in order

### Comments

```text
--- This is a comment
```

### Values

```text
42
3.14
`hello`
true
false
poof
```

### Bindings

Use `jutsu` to bind a value.

```text
jutsu name = `Naruto`
jutsu age = 16
```

Bindings are immutable. shadowing creates a new binding.

```text
jutsu power = 9000
jutsu power = power + 1
```

### Strings and interpolation

Strings use backticks.

```text
jutsu village = `Leaf`
jutsu line = `Welcome to {village}`
```

### Functions

Single expression.

```text
jutsu double = (x) -> x * 2
```

Block body.

```text
jutsu process = (x) -> {
  jutsu doubled = x * 2
  doubled + 1
}
```

Early return.

```text
jutsu safe = (n) -> {
  when n < 0 {
    dattebayo defeat(`negative`)
  }
  dattebayo victory(n)
}
```

### Lists

```text
jutsu numbers = [1, 2, 3]
jutsu empty = []
```

### Objects

```text
jutsu ninja = {
  name: `Naruto`,
  power: 9000
}

say(ninja.name)

jutsu stronger = { ...ninja, power: 9001 }
```

### Conditionals

```text
when true {
  say(`yes`)
} otherwise {
  say(`no`)
}
```

### Loops

```text
train n in [1, 2, 3] {
  say(n)
}
```

### Pattern matching

Use `read` to match values.

```text
read victory(42) {
  victory(n) -> say(`Answer {n}`)
  defeat(reason) -> say(`Error {reason}`)
}
```

### Results

```text
victory(`ok`)
defeat(`bad`)
```

## 6. Builtin functions

### `say(value) -> poof`

Print a value.

```text
say(`Hello`)
```

### `clone(list, fn) -> list`

Map over a list.

```text
clone([1, 2, 3], (n) -> n * 2)
```

### `pick(list, fn) -> list`

Filter a list.

```text
pick([1, 2, 3, 4], (n) -> n % 2 == 0)
```

### `combine(list, fn, initial) -> value`

Reduce a list.

```text
combine([1, 2, 3], (acc, n) -> acc + n, 0)
```

### `length(list) -> number`

```text
length([1, 2, 3])
```

### `type(value) -> string`

```text
type(42)
type(`Naruto`)
type([1, 2, 3])
```

## 7. CLI reference

Packaged command form.

```bash
narutoscript <file>
narutoscript run <file>
narutoscript repl
narutoscript examples
narutoscript --help
```

Bun form.

```bash
bun run src/index.ts <file>
bun run src/index.ts run <file>
bun run src/index.ts repl
bun run src/index.ts examples
bun run src/index.ts --help
```

## 8. Example programs

Included examples.

- `examples/hello.naru`
- `examples/ninja-power-calculator.naru`
- `examples/all-features.naru`

Try them.

```bash
bun run src/index.ts examples/hello.naru
bun run src/index.ts examples/ninja-power-calculator.naru
bun run src/index.ts examples/all-features.naru
```

## 9. Release workflow

The GitHub workflow at `.github/workflows/release.yml` does this.

1. Runs `bun ci`
2. Runs `bun tsc`
3. Runs `bun lint`
4. Runs `bun test`
5. Compiles standalone binaries with `bun build --compile`
6. Packages archives and checksums
7. Publishes them to a GitHub release for version tags like `v0.1.0`

## 10. Local development

Install dependencies.

```bash
bun install
```

Run the full check loop.

```bash
bun run format
bun tsc
bun lint
bun test
```

Build a local compiled binary for your current machine.

```bash
bun run build:compile
./dist/narutoscript --help
```
