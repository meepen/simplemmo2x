const { ipcRenderer, ipcMain } = require("electron");

let config = {
	get: function(a) {
		return ipcRenderer.sendSync("config-get", a);
	},
	set: function(a, b) {
		ipcRenderer.sendSync("config-set", [a, b]);
	}
};

function beginTravel() {
	let allow = [ "pick", "salvage", "attack", "chop", "catch", "mine" ];
	let button = document.querySelector("#primaryStepButton");
	let travelCooldown = document.querySelector("#travelBarContainer");

	if (!button) {
		console.log("cannot find button");
		return;
	}

	if (!travelCooldown) {
		console.log("cannot find cooldown");
		return;
	}

	function tryStep() {
		if (document.querySelector("a[href=\"/i-am-not-a-bot\"]")) {
			return;
		}

		let interaction = document.querySelector(".travel-text a");

		if (interaction) {
			let interactionType = interaction.textContent.trim().toLowerCase();
			ipcRenderer.send("note", interactionType);
			let found = false;
			for (let word of allow) {
				if (interactionType.indexOf(word) !== -1) {
					found = true;
					break;
				}
			}

			if (found) {
				// check if able to do
				let skill_check = Array.from(document.querySelector(".travel-text a").parentElement.querySelectorAll("small")).filter(n => n.textContent.indexOf("skill level") !== -1);
				if (skill_check.length === 0) {
					// skill level is fine
					interaction.click();
					return;
				}
			}
		}

		if (button.textContent.indexOf("step") === -1) {
			return;
		}

		if (travelCooldown.style[0] !== "display") {
			console.log("cooldown");
			return;
		}

		button.click();
	}
	
	tryStep();
	setInterval(tryStep, 2040);
}

function beginGather() {
	let pushed = false;
	let gatherAction = document.querySelector("#action_button");

	function doGather() {
		if (!pushed) {
			gatherAction.dispatchEvent(new MouseEvent("mousedown"));
			gatherAction.click();
			pushed = true;
		}
		else if (!document.querySelector(".loading-bar")) {
			gatherAction.dispatchEvent(new MouseEvent("mouseup"));
			pushed = false;
		}
	}

	setInterval(doGather, 1750);
}

function beginAttack() {
	let attackButton = document.querySelector("#attackButton");

	function tryAttack() {
		if (attackButton.disabled) {
			if (attackButton.textContent.toLowerCase().indexOf("battle has ended") !== -1) {
				window.history.back();
				return;
			}
		}

		attackButton.click();
	}

	setInterval(tryAttack, 1750);
}

let endpoints = Object.create(null);

endpoints["^/travel$"] = beginTravel;
endpoints["^/crafting/material/gather"] = beginGather;
endpoints["^/npcs/attack"] = beginAttack;

window.addEventListener("DOMContentLoaded", () => {
	for (let key in endpoints) {
		if (window.location.pathname.match(new RegExp(key))) {
			console.log(`Matched ${window.location.pathname} to ${key}`);
			endpoints[key]();
			break;
		}
	}
});