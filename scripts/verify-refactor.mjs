import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parse } from "@babel/parser";
import prettier from "prettier";
import {
  projectRoot,
  programPath,
  readSourceGraph,
  traverse,
  validateSourceGraph,
} from "./lib/module-analysis.mjs";

// This optional migration audit compares the current modules with the immutable
// published game. Normal development checks intentionally do not freeze gameplay.
const map = JSON.parse(
  await readFile(new URL("scripts/refactor-map.json", projectRoot), "utf8"),
);
const originalHTML = await readFile(
  new URL(map.originalArchive, projectRoot),
  "utf8",
);
const originalCode = originalHTML.match(/<script>\n?([\s\S]*?)<\/script>/)[1];
// Use the same formatter as the initial restoration: it makes dangling-else
// braces explicit without changing behavior, before comparing syntax trees.
const originalAST = parse(
  await prettier.format(originalCode, { parser: "babel" }),
);
const originalRoot = programPath(originalAST).get("body.0.expression.callee");
assert(originalRoot.isArrowFunctionExpression());
originalRoot.node.body.body = originalRoot.node.body.body.flatMap((node) =>
  node.type === "VariableDeclaration"
    ? node.declarations.map((declaration) => ({
        ...node,
        declarations: [declaration],
      }))
    : [node],
);
originalRoot.scope.crawl();
const originalGlobals = new Set(
  Object.keys(programPath(originalAST).scope.globals),
);
const graph = await readSourceGraph();
validateSourceGraph(graph);
const reverseAliases = Object.fromEntries(
  Object.entries(map.rootAliases).map(([original, readable]) => [
    readable,
    original,
  ]),
);

function normalizeBindings(container, rootScope, aliases) {
  const locals = new Map();
  function statementOf(current) {
    while (current.parentPath && current.parentPath.node !== container.node)
      current = current.parentPath;
    return current.node;
  }
  container.traverse({
    ImportDeclaration(current) {
      current.skip();
    },
    ExportNamedDeclaration(current) {
      current.skip();
    },
    Identifier(current) {
      // Property names are observable data, even when the source used shorthand.
      if (current.key === "key" && !current.parent.computed) return;
      if (current.key === "property" && !current.parent.computed) return;
      if (!current.isReferencedIdentifier() && !current.isBindingIdentifier())
        return;
      const binding = current.scope.getBinding(current.node.name);
      if (!binding) return;
      if (binding.scope === rootScope) {
        current.node.name = `$root$${aliases[current.node.name] || current.node.name}`;
      } else {
        const statement = statementOf(current);
        if (!locals.has(statement)) locals.set(statement, new Map());
        const names = locals.get(statement);
        if (!names.has(binding)) names.set(binding, `$local$${names.size}`);
        current.node.name = names.get(binding);
      }
    },
  });
}

const ignoredFields = new Set([
  "start",
  "end",
  "loc",
  "extra",
  "leadingComments",
  "innerComments",
  "trailingComments",
  "comments",
  "tokens",
  "shorthand",
]);
function semanticTree(value) {
  if (Array.isArray(value)) return value.map(semanticTree);
  if (!value || typeof value !== "object") return value;
  // Babel may wrap a nested if in an otherwise empty scope to make dangling
  // else ownership explicit. That wrapper introduces no declarations or logic.
  if (
    value.type === "BlockStatement" &&
    value.body.length === 1 &&
    value.body[0].type === "IfStatement" &&
    !value.directives?.length
  ) {
    return semanticTree(value.body[0]);
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !ignoredFields.has(key))
      .map(([key, child]) => [key, semanticTree(child)]),
  );
}
function digest(value) {
  // Sort object keys so parser bookkeeping insertion order has no effect.
  const stable = (item) =>
    Array.isArray(item)
      ? item.map(stable)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, stable(item[key])]),
          )
        : item;
  return createHash("sha256")
    .update(JSON.stringify(stable(semanticTree(value))))
    .digest("hex");
}

function firstDifference(actual, expected, location = "statement") {
  if (Object.is(actual, expected)) return null;
  if (
    !actual ||
    !expected ||
    typeof actual !== "object" ||
    typeof expected !== "object"
  ) {
    return { location, actual, expected };
  }
  for (const key of new Set([
    ...Object.keys(actual),
    ...Object.keys(expected),
  ])) {
    const result = firstDifference(
      actual[key],
      expected[key],
      `${location}.${key}`,
    );
    if (result) return result;
  }
  return null;
}

normalizeBindings(originalRoot.get("body"), originalRoot.scope, {});
const originalStatements = originalRoot.node.body.body;
const covered = new Set();
const report = [];
for (const { file, statements } of map.modules) {
  const url = new URL(`src/${file}`, projectRoot);
  const module = graph.get(url.pathname);
  assert(module, `Missing refactored module ${file}`);
  for (const global of Object.keys(module.scope.globals)) {
    assert(
      originalGlobals.has(global),
      `New unresolved reference ${global} in ${file}`,
    );
  }
  const program = programPath(module.ast);
  normalizeBindings(program, program.scope, reverseAliases);
  const actual = program.node.body.filter(
    (node) =>
      !["ImportDeclaration", "ExportNamedDeclaration"].includes(node.type),
  );
  assert.equal(
    actual.length,
    statements.length,
    `Statement count changed in ${file}`,
  );
  for (const [index, originalIndex] of statements.entries()) {
    assert(
      !covered.has(originalIndex),
      `Original statement ${originalIndex} was duplicated`,
    );
    covered.add(originalIndex);
    assert.equal(
      digest(actual[index]),
      digest(originalStatements[originalIndex]),
      `Logic changed in ${file}, original statement ${originalIndex}: ${JSON.stringify(firstDifference(semanticTree(actual[index]), semanticTree(originalStatements[originalIndex])))}`,
    );
  }
  report.push({ file, statements: actual.length });
}
assert.equal(
  covered.size,
  originalStatements.length,
  "Some original game code was omitted",
);
assert.equal(
  graph.size,
  map.modules.length,
  "Untracked runtime modules were added",
);
console.log(
  `Verified ${covered.size} original statements across ${report.length} modules`,
);
console.log(
  "Expressions, constants, shader/template strings and lexical bindings match the archive",
);
console.log(
  "All imports resolve; no circular dependencies or new unresolved references",
);
if (process.argv.includes("--report")) {
  await writeFile(
    new URL("docs/refactor-structure.json", projectRoot),
    JSON.stringify(
      {
        originalStatements: covered.size,
        modules: report,
        result:
          "equivalent after module boundaries and scoped identifier renaming",
      },
      null,
      2,
    ) + "\n",
  );
}
