const { BrowserView, session, app } = require("electron");
const { join } = require("path");

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0";


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
				sandbox: true,
				contextIsolation: true,
				preload: join(app.getAppPath(), "preload.js")
			},
		});

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
		let gameSession = session.fromPartition("persist:simplemmo2x" + this.sessionGroup + (this.id || ""));
		gameSession.setPermissionRequestHandler((webContents, permission, callback) => {
			return callback(false);
		});
		gameSession.setUserAgent(userAgent);
	
		return gameSession;
	}
}