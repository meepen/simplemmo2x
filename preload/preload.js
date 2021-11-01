const { VerifyAction } = require("./actions/verify");
const { GatherAction } = require("./actions/gather");
const { TravelAction } = require("./actions/travel");
const { AttackAction } = require("./actions/attack");
const { InventoryAction } = require("./actions/inventory");
const { QuestViewAction } = require("./actions/questview");
const { QuestAction } = require("./actions/quest");
const { storage } = require("./api");

let endpoints = Object.create(null);

endpoints["^/travel$"] = TravelAction;
endpoints["^/crafting/material/gather"] = GatherAction;
endpoints["^/npcs/attack"] = AttackAction;
endpoints["^/i-am-not-a-bot"] = VerifyAction;
endpoints["^/inventory/items"] = InventoryAction
endpoints["^/quests/viewall"] = QuestViewAction;
endpoints["^/quests/view/"] = QuestAction;

function checkTimers() {
	let nextBreak = storage.get("nextBreak");
	if (!nextBreak) {
		nextBreak = Date.now() + 60000 * 20 + Math.random() * 60000 * 15;
		storage.set("nextBreak", nextBreak);
	}

	if (nextBreak <= Date.now()) {
		setTimeout(() => {
			location.reload();
		}, 60000 * 5 + Math.random() * 60000 * 3);
		return true;
	}

	let nextQuest = storage.get("nextQuest") || 0;
	if (nextQuest <= Date.now()) {
		location.pathname = "/quests/viewall";
		storage.set("nextQuest", Date.now() + 60000 * 5 + Math.random() * 60000 * 10);
		return true;
	}

	let nextInventory = storage.get("nextInventory") || 0;

	if (nextInventory <= Date.now()) {
		storage.set("nextInventory", Date.now() + 60000 * 15);
		location.href = `${location.origin}/inventory/items?order_col=items.stat1modifier&order=desc&page=1`;
		return true;
	}

	return false;
}

let i = 0;
window.addEventListener("load", () => {
	document.querySelector("html").classList.add("dark");

	if (i++ == 0) {
		return; // rocket loader hack
	}

	if (location.pathname === "/travel" && checkTimers()) {
		return;
	}

	for (let key in endpoints) {
		if (window.location.pathname.match(new RegExp(key))) {
			console.log(`Matched ${window.location.pathname} to ${key}`);

			let c = new endpoints[key];
			c.run().then(travel => {
				console.log("action complete.");
				if (travel) {
					location.pathname = "/travel";
				}
			}).catch(e => {
				console.error(e);
			});

			break;
		}
	}
});