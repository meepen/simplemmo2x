const { ipcRenderer } = require("electron");

const wait = module.exports.wait = async function wait(ms) {
	await new Promise(r => {
		setTimeout(r, ms);
	});
};

module.exports.note = function(note) {
	ipcRenderer.send("note", note);
}

module.exports.config = {
	get: function(a) {
		return ipcRenderer.sendSync("config-get", a);
	},
	set: function(a, b) {
		ipcRenderer.sendSync("config-set", a, b);
	}
};

module.exports.storage = {
	get: function(a) {
		return ipcRenderer.sendSync("config-get-local", a);
	},
	set: function(a, b) {
		ipcRenderer.sendSync("config-set-local", a, b);
	}
}

module.exports.humanlike = class HumanLike {
	static checkChallenge() {
		let challenge = document.querySelector("*[href^=\"/i-am-not-a-bot\"]");
		if (!challenge) {
			return false;
		}

		let ev = this.pressElement(challenge, true);
		wait(200 + Math.random() * 500).then(() => {
			ev.finish();
		});

		return true;
	}

	static checkPopup() {
		let list = Array.from([...document.querySelectorAll(".swal2-container button"), ...document.querySelectorAll(".swal2-container a")]).filter(x => window.getComputedStyle(x).display !== "none");

		if (list.length === 0) {
			return false;
		}

		let ev = this.pressElement(list[0], true);
		wait(200 + Math.random() * 500).then(() => {
			ev.finish();
		});

		return true;
	}

	static pressElement(ele, ignoreChallenge = false, inp) {
		// checking page to see if we are challenged
		if (!ignoreChallenge) {
			if (this.checkChallenge()) {
				throw new Error("challenged");
			}
		}


		let bounds = ele.getBoundingClientRect();
		let px = Math.floor(inp ? inp.x : Math.random() * (bounds.right - bounds.left));
		let py = Math.floor(inp ? inp.y : Math.random() * (bounds.bottom - bounds.top));
		let opts = {
			clientX: px,
			clientY: py,
			screenX: px + bounds.left,
			screenY: py + bounds.top
		};
		ele.dispatchEvent(new MouseEvent("mousedown", opts));
	
		return {
			finish: function() {
				let dx = Math.floor(Math.random() * 6);
				let dy = Math.floor(Math.random() * 6);
				opts.clientX += dx;
				opts.clientY += dy;
				opts.screenX += dx;
				opts.screenY += dy;
				ele.dispatchEvent(new MouseEvent("mouseup", opts));
				ele.dispatchEvent(new MouseEvent("click", opts));
			}
		};
	}
}

module.exports.convertImageToBase64 = async function convertImageToBase64(img) {
	if (!img.complete) {
		await new Promise((res, rej) => {
			img.addEventListener("load", res);
			img.addEventListener("error", rej);
		});
	}

	let canvas = document.createElement("canvas");

	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;

	let ctx = canvas.getContext("2d");

	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	return canvas.toDataURL().substr("data:image/png;base64,".length);
}