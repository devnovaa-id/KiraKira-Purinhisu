let handler = async (m, { text, conn, usedPrefix }) => {
	if (!text) throw `Siapa yang ingin di-unban?\n\nContoh:\n${usedPrefix}unban @user\n${usedPrefix}unban 628.....\n${usedPrefix}unban all (untuk unban semua user)`;
	
	let who;
	let isAll = text.toLowerCase() === 'all';
	
	if (isAll) {
		// Unban semua user
		let unbannedCount = 0;
		
		for (let userId in global.db.data.users) {
			if (global.db.data.users[userId].banned) {
				global.db.data.users[userId].banned = false;
				unbannedCount++;
			}
		}
		
		m.reply(`✅ Berhasil unban ${unbannedCount} user`);
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
	
	// Pastikan user ada di database
	if (!global.db.data.users[who]) {
		throw `User @${who.split('@')[0]} tidak terdaftar di database!`;
	}
	
	// Cek jika user sudah tidak dibanned
	if (!global.db.data.users[who].banned) {
		throw `User @${who.split('@')[0]} tidak dalam status banned!`;
	}
	
	global.db.data.users[who].banned = false;
	
	// Dapatkan nama user
	let userName = global.db.data.users[who].name || conn.getName(who) || who.split('@')[0];
	
	// Kirim pesan ke user yang diunban
	try {
		await conn.sendMessage(who, {
			text: `✅ *AKUN ANDA DIUNBAN*\n\nAkun Anda telah diunban dan dapat menggunakan bot kembali.\n\nSelamat menggunakan bot!`
		});
	} catch (e) {
		console.log('Tidak bisa mengirim pesan ke user yang diunban:', e);
	}
	
	// Log ke console
	console.log(chalk.greenBright(`[UNBAN] User ${who} (${userName}) has been unbanned by ${m.sender}`));
	
	m.reply(`✅ Berhasil unban @${who.split('@')[0]} (${userName})`, null, {
		mentions: [who]
	});
};

handler.help = ['unban <nomor/mention/all>'];
handler.tags = ['owner'];
handler.command = /^unban(user)?$/i;
handler.owner = true;
handler.group = false;

export default handler;