import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

export const traverse = traverseModule.default ?? traverseModule;
export const projectRoot = new URL("../../", import.meta.url);

export async function sourceFiles(directory = new URL("src/", projectRoot)) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const url = new URL(entry.name, directory);
      if (entry.isDirectory())
        return sourceFiles(new URL(`${entry.name}/`, directory));
      return entry.name.endsWith(".js") ? [url] : [];
    }),
  );
  return nested.flat().sort((a, b) => a.pathname.localeCompare(b.pathname));
}

export function programPath(ast) {
  let result;
  traverse(ast, {
    Program(current) {
      result = current;
      current.stop();
    },
  });
  return result;
}

export async function readSourceGraph() {
  const files = await sourceFiles();
  const graph = new Map();
  for (const url of files) {
    const code = await readFile(url, "utf8");
    const ast = parse(code, { sourceType: "module" });
    const scope = programPath(ast).scope;
    const imports = [];
    const exports = new Set();
    for (const node of ast.program.body) {
      if (node.type === "ImportDeclaration") {
        if (!node.source.value.startsWith(".")) {
          throw new Error(
            `Unexpected runtime package import in ${url.pathname}: ${node.source.value}`,
          );
        }
        imports.push({
          target: new URL(node.source.value, url).pathname,
          names: node.specifiers.map((specifier) => {
            if (specifier.type === "ImportSpecifier")
              return specifier.imported.name;
            if (specifier.type === "ImportDefaultSpecifier") return "default";
            return "*";
          }),
        });
      } else if (node.type === "ExportNamedDeclaration") {
        for (const specifier of node.specifiers)
          exports.add(specifier.exported.name);
        if (node.declaration?.id) exports.add(node.declaration.id.name);
        for (const declaration of node.declaration?.declarations || []) {
          exports.add(declaration.id.name);
        }
      } else if (node.type === "ExportDefaultDeclaration") {
        exports.add("default");
      }
    }
    graph.set(url.pathname, { url, ast, scope, imports, exports });
  }
  return graph;
}

export function validateSourceGraph(graph) {
  for (const [file, module] of graph) {
    for (const [name, binding] of Object.entries(module.scope.bindings)) {
      if (binding.kind === "module" && binding.constantViolations.length) {
        throw new Error(`Cannot assign to imported binding ${name} in ${file}`);
      }
    }
    for (const dependency of module.imports) {
      const target = graph.get(dependency.target);
      if (!target)
        throw new Error(
          `Missing module ${dependency.target}, imported by ${file}`,
        );
      for (const name of dependency.names) {
        if (name !== "*" && !target.exports.has(name)) {
          throw new Error(
            `Missing export ${name} in ${dependency.target}, imported by ${file}`,
          );
        }
      }
    }
  }

  const visited = new Set();
  const active = new Set();
  function visit(file, stack) {
    if (active.has(file)) {
      throw new Error(
        `Circular dependency: ${[...stack, file].map((p) => path.basename(p)).join(" -> ")}`,
      );
    }
    if (visited.has(file)) return;
    active.add(file);
    for (const { target } of graph.get(file).imports)
      visit(target, [...stack, file]);
    active.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file, []);
}
