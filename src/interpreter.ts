import type {
  BinaryExpr,
  Block,
  Expression,
  Program,
  Statement,
  UnaryExpr,
} from "./ast";
import { parse } from "./parser";

export type Value =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "poof" }
  | { type: "list"; value: Value[] }
  | { type: "object"; value: Map<string, Value> }
  | {
      type: "function";
      params: string[];
      body: Expression | Block;
      closure: Environment;
    }
  | { type: "victory"; value: Value }
  | { type: "defeat"; value: Value };

const POOF: Value = { type: "poof" };

class ReturnSignal {
  constructor(readonly value: Value) {}
}

export class Environment {
  constructor(
    private readonly parent: Environment | null = null,
    private readonly bindings: Map<string, Value> = new Map(),
  ) {}

  child(): Environment {
    return new Environment(this);
  }

  define(name: string, value: Value): Environment {
    // Each binding creates a new frame so closures keep the environment they saw.
    return new Environment(this, new Map([[name, value]]));
  }

  lookup(name: string): Value {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!;
    }

    if (this.parent) {
      return this.parent.lookup(name);
    }

    throw new Error(`Undefined variable '${name}'`);
  }
}

type EvalResult = {
  value: Value;
  env: Environment;
};

export function interpret({ source }: { source: string }): Value {
  const program = parse({ source });
  return evaluateProgram(program);
}

export function evaluateProgram(
  program: Program,
  env: Environment = new Environment(),
): Value {
  try {
    return evaluateStatements(program.body, env).value;
  } catch (error) {
    if (error instanceof ReturnSignal) {
      return error.value;
    }

    throw error;
  }
}

function evaluateStatements(
  statements: Statement[],
  env: Environment,
): EvalResult {
  let currentEnv = env;
  let lastValue = POOF;

  for (const statement of statements) {
    const result = evaluateStatement(statement, currentEnv);
    currentEnv = result.env;
    lastValue = result.value;
  }

  return {
    value: lastValue,
    env: currentEnv,
  };
}

function evaluateStatement(statement: Statement, env: Environment): EvalResult {
  switch (statement.type) {
    case "JutsuBinding": {
      const value = evaluateExpression(statement.value, env);
      return {
        value,
        env: env.define(statement.name.name, value),
      };
    }
    case "DattebayoStatement": {
      const value = evaluateExpression(statement.value, env);
      throw new ReturnSignal(value);
    }
    default: {
      return {
        value: evaluateExpression(statement, env),
        env,
      };
    }
  }
}

function evaluateExpression(expression: Expression, env: Environment): Value {
  switch (expression.type) {
    case "NumberLiteral":
      return {
        type: "number",
        value: expression.value,
      };
    case "StringLiteral":
      return {
        type: "string",
        value: expression.value,
      };
    case "BooleanLiteral":
      return {
        type: "boolean",
        value: expression.value,
      };
    case "PoofLiteral":
      return POOF;
    case "Identifier":
      return env.lookup(expression.name);
    case "UnaryExpr":
      return evaluateUnaryExpr(expression, env);
    case "BinaryExpr":
      return evaluateBinaryExpr(expression, env);
    case "FunctionExpr":
      return {
        type: "function",
        params: expression.params.map((param) => param.name),
        body: expression.body,
        closure: env,
      };
    case "FunctionCall":
      return evaluateFunctionCall(expression, env);
    case "Block":
      return evaluateBlock(expression, env);
    case "VictoryExpr":
      return {
        type: "victory",
        value: evaluateExpression(expression.value, env),
      };
    case "DefeatExpr":
      return {
        type: "defeat",
        value: evaluateExpression(expression.value, env),
      };
    case "ListLiteral":
    case "ObjectLiteral":
    case "PropertyAccess":
    case "WhenExpr":
    case "TrainLoop":
    case "ReadExpr":
      throw new Error(
        `Runtime feature not implemented yet: ${expression.type}`,
      );
    default:
      return assertNever(expression);
  }
}

function evaluateUnaryExpr(expression: UnaryExpr, env: Environment): Value {
  const argument = evaluateExpression(expression.argument, env);

  switch (expression.operator) {
    case "nani":
      return booleanValue(!expectBoolean(argument, "nani"));
    default:
      throw new Error(`Unsupported unary operator '${expression.operator}'`);
  }
}

function evaluateBinaryExpr(expression: BinaryExpr, env: Environment): Value {
  if (expression.operator === "and") {
    const left = evaluateExpression(expression.left, env);
    const leftValue = expectBoolean(left, "and");

    if (!leftValue) {
      return booleanValue(false);
    }

    const right = evaluateExpression(expression.right, env);
    return booleanValue(expectBoolean(right, "and"));
  }

  if (expression.operator === "or") {
    const left = evaluateExpression(expression.left, env);
    const leftValue = expectBoolean(left, "or");

    if (leftValue) {
      return booleanValue(true);
    }

    const right = evaluateExpression(expression.right, env);
    return booleanValue(expectBoolean(right, "or"));
  }

  const left = evaluateExpression(expression.left, env);
  const right = evaluateExpression(expression.right, env);

  switch (expression.operator) {
    case "+":
      return numberValue(expectNumber(left, "+") + expectNumber(right, "+"));
    case "-":
      return numberValue(expectNumber(left, "-") - expectNumber(right, "-"));
    case "*":
      return numberValue(expectNumber(left, "*") * expectNumber(right, "*"));
    case "/":
      return numberValue(expectNumber(left, "/") / expectNumber(right, "/"));
    case "%":
      return numberValue(expectNumber(left, "%") % expectNumber(right, "%"));
    case "<":
      return booleanValue(expectNumber(left, "<") < expectNumber(right, "<"));
    case ">":
      return booleanValue(expectNumber(left, ">") > expectNumber(right, ">"));
    case "<=":
      return booleanValue(
        expectNumber(left, "<=") <= expectNumber(right, "<="),
      );
    case ">=":
      return booleanValue(
        expectNumber(left, ">=") >= expectNumber(right, ">="),
      );
    case "==":
      return booleanValue(isEqual(left, right));
    case "!=":
      return booleanValue(!isEqual(left, right));
    default:
      throw new Error(`Unsupported binary operator '${expression.operator}'`);
  }
}

function evaluateFunctionCall(
  expression: Extract<Expression, { type: "FunctionCall" }>,
  env: Environment,
): Value {
  const callee = evaluateExpression(expression.callee, env);

  if (callee.type !== "function") {
    throw new Error(
      "Can only call functions. Tried to call a non-function value",
    );
  }

  const args = expression.args.map((arg) => evaluateExpression(arg, env));

  if (args.length !== callee.params.length) {
    throw new Error(
      `Expected ${callee.params.length} arguments but got ${args.length}`,
    );
  }

  let callEnv = callee.closure.child();

  for (let index = 0; index < callee.params.length; index += 1) {
    callEnv = callEnv.define(callee.params[index]!, args[index]!);
  }

  try {
    if (callee.body.type === "Block") {
      return evaluateBlock(callee.body, callEnv);
    }

    return evaluateExpression(callee.body, callEnv);
  } catch (error) {
    if (error instanceof ReturnSignal) {
      return error.value;
    }

    throw error;
  }
}

function evaluateBlock(block: Block, env: Environment): Value {
  return evaluateStatements(block.body, env.child()).value;
}

function numberValue(value: number): Value {
  return {
    type: "number",
    value,
  };
}

function booleanValue(value: boolean): Value {
  return {
    type: "boolean",
    value,
  };
}

function expectNumber(value: Value, operator: string): number {
  if (value.type !== "number") {
    throw new Error(`Operator '${operator}' expects numbers`);
  }

  return value.value;
}

function expectBoolean(value: Value, operator: string): boolean {
  if (value.type !== "boolean") {
    throw new Error(`Operator '${operator}' expects booleans`);
  }

  return value.value;
}

function isEqual(left: Value, right: Value): boolean {
  if (left.type !== right.type) {
    return false;
  }

  switch (left.type) {
    case "number":
    case "string":
    case "boolean":
      return left.value === right.value;
    case "poof":
      return true;
    case "list":
      return (
        left.value.length === right.value.length &&
        left.value.every((item, index) => isEqual(item, right.value[index]!))
      );
    case "object": {
      if (left.value.size !== right.value.size) {
        return false;
      }

      for (const [key, value] of left.value.entries()) {
        const otherValue = right.value.get(key);

        if (!otherValue || !isEqual(value, otherValue)) {
          return false;
        }
      }

      return true;
    }
    case "victory":
    case "defeat":
      return isEqual(left.value, right.value);
    case "function":
      return left === right;
    default:
      return assertNever(left);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected node: ${JSON.stringify(value)}`);
}
