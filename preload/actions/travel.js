const { humanlike, wait, config, note } = require("../api");

module.exports.TravelAction = class TravelAction {
	constructor() {
		this.stepButton = document.querySelector("#primaryStepButton");
		this.travelCooldown = document.querySelector("#travelBarContainer");
	}

	getIgnored() {
		let r = [ "visit profile" ];

		if (!config.get("attack")) {
			r.push("attack");
		}

		return r;
	}

	async run() {
		await wait(2000 + Math.random() * 2000);
		while (1) {
			await wait(250 + Math.random() * 3000);

			let interaction = document.querySelector(".travel-text a.font-medium");

			if (interaction) {
				let interactionType = interaction.textContent.trim().toLowerCase();
				note(`interaction found: ${interactionType}`);

				let found = false;
				for (let word of this.getIgnored()) {
					if (interactionType.indexOf(word) !== -1) {
						found = true;
						break;
					}
				}

				if (!found) {
					// check if something is preventing us like a tool or level

					let skill_check = Array.from(document.querySelector(".travel-text a").parentElement.querySelectorAll("small")).filter(n => n.textContent.indexOf("skill level") !== -1);
					if (skill_check.length === 0) {
						// skill level is fine
						// TODO: more checks?

						let e = humanlike.pressElement(interaction);
						await wait(200 + Math.random() * 250);
						e.finish();

						return;
					}
				}
			}

			while (this.stepButton.textContent.indexOf("step") === -1) {
				await wait(200 + Math.random() * 250);
			}

			while (this.travelCooldown.style[0] !== "display") {
				await wait(200 + Math.random() * 250);
			}

			let ev = humanlike.pressElement(this.stepButton);

			await wait(200 + Math.random() * 360);

			ev.finish();
			config.set("steps", (config.get("steps") || 0) + 1);
		}
	}
}