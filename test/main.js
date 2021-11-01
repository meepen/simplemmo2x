const { BrowserWindow, app } = require("electron");
const { watch } = require("fs/promises");

app.commandLine.appendSwitch('ignore-certificate-errors')
app.once("ready", async () => {
	let win = new BrowserWindow({
		webPreferences: {
			nodeIntegration: false,
			sandbox: true,
			contextIsolation: true
		}
	});


	await win.loadURL("https://google.com/?q=what%20is%20my%20ip")
	win.webContents.openDevTools();
});