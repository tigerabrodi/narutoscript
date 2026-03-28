# NarutoScript

A programming language for Naruto fans. Anime-flavored syntax, immutable bindings, first-class functions, pattern matching.

```
jutsu name = `Naruto`
say(`Believe it, {name}!`)
```

## Install

```bash
npm install -g narutoscript
```

Or run without installing:

```bash
npx narutoscript examples/hello.naru
```

## Quick start

### Run a file

```bash
narutoscript hello.naru
```

### Start the REPL

```bash
narutoscript
```

```
NarutoScript v0.1.0 REPL
Type :help for REPL commands. Type exit to quit.
naru> jutsu name = `Naruto`
naru> say(`Hello {name}`)
Hello Naruto
naru> jutsu numbers = [1, 2, 3]
naru> clone(numbers, (n) -> n * 2)
[2, 4, 6]
naru> :type numbers
list
naru> exit
```

### REPL commands

| Command        | What it does                           |
| -------------- | -------------------------------------- |
| `:help`        | Show help text                         |
| `:examples`    | List bundled example programs          |
| `:builtins`    | List all builtin functions             |
| `:env`         | Show current user bindings             |
| `:type <expr>` | Show the runtime type of an expression |
| `:load <file>` | Load a `.naru` file into the session   |
| `:reset`       | Clear all bindings and start fresh     |
| `exit`         | Leave the REPL                         |

## Learn the language

### Comments

```
--- This is a comment
--- Comments start with three dashes
```

### Values

| Type     | Example                             |
| -------- | ----------------------------------- |
| Number   | `42`, `3.14`                        |
| String   | `` `hello` ``, `` `Hello {name}` `` |
| Boolean  | `true`, `false`                     |
| Nothing  | `poof`                              |
| List     | `[1, 2, 3]`                         |
| Object   | `{ name: `Naruto`, power: 9000 }`   |
| Function | `(x) -> x * 2`                      |
| Result   | `victory(value)`, `defeat(reason)`  |

### Bindings

`jutsu` binds a value to a name. Bindings are immutable.

```
jutsu name = `Naruto`
jutsu age = 16
jutsu nothing = poof
```

Shadowing is allowed (rebinding creates a new binding):

```
jutsu x = 5
jutsu x = x + 1  --- x is now 6
```

### Strings and interpolation

Strings use backticks and support `{expression}` interpolation:

```
jutsu village = `Konoha`
jutsu greeting = `Welcome to {village}!`
jutsu math = `Two plus two is {2 + 2}`
```

### Functions

Single expression (implicit return):

```
jutsu double = (x) -> x * 2
jutsu add = (x, y) -> x + y
```

Block body (last expression is the return value):

```
jutsu process = (x) -> {
  jutsu doubled = x * 2
  jutsu tripled = x * 3
  doubled + tripled
}
```

Early return with `dattebayo`:

```
jutsu safeDivide = (a, b) -> {
  when b == 0 {
    dattebayo defeat(`cannot divide by zero`)
  }
  dattebayo victory(a / b)
}
```

### Lists

```
jutsu numbers = [1, 2, 3, 4, 5]
jutsu empty = []
jutsu nested = [[1, 2], [3, 4]]
```

### Objects

```
jutsu ninja = {
  name: `Naruto`,
  village: `Konoha`,
  power: 9000
}

say(ninja.name)

--- Copy with modifications using spread
jutsu stronger = { ...ninja, power: 9001 }
```

### Conditionals

```
when power > 9000 {
  say(`Incredible power!`)
}

when hungry {
  eat()
} otherwise {
  train()
}
```

Logical operators: `and`, `or`, `nani` (not)

```
when strong and fast {
  win()
}

when nani ready {
  prepare()
}
```

### Loops

`train` iterates over a list:

```
jutsu names = [`Naruto`, `Sasuke`, `Sakura`]

train name in names {
  say(`Hello {name}`)
}
```

### Pattern matching

`read` matches values against patterns:

```
--- Match literals
read age {
  0 -> `baby`
  _ -> `not a baby`
}

--- Match with guards
read power {
  p when p > 8500 -> `Legendary`
  p when p > 7500 -> `Elite`
  p when p > 6000 -> `Strong`
  _ -> `Developing`
}

--- Match results
jutsu result = safeDivide(10, 2)

read result {
  victory(n) -> say(`Answer: {n}`)
  defeat(e) -> say(`Error: {e}`)
}

--- Match objects
read ninja {
  { rank: `Hokage` } -> `Leader of the village`
  { village: `Konoha` } -> `Leaf ninja`
  _ -> `Unknown`
}

--- Match lists
read myList {
  [] -> `empty`
  [single] -> `just one`
  [head, ...tail] -> `starts with {head}`
}
```

### Error handling with Results

Functions return `victory(value)` or `defeat(reason)` instead of throwing:

```
jutsu safeDivide = (a, b) -> {
  when b == 0 {
    dattebayo defeat(`cannot divide by zero`)
  }
  dattebayo victory(a / b)
}

read safeDivide(10, 0) {
  victory(n) -> say(`Got {n}`)
  defeat(err) -> say(`Error: {err}`)
}
```

## Builtin functions

| Function  | Signature                             | Description        |
| --------- | ------------------------------------- | ------------------ |
| `say`     | `say(value) -> poof`                  | Print a value      |
| `clone`   | `clone(list, fn) -> list`             | Map over a list    |
| `pick`    | `pick(list, fn) -> list`              | Filter a list      |
| `combine` | `combine(list, fn, initial) -> value` | Reduce a list      |
| `length`  | `length(list) -> number`              | Get list length    |
| `type`    | `type(value) -> string`               | Get type as string |

```
jutsu numbers = [1, 2, 3, 4, 5]

jutsu doubled = clone(numbers, (n) -> n * 2)
--- [2, 4, 6, 8, 10]

jutsu evens = pick(numbers, (n) -> n % 2 == 0)
--- [2, 4]

jutsu sum = combine(numbers, (acc, n) -> acc + n, 0)
--- 15

say(length(numbers))
--- 5

say(type(42))
--- number
```

## Keywords

```
jutsu, when, otherwise, train, in, dattebayo, read,
victory, defeat, and, or, nani, true, false, poof
```

## CLI reference

```
narutoscript <file>           Run a .naru file
narutoscript run <file>       Run a .naru file (explicit)
narutoscript repl             Start the REPL
narutoscript examples         List bundled examples
narutoscript --help           Show help
narutoscript --version        Show version
```

## Example programs

Three examples are bundled:

**hello.naru** — Hello world

```
--- Hello World in NarutoScript

jutsu message = `Hello, NarutoScript!`
say(message)

jutsu name = `Naruto`
say(`Welcome, {name}!`)
```

**ninja-power-calculator.naru** — Lists, objects, reduce

```
jutsu ninjas = [
  { name: `Naruto`, power: 9000 },
  { name: `Sasuke`, power: 8500 },
  { name: `Sakura`, power: 7800 }
]

jutsu totalPower = combine(ninjas, (acc, ninja) -> acc + ninja.power, 0)
say(`Total power is {totalPower}`)
```

**all-features.naru** — Spread, map, filter, pattern matching, loops

```
jutsu warriors = [
  { name: `Naruto`, power: 9000 },
  { name: `Sakura`, power: 7800 },
  { name: `Konohamaru`, power: 4200 }
]

jutsu boosted = clone(warriors, (warrior) -> {
  { ...warrior, power: warrior.power + 500 }
})

jutsu elites = pick(boosted, (warrior) -> warrior.power >= 8000)

jutsu classify = (warrior) -> when warrior.power >= 9500 {
  victory({ name: warrior.name, label: `legendary` })
} otherwise {
  defeat({ name: warrior.name, label: `rising` })
}

say(`Elite count {length(elites)}`)

train warrior in elites {
  read classify(warrior) {
    victory({ name: name, label: label }) -> say(`{name} is {label}`)
    defeat({ name: name, label: label }) -> say(`{name} is {label}`)
  }
}

say(`Elite total {combine(elites, (acc, warrior) -> acc + warrior.power, 0)}`)
```

## Development

```bash
bun install
bun test
bun tsc
bun lint
bun run format
```

Full development plan and phase breakdown in [DEVELOPMENT.md](./DEVELOPMENT.md).
Language specification in [SPECIFICATION.md](SPECIFICATION.md).
