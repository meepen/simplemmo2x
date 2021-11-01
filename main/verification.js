const { writeFile, readFile } = require("fs/promises");
const { readFileSync } = require("fs");
const { watch } = require("fs/promises");

const Jimp = require("jimp");

async function similar(i0, i1) {
	let a = await Jimp.read(Buffer.from(i0, "base64"));
	let b = await Jimp.read(Buffer.from(i1, "base64"));

	let dist = Jimp.distance(a, b);
	let diff = Jimp.diff(a, b).percent;

	return dist < 0.15 || diff < 0.15;
}

module.exports.Verification = class Verification {
	constructor() {
		this.dbFile = "data/verification.json";
		this.readDB();
		this.startRefresh();

	}
	
	async startRefresh() {
		let watcher = watch(this.dbFile);

		for await (const event of watcher) {
			this.readDB();
		}
	}

	readDB() {
		try {
			console.log("reloaded db");
			this.db = JSON.parse(readFileSync(this.dbFile, "utf-8"));
		}
		catch (e) {
			console.error(e);
			this.db = {};
		}
	}

	async saveDatabase() {
		await writeFile("verification_db.json", JSON.stringify(this.db, null, "\t"), "utf-8");
	}

	async findInDatabase(images, name) {
		if (!this.db[name]) {
			return -1;
		}

		for (let i = 0; i < images.length; i++) {
			for (let compare of this.db[name]) {
				if (await similar(images[i], compare)) {
					return i;
				}
			}
		}

		return -1;
	}

	async saveInDatabase(name, image) {
		if (!this.db[name]) {
			this.db[name] = [];
		}
		if (this.db[name].indexOf(image) !== -1) {
			return;
		}
		this.db[name].push(image);
	
		await this.saveDatabase();
	}
}