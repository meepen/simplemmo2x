import * as electron from "electron";
import { mkdir, readFile, writeFile } from "fs/promises";

const { app, BrowserWindow, session } = electron;

try {
	await mkdir("data");
}
catch (e) {
	console.log("data directory exists.");
}


await app.whenReady();

const win = new BrowserWindow({
	width: 400,
	height: 300
});

win.loadURL