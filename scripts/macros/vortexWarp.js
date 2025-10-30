import { animationUtils, itemUtils, workflowUtils, Teleport } from "../utils.js";

async function use({ trigger, workflow }) {
    let animation = animationUtils.jb2aCheck() === "patreon" ? "vortexWarp" : "mistyStep";
    if (!workflow.failedSaves.size) return;

    let range = 27 + 9 * (workflowUtils.getCastLevel(workflow) - 2);
    for (let i of workflow.failedSaves) {
        await Teleport.target([i], workflow.token, { range: range, animation: animation });
    }
}

export let vortexWarp = {
    name: "Vortex de distortion",
    version: "1.0.0",
    hasAnimation: true,
    rules: "legacy",
    midi: {
        item: [
            {
                pass: "rollFinished",
                macro: use,
                priority: 50,
            },
        ],
    },
};
