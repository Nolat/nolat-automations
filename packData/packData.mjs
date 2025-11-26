import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
let packs = ["na-spells", "na-class-features"];
for (let i of packs) {
    await compilePack("./packData/" + i, "./packs/" + i, { log: true });
}
