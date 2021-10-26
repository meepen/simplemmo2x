const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const { join } = require("path");
const { watch } = require("fs").promises;

let config = {};

const width = 400;
const height = 640;
const ui_height = 32;

const emittedOnce = (element, eventName) => new Promise(resolve => {
	element.once(eventName, event => resolve(event))
});

(async function() {

	await app.whenReady();

	const main = new BrowserWindow({
		width,
		height,
		show: false,
		autoHideMenuBar: true,
	});

	const ui = new BrowserView({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

	const game = new BrowserView({
		webPreferences: {
			partition: "persist:simplemmo2x",
			sandbox: true,
			contextIsolation: true,
			preload: join(app.getAppPath(), "preload.js")
		},
	});
	game.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0");

	main.on("closed", () => {
		process.exit();
	});

	ipcMain.on("config-get", (event, msg) => {
		event.returnValue = config[msg];
	});

	ipcMain.on("config-set", (event, msg) => {
		config[msg[0]] = msg[1];
		ui.webContents.send("config-update", msg);
		event.returnValue = true;
	});

	ipcMain.on("note", (event, msg) => {
		console.log(`note: ${msg}`);
	});

	ipcMain.on("flash-window", () => {
		window.flashFrame(true);
	});

	main.addBrowserView(ui);
	main.addBrowserView(game);
	
	await ui.webContents.loadFile("ui.html");
	await game.webContents.loadURL("https://web.simple-mmo.com/login");

	main.show();
	
	ui.setBounds({
		x: 0,
		y: 0,
		width,
		height: ui_height
	});
	ui.setAutoResize({
		width: true,
		height: false
	});

	game.setBounds({
		x: 0,
		y: ui_height,
		width,
		height: height - ui_height
	});
	game.setAutoResize({
		width: true,
		height: true
	});

	game.webContents.setAudioMuted(true);

	let watcher = watch("ui.html");

	for await (const event of watcher) {
		ui.webContents.loadFile(event.filename);
	}
})();