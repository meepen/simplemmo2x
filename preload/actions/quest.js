const { humanlike, wait } = require("../api");

module.exports.QuestAction = class QuestAction {
	constructor() {

	}

	async run() {
		let progress = document.querySelector("span[x-text=\"success_count\"]").parentElement.innerText;

		let [_, done, needed] = progress.match(/(\d+) \/ (\d+)/);
		done = parseInt(done);
		needed = parseInt(needed);
		console.log(`${done} / ${needed}`);

		let questButton = document.querySelector("#questButton");
		let resultLog = document.querySelector("#result");

		await wait(2000 + Math.random() * 500);

		for (let i = done; i < needed; i++) {
			console.log("performing quest");
			let ev = humanlike.pressElement(questButton);

			await wait(200 + Math.random() * 200);

			ev.finish();

			await wait(200 + Math.random() * 200);

			console.log("waiting to perform next quest...");
			while (questButton.innerText !== "Perform Quest") {
				await wait(200 + Math.random() * 200);
			}

			let log = resultLog.firstChild.innerText;

			if (log.toLowerCase().indexOf("no more quest points") !== -1) {
				console.log("out of quest points!");
				break;
			}
		}
		
		// do this way to refresh
		window.location = document.referrer;
	}
}