const { BrowserView, session, app } = require("electron");
const { join } = require("path");

const config = require("../config.json");

const userAgent = config.browser.userAgent;

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
		let gameSession = session.fromPartition("persist:simplemmo2x_" + this.sessionGroup + (this.id || ""));
		gameSession.setPermissionRequestHandler((webContents, permission, callback) => {
			return callback(false);
		});
		gameSession.setUserAgent(userAgent);
	
		return gameSession;
	}
}