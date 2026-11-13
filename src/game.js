import "./world/props/register.js";
import "./app/diagnostics.js";
import { showFatalError } from "./app/diagnostics.js";
import { startGame } from "./app/runtime.js";

startGame().catch((i) => showFatalError((i && i.stack) || i));
