const { humanlike, wait } = require("../api");

module.exports.GatherAction = class GatherAction {
	consrtuctor() {
		this.gatherAction = document.querySelector("#action_button");
	}

	async run() {
		while (!this.gatherAction) {
			this.gatherAction = document.querySelector("#action_button");
			await wait(200);
		}

		while (1) {
			let action = humanlike.pressElement(this.gatherAction);

			while (document.querySelector(".loading-bar")) {
				await wait(200 + Math.random() * 150);
			}

			await wait(500 + Math.random() * 500);

			action.finish();

			await wait(750 + Math.random() * 1500);

			if (humanlike.checkPopup()) {
				await wait(1000);
				window.history.back();
			}
		}
	}
}