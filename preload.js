const { ipcRenderer, ipcMain } = require("electron");

let config = {
	get: function(a) {
		return ipcRenderer.sendSync("config-get", a);
	},
	set: function(a, b) {
		ipcRenderer.sendSync("config-set", a, b);
	}
};

function pressDown(ele) {
	let bounds = ele.getBoundingClientRect()
	let px = bounds.left + Math.floor(Math.random() * (bounds.right - bounds.left));
	let py = bounds.top + Math.floor(Math.random() * (bounds.bottom - bounds.top));
	let opts = {
		clientX: px,
		clientY: py
	}
	ele.dispatchEvent(new MouseEvent("mousedown", opts));

	return {
		finish: function() {
			ele.dispatchEvent(new MouseEvent("mouseup", opts));
			ele.dispatchEvent(new MouseEvent("click", opts));
		}
	}
}

function beginTravel() {
	let ivl;
	let disallow = [ "visit profile" ];
	if (!config.get("attack")) {
		disallow.push("attack");
	}
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
			window.location.pathname = "/i-am-not-a-bot";
			clearInterval(ivl);
			return;
		}
		
		let interaction = document.querySelector(".travel-text a.font-medium");

		if (interaction) {
			let interactionType = interaction.textContent.trim().toLowerCase();
			ipcRenderer.send("note", interactionType);
			let found = false;
			for (let word of disallow) {
				if (interactionType.indexOf(word) !== -1) {
					found = true;
					break;
				}
			}

			if (!found) {
				// check if able to do
				let skill_check = Array.from(document.querySelector(".travel-text a").parentElement.querySelectorAll("small")).filter(n => n.textContent.indexOf("skill level") !== -1);
				if (skill_check.length === 0) {
					// skill level is fine
					pressDown(interaction).finish();
					return;
				}
			}
		}

		if (button.textContent.indexOf("step") === -1) {
			return;
		}

		if (travelCooldown.style[0] !== "display") {
			return;
		}

		pressDown(button).finish();
		config.set("steps", (config.get("steps") || 0) + 1);
	}
	
	tryStep();
	ivl = setInterval(tryStep, 540);
}

function beginGather() {
	let pushed = false;
	let gatherAction = document.querySelector("#action_button");
	let ev;

	function doGather() {
		if (!pushed) {
			ev = pressDown(gatherAction);
			pushed = true;
		}
		else if (!document.querySelector(".loading-bar")) {
			ev.finish();
			pushed = false;
		}
	}

	setInterval(doGather, 350);
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

		pressDown(attackButton).finish();
	}

	setInterval(tryAttack, 1350);
}

async function beginHumanVerif() {
	function getBase64Image(img) {
		return new Promise((res, rej) => {
			let loader = new Image();
			loader.onload = function() {
				var canvas = document.createElement("canvas");
				canvas.width = loader.width;
				canvas.height = loader.height;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(loader, 0, 0);
				var dataURL = canvas.toDataURL("image/png");
				res(dataURL.replace(/^data:image\/(?:png|jpg);base64,/, ""));
			}

			loader.src = img.src;

			loader.onabort = rej;
		});
	}

	let finding = Array.from(document.querySelectorAll("span")).find(e => e.textContent.indexOf("Please press on the following") === 0).parentElement.children[1].textContent.trim();

	let images = document.querySelectorAll("img[src^=\"/i-am-not-a-bot\"]");

	let b64 = [];

	for (let img of images) {
		b64.push(await getBase64Image(img));
	}

	let find = ipcRenderer.sendSync("find-verification", finding, b64);

	if (find === -1) {
		ipcRenderer.send("flash-window");
		for (let i = 0; i < images.length; i++) {
			images[i].parentElement.addEventListener("click", () => {
				ipcRenderer.send("verification-info", finding, b64, i);
			});
		}
	}
	else {
		console.log("found: ", finding, find);
		pressDown(images[find].parentElement).finish();
	}

	function detectEnd() {
		if (document.querySelector("div[class$=\"success-ring\"]")) {
			window.history.back();
		}
	}

	setInterval(detectEnd, 1000);
}

let endpoints = Object.create(null);

endpoints["^/travel$"] = beginTravel;
endpoints["^/crafting/material/gather"] = beginGather;
endpoints["^/npcs/attack"] = beginAttack;
endpoints["^/i-am-not-a-bot"] = beginHumanVerif;

let i = 0;
window.addEventListener("load", () => {
	if (i++ == 0) {
		return; // rocket loader hack
	}

	for (let key in endpoints) {
		if (window.location.pathname.match(new RegExp(key))) {
			console.log(`Matched ${window.location.pathname} to ${key}`);
			endpoints[key]();
			break;
		}
	}

});