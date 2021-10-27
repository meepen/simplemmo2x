const { app, BrowserWindow, BrowserView, ipcMain, session } = require("electron");
const { join } = require("path");
const { watch, writeFile, readFile } = require("fs").promises;
const Jimp = require("jimp");

const similar = function(i0, i1) {
	return new Promise(async (res, rej) => {
		let a = await Jimp.read(Buffer.from(i0, "base64"));
		let b = await Jimp.read(Buffer.from(i1, "base64"));

		let dist = Jimp.distance(a, b);
		let diff = Jimp.diff(a, b).percent;

		res(dist < 0.15 || diff < 0.15);
	});
}

let config = {};
let main, devtools, verification;

const width = 400;
const height = 640;
const ui_height = 32;

async function saveDatabase() {
	writeFile("verification_db.json", JSON.stringify(verification, null, "\t"), "utf-8");
}

async function findInDatabase(images, name) {
	if (!verification[name]) {
		return -1;
	}

	for (let i = 0; i < images.length; i++) {
		for (let compare of verification[name]) {
			if (await similar(images[i], compare)) {
				return i;
			}
		}
	}

	return -1;
}

function saveInDatabase(name, image) {
	if (!verification[name]) {
		verification[name] = [];
	}
	if (verification[name].indexOf(image) !== -1) {
		return;
	}
	verification[name].push(image);

	saveDatabase();
}

async function createGame() {
	try {
		verification = JSON.parse(await readFile("verification_db.json","utf-8"));
	}
	catch (e) {
		console.error(e);
		verification = {};
	}

	saveDatabase();

	main = new BrowserWindow({
		width,
		height,
		show: false,
		autoHideMenuBar: true,
	});
	
	devtools = new BrowserWindow({
		width, height
	});

	devtools.on("close", () => {
		devtools = null;
	});

	main.on("close", () => {
		if (devtools) {
			devtools.destroy();
		}
		main = null;
		devtools = null;
	});

	let ui = new BrowserView({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

	let game = new BrowserView({
		webPreferences: {
			partition: "persist:simplemmo2x",
			sandbox: true,
			contextIsolation: true,
			preload: join(app.getAppPath(), "preload.js")
		},
	});

	
	let gameSession = session.fromPartition("persist:simplemmo2x");
	gameSession.setPermissionRequestHandler((webContents, permission, callback) => {
		return callback(false);
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
		main.flashFrame(true);
	});

	ipcMain.on("find-verification", async (event, what, images) => {
		event.returnValue = await findInDatabase(images, what);
	});

	ipcMain.on("verification-info", async (event, what, images, chosen) => {
		if (await findInDatabase(images, what) !== -1) {
			console.log(`found similar: ${what}`);
		}
		else {
			saveInDatabase(what, images[chosen]);
		}
	});

	main.addBrowserView(ui);
	main.addBrowserView(game);

	game.webContents.setDevToolsWebContents(devtools.webContents);
	game.webContents.openDevTools({ mode: "detach" });

	game.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0");	
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
	game.webContents.setWindowOpenHandler(details => {
		game.webContents.loadURL(details.url);

		return {
			action: "deny"
		};
	});

	let watcher = watch("ui.html");

	for await (const event of watcher) {
		ui.webContents.loadFile(event.filename);
	}
}


app.on("window-all-closed", () => {
	app.exit();
});

app.on("ready", createGame);
app.on("activate", () => {
	if (main === null) {
		createGame();
	}
})