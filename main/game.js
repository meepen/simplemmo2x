const { BrowserView, session, app } = require("electron");
const { join } = require("path");
const SRand = require("seeded-rand");
const { createHash } = require("crypto");

const config = require("../config.json");

const userAgent = config.browser.userAgent;

const proxies = config.proxy || {};

if (!userAgent) {
	throw new Error("No user agent in config");
}

module.exports.Game = class Game {
	constructor(id, group) {
		this.id = id;
		this.sessionGroup = group || "";
	}

	async createView() {
		if (this.view) {
			return this.view;
		}

		this.view = new BrowserView({
			webPreferences: {
				session: this.createSession(),
				contextIsolation: true,
				preload: join(app.getAppPath(), "preload/preload.js")
			},
		});

		this.view.webContents.backgroundThrottling = false;
		this.view.webContents.setAudioMuted(true);
		this.view.webContents.setWindowOpenHandler(details => {
			this.view.webContents.loadURL(details.url);

			return {
				action: "deny"
			};
		});
		
		await this.view.webContents.loadURL("https://web.simple-mmo.com/login");

		return this.view;
	}

	createSession() {
		let sessionName = "persist:simplemmo2x_" + this.sessionGroup + (this.id || "");
		let gameSession = session.fromPartition(sessionName);
		gameSession.setPermissionRequestHandler((webContents, permission, callback) => {
			return callback(false);
		});
		gameSession.setUserAgent(userAgent);

		let seed = parseInt(createHash("sha256").update(sessionName).digest("hex").substr(0, 4), 16);

		if (Object.getOwnPropertyNames(proxies).length > 0) {
			let rnd = new SRand(seed);
			let proxyRules = [];
			for (let proto in proxies) {
				proxyRules.push(`${proto}=${rnd.sample(proxies[proto], Math.min(proxies[proto].length, 5))}`);
			};
			proxyRules = proxyRules.join(";") + ";direct://";
			gameSession.setProxy({
				proxyRules
			});

			console.log(proxyRules);
		}
	
		return gameSession;
	}
}