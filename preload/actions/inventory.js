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

		let ev = humanlike.pressElement(upgrades[0].querySelector("a"));

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
			// if searching by stats, look only for equippable... lol
			location.search = "?type%5B0%5D=weapon&type%5B1%5D=armour&type%5B4%5D=amulet&type%5B5%5D=shield&type%5B6%5D=boots&type%5B8%5D=helmet&type%5B10%5D=greaves&type%5B11%5D=special&order_col=items.stat1modifier&order=desc&page=1";
		}
		else if (location.search) {
			let p = parse(location.search.substr(1));
			if (!p) {
				return;
			}

			if (p && p.order_col === "items.stat1modifier" && p.order == "desc") {
				await this.doEquip();
			}
			else if (p["type[]"] && p["type[]"].join() == "collectable") {
				await this.startCollector();
			}
		}

	}
}