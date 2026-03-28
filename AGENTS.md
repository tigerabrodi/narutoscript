# Agent Instructions

## After Completing Work

Every time you finish a task (writing code, fixing bugs, refactoring, etc.), you **must** run these three checks before considering the work done:

```bash
# 1. Type check — catches type errors
bun tsc

# 2. Lint — catches code quality issues
bun lint

# 3. Format — ensures consistent style
bun run format
```

Fix any errors or warnings from `bun tsc` and `bun lint` before moving on. `bun run format` auto-fixes formatting so just run it.

This is non-negotiable. Do not skip these steps.
