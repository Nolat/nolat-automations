import * as macros from "./macros.js";
import { macroUtils } from "./utils.js";
Hooks.once("cprReady", async () => {
    macroUtils.registerMacros(
        Object.entries(macros).map(([identifier, macro]) => ({ ...macro, source: "nolat-automations", identifier })),
    );
});
