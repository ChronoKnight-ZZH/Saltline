import {
  readSourceGraph,
  validateSourceGraph,
} from "./lib/module-analysis.mjs";

const graph = await readSourceGraph();
validateSourceGraph(graph);
console.log(
  `Checked ${graph.size} JavaScript modules: syntax, named imports and acyclic dependencies`,
);
