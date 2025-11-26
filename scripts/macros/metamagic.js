import { actorUtils, dialogUtils, genericUtils, itemUtils, workflowUtils } from "../utils.js";

async function useDistant({ workflow }) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, "sorceryPoints");
    if (!sorcPoints?.system.uses.value) {
        genericUtils.notify("CHRISPREMADES.Macros.Metamagic.NotEnough", "info");
        return;
    }
    let validSpells = actorUtils
        .getCastableSpells(workflow.actor)
        .filter(
            (i) =>
                ["touch", "m"].includes(i.system.range.units) &&
                i.system.target.affects.type?.length &&
                i.system.target.affects.type !== "self"
        );
    if (!validSpells.length) {
        genericUtils.notify("CHRISPREMADES.Macros.Metamagic.NoValid", "info");
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(
        workflow.item.name,
        genericUtils.format("CHRISPREMADES.Macros.Metamagic.Which", { cost: 1, plural: "" }),
        validSpells,
        {
            showSpellLevel: true,
            addNoneDocument: true,
        }
    );
    if (!selection) return;
    await genericUtils.update(sorcPoints, { "system.uses.spent": sorcPoints.system.uses.spent + 1 });
    let itemUpdate;
    if (selection.system.range.units === "touch") {
        itemUpdate = { "system.range": { units: "m", value: 9 } };
    } else {
        itemUpdate = { "system.range.value": selection.system.range.value * 2 };
    }
    let newItem = selection.clone(itemUpdate, { keepId: true });
    newItem.prepareData();
    // newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    let shouldConsumeSlot = newItem.system.level && !["atwill", "innate", "ritual"].includes(newItem.system.method);
    let shouldConsumeUsage = newItem.system.hasLimitedUses;
    workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {
        options: {
            configureDialog: shouldConsumeSlot || shouldConsumeUsage ? true : null,
        },
        config: {
            consumeSpellSlot: shouldConsumeSlot ? true : null,
            consumeUsage: shouldConsumeUsage ? true : null,
        },
    });
}

export let distantSpell = {
    name: "Métamagie: Sort distant",
    version: "1.0.0",
    rules: "legacy",
    midi: {
        item: [
            {
                pass: "rollFinished",
                macro: useDistant,
                priority: 50,
            },
        ],
    },
};
