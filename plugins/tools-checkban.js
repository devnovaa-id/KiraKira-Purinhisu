let handler = async (m, { conn, text, usedPrefix }) => {
	if (!text) throw `Masukkan nomor atau tag user!\n\nContoh:\n${usedPrefix}checkban @user\n${usedPrefix}checkban 628.......`;
	
	let who;
	
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
			throw 'Format nomor tidak valid! Contoh: 6281234567890';
		}
	}
	
	if (!who) throw 'User tidak ditemukan!';
	
	// Cek apakah user ada di database
	let userData = global.db.data.users[who];
	
	if (!userData) {
		return m.reply(`❌ User @${who.split('@')[0]} tidak terdaftar di database.`, null, {
			mentions: [who]
		});
	}
	
	let userName = userData.name || conn.getName(who) || who.split('@')[0];
	let status = userData.banned ? '🚫 *DIBANNED*' : '✅ *TIDAK DIBANNED*';
	let action = userData.banned ? `unban` : `ban`;
	let statusIcon = userData.banned ? '🚫' : '✅';
	
	let txt = `👤 *INFO USER*\n\n`;
	txt += `${statusIcon} *Status:* ${status}\n`;
	txt += `📱 *Nomor:* @${who.split('@')[0]}\n`;
	txt += `👨‍💼 *Nama:* ${userName}\n`;
	txt += `📊 *Level:* ${userData.level || 1}\n`;
	txt += `✨ *Exp:* ${userData.exp || 0}\n`;
	txt += `🎫 *Limit:* ${userData.limit || 0}\n`;
	txt += `💰 *Money:* ${userData.money || 0}\n`;
	txt += `❤️ *Health:* ${userData.health || 100}\n`;
	txt += `📝 *Registered:* ${userData.registered ? '✅' : '❌'}\n`;
	txt += `👑 *Premium:* ${userData.premium ? '✅' : '❌'}\n`;
	txt += `⏳ *Premium Time:* ${userData.premiumTime ? new Date(userData.premiumTime).toLocaleString() : 'Tidak ada'}\n\n`;
	
	if (userData.banned) {
		txt += `🔧 *Action:*\n`;
		txt += `Gunakan *${usedPrefix}unban @${who.split('@')[0]}* untuk membuka ban user ini.\n\n`;
		txt += `⚠️ User ini tidak dapat menggunakan bot sampai diunban.`;
	} else {
		txt += `🔧 *Action:*\n`;
		txt += `Gunakan *${usedPrefix}ban @${who.split('@')[0]}* untuk membanned user ini.\n\n`;
		txt += `✅ User ini dapat menggunakan bot dengan normal.`;
	}
	
	// Cek jika user adalah owner
	let ownerJids = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
	if (ownerJids.includes(who)) {
		txt += `\n\n👑 *CATATAN:* User ini adalah OWNER bot!`;
	}
	
	m.reply(txt, null, {
		mentions: [who]
	});
};

handler.help = ['checkban <nomor/mention>'];
handler.tags = ['tools'];
handler.command = /^(checkban|cekbanned|statusban|infouser)$/i;
handler.owner = true;

export default handler;