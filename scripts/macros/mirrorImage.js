import { actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils } from "../utils.js";

async function use({ workflow }) {
    class MirrorImages extends Sequencer.BaseSection {
        constructor(inSequence) {
            super(inSequence);
            this.sequenceMirrorImages = new Sequence();
        }

        addMirrorImage(token, from, to, index, imageNumber) {
            return this.sequenceMirrorImages
                .effect()
                .name(`image-${index}`)
                .persist()
                .copySprite(token)
                .atLocation(token)
                .belowTokens()
                .attachTo(token, { bindAlpha: false, bindRotation: false })
                .scale(1)
                .anchor({ x: 0.9 + imageNumber * 0.05 })
                .animateProperty("spriteContainer", "rotation", { from: from, to: to, duration: 500 })
                .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true })
                .zeroSpriteRotation()
                .opacity(0.75)
                .tint("#d0c2ff")
                .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
                .zIndex(4);
        }

        addMirrorImages(token, copies) {
            let from = 0;
            let to = 0;
            const angle = 360 / copies;
            for (let i = 0; i < copies; i++) {
                to = i * angle;
                from = to - 180;
                this.addMirrorImage(token, from, to, i + 1, copies); // Pass index starting from 1
            }
            return this;
        }

        run() {
            this.sequenceMirrorImages.play();
        }
    }

    const effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [],
        flags: {
            "nolat-automations": {
                mirrorImage: {
                    images: 3,
                },
            },
        },
    };
    effectUtils.addMacro(effectData, "midi.actor", ["mirrorImageMirrored"]);
    effectUtils.addMacro(effectData, "effect", ["mirrorImageMirrored"]);
    await effectUtils.createEffect(workflow.actor, effectData, { identifier: "mirrorImage" });

    const token = actorUtils.getFirstToken(workflow.actor);

    Sequencer.SectionManager.registerSection("", "mirrorImages", MirrorImages, true);

    new Sequence()
        .effect()
        .file("jb2a.shimmer.01.purple")
        .opacity(0.5)
        .rotate(-90)
        .scaleToObject(1.25)
        .atLocation(token)

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .file("jb2a.particles.outward.orange.02.03")
        .scaleToObject(2.5)
        .atLocation(token)
        .fadeIn(1000)
        .duration(10000)
        .fadeOut(2000)
        .randomRotation()

        .effect()
        .copySprite(token)
        .atLocation(token)
        .belowTokens()
        .animateProperty("sprite", "position.x", { from: -80, to: 80, duration: 1500, pingPong: true })
        .duration(1500)
        .opacity(0.75)
        .tint("#d0c2ff")
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .effect()
        .copySprite(token)
        .atLocation(token)
        .belowTokens()
        .animateProperty("sprite", "position.x", { from: 80, to: -80, duration: 1500, pingPong: true })
        .duration(1500)
        .opacity(0.75)
        .tint("#d0c2ff")
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .wait(500)

        //Images
        .mirrorImages()
        .addMirrorImages(token, 3)

        .wait(200)

        .effect()
        .file("jb2a.shimmer.01.purple")
        .opacity(0.5)
        .rotate(90)
        .scaleToObject(1.25)
        .atLocation(token)

        .animation()
        .on(token)
        .fadeIn(1000)
        .opacity(1)

        .play();
}

async function attacked({ trigger: { entity: effect }, workflow }) {
    if (workflow.targets.size !== 1) return;
    if (workflow.isFumble) return;

    const targetToken = workflow.targets.first();
    const targetActor = targetToken.actor;
    const attackingToken = workflow.token;

    if (!tokenUtils.canSee(attackingToken, targetToken)) return;
    if (tokenUtils.canSense(attackingToken, targetToken, ["blindsight", "seeAll"])) return;

    const duplicates = effect.flags["nolat-automations"].mirrorImage.images;
    if (!duplicates) return;

    const roll = await new Roll("1d20").evaluate();
    roll.toMessage({
        rollMode: "roll",
        speaker: ChatMessage.implementation.getSpeaker({ token: targetToken }),
        flavor: effect.name,
    });

    const rollTotal = roll.total;
    let rollNeeded;
    switch (duplicates) {
        case 3:
            rollNeeded = 6;
            break;
        case 2:
            rollNeeded = 8;
            break;
        default:
            rollNeeded = 11;
    }

    if (rollTotal < rollNeeded) return;
    if (workflow.hitTargets.size) workflow.hitTargets.delete(targetToken);

    const duplicateAC = 10 + targetActor.system.abilities.dex.mod;
    if (workflow.attackTotal >= duplicateAC) {
        ChatMessage.create({
            speaker: workflow.chatCard.speaker,
            content: genericUtils.translate("NOLATAUTOMATIONS.Macros.MirrorImage.Hit"),
        });

        Sequencer.EffectManager.endEffects({ name: `image-${duplicates}` }, targetToken);

        if (duplicates === 1) {
            await genericUtils.remove(effect);
        } else {
            await genericUtils.setFlag(effect, "nolat-automations", "mirrorImage.images", duplicates - 1);
        }
    } else {
        ChatMessage.create({
            speaker: workflow.chatCard.speaker,
            content: genericUtils.translate("NOLATAUTOMATIONS.Macros.MirrorImage.Miss"),
        });
    }
}

async function remove({ trigger: { entity: effect } }) {
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    await Sequencer.EffectManager.endEffects({ name: `image-1` }, token);
    await Sequencer.EffectManager.endEffects({ name: `image-2` }, token);
    await Sequencer.EffectManager.endEffects({ name: `image-3` }, token);
}

export let mirrorImage = {
    name: "Image Miroir",
    version: "1.0.0",
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

export let mirrorImageMirrored = {
    name: "Image Miroir - Miroité",
    version: mirrorImage.version,
    rules: "legacy",
    midi: {
        actor: [
            {
                pass: "targetAttackRollComplete",
                macro: attacked,
                priority: 50,
            },
        ],
    },
    effect: [
        {
            pass: "deleted",
            macro: remove,
            priority: 50,
        },
    ],
};
