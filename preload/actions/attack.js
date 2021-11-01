const { wait, humanlike } = require("../api");

module.exports.AttackAction = class AttackAction {
	constructor() {
		this.attackButton = document.querySelector("#attackButton");
	}

	async run() {
		while (1) {
			let start = Date.now();
			while (this.attackButton.disabled) {
				if (Date.now() > start + 3000) {
					// sanity check, if 3 seconds has passed then just go back
					window.history.back();
					return;
				}

				if (this.attackButton.textContent.toLowerCase().indexOf("battle has ended") !== -1) {
					// TODO: check popup and click
					while (!humanlike.checkPopup()) {
						await wait(200 + Math.random() * 350);
					}
					return;
				}
				await wait(200 + Math.random() * 500);
			}

			let ev = humanlike.pressElement(this.attackButton);

			await wait(200 + Math.random() * 500);

			ev.finish();

			await wait(1000 + Math.random() * 1500);
				
			if (humanlike.checkPopup()) {
				await wait(1000);
				window.history.back();
			}
		}
	}
}