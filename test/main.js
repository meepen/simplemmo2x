const { BrowserWindow, app } = require("electron");
const { watch } = require("fs/promises");

app.once("ready", async () => {
	let win = new BrowserWindow({

	});

	await win.loadFile("index.html");
	win.webContents.openDevTools();

	let watcher = watch(`${__dirname}/index.html`);
	for await (const e of watcher) {
		await win.loadFile("index.html");
	}
});