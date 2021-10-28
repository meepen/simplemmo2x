const { app, ipcMain } = require("electron");
const { GameManager } = require("./manager");
const { Verification } = require("./verification");

const width = 400;
const height = 640;

let verify = new Verification();
let manager = new GameManager({
	gameCount: 3
});

ipcMain.on("config-get", (event, key) => {
	event.returnValue = manager.getConfig(key);
});

ipcMain.on("config-set", (event, key, value) => {
	manager.setConfig(key, value);
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

function createGame() {
	manager.init(width, height);
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