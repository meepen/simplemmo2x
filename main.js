const { app, ipcMain } = require("electron");
const yargs = require("yargs");
const { GameManager } = require("./main/manager");
const { Verification } = require("./main/verification");
const config = require("./config.json");

const argv = yargs
	.command("amount", "Determines how many sub-windows to create for multi-account", {
		amount: {
			alias: "a",
			default: "1",
			type: "number"
		}
	})
	.command("group", "Determines a group for the cookie storage", {
		group: {
			alias: "g",
			default: "",
			type: "string"
		}
	}).argv

const width = config.game.width;
const height = config.game.height;

let verify = new Verification();
let manager = new GameManager({
	gameCount: argv.amount,
	group: argv.group
});

// TODO: new class?
ipcMain.on("config-get", (event, key) => {
	event.returnValue = manager.getConfig(key);
});

ipcMain.on("config-set", (event, key, value) => {
	manager.setConfig(key, value);
	event.returnValue = true;
});

let localStorage = Object.create(null);
function getLocalStorage(id) {
	if (!localStorage[id]) {
		localStorage[id] = Object.create(null);
	}

	return localStorage[id];
}

ipcMain.on("config-get-local", (event, key) => {
	event.returnValue = getLocalStorage(event.processId)[key];
});

ipcMain.on("config-set-local", (event, key, value) => {
	getLocalStorage(event.processId)[key] = value;
	event.returnValue = true;
});

ipcMain.on("note", (event, msg) => {
	console.log(`note: ${msg}`);
});

ipcMain.on("find-verification", async (event, what, images) => {
	event.returnValue = await verify.findInDatabase(images, what);
});

ipcMain.on("verification-info", async (event, what, images, chosen) => {
	await verify.saveInDatabase(what, images[chosen]);
});

ipcMain.on("next-game", () => {
	manager.nextGame();
});

ipcMain.on("open-devtools", () => {
	manager.openDevTools();
});

function createGame() {
	manager.init(width, height);
}

app.on("window-all-closed", () => {
	app.exit();
});

app.on("ready", createGame);
app.on("activate", createGame);