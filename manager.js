const { BrowserWindow, BrowserView } = require("electron");
const { Game } = require("./game");

const { watch } = require("fs/promises");

const ui_height = 32;
const inactive_height = 200;

module.exports.GameManager = class GameManager {
	constructor(opts) {
		this.games = [];
		this.config = {};

		this.activeGame = 0;

		this.gameCount = opts.gameCount || 1;
		this.group = opts.group || "";
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
			backgroundColor: "#000"
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

		let x = 0;
		let w = Math.floor(width / (this.games.length - 1));

		let inactiveHeight = this.games.length === 1 ? 0 : inactive_height;

		for (let { view, id } of this.games) {
			if (id === this.activeGame) {
				view.setBounds({
					x: 0,
					y: ui_height + inactiveHeight,
					width: width,
					height: height - ui_height - inactiveHeight
				});
				view.setAutoResize({
					width: true,
					height: true
				});
			}
			else {
				view.setBounds({
					x: x,
					y: ui_height,
					height: inactiveHeight,
					width: w
				});
				view.setAutoResize({
					horizontal: true
				});
				x += w;
			}
		}
	}

	nextGame() {
		this.activeGame = (this.activeGame + 1) % this.games.length;

		this.manageViews();
		this.setConfig("game", this.activeGame);
	}

	async createGame() {
		let game = new Game(this.games.length, this.group + (this.group ? "_" : ""));
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