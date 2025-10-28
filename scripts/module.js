import * as macros from "./macros.js";
import { macroUtils, setup } from "./utils.js";
Hooks.once("cprReady", async () => {
    setup();
    macroUtils.registerMacros(
        Object.entries(macros).map(([identifier, macro]) => ({ ...macro, source: "nolat-automations", identifier }))
    );
    await globalThis.chrisPremades.integration.acc.init();
});
