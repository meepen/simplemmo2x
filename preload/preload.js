const { VerifyAction } = require("./actions/verify");
const { GatherAction } = require("./actions/gather");
const { TravelAction } = require("./actions/travel");
const { AttackAction } = require("./actions/attack");
const { InventoryAction } = require("./actions/inventory");

let endpoints = Object.create(null);

endpoints["^/travel$"] = TravelAction;
endpoints["^/crafting/material/gather"] = GatherAction;
endpoints["^/npcs/attack"] = AttackAction;
endpoints["^/i-am-not-a-bot"] = VerifyAction;
endpoints["^/inventory/items"] = InventoryAction

let i = 0;
window.addEventListener("load", () => {
	document.querySelector("html").classList.add("dark");

	if (i++ == 0) {
		return; // rocket loader hack
	}

	for (let key in endpoints) {
		if (window.location.pathname.match(new RegExp(key))) {
			console.log(`Matched ${window.location.pathname} to ${key}`);

			let c = new endpoints[key];
			c.run().then(() => {
				console.log("action complete.");
			}).catch(e => {
				console.error(e);
			});

			break;
		}
	}
});