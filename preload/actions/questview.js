const { humanlike, wait } = require("../api");

module.exports.QuestViewAction = class QuestViewAction {
	constructor() {
		this.questPoints = parseInt(document.querySelector("#questPoints").innerText);
	}

	async run() {
		if (this.questPoints === 0) {
			console.log("no quest points to spend ;)");
			return true;
		}

		let quests = document.querySelectorAll("a[href^=\"/quests/view/\"]");

		let incomplete = Array.from(quests).filter(x => !x.querySelector(".text-right *"));

		if (incomplete.length >= 0) {
			console.log("found incomplete quest");

			let ev = humanlike.pressElement(incomplete.reverse()[0]);
			await wait(300 + Math.random() * 200);
			ev.finish();
		}
	}
}