import {
    activityUtils,
    actorUtils,
    animationUtils,
    dialogUtils,
    effectUtils,
    errors,
    genericUtils,
    itemUtils,
    socketUtils,
    workflowUtils,
} from "../utils.js";

async function use({ workflow }) {
    if (!workflow.targets.size) return;

    const maxMissiles = 2 + workflowUtils.getCastLevel(workflow);
    const [selection] = await dialogUtils.selectTargetDialog(
        workflow.item.name,
        genericUtils.format("NOLATAUTOMATIONS.Macros.MagicMissile.Select", { maxMissiles }),
        workflow.targets,
        {
            type: "selectAmount",
            maxAmount: maxMissiles,
        }
    );
    if (!selection || !selection.length) return;

    const feature = activityUtils.getActivityByIdentifier(workflow.item, "chaoticMissileBolt");

    if (!feature) {
        errors.missingActivity("chaoticMissileBolt");
        return;
    }

    const shieldedFeatureData = feature.clone({ "damage.parts": [] }, { keepId: true }).toObject();
    const playAnimation = itemUtils.getConfig(workflow.item, "playAnimation") && animationUtils.jb2aCheck();

    for (const { document: targetToken, value: numBolts } of selection) {
        if (isNaN(numBolts) || numBolts === 0) continue;

        let isShielded = false;
        let shieldItems = itemUtils
            .getAllItemsByIdentifier(targetToken.actor, "shield")
            .filter((i) => !i.system.hasLimitedUses || i.system.uses.value);

        if (effectUtils.getEffectByIdentifier(targetToken.actor, "shield")) {
            isShielded = true;
        } else if (!actorUtils.hasUsedReaction(targetToken.actor) && shieldItems.length) {
            shieldItems = shieldItems.filter(
                (i) => i.system.preparation.mode !== "prepared" || i.system.preparation.prepared
            );
            shieldItems = shieldItems.filter(
                (i) => i.system.preparation.mode !== "pact" || targetToken.actor.system.spells.pact.value
            );
            shieldItems = shieldItems.filter(
                (i) =>
                    i.system.hasLimitedUses ||
                    !i.system.level ||
                    actorUtils.hasSpellSlots(targetToken.actor, i.system.level) ||
                    ["atwill", "innate"].includes(i.system.preparation.mode)
            );
            const selectedSpell = await dialogUtils.selectDocumentDialog(
                workflow.item.name,
                "NOLATAUTOMATIONS.Macros.MagicMissile.Shield",
                shieldItems,
                { userId: socketUtils.firstOwner(targetToken.actor, true), addNoneDocument: true }
            );
            if (selectedSpell) {
                await socketUtils.remoteRollItem(
                    selectedSpell,
                    {},
                    { targetUuids: [targetToken.document.uuid] },
                    socketUtils.firstOwner(targetToken, true)
                );
                if (effectUtils.getEffectByIdentifier(targetToken.actor, "shield")) isShielded = true;
            }
        }

        for (let i = 0; i < numBolts; i++) {
            /// Pick a random index between 0 & 3
            const randomTypeIndex = Math.floor(Math.random() * 4);

            let colorSelection = "purple";
            let damageType = "force";
            switch (randomTypeIndex) {
                case 0:
                    colorSelection = "green";
                    damageType = "acid";
                    break;
                case 1:
                    colorSelection = "blue";
                    damageType = "cold";
                    break;
                case 2:
                    colorSelection = "orange";
                    damageType = "fire";
                    break;
                case 3:
                    colorSelection = "yellow";
                    damageType = "lightning";
                    break;
            }

            const damagePart = {
                ...feature.damage.parts[0],
                types: [damageType],
            };
            const damagedFeatureData = feature.clone({ "damage.parts": [damagePart] }, { keepId: true }).toObject();

            if (playAnimation) {
                let path = "jb2a.magic_missile.";
                path += colorSelection;

                new Sequence()
                    .effect()
                    .file(path)
                    .atLocation(workflow.token)
                    .stretchTo(targetToken)
                    .randomizeMirrorY()
                    .missed(isShielded)
                    .play();
            }
            if (isShielded) {
                await workflowUtils.syntheticActivityDataRoll(
                    shieldedFeatureData,
                    workflow.item,
                    workflow.actor,
                    [targetToken],
                    { options: { workflowOptions: { targetConfirmation: "none" } } }
                );
            } else {
                await workflowUtils.syntheticActivityDataRoll(
                    damagedFeatureData,
                    workflow.item,
                    workflow.actor,
                    [targetToken],
                    {
                        options: { workflowOptions: { targetConfirmation: "none" } },
                    }
                );
            }
        }
    }
}

export let chaoticMissile = {
    name: "Projectile chaotique de Seiko",
    version: "1.0.0",
    rules: "legacy",
    midi: {
        item: [
            {
                pass: "rollFinished",
                macro: use,
                priority: 50,
                activities: ["chaoticMissile"],
            },
        ],
    },
    config: [
        {
            value: "playAnimation",
            label: "CHRISPREMADES.Config.PlayAnimation",
            type: "checkbox",
            default: true,
            category: "animation",
        },
    ],
};
