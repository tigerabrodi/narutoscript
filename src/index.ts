// NarutoScript - A fun programming language with anime-inspired syntax

export function run({ source }: { source: string }): void {
  console.log('NarutoScript v0.1.0')
  console.log('Source:', source)
  // TODO: Implement lexer -> parser -> interpreter pipeline
}

// CLI entry point
const args = process.argv.slice(2)
const filePath = args[0]

if (filePath === undefined) {
  console.log('NarutoScript v0.1.0')
  console.log('Usage: bun run src/index.ts <file.naru>')
} else {
  const file = Bun.file(filePath)
  const source = await file.text()
  run({ source })
}
