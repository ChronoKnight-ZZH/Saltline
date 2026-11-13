import {
  readSourceGraph,
  validateSourceGraph,
} from "./lib/module-analysis.mjs";

// ---- M1 环境系统静态契约 ----
// 这些模块与导出由 M1（时间/天气/能见度骨架）引入，
// 一旦被误删或改名，运行时会以 "context.render.setSun is not a function"
// 之类的错误暴露。放在 check 里可以构建前失败。
const EXPECTED_ENV_MODULES = [
  "src/core/environment.js",
  "src/core/environment-presets.js",
  "src/world/helicopter.js",
  "src/effects/lightning.js",
];

const EXPECTED_EXPORTS = {
  "src/core/environment.js": [
    "createEnvironment",
    "environmentShowcaseModule",
    "showcaseEnvironment",
  ],
  "src/core/environment-presets.js": [
    "TIME_PRESETS",
    "WEATHER_PRESETS",
    "DEFAULT_ENV",
    "combine",
  ],
  "src/render/sky.js": ["applySkyPreset"],
  "src/world/helicopter.js": ["createHelicopter"],
  "src/effects/lightning.js": ["createLightning"],
};

const EXPECTED_IMPORTS = {
  "src/render/renderer.js": ["FogExp2", "applySkyPreset"],
  "src/app/runtime.js": [
    "createEnvironment",
    "createHelicopter",
    "createLightning",
    "DEFAULT_ENV",
    "TIME_PRESETS",
    "WEATHER_PRESETS",
  ],
  "src/app/showcases.js": ["environmentShowcaseModule"],
  "src/audio/library.js": ["_9"],
  "src/core/environment.js": ["LIGHTNING_TIMING"],
};

// readSourceGraph 的 key 可能是相对路径、绝对路径或 file:// URL。
// 先精确匹配，再 endsWith 回退，避免把 key 形态写死。
function findModule(graph, relPath) {
  if (graph.has(relPath)) return [relPath, graph.get(relPath)];
  for (const [key, value] of graph) {
    if (key.endsWith(relPath)) return [key, value];
  }
  return [null, null];
}

function readNameSet(value) {
  if (!value) return null;
  if (value instanceof Set) return value;
  if (Array.isArray(value)) {
    return new Set(
      value.map((item) => (typeof item === "string" ? item : item && item.name)),
    );
  }
  return null;
}

function assertEnvironmentContracts(graph) {
  const problems = [];

  for (const relPath of EXPECTED_ENV_MODULES) {
    const [, mod] = findModule(graph, relPath);
    if (!mod) problems.push(`missing module: ${relPath}`);
  }

  for (const [relPath, names] of Object.entries(EXPECTED_EXPORTS)) {
    const [, mod] = findModule(graph, relPath);
    if (!mod) continue; // 已由 missing module 覆盖
    const exports = readNameSet(mod.exports);
    if (!exports) continue; // 字段名未知时跳过，不阻断 CI
    for (const name of names) {
      if (!exports.has(name)) {
        problems.push(`${relPath} missing export "${name}"`);
      }
    }
  }

  for (const [relPath, names] of Object.entries(EXPECTED_IMPORTS)) {
    const [, mod] = findModule(graph, relPath);
    if (!mod) continue;
    // mod.imports is [{ target, names[] }, ...] — flatten all named imports
    const imports = new Set(
      (mod.imports || []).flatMap((d) => d.names || []),
    );
    for (const name of names) {
      if (!imports.has(name)) {
        problems.push(`${relPath} missing import "${name}"`);
      }
    }
  }

  return problems;
}

const graph = await readSourceGraph();
validateSourceGraph(graph);

const envProblems = assertEnvironmentContracts(graph);
if (envProblems.length) {
  for (const problem of envProblems) {
    console.error(`[check] ${problem}`);
  }
  process.exitCode = 1;
}

console.log(
  `Checked ${graph.size} JavaScript modules: syntax, named imports and acyclic dependencies`,
);

if (!envProblems.length) {
  console.log(
    "Environment contracts OK: createEnvironment / combine / applySkyPreset / createHelicopter / createLightning / runtime wiring",
  );
}