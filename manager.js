const { BrowserWindow, BrowserView } = require("electron");
const { Game } = require("./game");

const { watch } = require("fs/promises");

const ui_height = 32;

module.exports.GameManager = class GameManager {
	constructor(opts) {
		this.games = [];
		this.config = {};

		this.gameCount = opts.gameCount || 1;
	}

	setConfig(key, value) {
		this.config[key] = value;

		this.uiView.webContents.send("config-update", key, value);
	}


	getConfig(key) {
		return this.config[key];
	}

	async init(width, height) {
		this.mainWindow = new BrowserWindow({
			width,
			height,
			show: false,
			autoHideMenuBar: true,
		});

		this.mainWindow.on("close", () => {
			this.mainWindow = null;
		});

		this.uiFile = "ui.html"
		
		this.uiView = new BrowserView({
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			}
		});

		await this.uiView.webContents.loadFile(this.uiFile);

		this.mainWindow.addBrowserView(this.uiView);

		for (let i = 0; i < this.gameCount; i++) {
			let game = await this.createGame();
			console.log("Created", i);
		}
		
		// for some reason must be called after adding all views
		this.manageViews();


		this.mainWindow.show();

		this.startRefresh();
	}

	manageViews() {
		let { width, height } = this.mainWindow.getBounds();

		this.uiView.setBounds({
			x: 0,
			y: 0,
			width,
			height: ui_height
		});

		this.uiView.setAutoResize({
			width: true,
			height: false
		});

		for (let { view } of this.games) {
			view.setBounds({
				x: 0,
				y: ui_height,
				width: width,
				height: height - ui_height
			});
			view.setAutoResize({
				width: true,
				height: true
			});
		}
	}

	async createGame() {
		let bounds = this.mainWindow.getBounds();
		let game = new Game(this.games.length);
		let view = await game.createView();

		this.games.push(game);

		this.mainWindow.addBrowserView(view);

		return game;
	}

	async startRefresh() {
		let watcher = watch(this.uiFile);

		for await (const event of watcher) {
			this.uiView.webContents.loadFile(event.filename);
		}
	}
};