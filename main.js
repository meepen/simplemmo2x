const { app, BrowserWindow, session, ipcMain } = require("electron");
const { join } = require("path");

let config = {};

(async function() {

	await app.whenReady();

	const win = new BrowserWindow({
		width: 600,
		height: 800,
		show: false,
		autoHideMenuBar: false,
		webPreferences: {
			partition: "persist:simplemmo2x",
			sandbox: true,
			contextIsolation: true,
			preload: join(app.getAppPath(), "preload.js")
		},
	});

	win.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0");

	win.on("ready-to-show", () => {
		//console.log("URL: " + win.webContents.getURL())
	
		win.webContents.setAudioMuted(true);
	});

	win.on("closed", () => {
		process.exit();
	});

	ipcMain.on("config-get", (event, msg) => {
		event.returnValue = config[msg];
	});

	ipcMain.on("config-set", (event, msg) => {
		config[msg[0]] = msg[1];
	});

	ipcMain.on("note", (event, msg) => {
		console.log(`note: ${msg}`);
	});

	await win.loadURL("https://web.simple-mmo.com/login");

	win.show();
})();