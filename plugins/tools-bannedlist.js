let handler = async (m, { conn, usedPrefix }) => {
	// Cek jika sender adalah owner
	let isOwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)]
		.map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
	
	if (!isOwner) {
		return m.reply('❌ Command ini hanya untuk owner bot!');
	}
	
	let bannedUsers = [];
	let totalUsers = 0;
	let totalBanned = 0;
	
	for (let userId in global.db.data.users) {
		totalUsers++;
		if (global.db.data.users[userId].banned) {
			totalBanned++;
			let userName = global.db.data.users[userId].name || conn.getName(userId) || userId.split('@')[0];
			let level = global.db.data.users[userId].level || 1;
			let exp = global.db.data.users[userId].exp || 0;
			let registered = global.db.data.users[userId].registered ? '✅' : '❌';
			
			bannedUsers.push({
				userId,
				name: userName,
				level,
				exp,
				registered
			});
		}
	}
	
	if (bannedUsers.length === 0) {
		return m.reply('✅ Tidak ada user yang dibanned.');
	}
	
	// Urutkan berdasarkan exp (descending)
	bannedUsers.sort((a, b) => b.exp - a.exp);
	
	let txt = `📋 *DAFTAR USER BANNED*\n\n`;
	txt += `📊 *Statistik:*\n`;
	txt += `├ Total User: ${totalUsers}\n`;
	txt += `└ User Banned: ${totalBanned}\n\n`;
	
	// Tampilkan maksimal 15 user untuk menghindari pesan terlalu panjang
	let displayCount = Math.min(bannedUsers.length, 15);
	
	for (let i = 0; i < displayCount; i++) {
		let user = bannedUsers[i];
		txt += `${i + 1}. *${user.name}*\n`;
		txt += `   👤 @${user.userId.split('@')[0]}\n`;
		txt += `   📊 Level: ${user.level} | Exp: ${user.exp}\n`;
		txt += `   📝 Registered: ${user.registered}\n`;
		txt += `   ⚙️ Command: ${usedPrefix}unban @${user.userId.split('@')[0]}\n\n`;
	}
	
	if (bannedUsers.length > 15) {
		txt += `\n... dan ${bannedUsers.length - 15} user lainnya.\n`;
	}
	
	txt += `\n📌 *Command yang tersedia:*\n`;
	txt += `• ${usedPrefix}unban all - Unban semua user\n`;
	txt += `• ${usedPrefix}unban @user - Unban user tertentu\n`;
	txt += `• ${usedPrefix}checkban @user - Cek status ban user`;
	
	// Kirim pesan dengan mentions
	let mentions = bannedUsers.slice(0, 15).map(u => u.userId);
	
	await conn.reply(m.chat, txt, m, {
		mentions
	});
};

handler.help = ['bannedlist'];
handler.tags = ['owner'];
handler.command = /^(listbanned|bannedlist|daftarbanned)$/i;
handler.owner = true;

export default handler;