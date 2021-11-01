const { convertImageToBase64, wait, humanlike } = require("../api");
const { ipcRenderer } = require("electron");

module.exports.VerifyAction = class VerifyAction {
	constructor() {
		this.findWhat = Array.from(document.querySelectorAll("span")).find(e => e.textContent.indexOf("Please press on the following") === 0).parentElement.children[1].textContent.trim();
		this.imageList = document.querySelectorAll("img[src^=\"/i-am-not-a-bot\"]");
		this.fullImages = [];
	}

	async run() {
		for (let img of this.imageList) {
			this.fullImages.push(await convertImageToBase64(img));
		}

		let find = ipcRenderer.sendSync("find-verification", this.findWhat, this.fullImages);

		if (find === -1) {
			// could not find image in database
			// notify host and wait for human intervention
			ipcRenderer.send("flash-window");

			for (let i = 0; i < this.imageList.length; i++) {
				this.imageList[i].parentElement.addEventListener("click", () => {
					ipcRenderer.send("verification-info", this.findWhat, this.fullImages, i);
				});
			}

			console.log("waiting for human intervention...");
		}
		else {
			let push = humanlike.pressElement(this.imageList[find].parentElement, true);
			await wait(200 + Math.random() * 200);
			push.finish();
		}

		do {
			console.log("waiting...");
			await wait(500 + Math.random() * 750);
		}
		while (!document.querySelector("div[class$=\"success-ring\"]"));


		console.log("finished human verification");
		window.history.back();
	}

}