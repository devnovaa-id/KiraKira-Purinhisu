# FILE NAME LIST


---

// config.js
import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

global.pairingNumber = 6285134205152;
global.owner = [['6283170121139', 'Key', true]];

global.namebot = 'KiraKira Purinhisu';
global.author = 'Key';
global.source = 'https://chat.whatsapp.com/JUUkxTVW5OPIPnIx8wdoYm?mode=gi_t';

global.wait = 'Loading...';
global.eror = 'Terjadi Kesalahan...';

global.pakasir = {
	slug: 'yarsyaai',
	apikey: 'dxNSbmCOxzNIIhogZO5PihBfPfZHlFzh',
	expired: 30, //1 = 1menit. 30 = 30menit
};

global.stickpack = 'Croted By';
global.stickauth = namebot;

global.multiplier = 38; // The higher, The harder levelup

/*============== EMOJI ==============*/
global.rpg = {
	emoticon(string) {
		string = string.toLowerCase();
		let emot = {
			level: '📊',
			limit: '🎫',
			health: '❤️',
			stamina: '🔋',
			exp: '✨',
			money: '💹',
			bank: '🏦',
			potion: '🥤',
			diamond: '💎',
			common: '📦',
			uncommon: '🛍️',
			mythic: '🎁',
			legendary: '🗃️',
			superior: '💼',
			pet: '🔖',
			trash: '🗑',
			armor: '🥼',
			sword: '⚔️',
			pickaxe: '⛏️',
			fishingrod: '🎣',
			wood: '🪵',
			rock: '🪨',
			string: '🕸️',
			horse: '🐴',
			cat: '🐱',
			dog: '🐶',
			fox: '🦊',
			petFood: '🍖',
			iron: '⛓️',
			gold: '🪙',
			emerald: '❇️',
			upgrader: '🧰',
		};
		let results = Object.keys(emot)
			.map((v) => [v, new RegExp(v, 'gi')])
			.filter((v) => v[1].test(string));
		if (!results.length) return '';
		else return emot[results[0][0]];
	},
};

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'config.js'"));
	import(`${file}?update=${Date.now()}`);
});


---

// handler.js
import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';

/**
 * Handle messages upsert
 * @param {import('baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate
 */
export async function handler(chatUpdate) {
	if (!chatUpdate) return;
	this.pushMessage(chatUpdate.messages).catch(console.error);
	let m = chatUpdate.messages[chatUpdate.messages.length - 1];
	if (!m) return;
	if (global.db.data == null) await global.loadDatabase();
	try {
		m = smsg(this, m) || m;
		if (!m) return;
		m.exp = 0;
		m.limit = false;

		if (m.sender.endsWith('@broadcast') || m.sender.endsWith('@newsletter')) return;
		await (await import(`./lib/database.js?v=${Date.now()}`)).default(m, this);

		if (typeof m.text !== 'string') m.text = '';

		const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
		const isOwner = isROwner || m.fromMe;
		const isPrems = isROwner || db.data.users[m.sender]?.premiumTime > 0;

		if (global.db.data.settings[this.user.jid].gconly && !m.isGroup && !isOwner && !isPrems) return;
		if (!global.db.data.settings[this.user.jid].public && !isOwner && !m.fromMe) return;

		if (m.isBaileys) return;
		m.exp += Math.ceil(Math.random() * 10);

		let usedPrefix;
		let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender];

		const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata || (await this.groupMetadata(m.chat).catch((_) => null)) : {}) || {};
		const participants = (m.isGroup ? groupMetadata.participants : []) || [];
		const user = (m.isGroup ? participants.find((u) => conn.getJid(u.id) === m.sender) : {}) || {}; // User Data
		const bot = (m.isGroup ? participants.find((u) => conn.getJid(u.id) == this.user.jid) : {}) || {}; // Your Data
		const isRAdmin = user?.admin == 'superadmin' || false;
		const isAdmin = isRAdmin || user?.admin == 'admin' || false; // Is User Admin?
		const isBotAdmin = bot?.admin || false; // Are you Admin?

		const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
		for (let name in global.plugins) {
			let plugin = global.plugins[name];
			if (!plugin) continue;
			if (plugin.disabled) continue;
			const __filename = path.join(___dirname, name);
			if (typeof plugin.all === 'function') {
				try {
					await plugin.all.call(this, m, {
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					});
				} catch (e) {
					// if (typeof e === 'string') continue
					console.error(e);
					for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
						let data = (await conn.onWhatsApp(jid))[0] || {};
						if (data.exists) m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid);
					}
				}
			}
			if (plugin.tags && plugin.tags.includes('admin')) {
				// global.dfail('restrict', m, this)
				continue;
			}
			const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
			let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix;
			let match = (
				_prefix instanceof RegExp // RegExp Mode?
					? [[_prefix.exec(m.text), _prefix]]
					: Array.isArray(_prefix) // Array?
						? _prefix.map((p) => {
								let re =
									p instanceof RegExp // RegExp in Array?
										? p
										: new RegExp(str2Regex(p));
								return [re.exec(m.text), re];
							})
						: typeof _prefix === 'string' // String?
							? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
							: [[[], new RegExp()]]
			).find((p) => p[1]);
			if (typeof plugin.before === 'function') {
				if (
					await plugin.before.call(this, m, {
						match,
						conn: this,
						participants,
						groupMetadata,
						user,
						bot,
						isROwner,
						isOwner,
						isRAdmin,
						isAdmin,
						isBotAdmin,
						isPrems,
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					})
				)
					continue;
			}
			if (typeof plugin !== 'function') continue;
			if ((usedPrefix = (match[0] || '')[0])) {
				let noPrefix = m.text.replace(usedPrefix, '');
				let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
				args = args || [];
				let _args = noPrefix.trim().split` `.slice(1);
				let text = _args.join` `;
				command = (command || '').toLowerCase();
				let fail = plugin.fail || global.dfail; // When failed
				let isAccept =
					plugin.command instanceof RegExp // RegExp Mode?
						? plugin.command.test(command)
						: Array.isArray(plugin.command) // Array?
							? plugin.command.some((cmd) =>
									cmd instanceof RegExp // RegExp in Array?
										? cmd.test(command)
										: cmd === command
								)
							: typeof plugin.command === 'string' // String?
								? plugin.command === command
								: false;

				if (!isAccept) continue;
				m.plugin = name;
				if (!isOwner && (m.chat in global.db.data.chats || m.sender in global.db.data.users)) {
					let chat = global.db.data.chats[m.chat];
					if (name != 'tools-delete.js' && chat?.isBanned) return; // Except this
				}
				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
					// Both Owner
					fail('owner', m, this);
					continue;
				}
				if (plugin.rowner && !isROwner) {
					// Real Owner
					fail('rowner', m, this);
					continue;
				}
				if (plugin.owner && !isOwner) {
					// Number Owner
					fail('owner', m, this);
					continue;
				}
				if (plugin.premium && !isPrems) {
					// Premium
					fail('premium', m, this);
					continue;
				}
				if (plugin.group && !m.isGroup) {
					// Group Only
					fail('group', m, this);
					continue;
				} else if (plugin.botAdmin && !isBotAdmin) {
					// You Admin
					fail('botAdmin', m, this);
					continue;
				} else if (plugin.admin && !isAdmin) {
					// User Admin
					fail('admin', m, this);
					continue;
				}
				if (plugin.private && m.isGroup) {
					// Private Chat Only
					fail('private', m, this);
					continue;
				}
				if (plugin.register == true && _user.registered == false) {
					// Butuh daftar?
					fail('unreg', m, this);
					continue;
				}
				m.isCommand = true;
				let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17; // XP Earning per command
				if (xp > 200)
					m.reply('Ngecit -_-'); // Hehehe
				else m.exp += xp;
				if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
					this.reply(m.chat, `[❗] Limit anda habis, silahkan beli melalui *${usedPrefix}buy limit*`, m);
					continue; // Limit habis
				}
				if (plugin.level > _user.level) {
					this.reply(m.chat, `[💬] Diperlukan level ${plugin.level} untuk menggunakan perintah ini\n*Level mu:* ${_user.level} 📊`, m);
					continue; // If the level has not been reached
				}
				let extra = {
					match,
					usedPrefix,
					noPrefix,
					_args,
					args,
					command,
					text,
					conn: this,
					participants,
					groupMetadata,
					user,
					bot,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					isPrems,
					chatUpdate,
					__dirname: ___dirname,
					__filename,
				};
				try {
					await plugin.call(this, m, extra);
					if (!isPrems) m.limit = m.limit || plugin.limit || false;
				} catch (e) {
					// Error occured
					m.error = e;
					console.error(e);
					if (e) {
						let text = format(e);
						if (e.name)
							for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
								let data = (await conn.onWhatsApp(jid))[0] || {};
								if (data.exists)
									m.reply(
										`*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${m.sender}\n*💬 Chat:* ${m.chat}\n*💻 Command:* ${usedPrefix}${command} ${args.join(' ')}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(),
										data.jid
									);
							}
						m.reply(text);
					}
				} finally {
					if (typeof plugin.after === 'function') {
						try {
							await plugin.after.call(this, m, extra);
						} catch (e) {
							console.error(e);
						}
					}
					if (m.limit) m.reply(+m.limit + ' Limit terpakai ✔️');
				}
				break;
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		let user,
			stats = global.db.data.stats;

		if (m) {
			if (m.sender && (user = global.db.data.users[m.sender])) {
				user.exp += Number(m.exp || 0);
				user.limit -= Number(m.limit || 0);
			}

			if (m.plugin) {
				const now = Date.now();

				stats[m.plugin] = {
					total: 0,
					success: 0,
					last: 0,
					lastSuccess: 0,
					...stats[m.plugin],
				};

				stats[m.plugin].total++;
				stats[m.plugin].last = now;

				if (!m.error) {
					stats[m.plugin].success++;
					stats[m.plugin].lastSuccess = now;
				}
			}
		}

		try {
			await (await import(`./lib/print.js`)).default(m, this);
		} catch (e) {
			console.log(m, m.quoted, e);
		}
		if (global.db.data.settings[this.user.jid]?.autoread) await conn.readMessages([m.key]);
	}
}

/**
 * Handle groups participants update
 * @param {import('baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate
 */
export async function participantsUpdate({ id, participants, action, simulate = false }) {
	// if (id in conn.chats) return // First login will spam
	if (this.isInit && !simulate) return;
	if (global.db.data == null) await loadDatabase();
	let chat = global.db.data.chats[id] || {};
	let text = '';
	const groupMetadata = (conn.chats[id] || {}).metadata || (await this.groupMetadata(id));
	switch (action) {
		case 'add':
		case 'remove':
			if (chat.welcome) {
				for (let user of participants) {
					user = this.getJid(user?.phoneNumber || user.id);
					const tamnel = await this.profilePictureUrl(user, 'image', 'buffer');
					text = (action === 'add' ? chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!' : chat.sBye || this.bye || conn.bye || 'Bye, @user!')
						.replace('@user', `@${user.split('@')[0]}`)
						.replace('@subject', this.getName(id))
						.replace('@desc', groupMetadata.desc || '');
					this.sendMessage(
						id,
						{
							text,
							contextInfo: {
								mentionedJid: [user],
								externalAdReply: {
									title: action == 'add' ? '💌 WELCOME' : '🐾 BYE',
									body: action == 'add' ? 'YAELAH BEBAN GROUP NAMBAH 1 :(' : 'BYE BEBAN! :)',
									mediaType: 1,
									previewType: 'PHOTO',
									renderLargerThumbnail: true,
									thumbnail: tamnel,
								},
							},
						},
						{
							ephemeralExpiration: groupMetadata.ephemeralDuration,
						}
					);
				}
			}
			break;
		case 'promote':
		case 'demote':
			for (let users of participants) {
				let user = this.getJid(users?.phoneNumber || users.id);
				text = (
					action === 'promote'
						? chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```'
						: chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```'
				)
					.replace('@user', '@' + user.split('@')[0])
					.replace('@subject', this.getName(id))
					.replace('@desc', groupMetadata.desc || '');
				if (chat.detect) this.sendMessage(id, { text, mentions: this.parseMention(text) });
			}
			break;
	}
}
/**
 * Handle groups update
 * @param {import('baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate
 */
export async function groupsUpdate(groupsUpdate) {
	for (const groupUpdate of groupsUpdate) {
		const id = groupUpdate.id;
		if (!id) continue;
		let chats = global.db.data.chats[id],
			text = '';
		if (!chats?.detect) continue;
		if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc);
		if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject);
		if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon);
		if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke);
		if (!text) continue;
		await this.sendMessage(id, { text, mentions: this.parseMention(text) });
	}
}

export async function deleteUpdate(message) {
	try {
		const { fromMe, id, participant } = message;
		if (fromMe) return;
		let msg = this.serializeM(this.loadMessage(id));
		if (!msg) return;
		let chat = global.db.data.chats[msg.chat];
		if (!chat.delete) return;
		await this.reply(
			msg.chat,
			`
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(),
			msg,
			{
				mentions: [participant],
			}
		);
		this.copyNForward(msg.chat, msg).catch((e) => console.log(e, msg));
	} catch (e) {
		console.error(e);
	}
}

global.dfail = (type, m, conn) => {
	let msg = {
		rowner: 'Only Developer - Command ini hanya untuk developer bot',
		owner: 'Only Owner - Command ini hanya untuk owner bot',
		premium: 'Only Premium - Command ini hanya untuk pengguna premium',
		group: 'Group Chat - Command ini hanya bisa dipakai di dalam grup',
		private: 'Private Chat - Command ini hanya bisa dipakai di private chat',
		admin: 'Only Admin - Command ini hanya untuk admin grup',
		botAdmin: 'Only Bot Admin - Command ini hanya bisa digunakan ketika bot menjadi admin',
		unreg: 'Halo kak! 👋 Anda harus mendaftar ke database bot dulu sebelum menggunakan fitur ini\nCara daftarnya tulis .daftar Nama.umur',
		restrict: 'Restrict - Fitur restrict belum diaktifkan di chat ini',
	}[type];
	if (msg) return conn.reply(m.chat, msg, m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'handler.js'"));
	if (global.reloadHandler) console.log(await global.reloadHandler());
});


---

// index.js
console.log('🐾 Starting...');

import { Worker } from 'worker_threads';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { watchFile, unwatchFile } from 'fs';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rl = readline.createInterface(process.stdin, process.stdout);

let worker = null;
let running = false;
let restartTimer = null;

function start(file) {
	if (running) return;
	running = true;
	const full = join(__dirname, file);

	if (worker) worker.terminate();
	worker = new Worker(full);
	if (restartTimer) {
		clearTimeout(restartTimer);
		restartTimer = null;
	}

	worker.on('message', (msg) => {
		console.log('[MESSAGE]', msg);

		if (msg === 'restart' || msg === 'reset') {
			restart();
		}
	});

	worker.on('exit', (code) => {
		console.log('❗ Worker exited with code', code);
		running = false;
		if (code !== 0) {
			restartTimer = setTimeout(
				() => {
					console.log('⏳ Auto restart...');
					restart();
				},
				30 * 60 * 1000
			);
		}
		watchFile(full, () => {
			unwatchFile(full);
			console.log('♻️ File updated → Restarting...');
			start(file);
		});
	});

	if (!rl.listenerCount('line')) {
		rl.on('line', (line) => {
			const cmd = line.trim().toLowerCase();
			if (!cmd) return;

			if (cmd === 'exit') {
				console.log('⛔ Exiting...');
				worker?.terminate();
				process.exit(0);
			}
			if (cmd === 'restart' || cmd === 'reset') {
				console.log('🍃Restart...');
				restart();
			}

			worker?.postMessage(cmd);
		});
	}
}

function restart() {
	if (worker) {
		try {
			worker.terminate();
		} catch {}
	}
	running = false;

	start('main.js');
}

start('main.js');


---

// main.js
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import './config.js';

import { createRequire } from 'module'; // Bring in the ability to create the 'require' method
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = process.platform !== 'win32') {
	return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
	return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
	return createRequire(dir);
};

import fs from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { format } from 'util';
import { parentPort } from 'worker_threads';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import chalk from 'chalk';
import pino from 'pino';
import syntaxerror from 'syntax-error';
import Database from 'better-sqlite3';

import useSQLiteAuthState from './lib/useSQLite.js';

import { Browsers, fetchLatestWaWebVersion, makeCacheableSignalKeyStore } from 'baileys';

protoType();
serialize();

const __dirname = global.__dirname(import.meta.url);

global.prefix = new RegExp('^[' + '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-'.replace(/[|\\{}[\]()^$+*?.-]/g, '\\$&') + ']');
global.db = {
	sqlite: null,
	data: null,
};

global.loadDatabase = function () {
	if (!global.db.sqlite) {
		const dbFile = path.resolve('./data/database.db');
		fs.mkdirSync(path.dirname(dbFile), { recursive: true });

		global.db.sqlite = new Database(dbFile);
		global.db.sqlite.pragma('journal_mode = WAL');
		global.db.sqlite.pragma('synchronous = NORMAL');
		global.db.sqlite.pragma('wal_autocheckpoint = 1000');

		global.db.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS database (
        id INTEGER PRIMARY KEY,
        data TEXT
      )
    `);
	}

	if (global.db.data !== null) return;

	global.db.data = {
		users: {},
		chats: {},
		stats: {},
		msgs: {},
		sticker: {},
		settings: {},
	};

	const row = global.db.sqlite.prepare('SELECT data FROM database WHERE id = 1').get();

	if (row?.data) {
		try {
			Object.assign(global.db.data, JSON.parse(row.data));
		} catch {
			console.error('[DB] JSON rusak, reset database');
		}
	} else {
		global.db.sqlite.prepare('INSERT OR IGNORE INTO database (id, data) VALUES (1, ?)').run(JSON.stringify(global.db.data));
	}
};
loadDatabase();

const { state, saveCreds } = await useSQLiteAuthState('sessions');
const { version } = await fetchLatestWaWebVersion();
const connectionOptions = {
	auth: {
		creds: state.creds,
		keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'fatal', stream: 'store' })),
	},
	version,
	logger: pino({ level: 'silent' }),
	browser: Browsers.ubuntu('Edge'),
	generateHighQualityLinkPreview: true,
	syncFullHistory: false,
	shouldSyncHistoryMessage: () => false,
	markOnlineOnConnect: true,
	connectTimeoutMs: 60_000,
	keepAliveIntervalMs: 30_000,
	retryRequestDelayMs: 250,
	maxMsgRetryCount: 5,
	cachedGroupMetadata: (jid) => conn.chats[jid],
};

global.conn = makeWASocket(connectionOptions);

if (!conn.authState.creds.registered) {
	console.log(chalk.bgWhite(chalk.blue('Generating code...')));
	try {
		setTimeout(async () => {
			let code = await conn.requestPairingCode(global.pairingNumber);
			code = code?.match(/.{1,4}/g)?.join('-') || code;
			console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)));
		}, 3000);
	} catch (e) {
		console.log(e);
		fs.rmSync('./sessions', { recursive: true, force: true });
		parentPort.postMessage('restart');
	}
}

if (global.db) {
	setInterval(() => {
		if (global.db.data) {
			global.db.sqlite.prepare('UPDATE database SET data = ? WHERE id = 1').run(JSON.stringify(global.db.data));
		}

		if ((global.support || {}).find) {
			const tmp = [tmpdir(), 'tmp'];
			tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']));
		}
	}, 5000);
}

async function connectionUpdate(update) {
	const { receivedPendingNotifications, connection, lastDisconnect, isOnline } = update;

	if (connection === 'connecting') console.log(chalk.redBright('⚡ Mengaktifkan Bot, Mohon tunggu sebentar...'));

	if (connection === 'open') console.log(chalk.green('✅ Tersambung'));

	if (isOnline === true) console.log(chalk.green('Status Aktif'));
	else if (isOnline === false) console.log(chalk.red('Status Mati'));

	if (receivedPendingNotifications) console.log(chalk.yellow('Menunggu Pesan Baru'));

	// if (connection === 'close') console.log(chalk.red('⏱️ Koneksi terputus & mencoba menyambung ulang...'))

	const output = lastDisconnect?.error?.output;
	if (output?.payload) {
		if (output.statusCode === 401) {
			console.log(chalk.red('Session logged out. Recreate session...'));
			fs.rmSync('./sessions', { recursive: true, force: true });
			parentPort.postMessage('restart');
			return;
		} else if (output.statusCode === 403) {
			console.log(chalk.red('WhatsApp account banned :D'));
			process.exit(0);
		} else if (output.statusCode === 515) {
			console.log(chalk.yellow('Restart Required, Restarting....'));
		} else if (output.statusCode === 428) {
			console.log(chalk.yellow('Connection closed, Restarting....'));
		} else if (output.statusCode === 408) {
			console.log(chalk.yellow('Connection timed out, Restarting....'));
		} else {
			console.log(chalk.red(output.payload.message));
		}
		await global.reloadHandler(true);
	}

	if (!global.db.data) await global.loadDatabase();
}

// let strQuot = /(["'])(?:(?=(\\?))\2.)*?\1/

let isInit = true;
let handler = await import('./handler.js');
global.reloadHandler = async function (restatConn) {
	try {
		const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
		if (Object.keys(Handler || {}).length) handler = Handler;
	} catch (e) {
		console.error(e);
	}
	if (restatConn) {
		const oldChats = global.conn.chats;
		try {
			global.conn.ws.close();
		} catch {}
		conn.ev.removeAllListeners();
		global.conn = makeWASocket(connectionOptions, { chats: oldChats });
		isInit = true;
	}
	if (!isInit) {
		conn.ev.off('messages.upsert', conn.handler);
		conn.ev.off('group-participants.update', conn.participantsUpdate);
		conn.ev.off('groups.update', conn.groupsUpdate);
		conn.ev.off('message.delete', conn.onDelete);
		conn.ev.off('connection.update', conn.connectionUpdate);
		conn.ev.off('creds.update', conn.credsUpdate);
	}

	conn.welcome =
		'✦━━━━━━[ *WELCOME* ]━━━━━━✦\n\n┏––––––━━━━━━━━•\n│⫹⫺ @subject\n┣━━━━━━━━┅┅┅\n│( 👋 Hallo @user)\n├[ *INTRO* ]—\n│ *Nama:* \n│ *Umur:* \n│ *Gender:*\n┗––––––━━┅┅┅\n\n––––––┅┅ *DESCRIPTION* ┅┅––––––\n@desc';
	conn.bye = '✦━━━━━━[ *GOOD BYE* ]━━━━━━✦\nSayonara *@user* 👋( ╹▽╹ )';
	conn.spromote = '@user sekarang admin!';
	conn.sdemote = '@user sekarang bukan admin!';
	conn.sDesc = 'Deskripsi telah diubah ke \n@desc';
	conn.sSubject = 'Judul grup telah diubah ke \n@subject';
	conn.sIcon = 'Icon grup telah diubah!';
	conn.sRevoke = 'Link group telah diubah ke \n@revoke';
	conn.handler = handler.handler.bind(global.conn);
	conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
	conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
	conn.onDelete = handler.deleteUpdate.bind(global.conn);
	conn.connectionUpdate = connectionUpdate.bind(global.conn);
	conn.credsUpdate = saveCreds.bind(global.conn);

	conn.ev.on('call', async (calls) => {
		for (const call of calls) {
			const { id, from, status } = call;
			const settings = global.db.data.settings[conn.user.jid];
			if (status === 'offer' && settings.anticall) {
				await conn.rejectCall(id, from);
				console.log('Menolak panggilan dari', from);
			}
		}
	});

	conn.ev.on('messages.upsert', conn.handler);
	conn.ev.on('group-participants.update', conn.participantsUpdate);
	conn.ev.on('groups.update', conn.groupsUpdate);
	conn.ev.on('message.delete', conn.onDelete);
	conn.ev.on('connection.update', conn.connectionUpdate);
	conn.ev.on('creds.update', conn.credsUpdate);
	isInit = false;
	return true;
};

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};
async function filesInit() {
	for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
		try {
			let file = global.__filename(join(pluginFolder, filename));
			const module = await import(file);
			global.plugins[filename] = module.default || module;
		} catch (e) {
			conn.logger.error(`❌ Failed to load plugins ${filename}: ${e}`);
			delete global.plugins[filename];
		}
	}
}
filesInit()
	.then((_) => console.log(`Successfully Loaded ${Object.keys(global.plugins).length} Plugins`))
	.catch(console.error);

global.reload = async (_ev, filename) => {
	if (pluginFilter(filename)) {
		let dir = global.__filename(join(pluginFolder, filename), true);
		if (filename in global.plugins) {
			if (fs.existsSync(dir)) conn.logger.info(`re - require plugin '${filename}'`);
			else {
				conn.logger.warn(`deleted plugin '${filename}'`);
				return delete global.plugins[filename];
			}
		} else conn.logger.info(`requiring new plugin '${filename}'`);
		let err = syntaxerror(fs.readFileSync(dir), filename, {
			sourceType: 'module',
			allowAwaitOutsideFunction: true,
		});
		if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
		else
			try {
				const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
				global.plugins[filename] = module.default || module;
			} catch (e) {
				conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
			} finally {
				global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
			}
	}
};
Object.freeze(global.reload);
fs.watch(pluginFolder, global.reload);
await global.reloadHandler();

// Quick Test
async function _quickTest() {
	let test = await Promise.all(
		[
			spawn('ffmpeg'),
			spawn('ffprobe'),
			spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
			spawn('convert'),
			spawn('magick'),
			spawn('gm'),
			spawn('find', ['--version']),
		].map((p) => {
			return Promise.race([
				new Promise((resolve) => {
					p.on('close', (code) => {
						resolve(code !== 127);
					});
				}),
				new Promise((resolve) => {
					p.on('error', (_) => resolve(false));
				}),
			]);
		})
	);
	let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
	//console.log(test)
	let s = (global.support = {
		ffmpeg,
		ffprobe,
		ffmpegWebp,
		convert,
		magick,
		gm,
		find,
	});
	// require('./lib/sticker').support = s
	Object.freeze(global.support);

	if (!s.ffmpeg) conn.logger.warn('Please install ffmpeg for sending videos (apt install ffmpeg)');
	if (s.ffmpeg && !s.ffmpegWebp) conn.logger.warn('Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)');
	if (!s.convert && !s.magick && !s.gm) conn.logger.warn('Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (apt install imagemagick)');
}

_quickTest()
	.then(() => conn.logger.info('☑️ Quick Test Done'))
	.catch(console.error);

function closeDB() {
	try {
		global.db.sqlite.close();
		console.log('Database closed');
	} catch (e) {
		console.error(e);
	}
}
process.on('uncaughtException', console.error);
process.on('exit', closeDB);
process.on('SIGINT', closeDB);
process.on('SIGTERM', closeDB);


---

// plugins/main-menu.js
import moment from 'moment-timezone';
import * as levelling from '../lib/levelling.js';
import fs from 'fs';

const handler = async (m, { conn, usedPrefix: _p, isOwner, args }) => {
	const allTags = {
		main: 'Main Menu',
		ai: 'Ai Menu',
		downloader: 'Downloader Menu',
		database: 'Database Menu',
		sticker: 'Sticker Menu',
		tools: 'Tools Menu',
		rpg: 'Rpg Menu',
		fun: 'Fun Menu',
		group: 'Group Menu',
		xp: 'XP & Level Menu',
		info: 'Info Menu',
		owner: 'Owner Menu',
	};

	let teks = (args[0] || '').toLowerCase();
	let tags = {};

	if (!Object.keys(allTags).includes(teks) && !Object.values(allTags).some((v) => v.toLowerCase().includes(teks))) {
		teks = 'all';
	}

	tags = teks === 'all' ? { ...allTags } : Object.fromEntries(Object.entries(allTags).filter(([k, v]) => k === teks || v.toLowerCase().includes(teks)));

	if (!isOwner) delete tags.owner;
	if (!m.isGroup) delete tags.group;

	const defaultMenu = {
		before: `
┌ ◦ *[ %me ]*
├ *${ucapan()} %name*
│
│ ◦ Limit : *%limit*
│ ◦ Role : *%role*
│ ◦ Level : *%level (%exp / %maxexp)* [%xp4levelup]
│ ◦ %totalexp XP secara Total
│
│ ◦ Tanggal: *%week, %date*
│ ◦ Uptime: *%uptime*
│ ◦ Database: %rtotalreg dari %totalreg
│
│ ◦ Note :
│ ◦ *🄿* = Premium
│ ◦ *🄻* = Limit
└────
%readmore`.trim(),
		header: '┌ ◦ *[ %category ]*',
		body: '│ ◦ %cmd %flags',
		footer: '└—',
		after: '',
	};

	try {
		const plugins = Object.values(global.plugins).filter((p) => !p.disabled);
		const help = plugins.map((p) => ({
			help: Array.isArray(p.help) ? p.help : [p.help],
			tags: Array.isArray(p.tags) ? p.tags : [p.tags],
			prefix: 'customPrefix' in p,
			limit: p.limit ? '🄻' : '',
			premium: p.premium ? '🄿' : '',
			owner: p.owner ? '🄾' : '',
		}));

		const text = [
			defaultMenu.before,
			...Object.keys(tags).map((tag) => {
				const items = help
					.filter((p) => p.tags.includes(tag))
					.flatMap((p) =>
						p.help.map((h) => {
							const cmd = p.prefix ? h : `${_p}${h}`;
							const flags = [p.limit, p.premium, p.owner, p.rowner].join(' ');
							return defaultMenu.body
								.replace(/%cmd/g, cmd)
								.replace(/%flags/g, flags)
								.trim();
						})
					)
					.join('\n');
				return `${defaultMenu.header.replace(/%category/g, tags[tag])}\n${items}\n${defaultMenu.footer}`;
			}),
			defaultMenu.after,
		].join('\n');

		let { exp, limit, money, level, role, registered } = global.db.data.users[m.sender];
		let { min, xp, max } = levelling.xpRange(level, global.multiplier);
		let name = registered ? global.db.data.users[m.sender].name : conn.getName(m.sender);
		let _uptime = process.uptime() * 1000;
		let uptime = clockString(_uptime);
		let totalreg = Object.keys(global.db.data.users).length;
		let rtotalreg = Object.values(global.db.data.users).filter((user) => user.registered == true).length;
		let d = new Date(new Date() + 3600000);
		let locale = 'id-ID';
		let week = d.toLocaleDateString(locale, { weekday: 'long' });
		let date = d.toLocaleDateString(locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});

		const replace = {
			'%': '',
			p: _p,
			uptime,
			me: conn.user.name,
			exp: exp - min,
			maxexp: xp,
			totalexp: exp,
			xp4levelup: max - exp <= 0 ? `Siap untuk *${_p}levelup*` : `${max - exp} XP lagi untuk levelup`,
			level,
			limit,
			name,
			money,
			week,
			date,
			totalreg,
			rtotalreg,
			role,
			readmore: readMore,
		};

		conn.sendMessage(
			m.chat,
			{
				document: Buffer.from('YAW :3'),
				fileName: m.pushName,
				fileLength: Date.now(),
				pageCount: new Date().getFullYear(),
				caption: style(text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])),
				contextInfo: {
					mentionedJid: conn.parseMention(text),
					forwardingScore: 10,
					isForwarded: true,
					externalAdReply: {
						title: global.namebot,
						body: `${global.namebot} By ${global.author}`,
						thumbnail: fs.readFileSync('./media/menu.jpg'),
						thumbnailUrl: global.source,
						sourceUrl: global.source,
						mediaType: 1,
						renderLargerThumbnail: true,
					},
					forwardedNewsletterMessageInfo: {
						newsletterJid: '120363404755087104@newsletter',
						serverMessageId: 109,
						newsletterName: global.namebot,
					},
				},
			},
			{ quoted: m }
		);
	} catch (e) {
		console.error(e);
		m.reply('Terjadi kesalahan saat menampilkan menu.');
	}
};

handler.help = ['menu'];
handler.command = /^(menu|help|\?)$/i;
handler.exp = 3;

export default handler;

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function style(text, style = 1) {
	const xStr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
	const yStr = {
		1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ1234567890',
	}[style].split('');
	return text
		.toLowerCase()
		.split('')
		.map((char) => {
			const i = xStr.indexOf(char);
			return i !== -1 ? yStr[i] : char;
		})
		.join('');
}

function clockString(ms) {
	let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
	let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
	let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
	return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(':');
}

function ucapan() {
	const time = moment.tz('Asia/Jakarta').format('HH');
	let res = 'Selamat dinihari';
	if (time >= 4) {
		res = 'Selamat pagi';
	}
	if (time > 10) {
		res = 'Selamat siang';
	}
	if (time >= 15) {
		res = 'Selamat sore';
	}
	if (time >= 18) {
		res = 'Selamat malam';
	}
	return res;
}


---

// plugins/main-enable.js
let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
	const isEnable = /^(true|enable|(turn)?on|1)$/i.test(command);
	const chat = global.db.data.chats[m.chat];
	const user = global.db.data.users[m.sender];
	const settings = global.db.data.settings[conn.user.jid];
	let type = (args[0] || '').toLowerCase();
	let isAll = false;
	let isUser = false;

	switch (type) {
		case 'welcome':
			if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
			chat.welcome = isEnable;
			break;
		case 'detect':
			if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
			chat.detect = isEnable;
			break;
		case 'antidelete':
		case 'delete':
			if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
			chat.delete = isEnable;
			break;
		case 'autolevelup':
			isUser = true;
			user.autolevelup = isEnable;
			break;
		case 'autoread':
			isAll = true;
			if (!isOwner) return global.dfail('owner', m, conn);
			settings.autoread = isEnable;
			break;
		case 'public':
			isAll = true;
			if (!isOwner) return global.dfail('owner', m, conn);
			settings.public = isEnable;
			break;
		case 'gconly':
		case 'grouponly':
			isAll = true;
			if (!isOwner) return global.dfail('owner', m, conn);
			settings.gconly = isEnable;
			break;
		case 'anticall':
			isAll = true;
			if (!isOwner) return global.dfail('owner', m, conn);
			settings.anticall = isEnable;
			break;
		default:
			if (!/[01]/.test(command))
				return m.reply(
					`
*Daftar opsi yang bisa diatur:*

*Untuk User:*
- autolevelup

*Untuk Admin Grup:*
- welcome
- detect
- antidelete
${
	isOwner
		? `
*Untuk Owner Bot:*
- autoread
- self
- anticall
- gconly
`
		: ''
}
*Contoh penggunaan:*
- ${usedPrefix}enable welcome
- ${usedPrefix}disable welcome
`.trim()
				);
			throw false;
	}

	m.reply(`*${type}* berhasil di *${isEnable ? 'aktifkan' : 'nonaktifkan'}* ${isAll ? 'untuk bot' : isUser ? '' : 'untuk chat ini'}`);
};

handler.help = ['enable', 'disable'];
handler.tags = ['main'];
handler.command = /^((en|dis)able|(true|false)|(turn)?(on|off)|[01])$/i;

export default handler;


---

// lib/converter.js
import { promises } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
	try {
		const tmp = join(global.__dirname(import.meta.url), '../tmp', Date.now() + '.' + ext);
		const out = tmp + '.' + ext2;

		await promises.writeFile(tmp, buffer);

		await new Promise((resolve, reject) => {
			spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
				.on('error', reject)
				.on('close', (code) => {
					if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}`));
					else resolve();
				});
		});

		const data = await promises.readFile(out);

		return {
			data,
			filename: out,
			delete() {
				return promises.unlink(out);
			},
		};
	} finally {
		try {
			await promises.unlink(tmp);
		} catch {}
	}
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toPTT(buffer, ext) {
	return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg');
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toAudio(buffer, ext) {
	return ffmpeg(buffer, ['-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', '-f', 'mp3'], ext, 'opus');
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toVideo(buffer, ext) {
	return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

export { toAudio, toPTT, toVideo, ffmpeg };


---

// lib/database.js
export default function (m, conn) {
	try {
		const defaultUser = {
			name: m.name,
			exp: 0,
			money: 0,
			health: 100,
			level: 1,
			limit: 20,
			age: -1,
			regTime: -1,
			afk: -1,
			afkReason: '',
			warn: 0,
			role: 'Newbie',
			premium: false,
			premiumTime: 0,
			registered: false,
			banned: false,
			autolevelup: false,
			// Bibit
			bibitapel: 0,
			bibitjeruk: 0,
			bibitdurian: 0,
			bibitmangga: 0,
			bibitpisang: 0,
			// Buah
			apel: 0,
			jeruk: 0,
			durian: 0,
			mangga: 0,
			pisang: 0,
			// Hewan
			banteng: 0,
			harimau: 0,
			gajah: 0,
			kambing: 0,
			panda: 0,
			buaya: 0,
			kerbau: 0,
			sapi: 0,
			monyet: 0,
			babihutan: 0,
			babi: 0,
			ayam: 0,

			ikan: 0,
			lele: 0,
			nila: 0,
			bawal: 0,
			udang: 0,
			paus: 0,
			kepiting: 0,
			// Tools
			sword: 0,
			pickaxe: 0,
			axe: 0,
			fishingrod: 0,
			armor: 0,
			atm: 0,
			// Durability
			sworddurability: 0,
			pickaxedurability: 0,
			axedurability: 0,
			fishingroddurability: 0,
			armordurability: 0,
			fullatm: 0,

			// Items
			potion: 0,
			string: 0,
			wood: 0,
			rock: 0,
			coal: 0,
			iron: 0,
			diamond: 0,
			emerald: 0,
			trash: 0,
			common: 0,
			uncommon: 0,
			mythic: 0,
			legendary: 0,
			// Food
			ayambakar: 0,
			ayamgoreng: 0,
			oporayam: 0,
			gulaiayam: 0,
			steak: 0,
			rendang: 0,
			babipanggang: 0,
			ikanbakar: 0,
			lelebakar: 0,
			nilabakar: 0,
			bawalbakar: 0,
			udangbakar: 0,
			pausbakar: 0,
			kepitingbakar: 0,
			// LAST ACTION
			lastadventure: 0,
			lastbansos: 0,
			lastberburu: 0,
			lastdagang: 0,
			lastduel: 0,
			lastrampok: 0,
			lastmining: 0,
			lastnebang: 0,
			lastnguli: 0,
			lastclaim: 0,
			lastweekly: 0,
			lastmonthly: 0,
		};

		const defaultChat = {
			sWelcome: '',
			sBye: '',
			sPromote: '',
			sDemote: '',
			isBanned: false,
			welcome: false,
			detect: false,
			delete: false,
		};

		const defaultSettings = {
			public: true,
			autoread: true,
			anticall: true,
			gconly: true,
		};

		// === USER ===
		if (m.sender.endsWith('@s.whatsapp.net')) {
			if (!global.db.data.users[m.sender])
				global.db.data.users[m.sender] = {
					...defaultUser,
				};
			else (Object.assign(defaultUser, global.db.data.users[m.sender]), (global.db.data.users[m.sender] = defaultUser));
		}

		// === GROUP ===
		if (m.isGroup) {
			if (!global.db.data.chats[m.chat])
				global.db.data.chats[m.chat] = {
					...defaultChat,
				};
			else (Object.assign(defaultChat, global.db.data.chats[m.chat]), (global.db.data.chats[m.chat] = defaultChat));
		}

		// === SETTINGS ===
		if (!global.db.data.settings[conn.user.jid])
			global.db.data.settings[conn.user.jid] = {
				...defaultSettings,
			};
		else (Object.assign(defaultSettings, global.db.data.settings[conn.user.jid]), (global.db.data.settings[conn.user.jid] = defaultSettings));
	} catch (e) {
		console.error(e);
	}
}


---

// lib/exif.js
import fs from 'fs';
import { tmpdir } from 'os';
import Crypto from 'crypto';
import ff from 'fluent-ffmpeg';
import webp from 'node-webpmux';
import path from 'path';

const temp = process.platform === 'win32' ? process.env.TEMP : tmpdir();

export async function imageToWebp(media) {
	const tmpFileIn = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'png'}`);
	const tmpFileOut = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

	fs.writeFileSync(tmpFileIn, media.data);

	try {
		await new Promise((resolve, reject) => {
			ff(tmpFileIn)
				.on('error', reject)
				.on('end', () => resolve(true))
				//.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512`]).toFormat('webp').save(tmpFileOut)
				.addOutputOptions([
					'-vcodec',
					'libwebp',
					'-vf',
					"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=000000 [p]; [b][p] paletteuse",
				])
				.toFormat('webp')
				.saveToFile(tmpFileOut);
		});

		fs.promises.unlink(tmpFileIn);
		const buff = fs.readFileSync(tmpFileOut);
		fs.promises.unlink(tmpFileOut);

		return buff;
	} catch (e) {
		fs.existsSync(tmpFileIn) ? fs.promises.unlink(tmpFileIn) : '';
		fs.existsSync(tmpFileOut) ? fs.promises.unlink(tmpFileOut) : '';
		throw e;
	}
}

export async function videoToWebp(media) {
	const tmpFileIn = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'mp4'}`);
	const tmpFileOut = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

	fs.writeFileSync(tmpFileIn, media.data);

	try {
		await new Promise((resolve, reject) => {
			ff(tmpFileIn)
				.on('error', reject)
				.on('end', () => resolve(true))
				//.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512`]).toFormat('webp').save(tmpFileOut)
				.addOutputOptions([
					'-vcodec',
					'libwebp',
					'-vf',
					"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=000000 [p]; [b][p] paletteuse",
					'-loop',
					'0',
					'-ss',
					'00:00:00',
					'-t',
					'00:00:05',
					'-preset',
					'default',
					'-an',
					'-vsync',
					'0',
				])
				.toFormat('webp')
				.saveToFile(tmpFileOut);
		});

		fs.promises.unlink(tmpFileIn);
		const buff = fs.readFileSync(tmpFileOut);
		fs.promises.unlink(tmpFileOut);

		return buff;
	} catch (e) {
		fs.existsSync(tmpFileIn) ? fs.promises.unlink(tmpFileIn) : '';
		fs.existsSync(tmpFileOut) ? fs.promises.unlink(tmpFileOut) : '';
		throw e;
	}
}

export async function writeExif(media, metadata) {
	let wMedia = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media) : /video/.test(media.mimetype) ? await videoToWebp(media) : '';

	if (metadata && Object?.keys(metadata).length !== 0) {
		const img = new webp.Image();
		const json = {
			'sticker-pack-id': metadata?.packId || `hisoka-${Date.now()}`,
			'sticker-pack-name': metadata?.packName || '',
			'sticker-pack-publisher': metadata?.packPublish || '',
			'android-app-store-link': metadata?.androidApp || 'https://play.google.com/store/apps/details?id=com.bitsmedia.android.muslimpro',
			'ios-app-store-link': metadata?.iOSApp || 'https://apps.apple.com/id/app/muslim-pro-al-quran-adzan/id388389451?|=id',
			emojis: metadata?.emojis || ['😋', '😎', '🤣', '😂', '😁'],
			'is-avatar-sticker': metadata?.isAvatar || 0,
		};
		const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
		const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
		const exif = Buffer.concat([exifAttr, jsonBuff]);
		exif.writeUIntLE(jsonBuff.length, 14, 4);
		await img.load(wMedia);
		img.exif = exif;

		return await img.save(null);
	}
}


---

// lib/levelling.js
export const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;
export function xpRange(level, multiplier = global.multiplier || 1) {
	if (level < 0) throw new TypeError('level cannot be negative value');
	level = Math.floor(level);
	let min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1;
	let max = Math.round(Math.pow(++level, growth) * multiplier);
	return {
		min,
		max,
		xp: max - min,
	};
}
export function findLevel(xp, multiplier = global.multiplier || 1) {
	if (xp === Infinity) return Infinity;
	if (isNaN(xp)) return NaN;
	if (xp <= 0) return -1;
	let level = 0;
	do level++;
	while (xpRange(level, multiplier).min <= xp);
	return --level;
}
export function canLevelUp(level, xp, multiplier = global.multiplier || 1) {
	if (level < 0) return false;
	if (xp === Infinity) return true;
	if (isNaN(xp)) return false;
	if (xp <= 0) return false;
	return level < findLevel(xp, multiplier);
}


---

// lib/print.js
import { WAMessageStubType } from 'baileys';
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';

export default async function (m, conn = { user: {} }) {
	const _name = conn.getName(m.sender);
	const sender = PhoneNumber('+' + m.sender.split('@')[0]).getNumber('international') + (_name ? ' ~' + _name : '');
	const chat = conn.getName(m.chat);
	const user = global.db.data.users[m.sender];
	const mentioned = m?.message?.[m.mtype]?.contextInfo?.mentionedJid ?? [];
	const me = PhoneNumber('+' + conn.user?.jid.split('@')[0]).getNumber('international');
	const filesize =
		(m.msg
			? m.msg.vcard
				? m.msg.vcard.length
				: m.msg.fileLength
					? m.msg.fileLength.low || m.msg.fileLength
					: m.msg.axolotlSenderKeyDistributionMessage
						? m.msg.axolotlSenderKeyDistributionMessage.length
						: m.text
							? m.text.length
							: 0
			: m.text
				? m.text.length
				: 0) || 0;
	console.log(
		`
\n▣ ${chalk.redBright('%s')}\n│⏰ ${chalk.black(chalk.bgYellow('%s'))}\n│📑 ${chalk.black(chalk.bgGreen('%s'))}\n│📊 ${chalk.magenta('%s [%s %sB]')}
│📤 ${chalk.green('%s')}\n│📃 ${chalk.yellow('%s%s')}\n│📥 ${chalk.green('%s')}\n│💬 ${chalk.black(chalk.bgYellow('%s'))}
▣──────···
`.trim(),
		me + ' ~' + conn.user.name,
		(m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date()).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
		m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
		filesize,
		filesize === 0 ? 0 : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
		['', ...'KMGTP'][Math.floor(Math.log(filesize) / Math.log(1000))] || '',
		sender,
		m ? m.exp : '?',
		user ? '|' + user.exp + '|' + user.limit : '' + ('|' + user.level),
		m.chat + (chat ? ' ~' + chat : ''),
		m.mtype
			? m.mtype
					.replace(/message$/i, '')
					.replace('audio', m.msg.ptt ? 'PTT' : 'audio')
					.replace(/^./, (v) => v.toUpperCase())
			: ''
	);
	if (typeof m.text === 'string' && m.text) {
		let log = m.text.replace(/\u200e+/g, '');
		let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g;
		let mdFormat =
			(depth = 4) =>
			(_, type, text, monospace) => {
				let types = {
					_: 'italic',
					'*': 'bold',
					'~': 'strikethrough',
				};
				text = text || monospace;
				let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)));
				// console.log({ depth, type, formatted, text, monospace }, formatted)
				return formatted;
			};
		log = log.replace(mdRegex, mdFormat(4));
		if (mentioned) for (let users of mentioned) log = log.replace('@' + users.split('@')[0], chalk.blueBright('@' + conn.getName(users)));
		console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log);
	}
	if (m.messageStubParameters)
		console.log(
			m.messageStubParameters
				.map((jid) => {
					jid = conn.decodeJid(jid);
					let name = conn.getName(jid);
					return chalk.gray(PhoneNumber('+' + jid.split('@')[0]).getNumber('international') + (name ? ' ~' + name : ''));
				})
				.join(', ')
		);
	if (/document/i.test(m.mtype)) console.log(`🗂️ ${m.msg.fileName || m.msg.displayName || 'Document'}`);
	else if (/ContactsArray/i.test(m.mtype)) console.log('👨‍👩‍👧‍👦 ');
	else if (/contact/i.test(m.mtype)) console.log(`👨 ${m.msg.displayName || ''}`);
	else if (/audio/i.test(m.mtype)) {
		const duration = m.msg.seconds;
		console.log(
			`${m.msg.ptt ? '🎤 (PTT ' : '🎵 ('}AUDIO) ${Math.floor(duration / 60)
				.toString()
				.padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`
		);
	}
	console.log();
}

let file = global.__filename(import.meta.url);
watchFile(file, () => {
	console.log(chalk.redBright("Update 'lib/print.js'"));
});


---

// lib/simple.js
import path from 'path';
import fs from 'fs';
import util from 'util';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import PhoneNumber from 'awesome-phonenumber';
import { fileTypeFromBuffer } from 'file-type';

import store from './store.js';
import { toAudio } from './converter.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('baileys')}
 */
import MakeWASocket, {
	proto,
	delay,
	downloadContentFromMessage,
	jidDecode,
	areJidsSameUser,
	generateForwardMessageContent,
	generateWAMessageFromContent,
	generateWAMessage,
	getBinaryNodeChild,
	WAMessageStubType,
	extractMessageContent,
	prepareWAMessageMedia,
} from 'baileys';

export function makeWASocket(connectionOptions, options = {}) {
	/**
	 * @type {import('baileys').WASocket}
	 */
	let conn = MakeWASocket(connectionOptions);

	const OrigMsg = conn.sendMessage.bind(conn);
	let sock = Object.defineProperties(conn, {
		chats: {
			value: { ...(options.chats || {}) },
			writable: true,
		},
		sendMessage: {
			value(jid, content, options = {}) {
				const text = content?.text || content?.caption || '';

				return OrigMsg(
					jid,
					{
						...content,
						mentions: content.mentions || conn.parseMention(text),
					},
					{
						...options,
						useCachedGroupMetadata: options.useCachedGroupMetadata || true,
					}
				);
			},
		},
		decodeJid: {
			value(jid) {
				if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null;
				return jid.decodeJid();
			},
		},
		profilePictureUrl: {
			async value(jid, type = 'image', query = 'url') {
				try {
					const result = await conn.query(
						{
							tag: 'iq',
							attrs: {
								target: jid,
								to: 's.whatsapp.net',
								type: 'get',
								xmlns: 'w:profile:picture',
							},
							content: [{ tag: 'picture', attrs: { type, query } }],
						},
						15000
					);
					const child = getBinaryNodeChild(result, 'picture');
					return child?.content || child?.attrs?.url;
				} catch {
					return query == 'buffer' ? fs.readFileSync(path.resolve(__dirname, '../media/avatar_contact.png')) : 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
				}
			},
		},
		getJid: {
			value(sender) {
				sender = conn.decodeJid(sender);
				if (!conn.isLid) conn.isLid = new Map();
				if (conn.isLid.has(sender)) return conn.isLid.get(sender);
				if (!sender?.endsWith('@lid')) return sender;

				for (const chat of Object.values(conn.chats)) {
					if (!chat?.metadata?.participants) continue;
					const user = chat.metadata.participants.find((p) => p.lid === sender || p.id === sender);
					if (user) {
						const jid = user?.phoneNumber || user?.jid || user?.id;
						conn.isLid.set(sender, jid);
						return jid;
					}
				}

				return sender;
			},
		},
		logger: {
			get() {
				let dates = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
				return {
					info(...args) {
						console.log(chalk.bold.bgRgb(51, 204, 51)('INFO '), `[${chalk.rgb(255, 255, 255)(dates)}]:`, chalk.cyan(util.format(...args)));
					},
					error(...args) {
						console.log(chalk.bold.bgRgb(247, 38, 33)('ERROR '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.rgb(255, 38, 0)(util.format(...args)));
					},
					warn(...args) {
						console.log(chalk.bold.bgRgb(255, 153, 0)('WARNING '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.redBright(util.format(...args)));
					},
					trace(...args) {
						console.log(chalk.grey('TRACE '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(util.format(...args)));
					},
					debug(...args) {
						console.log(chalk.bold.bgRgb(66, 167, 245)('DEBUG '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(util.format(...args)));
					},
				};
			},
			enumerable: true,
		},
		getFile: {
			/**
			 * getBuffer hehe
			 * @param {fs.PathLike} PATH
			 * @param {Boolean} saveToFile
			 */
			async value(PATH, saveToFile = false) {
				let res, filename;
				const data = Buffer.isBuffer(PATH)
					? PATH
					: PATH instanceof ArrayBuffer
						? PATH.toBuffer()
						: /^data:.*?\/.*?;base64,/i.test(PATH)
							? Buffer.from(PATH.split`,`[1], 'base64')
							: /^https?:\/\//.test(PATH)
								? (res = Buffer.from(await (await fetch(PATH)).arrayBuffer()))
								: fs.existsSync(PATH)
									? ((filename = PATH), fs.readFileSync(PATH))
									: typeof PATH === 'string'
										? PATH
										: Buffer.alloc(0);
				if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
				const type = (await fileTypeFromBuffer(data)) || { mime: 'application/octet-stream', ext: '.bin' };
				if (data && saveToFile && !filename) ((filename = path.join(__dirname, '../tmp/' + new Date() * 1 + '.' + type.ext)), await fs.promises.writeFile(filename, data));
				return {
					res,
					filename,
					...type,
					data,
					deleteFile() {
						return filename && fs.promises.unlink(filename);
					},
				};
			},
			enumerable: true,
		},
		sendFile: {
			/**
			 * Send Media/File with Automatic Type Specifier
			 * @param {String} jid
			 * @param {String|Buffer} path
			 * @param {String} filename
			 * @param {String} caption
			 * @param {import('baileys').proto.WebMessageInfo} quoted
			 * @param {Boolean} ptt
			 * @param {Object} options
			 */
			async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
				let type = await conn.getFile(path, true);
				let { res, data: file, filename: pathFile } = type;
				if ((res && res.status !== 200) || file.length <= 65536) {
					try {
						throw {
							json: JSON.parse(file.toString()),
						};
					} catch (e) {
						if (e.json) throw e.json;
					}
				}
				const fileSize = fs.statSync(pathFile).size / 1024 / 1024;
				if (fileSize >= 100) throw new Error('File size is too big!');
				let opt = {};
				if (quoted) opt.quoted = quoted;
				if (!type) options.asDocument = true;
				let mtype = '',
					mimetype = options.mimetype || type.mime,
					convert;
				if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
				else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
				else if (/video/.test(type.mime)) mtype = 'video';
				else if (/audio/.test(type.mime))
					((convert = await toAudio(file, type.ext)), (file = convert.data), (pathFile = convert.filename), (mtype = 'audio'), (mimetype = options.mimetype || 'audio/mpeg'));
				else mtype = 'document';
				if (options.asDocument) mtype = 'document';

				delete options.asSticker;
				delete options.asLocation;
				delete options.asVideo;
				delete options.asDocument;
				delete options.asImage;

				let message = {
					...options,
					caption,
					ptt,
					[mtype]: { url: pathFile },
					mimetype,
					fileName: filename || pathFile.split('/').pop(),
				};
				/**
				 * @type {import('baileys').proto.WebMessageInfo}
				 */
				let m;
				try {
					m = await conn.sendMessage(jid, message, { ...opt, ...options });
				} catch (e) {
					console.error(e);
					m = null;
				} finally {
					if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
					file = null; // releasing the memory
				}
				return m;
			},
			enumerable: true,
		},
		sendSticker: {
			async value(jid, filePath, m, options = {}) {
				const { data, mime } = await conn.getFile(filePath);
				if (data.length === 0) throw new TypeError('File tidak ditemukan');
				const exif = { packName: options.packname || global.stickpack, packPublish: options.packpublish || global.stickauth };
				const sticker = await (await import('./exif.js')).writeExif({ mimetype: mime, data }, exif);
				return conn.sendMessage(jid, { sticker }, { quoted: m, ephemeralExpiration: m?.expiration });
			},
		},
		sendMedia: {
			/**
			 * Send Media/File with Automatic Type Specifier
			 * @param {String} jid
			 * @param {String|Buffer} path
			 * @param {String} filename
			 * @param {String} caption
			 * @param {import('baileys').proto.WebMessageInfo} quoted
			 * @param {Boolean} ptt
			 * @param {Object} options
			 */
			async value(jid, path, quoted, options = {}) {
				let { mime, data } = await conn.getFile(path);
				let messageType = mime.split('/')[0];
				let pase = messageType.replace('application', 'document') || messageType;
				return conn.sendMessage(jid, { [`${pase}`]: data, mimetype: mime, ...options }, { quoted });
			},
		},
		sendAlbum: {
			async value(jid, medias = [], options = {}) {
				if (medias.length < 2) throw new Error('Album minimal berisi 2 media.');

				const media = [];

				for (const item of medias) {
					const url = typeof item === 'string' ? item : item.url;
					const caption = typeof item === 'object' ? item.caption : '';

					let file;
					try {
						file = await conn.getFile(url);
					} catch {
						continue;
					}

					const mime = file.mime;
					const data = file.data;
					if (!mime || !data) continue;

					const type = mime.split('/')[0];

					if (type === 'image') {
						media.push({
							image: data,
							caption,
						});
					} else if (type === 'video') {
						media.push({
							video: data,
							caption,
						});
					} else {
						continue;
					}
				}

				return conn.sendAlbumMessage(jid, media, options);
			},
		},
		sendAlbumMessage: {
			async value(jid, medias, options = {}) {
				const userJid = conn.user?.id;
				if (!Array.isArray(medias) || medias.length < 2) throw new Error('Album minimal berisi 2 media.');

				const delayTime = options.delay || 5000;
				delete options.delay;

				const album = await generateWAMessageFromContent(
					jid,
					{
						albumMessage: {
							expectedImageCount: medias.filter((m) => m.image).length,
							expectedVideoCount: medias.filter((m) => m.video).length,
							...options,
						},
					},
					{
						userJid,
						...options,
					}
				);

				await conn.relayMessage(jid, album.message, { messageId: album.key.id });

				for (const media of medias) {
					const content = media.image ? { image: media.image, ...media } : media.video ? { video: media.video, ...media } : null;

					if (!content) continue;

					const msg = await generateWAMessage(jid, content, {
						userJid,
						upload: (readStream, opts) => conn.waUploadToServer(readStream, opts),
						...options,
					});

					if (msg) {
						msg.message.messageContextInfo = {
							messageAssociation: {
								associationType: 1,
								parentMessageKey: album.key,
							},
						};
					}

					await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
					await delay(delayTime);
				}

				return album;
			},
		},
		sendButton: {
			async value(jid, content = {}, options = {}) {
				let header = {};

				let mime = null;
				if (content.image) mime = 'image';
				else if (content.video) mime = 'video';
				else if (content.document) mime = 'document';
				else if (content.audio) mime = 'audio';

				if (mime) {
					const media = await prepareWAMessageMedia({ [mime]: content[mime] }, { upload: conn.waUploadToServer });

					header = {
						hasMediaAttachment: true,
						[`${mime}Message`]: media[`${mime}Message`],
					};
				}

				const msg = generateWAMessageFromContent(
					jid,
					{
						interactiveMessage: {
							header: { title: content.title || '', ...header },
							body: { text: content.body || content.text || content.caption },
							footer: { text: content.footer },
							nativeFlowMessage: {
								buttons: content.buttons || [],
							},
						},
						...content,
					},
					options
				);

				await conn.relayMessage(jid, msg.message, {
					messageId: msg.key.id,
					additionalNodes: [
						{
							tag: 'biz',
							attrs: {},
							content: [
								{
									tag: 'interactive',
									attrs: { type: 'native_flow', v: '1' },
									content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
								},
							],
						},
					],
				});

				return msg;
			},
		},
		sendContact: {
			/**
			 * Send Contact
			 * @param {String} jid
			 * @param {String[][]|String[]} data
			 * @param {import('baileys').proto.WebMessageInfo} quoted
			 * @param {Object} options
			 */
			async value(jid, data, quoted, options) {
				if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data];
				let contacts = [];
				for (let [number, name] of data) {
					number = number.replace(/[^0-9]/g, '');
					let njid = number + '@s.whatsapp.net';
					let biz = (await conn.getBusinessProfile(njid).catch((_) => null)) || {};
					let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${
						biz.description
							? `
X-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim()
							: ''
					}
END:VCARD
        `.trim();
					contacts.push({ vcard, displayName: name });
				}
				return conn.sendMessage(
					jid,
					{
						...options,
						contacts: {
							...options,
							displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
							contacts,
						},
					},
					{
						quoted,
						...options,
					}
				);
			},
			enumerable: true,
		},
		reply: {
			/**
			 * Reply to a message
			 * @param {String} jid
			 * @param {String|Buffer} text
			 * @param {import('baileys').proto.WebMessageInfo} quoted
			 * @param {Object} options
			 */
			value(jid, text = '', quoted, options) {
				return Buffer.isBuffer(text)
					? conn.sendFile(jid, text, 'file', '', quoted, false, options)
					: conn.sendMessage(
							jid,
							{
								text,
								...options,
							},
							{
								quoted,
								...options,
							}
						);
			},
		},
		adReply: {
			async value(jid, text, path, m, options = {}) {
				const { data } = await conn.getFile(path);
				return conn.sendMessage(
					jid,
					{
						text: text,
						contextInfo: {
							externalAdReply: {
								title: options.title || global.namebot,
								body: options.body || '',
								thumbnail: data,
								mediaType: 1,
								renderLargerThumbnail: options.large || true,
								thumbnailUrl: options.source || global.source,
								sourceUrl: options.source || global.source,
							},
						},
					},
					{ quoted: m }
				);
			},
		},
		cMod: {
			/**
			 * cMod
			 * @param {String} jid
			 * @param {import('baileys').proto.WebMessageInfo} message
			 * @param {String} text
			 * @param {String} sender
			 * @param {*} options
			 * @returns
			 */
			value(jid, message, text = '', sender = conn.user.jid, options = {}) {
				if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
				let copy = message.toJSON();
				delete copy.message.messageContextInfo;
				delete copy.message.senderKeyDistributionMessage;
				let mtype = Object.keys(copy.message)[0];
				let msg = copy.message;
				let content = msg[mtype];
				if (typeof content === 'string') msg[mtype] = text || content;
				else if (content.caption) content.caption = text || content.caption;
				else if (content.text) content.text = text || content.text;
				if (typeof content !== 'string') {
					msg[mtype] = { ...content, ...options };
					msg[mtype].contextInfo = { ...(content.contextInfo || {}), mentionedJid: options.mentions || content.contextInfo?.mentionedJid || [] };
				}
				if (copy.participant) sender = copy.participant = sender || copy.participant;
				else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
				if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
				else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
				copy.key.remoteJid = jid;
				copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
				return proto.WebMessageInfo.create(copy);
			},
			enumerable: true,
		},
		copyNForward: {
			/**
			 * Exact Copy Forward
			 * @param {String} jid
			 * @param {import('baileys').proto.WebMessageInfo} message
			 * @param {Boolean|Number} forwardingScore
			 * @param {Object} options
			 */
			async value(jid, message, forwardingScore = true, options = {}) {
				let vtype;
				if (options.readViewOnce && message.message.viewOnceMessage?.message) {
					vtype = Object.keys(message.message.viewOnceMessage.message)[0];
					delete message.message.viewOnceMessage.message[vtype].viewOnce;
					message.message = proto.Message.create(JSON.parse(JSON.stringify(message.message.viewOnceMessage.message)));
					message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo;
				}
				let mtype = Object.keys(message.message)[0];
				let m = generateForwardMessageContent(message, !!forwardingScore);
				let ctype = Object.keys(m)[0];
				if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore;
				m[ctype].contextInfo = { ...(message.message[mtype].contextInfo || {}), ...(m[ctype].contextInfo || {}) };
				m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.jid });
				await conn.relayMessage(jid, m.message, {
					messageId: m.key.id,
					additionalAttributes: { ...options },
				});
				return m;
			},
			enumerable: true,
		},
		downloadM: {
			/**
			 * Download media message
			 * @param {Object} m
			 * @param {String} type
			 * @param {fs.PathLike | fs.promises.FileHandle} saveToFile
			 * @returns {Promise<fs.PathLike | fs.promises.FileHandle | Buffer>}
			 */
			async value(m, type, saveToFile) {
				let filename;
				if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
				const stream = await downloadContentFromMessage(m, type);
				let buffer = Buffer.from([]);
				for await (const chunk of stream) {
					buffer = Buffer.concat([buffer, chunk]);
				}
				if (saveToFile) ({ filename } = await conn.getFile(buffer, true));
				return saveToFile && fs.existsSync(filename) ? filename : buffer;
			},
			enumerable: true,
		},
		parseMention: {
			value(text) {
				if (!text) return [];

				const match = [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((m) => m[1]);
				const out = [];

				for (const id of match) {
					if (id.length < 10) continue;
					const lid = `${id}@lid`;
					const jid = conn.getJid(lid);

					if (conn.isLid.has(lid)) out.push(lid);
					else if (jid && jid !== lid && jid.includes(id)) out.push(jid);
					else out.push(`${id}@s.whatsapp.net`);
				}

				return [...new Set(out)];
			},
			enumerable: true,
		},
		getName: {
			/**
			 * Get name from jid
			 * @param {String} jid
			 * @param {Boolean} withoutContact
			 */
			value(jid = '', withoutContact = false) {
				jid = conn.getJid(jid);
				withoutContact = conn.withoutContact || withoutContact;
				let v;

				if (jid.endsWith('@g.us')) {
					v = conn.chats[jid] || {};

					if (!(v.name || v.subject)) {
						v = (conn.chats[jid] || {}).metadata || {};
					}

					return v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
				}

				v = jid === '0@s.whatsapp.net' ? { jid, vname: 'WhatsApp' } : areJidsSameUser(jid, conn.user.jid) ? conn.user : conn.chats[jid] || {};

				return (!withoutContact && v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
			},
			enumerable: true,
		},

		loadMessage: {
			/**
			 *
			 * @param {String} messageID
			 * @returns {import('baileys').proto.WebMessageInfo}
			 */
			value(messageID) {
				return Object.entries(conn.chats)
					.filter(([_, { messages }]) => typeof messages === 'object')
					.find(([_, { messages }]) => Object.entries(messages).find(([k, v]) => k === messageID || v.key?.id === messageID))?.[1].messages?.[messageID];
			},
			enumerable: true,
		},
		sendGroupV4Invite: {
			/**
			 * sendGroupV4Invite
			 * @param {String} jid
			 * @param {*} participant
			 * @param {String} inviteCode
			 * @param {Number} inviteExpiration
			 * @param {String} groupName
			 * @param {String} caption
			 * @param {Buffer} jpegThumbnail
			 * @param {*} options
			 */
			async value(groupJid, participant, inviteCode, inviteExpiration, groupName, caption, jpegThumbnail, options = {}) {
				const msg = generateWAMessageFromContent(
					participant,
					{
						groupInviteMessage: {
							inviteCode,
							inviteExpiration: parseInt(inviteExpiration) || Date.now() + 3 * 86400000,
							groupJid,
							groupName,
							jpegThumbnail,
							caption,
						},
					},
					{
						userJid: conn.user.id,
						...options,
					}
				);

				await conn.relayMessage(participant, msg.message, {
					messageId: msg.key.id,
				});
				return msg;
			},
			enumerable: true,
		},
		insertAllGroup: {
			async value() {
				const groups = (await conn.groupFetchAllParticipating().catch((_) => null)) || {};
				for (const group in groups)
					conn.chats[group] = {
						...(conn.chats[group] || {}),
						id: group,
						subject: groups[group].subject,
						isChats: true,
						metadata: groups[group],
					};
				return conn.chats;
			},
		},
		pushMessage: {
			/**
			 * pushMessage
			 * @param {import('baileys').proto.WebMessageInfo[]} m
			 */
			async value(m) {
				if (!m) return;
				if (!Array.isArray(m)) m = [m];
				for (const message of m) {
					try {
						// if (!(message instanceof proto.WebMessageInfo)) continue // https://github.com/adiwajshing/Baileys/pull/696/commits/6a2cb5a4139d8eb0a75c4c4ea7ed52adc0aec20f
						if (!message) continue;
						//if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
						const _mtype = Object.keys(message.message || {});
						const mtype =
							(!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
							(_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
							_mtype[_mtype.length - 1];
						const chat = conn.getJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '');
						if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
							/**
							 * @type {import('baileys').proto.IContextInfo}
							 */
							let context = message.message[mtype].contextInfo;
							let participant = conn.getJid(context.participant);
							const remoteJid = conn.getJid(context.remoteJid || participant);
							/**
							 * @type {import('baileys').proto.IMessage}
							 *
							 */
							let quoted = message.message[mtype].contextInfo.quotedMessage;
							if (remoteJid && remoteJid !== 'status@broadcast' && quoted) {
								// let qMtype = Object.keys(quoted)[0]
								// if (qMtype == 'conversation') {
								// quoted.extendedTextMessage = { text: quoted[qMtype] }
								// delete quoted.conversation
								// qMtype = 'extendedTextMessage'
								// }
								//if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
								//quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
								const isGroup = remoteJid.endsWith('g.us');
								if (isGroup && !participant) participant = remoteJid;
								const qM = {
									key: {
										remoteJid,
										fromMe: areJidsSameUser(conn.user.jid, remoteJid),
										id: context.stanzaId,
										participant,
									},
									message: JSON.parse(JSON.stringify(quoted)),
									...(isGroup ? { participant } : {}),
								};
								let qChats = conn.chats[participant];
								if (!qChats)
									qChats = conn.chats[participant] = {
										id: participant,
										isChats: !isGroup,
									};
								if (!qChats.messages) qChats.messages = {};
								if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM;
								let qChatsMessages;
								if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length)); // maybe avoid memory leak
							}
						}
						if (!chat || chat === 'status@broadcast') continue;
						const isGroup = chat.endsWith('@g.us');
						let chats = conn.chats[chat];
						if (!chats) {
							if (isGroup) await conn.insertAllGroup().catch(console.error);
							chats = conn.chats[chat] = {
								id: chat,
								isChats: true,
								...(conn.chats[chat] || {}),
							};
						}
						let metadata, sender;
						if (isGroup) {
							if (!chats.subject || !chats.metadata) {
								metadata = (await conn.groupMetadata(chat).catch((_) => ({}))) || {};
								if (!chats.subject) chats.subject = metadata.subject || '';
								if (!chats.metadata) chats.metadata = metadata;
							}
							sender = conn.getJid((message.key?.fromMe && conn.user.id) || message.participant || message.key?.participant || chat);
							if (sender !== chat) {
								let chats = conn.chats[sender];
								if (!chats)
									chats = conn.chats[sender] = {
										id: sender,
									};
								if (!chats.name) chats.name = message.pushName || chats.name || '';
							}
						} else if (!chats.name) chats.name = message.pushName || chats.name || '';
						if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue;
						chats.isChats = true;
						if (!chats.messages) chats.messages = {};
						const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
						if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
							delete message.message.messageContextInfo;
							delete message.message.senderKeyDistributionMessage;
							chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2));
							let chatsMessages;
							if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length));
						}
					} catch (e) {
						console.error(e);
					}
				}
			},
		},
		serializeM: {
			/**
			 * Serialize Message, so it easier to manipulate
			 * @param {import('baileys').proto.WebMessageInfo} m
			 */
			value(m) {
				return smsg(conn, m);
			},
		},
		...(typeof conn.setStatus !== 'function'
			? {
					setStatus: {
						/**
						 * setStatus bot
						 * @param {String} status
						 */
						value(status) {
							return conn.query({
								tag: 'iq',
								attrs: {
									to: S_WHATSAPP_NET,
									type: 'set',
									xmlns: 'status',
								},
								content: [
									{
										tag: 'status',
										attrs: {},
										content: Buffer.from(status, 'utf-8'),
									},
								],
							});
						},
						enumerable: true,
					},
				}
			: {}),
	});
	if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id);
	store.bind(sock);
	return sock;
}
/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn
 * @param {import('baileys').proto.WebMessageInfo} m
 */
export function smsg(conn, m) {
	if (!m) return m;
	/**
	 * @type {import('baileys').proto.WebMessageInfo}
	 */
	let M = proto.WebMessageInfo;
	m = M.create(m);
	m.message = parseMessage(m.message);
	Object.defineProperty(m, 'conn', {
		enumerable: false,
		writable: true,
		value: conn,
	});
	let protocolMessageKey;
	if (m.message) {
		if (m.mtype == 'protocolMessage' && m.msg.key) {
			protocolMessageKey = m.msg.key;
			if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat;
			if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender;
			protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user.id);
			if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === conn.decodeJid(conn.user.id)) protocolMessageKey.remoteJid = m.sender;
		}
		if (m.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download;
	}
	if (!m.mediaMessage) delete m.download;

	try {
		if (protocolMessageKey && m.mtype == 'protocolMessage') conn.ev.emit('message.delete', protocolMessageKey);
	} catch (e) {
		console.error(e);
	}
	return m;
}

// https://github.com/Nurutomo/wabot-aq/issues/490
export function serialize() {
	const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
	const getDevice = (id) => (/^3A|2A.{18}$/.test(id) ? 'ios' : /^(.{21}|.{32})$/.test(id) ? 'android' : /^(3F|.{18}$)/.test(id) ? 'desktop' : 'unknown');

	return Object.defineProperties(proto.WebMessageInfo.prototype, {
		conn: {
			value: undefined,
			enumerable: false,
			writable: true,
		},
		id: {
			get() {
				return this.key?.id;
			},
		},
		isBaileys: {
			get() {
				return getDevice(this.id) === 'unknown' || false;
			},
		},
		chat: {
			get() {
				const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId;
				return this.conn.getJid(
					this.key?.remoteJidAlt?.endsWith('@s.whatsapp.net')
						? this.key.remoteJidAlt
						: conn.getJid(this.key?.remoteJid) || (senderKeyDistributionMessage && senderKeyDistributionMessage !== 'status@broadcast')
				);
			},
		},
		isGroup: {
			get() {
				return this.chat.endsWith('@g.us');
			},
			enumerable: true,
		},
		sender: {
			get() {
				return this.conn.getJid((this.key?.fromMe && this.conn?.user.id) || this?.key?.participantAlt || this?.participant || this?.key?.participant || this.chat);
			},
			enumerable: true,
		},
		fromMe: {
			get() {
				return areJidsSameUser(this.conn?.user.jid, this.sender) || this.key?.fromMe || false;
			},
		},
		mtype: {
			get() {
				if (!this.message) return '';
				const type = Object.keys(this.message);
				return (
					(!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) || // Sometimes message in the front
					(type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || // Sometimes message in midle if mtype length is greater than or equal to 3
					type[type.length - 1]
				); // common case
			},
			enumerable: true,
		},
		msg: {
			get() {
				if (!this.message) return null;
				return parseMessage(this.message[this.mtype]);
			},
		},
		mediaMessage: {
			get() {
				if (!this.message) return null;
				const Message =
					(this.msg?.url || this.msg?.directPath
						? {
								...this.message,
							}
						: extractMessageContent(this.message)) || null;
				if (!Message) return null;
				const mtype = Object.keys(Message)[0];
				return MediaType.includes(mtype) ? Message : null;
			},
			enumerable: true,
		},
		mediaType: {
			get() {
				let message;
				if (!(message = this.mediaMessage)) return null;
				return Object.keys(message)[0];
			},
			enumerable: true,
		},
		quoted: {
			get() {
				/**
				 * @type {ReturnType<typeof makeWASocket>}
				 */
				const self = this;
				const msg = self.msg;
				const contextInfo = msg?.contextInfo;
				const quoted = parseMessage(contextInfo?.quotedMessage);
				if (!msg || !contextInfo || !quoted) return null;
				const type = Object.keys(quoted)[0];
				let q = quoted[type];
				const text = typeof q === 'string' ? q : q.text;
				return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
					mtype: {
						get() {
							return type;
						},
						enumerable: true,
					},
					mediaMessage: {
						get() {
							const Message = (q.url || q.directPath ? { ...quoted } : extractMessageContent(quoted)) || null;
							if (!Message) return null;
							const mtype = Object.keys(Message)[0];
							return MediaType.includes(mtype) ? Message : null;
						},
						enumerable: true,
					},
					mediaType: {
						get() {
							let message;
							if (!(message = this.mediaMessage)) return null;
							return Object.keys(message)[0];
						},
						enumerable: true,
					},
					id: {
						get() {
							return contextInfo.stanzaId;
						},
						enumerable: true,
					},
					chat: {
						get() {
							return self.conn.getJid(contextInfo.remoteJid || self.chat);
						},
						enumerable: true,
					},
					isBaileys: {
						get() {
							return getDevice(this.id) === 'unknown' || false;
						},
						enumerable: true,
					},
					sender: {
						get() {
							return self.conn.getJid(contextInfo.participant || this.chat);
						},
						enumerable: true,
					},
					fromMe: {
						get() {
							return areJidsSameUser(this.sender, self.conn?.user.jid);
						},
						enumerable: true,
					},
					text: {
						get() {
							return text || this.caption || this.contentText || this.selectedDisplayText || '';
						},
						enumerable: true,
					},
					mentionedJid: {
						get() {
							let raw = q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || [];
							return raw.map((jid) => self.conn.getJid(jid));
						},
						enumerable: true,
					},
					name: {
						get() {
							const sender = this.sender;
							return sender ? self.conn?.getName(sender) : null;
						},
						enumerable: true,
					},
					vM: {
						get() {
							return proto.WebMessageInfo.create({
								key: {
									fromMe: this.fromMe,
									remoteJid: this.chat,
									id: this.id,
								},
								message: quoted,
								...(self.isGroup
									? {
											participant: this.sender,
										}
									: {}),
							});
						},
					},
					fakeObj: {
						get() {
							return this.vM;
						},
					},
					download: {
						value(saveToFile = false) {
							const mtype = this.mediaType;
							return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
						},
						enumerable: true,
						configurable: true,
					},
					reply: {
						/**
						 * Reply to quoted message
						 * @param {String|Object} text
						 * @param {String|false} chatId
						 * @param {Object} options
						 */
						value(text, chatId, options) {
							return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options);
						},
						enumerable: true,
					},
					copy: {
						/**
						 * Copy quoted message
						 */
						value() {
							const M = proto.WebMessageInfo;
							return smsg(self.conn, M.create(M.toObject(this.vM)));
						},
						enumerable: true,
					},
					forward: {
						/**
						 * Forward quoted message
						 * @param {String} jid
						 *  @param {Boolean} forceForward
						 */
						value(jid, force = false, options) {
							return self.conn?.sendMessage(
								jid,
								{
									forward: this.vM,
									force,
									...options,
								},
								{
									...options,
								}
							);
						},
						enumerable: true,
					},
					copyNForward: {
						/**
						 * Exact Forward quoted message
						 * @param {String} jid
						 * @param {Boolean|Number} forceForward
						 * @param {Object} options
						 */
						value(jid, forceForward = false, options) {
							return self.conn?.copyNForward(jid, this.vM, forceForward, options);
						},
						enumerable: true,
					},
					cMod: {
						/**
						 * Modify quoted Message
						 * @param {String} jid
						 * @param {String} text
						 * @param {String} sender
						 * @param {Object} options
						 */
						value(jid, text = '', sender = this.sender, options = {}) {
							return self.conn?.cMod(jid, this.vM, text, sender, options);
						},
						enumerable: true,
					},
					delete: {
						/**
						 * Delete quoted message
						 */
						value() {
							return self.conn?.sendMessage(this.chat, {
								delete: this.vM.key,
							});
						},
						enumerable: true,
					},
				});
			},
			enumerable: true,
		},
		_text: {
			value: null,
			writable: true,
		},

		text: {
			get() {
				const msg = this.msg;
				const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || msg?.selectedDisplayText || msg?.hydratedTemplate?.hydratedContentText || '';
				if (typeof this._text === 'string') return this._text;
				return text;
			},

			set(str) {
				this._text = str;
			},

			enumerable: true,
		},

		mentionedJid: {
			get() {
				let raw = (this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid) || [];
				return raw.map((jid) => this.conn.getJid(jid));
			},
			enumerable: true,
		},
		name: {
			get() {
				return (!nullish(this.pushName) && this.pushName) || this.conn?.getName(this.sender);
			},
			enumerable: true,
		},
		download: {
			value(saveToFile = false) {
				const mtype = this.mediaType;
				return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
			},
			enumerable: true,
			configurable: true,
		},
		reply: {
			value(text, chatId, options) {
				return this.conn?.reply(chatId ? chatId : this.chat, text, this, options);
			},
		},
		edit: {
			value(text, key) {
				return this.conn.sendMessage(this.chat, { text, edit: key });
			},
		},
		react: {
			value(emoji) {
				return this.conn.sendMessage(this.chat, {
					react: { text: emoji, key: this.key },
				});
			},
		},
		copy: {
			value() {
				const M = proto.WebMessageInfo;
				return smsg(this.conn, M.create(M.toObject(this)));
			},
			enumerable: true,
		},
		forward: {
			value(jid, force = false, options = {}) {
				return this.conn?.sendMessage(
					jid,
					{
						forward: this,
						force,
						...options,
					},
					{
						...options,
					}
				);
			},
			enumerable: true,
		},
		copyNForward: {
			value(jid, forceForward = false, options = {}) {
				return this.conn?.copyNForward(jid, this, forceForward, options);
			},
			enumerable: true,
		},
		cMod: {
			value(jid, text = '', sender = this.sender, options = {}) {
				return this.conn?.cMod(jid, this, text, sender, options);
			},
			enumerable: true,
		},
		getQuotedObj: {
			value() {
				if (!this.quoted.id) return null;
				const q = proto.WebMessageInfo.create(this.conn?.loadMessage(this.quoted.id) || this.quoted.vM);
				return smsg(this.conn, q);
			},
			enumerable: true,
		},
		getQuotedMessage: {
			get() {
				return this.getQuotedObj;
			},
		},
		delete: {
			value() {
				return this.conn?.sendMessage(this.chat, {
					delete: this.key,
				});
			},
			enumerable: true,
		},
	});
}

export function logic(check, inp, out) {
	if (inp.length !== out.length) throw new Error('Input and Output must have same length');
	for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i];
	return null;
}

function parseMessage(content) {
	content = extractMessageContent(content);
	if (content && content.viewOnceMessageV2Extension) {
		content = content.viewOnceMessageV2Extension.message;
	}
	if (content && content.protocolMessage && content.protocolMessage.type == 14) {
		let type = getContentType(content.protocolMessage);
		content = content.protocolMessage[type];
	}
	if (content && content.message) {
		let type = getContentType(content.message);
		content = content.message[type];
	}

	return content;
}

const getContentType = (content) => {
	if (content) {
		const keys = Object.keys(content);
		const key = keys.find((k) => (k === 'conversation' || k.endsWith('Message') || k.includes('V2') || k.includes('V3')) && k !== 'senderKeyDistributionMessage');
		return key;
	}
};

export function protoType() {
	Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
		const ab = new ArrayBuffer(this.length);
		const view = new Uint8Array(ab);
		for (let i = 0; i < this.length; ++i) {
			view[i] = this[i];
		}
		return ab;
	};
	/**
	 * @returns {ArrayBuffer}
	 */
	Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
		return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
	};
	/**
	 * @returns {Buffer}
	 */
	ArrayBuffer.prototype.toBuffer = function toBuffer() {
		return Buffer.from(new Uint8Array(this));
	};
	// /**
	//  * @returns {String}
	//  */
	// Buffer.prototype.toUtilFormat = ArrayBuffer.prototype.toUtilFormat = Object.prototype.toUtilFormat = Array.prototype.toUtilFormat = function toUtilFormat() {
	//     return util.format(this)
	// }
	Uint8Array.prototype.getFileType =
		ArrayBuffer.prototype.getFileType =
		Buffer.prototype.getFileType =
			async function getFileType() {
				return await fileTypeFromBuffer(this);
			};
	/**
	 * @returns {Boolean}
	 */
	String.prototype.isNumber = Number.prototype.isNumber = isNumber;
	/**
	 *
	 * @returns {String}
	 */
	String.prototype.capitalize = function capitalize() {
		return this.charAt(0).toUpperCase() + this.slice(1, this.length);
	};
	/**
	 * @returns {String}
	 */
	String.prototype.capitalizeV2 = function capitalizeV2() {
		const str = this.split(' ');
		return str.map((v) => v.capitalize()).join(' ');
	};
	String.prototype.decodeJid = function decodeJid() {
		if (/:\d+@/gi.test(this)) {
			const decode = jidDecode(this) || {};
			return ((decode.user && decode.server && decode.user + '@' + decode.server) || this).trim();
		} else return this.trim();
	};
	/**
	 * number must be milliseconds
	 * @returns {string}
	 */
	Number.prototype.toTimeString = function toTimeString() {
		// const milliseconds = this % 1000
		const seconds = Math.floor((this / 1000) % 60);
		const minutes = Math.floor((this / (60 * 1000)) % 60);
		const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
		const days = Math.floor(this / (24 * 60 * 60 * 1000));
		return ((days ? `${days} hari ` : '') + (hours ? `${hours} jam ` : '') + (minutes ? `${minutes} menit ` : '') + (seconds ? `${seconds} detik` : '')).trim();
	};
	Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom;
}

function isNumber() {
	const int = parseInt(this);
	return typeof int === 'number' && !isNaN(int);
}

function getRandom() {
	if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)];
	return Math.floor(Math.random() * this);
}

/**
 * ??
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
 * @returns {boolean}
 */
function nullish(args) {
	return !(args !== null && args !== undefined);
}


---

// lib/store.js
/**
 * @param {import('baileys').WASocket | import('baileys').WALegacySocket}
 */
function bind(conn) {
	if (!conn.chats) conn.chats = {};
	/**
	 *
	 * @param {import('baileys').Contact[]|{contacts:import('baileys').Contact[]}} contacts
	 * @returns
	 */
	function updateNameToDb(contacts) {
		if (!contacts) return;
		try {
			contacts = contacts.contacts || contacts;
			for (const contact of contacts) {
				const id = conn.decodeJid(contact.id);
				if (!id || id === 'status@broadcast') continue;
				let chats = conn.chats[id];
				if (!chats) chats = conn.chats[id] = { ...contact, id };
				conn.chats[id] = {
					...chats,
					...{
						...contact,
						id,
						...(id.endsWith('@g.us') ? { subject: contact.subject || contact.name || chats.subject || '' } : { name: contact.notify || contact.name || chats.name || chats.notify || '' }),
					},
				};
			}
		} catch (e) {
			console.error(e);
		}
	}
	conn.ev.on('contacts.upsert', updateNameToDb);
	conn.ev.on('groups.update', updateNameToDb);
	conn.ev.on('contacts.set', updateNameToDb);
	conn.ev.on('chats.set', async ({ chats }) => {
		try {
			for (let { id, name, readOnly } of chats) {
				id = conn.decodeJid(id);
				if (!id || id === 'status@broadcast') continue;
				const isGroup = id.endsWith('@g.us');
				let chats = conn.chats[id];
				if (!chats) chats = conn.chats[id] = { id };
				chats.isChats = !readOnly;
				if (name) chats[isGroup ? 'subject' : 'name'] = name;
				if (isGroup) {
					const metadata = await conn.groupMetadata(id).catch(() => null);
					if (name || metadata?.subject) chats.subject = name || metadata.subject;
					if (!metadata) continue;
					chats.metadata = metadata;
				}
			}
		} catch (e) {
			console.error(e);
		}
	});

	conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
		if (!id) return;
		id = conn.decodeJid(id);
		if (id === 'status@broadcast') return;
		if (!(id in conn.chats)) conn.chats[id] = { id };
		let chat = conn.chats[id];
		chat.isChats = true;

		let metadata = chat.metadata;
		if (!metadata) {
			try {
				metadata = await conn.groupMetadata(id);
				chat.metadata = metadata;
				chat.subject = metadata.subject;
			} catch (e) {
				console.error('Gagal ambil metadata grup:', e);
			}
		}

		switch (action) {
			case 'add':
			case 'revoked_membership_requests':
				for (const p of participants) {
					if (!metadata.participants.find((x) => x.id === p.id)) metadata.participants.push(p);
				}
				break;

			case 'promote':
			case 'demote':
				for (const p of participants) {
					const target = metadata.participants.find((x) => x.id === p.id);
					if (target) target.admin = action === 'promote' ? 'admin' : null;
				}
				break;

			case 'remove':
				metadata.participants = metadata.participants.filter((a) => !participants.find((b) => b.id === a.id));
				break;
		}
	});

	conn.ev.on('groups.update', (updates) => {
		for (const update of updates) {
			const id = conn.decodeJid(update.id);
			if (!id || id === 'status@broadcast') continue;
			const isGroup = id.endsWith('@g.us');
			if (!isGroup) continue;
			let chat = conn.chats[id];
			if (!chat) chat = conn.chats[id] = { id };
			chat.isChats = true;
			chat.metadata = {
				...(chat.metadata || {}),
				...update,
			};
			if (update.subject) chat.subject = update.subject;
		}
	});

	conn.ev.on('chats.upsert', (chatsUpsert) => {
		try {
			const { id } = chatsUpsert;
			if (!id || id === 'status@broadcast') return;
			conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true };
			const isGroup = id.endsWith('@g.us');
			if (isGroup) conn.insertAllGroup().catch(() => null);
		} catch (e) {
			console.error(e);
		}
	});

	conn.ev.on('presence.update', async ({ id, presences }) => {
		try {
			const sender = Object.keys(presences)[0] || id;
			const _sender = conn.decodeJid(sender);
			const presence = presences[sender]['lastKnownPresence'] || 'composing';
			let chats = conn.chats[_sender];
			if (!chats) chats = conn.chats[_sender] = { id: sender };
			chats.presences = presence;
			if (id.endsWith('@g.us')) {
				let chats = conn.chats[id];
				if (!chats) chats = conn.chats[id] = { id };
			}
		} catch (e) {
			console.error(e);
		}
	});
}

export default {
	bind,
};


---

// lib/useSQLite.js
//Croted By ChatGpt
import Database from 'better-sqlite3';
import { Mutex } from 'async-mutex';
import { BufferJSON, initAuthCreds, proto } from 'baileys';
import path from 'path';
import fs from 'fs';

export default async (folder = './sessions') => {
	const mutex = new Mutex();
	const ALLOWED_KEYS = new Set(['pre-key', 'session', 'sender-key', 'app-state-sync-key', 'app-state-sync-version']);

	const dir = path.resolve(`${folder}/auth.db`);
	fs.mkdirSync(path.dirname(dir), { recursive: true });
	const db = new Database(dir);

	db.pragma('journal_mode = WAL');
	db.pragma('synchronous = NORMAL');
	db.pragma('temp_store = MEMORY');
	db.pragma('foreign_keys = ON');

	db.exec(`
		CREATE TABLE IF NOT EXISTS creds (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			data TEXT NOT NULL,
			updated_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS keys (
			category TEXT NOT NULL,
			id TEXT NOT NULL,
			data TEXT,
			updated_at INTEGER,
			PRIMARY KEY (category, id)
		);
	`);

	const stmtGetCreds = db.prepare(`SELECT data FROM creds WHERE id=1`);
	const stmtSetCreds = db.prepare(
		`INSERT OR REPLACE INTO creds
		 (id, data, updated_at)
		 VALUES (1, ?, ?)`
	);

	const stmtGetKey = db.prepare(
		`SELECT data FROM keys
		 WHERE category=? AND id=?`
	);
	const stmtSetKey = db.prepare(
		`INSERT OR REPLACE INTO keys
		 (category, id, data, updated_at)
		 VALUES (?, ?, ?, ?)`
	);
	const stmtDelKey = db.prepare(
		`DELETE FROM keys
		 WHERE category=? AND id=?`
	);

	const readCreds = async () =>
		mutex.runExclusive(() => {
			const row = stmtGetCreds.get();
			return row ? JSON.parse(row.data, BufferJSON.reviver) : null;
		});

	const writeCreds = async (creds) =>
		mutex.runExclusive(() => {
			stmtSetCreds.run(JSON.stringify(creds, BufferJSON.replacer), Date.now());
		});

	const readKey = async (category, id) =>
		mutex.runExclusive(() => {
			const row = stmtGetKey.get(category, id);
			if (!row) return null;

			let value = JSON.parse(row.data, BufferJSON.reviver);

			if (category === 'app-state-sync-key') {
				value = proto.Message.AppStateSyncKeyData.fromObject(value);
			}

			return value;
		});

	const writeKey = async (category, id, value) =>
		mutex.runExclusive(() => {
			stmtSetKey.run(category, id, JSON.stringify(value, BufferJSON.replacer), Date.now());
		});

	const removeKey = async (category, id) =>
		mutex.runExclusive(() => {
			stmtDelKey.run(category, id);
		});

	const creds = (await readCreds()) || initAuthCreds();

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const result = {};
					for (const id of ids) {
						result[id] = await readKey(type, id);
					}
					return result;
				},

				set: async (data) => {
					const tasks = [];
					for (const category in data) {
						if (!ALLOWED_KEYS.has(category)) continue;

						for (const id in data[category]) {
							const value = data[category][id];
							tasks.push(value ? writeKey(category, id, value) : removeKey(category, id));
						}
					}
					await Promise.all(tasks);
				},
			},
		},

		saveCreds: async () => {
			await writeCreds(creds);
		},
	};
};


---

