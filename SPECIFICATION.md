# NarutoScript Language Specification v0.1

## Overview

NarutoScript is a dynamically-typed, functional-ish programming language with anime-inspired syntax. It prioritizes immutability, first-class functions, and pattern matching while remaining readable and approachable.

## Design Principles

- Immutable by default, no reassignment
- First-class functions with closures
- Pattern matching as primary control flow for complex logic
- Readable as code, but with anime flavor
- Fun first, practical second

---

## Syntax Reference

### Comments

```
--- This is a comment
--- Comments start with three dashes
```

### Bindings

The `jutsu` keyword binds a value to a name. Bindings are immutable.

```
jutsu name = "Naruto"
jutsu age = 16
jutsu pi = 3.14159
jutsu active = true
jutsu nothing = poof
```

Shadowing is allowed (rebinding the same name creates a new binding):

```
jutsu x = 5
jutsu x = x + 1  --- x is now 6, original x is shadowed
```

Reassignment is NOT allowed:

```
jutsu x = 5
x = 10  --- ERROR: cannot reassign
```

### Data Types

| Type     | Examples                            | Notes                             |
| -------- | ----------------------------------- | --------------------------------- |
| Number   | `42`, `3.14`, `-10`                 | All numbers are floats internally |
| String   | `` `hello` ``, `` `Hello {name}` `` | Backticks, with interpolation     |
| Boolean  | `true`, `false`                     |                                   |
| Nothing  | `poof`                              | Represents absence of value       |
| List     | `[1, 2, 3]`, `[]`                   | Ordered collection                |
| Object   | `{ name: "Naruto", age: 16 }`       | Key-value pairs                   |
| Function | `(x) -> x * 2`                      | First-class, closures supported   |
| Result   | `victory(value)`, `defeat(reason)`  | For error handling                |

### Strings and Interpolation

Strings use backticks and support interpolation with `{expression}`:

```
jutsu name = "Naruto"
jutsu greeting = `Hello, {name}!`
jutsu math = `Two plus two is {2 + 2}`
```

### Operators

#### Arithmetic

| Operator | Description    |
| -------- | -------------- |
| `+`      | Addition       |
| `-`      | Subtraction    |
| `*`      | Multiplication |
| `/`      | Division       |

#### Comparison

| Operator | Description           |
| -------- | --------------------- |
| `==`     | Equal                 |
| `!=`     | Not equal             |
| `<`      | Less than             |
| `>`      | Greater than          |
| `<=`     | Less than or equal    |
| `>=`     | Greater than or equal |

#### Logical

| Operator | Description | Example   |
| -------- | ----------- | --------- |
| `and`    | Logical AND | `a and b` |
| `or`     | Logical OR  | `a or b`  |
| `nani`   | Logical NOT | `nani a`  |

```
when hungry also tired {
  rest()
}

when nani defeated {
  celebrate()
}

when sunny either warm {
  goOutside()
}
```

### Functions

Functions are defined with arrow syntax and are first-class values.

Single expression (implicit return):

```
jutsu double = (x) -> x * 2
jutsu add = (x, y) -> x + y
jutsu greet = () -> say(`Hello!`)
```

Multi-line with block (last expression is return value):

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
    dattebayo defeat("cannot divide by zero")
  }
  dattebayo victory(a / b)
}
```

### Function Calls

```
jutsu result = double(5)
jutsu sum = add(1, 2)
say(`The sum is {sum}`)
```

### Objects

Simple key-value data structures:

```
jutsu ninja = {
  name: "Naruto",
  village: "Konoha",
  power: 9000
}
```

Dot access for properties:

```
say(ninja.name)
say(ninja.power)
```

Spread operator for copying with modifications:

```
jutsu stronger = { ...ninja, power: 9001 }
jutsu detailed = { ...ninja, rank: "Hokage", age: 27 }
```

### Lists

Ordered collections:

```
jutsu numbers = [1, 2, 3, 4, 5]
jutsu empty = []
jutsu mixed = [1, "two", true, poof]
jutsu nested = [[1, 2], [3, 4]]
```

### Conditionals

Use `when` and `otherwise`:

```
when power > 9000 {
  say("Incredible power!")
}

when hungry {
  eat()
} otherwise {
  train()
}
```

Conditions can use logical operators:

```
when strong also fast {
  win()
}

when nani ready {
  prepare()
}
```

### Loops

Use `train` for iteration (for-each style):

```
jutsu names = ["Naruto", "Sasuke", "Sakura"]

train name in names {
  say(`Hello {name}`)
}

train i in [1, 2, 3, 4, 5] {
  say(i * 2)
}
```

### Error Handling

Results are either `victory(value)` or `defeat(reason)`:

```
jutsu safeDivide = (a, b) -> {
  when b == 0 {
    dattebayo defeat("cannot divide by zero")
  }
  dattebayo victory(a / b)
}

jutsu parseNumber = (str) -> {
  --- parsing logic here
  when valid {
    dattebayo victory(num)
  }
  dattebayo defeat("invalid number format")
}
```

### Pattern Matching

The `read` expression matches values against patterns:

```
read value {
  pattern -> result
  pattern when guard -> result
  _ -> default
}
```

#### Matching Literals

```
jutsu describe = (n) -> {
  read n {
    0 -> "zero"
    1 -> "one"
    2 -> "two"
    _ -> "many"
  }
}
```

#### Matching with Variable Binding

```
read x {
  0 -> "nothing"
  n -> `got {n}`
}
```

#### Matching with Guards

```
read age {
  n when n < 13 -> "child"
  n when n < 20 -> "teenager"
  n when n < 65 -> "adult"
  _ -> "senior"
}
```

#### Matching Results

```
jutsu result = safeDivide(10, 2)

read result {
  victory(n) -> say(`Answer: {n}`)
  defeat(e) -> say(`Error: {e}`)
}
```

#### Matching Objects

```
read ninja {
  { rank: "Hokage" } -> "Leader of the village"
  { village: "Konoha" } -> "Leaf ninja"
  { village: "Suna" } -> "Sand ninja"
  _ -> "Unknown origin"
}
```

#### Matching Lists

```
read myList {
  [] -> "empty list"
  [single] -> `just one: {single}`
  [first, second] -> `two items: {first} and {second}`
  [head, ...tail] -> `starts with {head}, {length(tail)} more`
}
```

---

## Builtin Functions

| Function  | Signature                             | Description                 |
| --------- | ------------------------------------- | --------------------------- |
| `say`     | `say(value) -> poof`                  | Print value to output       |
| `clone`   | `clone(list, fn) -> list`             | Map function over list      |
| `pick`    | `pick(list, fn) -> list`              | Filter list by predicate    |
| `combine` | `combine(list, fn, initial) -> value` | Reduce list to single value |
| `length`  | `length(list) -> number`              | Get list length             |
| `type`    | `type(value) -> string`               | Get type as string          |

### Examples

```
jutsu numbers = [1, 2, 3, 4, 5]

--- Map: double each number
jutsu doubled = clone(numbers, (n) -> n * 2)
--- Result: [2, 4, 6, 8, 10]

--- Filter: keep even numbers
jutsu evens = pick(numbers, (n) -> n % 2 == 0)
--- Result: [2, 4]

--- Reduce: sum all numbers
jutsu sum = combine(numbers, (acc, n) -> acc + n, 0)
--- Result: 15

--- Length
say(length(numbers))
--- Output: 5

--- Type checking
say(type(42))        --- "number"
say(type("hello"))   --- "string"
say(type([1,2,3]))   --- "list"
say(type(poof))      --- "poof"
```

---

## Complete Example Program

```
--- NarutoScript Example: Ninja Power Calculator

jutsu warriors = [
  { name: "Naruto", village: "Konoha", power: 9000 },
  { name: "Sasuke", village: "Konoha", power: 8500 },
  { name: "Gaara", village: "Suna", power: 7500 },
  { name: "Sakura", village: "Konoha", power: 7000 }
]

--- Get all power levels
jutsu powers = clone(warriors, (w) -> w.power)

--- Calculate total power
jutsu totalPower = combine(powers, (a, b) -> a + b, 0)

say(`Total power of all warriors: {totalPower}`)

--- Find strong warriors
jutsu strongWarriors = pick(warriors, (w) -> w.power > 7500)

say(`Warriors over 7500 power:`)
train warrior in strongWarriors {
  say(`  - {warrior.name}: {warrior.power}`)
}

--- Categorize each warrior
train warrior in warriors {
  jutsu category = read warrior.power {
    p when p > 8500 -> "Legendary"
    p when p > 7500 -> "Elite"
    p when p > 6000 -> "Strong"
    _ -> "Developing"
  }
  say(`{warrior.name} is {category}`)
}

--- Safe division example
jutsu safeDivide = (a, b) -> {
  when b == 0 {
    dattebayo defeat("cannot divide by zero")
  }
  dattebayo victory(a / b)
}

jutsu averagePower = safeDivide(totalPower, length(warriors))

read averagePower {
  victory(avg) -> say(`Average power: {avg}`)
  defeat(err) -> say(`Error: {err}`)
}
```

---

## Reserved Keywords

```
jutsu, when, otherwise, train, in, dattebayo, read,
victory, defeat, and, or, nani, true, false, poof
```

## File Extension

`.naru`
