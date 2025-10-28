import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
let packs = [];
for (let i of packs) {
    await compilePack("./packData/" + i, "./packs/" + i, { log: true });
}
