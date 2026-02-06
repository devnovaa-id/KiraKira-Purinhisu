let handler = async (m, { text, conn, usedPrefix }) => {
	if (!text) throw `Siapa yang ingin di-ban?\n\nContoh:\n${usedPrefix}ban @user\n${usedPrefix}ban 628....\n${usedPrefix}ban all (untuk banned semua user)`;
	
	let who;
	let isAll = text.toLowerCase() === 'all';
	
	if (isAll) {
		// Ban semua user kecuali owner
		let bannedCount = 0;
		let ownerJids = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
		
		for (let userId in global.db.data.users) {
			if (!ownerJids.includes(userId) && !global.db.data.users[userId].banned) {
				global.db.data.users[userId].banned = true;
				bannedCount++;
			}
		}
		
		m.reply(`✅ Berhasil banned ${bannedCount} user (kecuali owner)`);
		return;
	}
	
	// Cari user berdasarkan mention atau nomor
	if (m.mentionedJid.length > 0) {
		who = m.mentionedJid[0];
	} else {
		// Coba parse nomor dari text
		let number = text.replace(/[^0-9]/g, '');
		if (!number) throw 'Tag user atau berikan nomor yang valid!';
		
		if (number.startsWith('0')) number = '62' + number.substring(1);
		if (number.startsWith('62')) {
			who = number + '@s.whatsapp.net';
		} else {
			throw 'Format nomor tidak valid! Contoh: 628.....';
		}
	}
	
	if (!who) throw 'Tag user yang valid!';
	
	// Cek jika yang di-ban adalah owner
	let ownerJids = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
	if (ownerJids.includes(who)) {
		throw 'Tidak bisa banned owner bot!';
	}
	
	// Cek jika yang di-ban adalah bot sendiri
	if (who === conn.user.jid) {
		throw 'Tidak bisa banned bot sendiri!';
	}
	
	// Pastikan user ada di database
	if (!global.db.data.users[who]) {
		// Buat data user baru jika belum ada
		global.db.data.users[who] = {
			name: conn.getName(who) || 'User',
			exp: 0,
			level: 1,
			limit: 20,
			banned: false,
			registered: false,
			money: 0,
			health: 100,
			age: -1,
			regTime: -1,
			afk: -1,
			afkReason: '',
			warn: 0,
			role: 'Newbie',
			premium: false,
			premiumTime: 0,
			autolevelup: false,
		};
	}
	
	// Cek jika user sudah dibanned
	if (global.db.data.users[who].banned) {
		throw `User @${who.split('@')[0]} sudah dibanned sebelumnya!`;
	}
	
	global.db.data.users[who].banned = true;
	
	// Dapatkan nama user
	let userName = global.db.data.users[who].name || conn.getName(who) || who.split('@')[0];
	
	// Kirim pesan ke user yang dibanned
	try {
		await conn.sendMessage(who, {
			text: `🚫 *AKUN ANDA DIBANNED*\n\nAkun Anda telah dibanned dari menggunakan bot ini.\n\nJika merasa ini kesalahan, hubungi owner:\n@${global.owner[0][0].replace(/[^0-9]/g, '')}\n\nTerima kasih.`,
			mentions: [global.owner[0][0] + '@s.whatsapp.net']
		});
	} catch (e) {
		console.log('Tidak bisa mengirim pesan ke user yang dibanned:', e);
	}
	
	// Log ke console
	console.log(chalk.redBright(`[BAN] User ${who} (${userName}) has been banned by ${m.sender}`));
	
	m.reply(`✅ Berhasil banned @${who.split('@')[0]} (${userName})`, null, {
		mentions: [who]
	});
};

handler.help = ['ban <nomor/mention/all>'];
handler.tags = ['owner'];
handler.command = /^ban(user)?$/i;
handler.owner = true;
handler.group = false;

export default handler;