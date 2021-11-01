const { humanlike, wait } = require("../api");
const { parse } = require("querystring");

module.exports.InventoryAction = class InventoryAction {
	constructor() {

	}

	async doEquip() {
		console.log("attempting equip.");
		let upgrades = Array.from(document.querySelectorAll("tr[id^=\"item-\"]")).filter(x => {
			return x.querySelector(".fa-caret-up") && x.querySelector("a button")
		});

		if (upgrades.length === 0) {
			console.log("no upgrades available.");
			return;
		}

		console.log(`found ${upgrades.length} upgrades`);

		await wait(200 + Math.random() * 350);

		let ev = humanlike.pressElement(upgrades[0]);

		await wait(200 + Math.random() * 350);

		ev.finish();
	}

	async startCollector() {
		console.log("starting the collection process.");
		let collects = document.querySelectorAll("tr[id^=\"item-\"]");

		if (collects.length === 0) {
			console.log("collection finished.");
			return;
		}

		let collect = collects[0];

		let ev = humanlike.pressElement(collect);

		await wait(200 + Math.random() * 200);

		ev.finish();

		await wait(300 + Math.random() * 300);

		let range = document.querySelectorAll(".swal2-range input[type=\"range\"]");

		let bounds = range.getBoundingClientRect();
		ev = humanlike.pressElement(range, undefined, {
			x: (bounds.bottom - bounds.top) * Math.random(),
			y: bounds.right - bounds.left - 1
		});

		await wait(300 + Math.random() * 100);

		console.log("waiting");
	}

	async run() {
		if (location.search == "?order_col=items.stat1modifier&order=desc&page=1") {
			await this.doEquip();
		}
		else if (location.search) {
			let p = parse(location.search.substr(1));
			if (p && p["type[]"] && p["type[]"].indexOf("collectable") !== -1) {
				await this.startCollector();
			}
		}

	}
}