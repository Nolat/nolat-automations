import { dialogUtils, itemUtils, tokenUtils, Teleport } from "../utils.js";

async function use({ workflow }) {
    let animation = "mistyStep";
    let mistyWanderer = itemUtils.getItemByIdentifier(workflow.actor, "mistyWanderer");
    let secondaryTarget;

    if (mistyWanderer) {
        let nearbyTargets = tokenUtils
            .findNearby(workflow.token, 5, "ally")
            .filter((t) => tokenUtils.canSee(workflow.token, t));
        if (nearbyTargets?.length) {
            let selection = await dialogUtils.selectTargetDialog(
                workflow.item.name,
                "CHRISPREMADES.Macros.MistyWanderer.TeleportFriend",
                nearbyTargets
            );
            if (selection) secondaryTarget = selection[0];
        }
    }

    await Teleport.target([workflow.token], workflow.token, { range: 9, animation: animation });
    if (!secondaryTarget) return;
    await Teleport.target([secondaryTarget], workflow.token, { range: 1.5, animation: animation });
}

export let mistyStep = {
    name: "Foulée brumeuse",
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
