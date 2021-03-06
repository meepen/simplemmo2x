const { BrowserWindow, BrowserView } = require("electron");
const { Game } = require("./game");

const { watch } = require("fs/promises");
const config = require("../config.json");

const ui_height = 32;
const inactive_height = config.game.inactive.height;
const min_width = config.game.inactive.min_width || -Infinity;

if (!inactive_height) {
	throw new Error("null inactive.height");
}

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

	getDevToolsWindow() {
		if (!this.devtools) {
			let currentTools = this.devtools = new BrowserWindow({
				width: 400,
				height: 600,
				autoHideMenuBar: true
			});

			this.devtools.on("closed", () => {
				if (this.devtools == currentTools) {
					this.devtools = null;
				}
			});
		}

		return this.devtools;
	}

	getActiveView() {
		return this.games[this.activeGame].view;
	}

	openDevTools() {
		let tools = this.getDevToolsWindow();
		let game = this.games[this.activeGame].view.webContents;

		game.setDevToolsWebContents(tools.webContents);
		game.openDevTools({mode: "detach"});
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

		this.mainWindow.on("resize", () => {
			this.manageViews();
		});

		this.uiFile = "html/ui.html"
		
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
		let { width, height } = this.mainWindow.getContentBounds();

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


		let inactiveHeight = this.games.length === 1 ? 0 : inactive_height;
		let perRow = Math.ceil(width / min_width);
		if (perRow > this.games.length - 1) {
			perRow = this.games.length - 1;
		}
		let w = Math.floor(width / perRow);
		let x = 0;
		let y = ui_height;
		let rows = 0;


		for (let { view, id } of this.games) {
			if (id !== this.activeGame) {
				if (x == perRow) {
					x = 0;
					y += inactiveHeight;
					rows++;
					w = Math.floor(width / Math.min(this.games.length - 1 - perRow * rows, perRow));
				}

				view.setBounds({
					x: x++ * w,
					y: y,
					height: inactiveHeight,
					width: w
				});
				view.setAutoResize({
					horizontal: true
				});
			}
		}

		let mainView = this.games[this.activeGame].view;
		
		mainView.setBounds({
			x: 0,
			y: y + inactiveHeight,
			width: width,
			height: height - y - inactiveHeight
		});
		mainView.setAutoResize({
			width: true,
			height: true
		});
	}

	nextGame(back) {
		if (back) {
			this.activeGame--;
			if (this.activeGame === -1) {
				this.activeGame = this.games.length - 1;
			}
		}
		else {
			this.activeGame = (this.activeGame + 1) % this.games.length;
		}

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
			this.uiView.webContents.loadFile(this.uiFile);
		}
	}
};