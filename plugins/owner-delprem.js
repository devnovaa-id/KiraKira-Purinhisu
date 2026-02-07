import moment from 'moment-timezone';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Fungsi untuk normalisasi nomor telepon
    function normalizePhoneNumber(phone) {
        if (!phone) return '';
        
        phone = phone.replace(/\D/g, '');
        
        if (!phone) return '';
        
        // Koreksi format umum
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        } else if (phone.startsWith('620')) {
            phone = '62' + phone.substring(3);
        } else if (phone.startsWith('8')) {
            phone = '62' + phone;
        } else if (phone.startsWith('+62')) {
            phone = phone.substring(1);
        } else if (phone.startsWith('62')) {
            // Sudah benar
        } else {
            phone = '62' + phone;
        }
        
        if (phone.length < 10) return '';
        
        return phone;
    }

    if (!args[0] && !m.mentionedJid?.[0] && !m.quoted) {
        throw `Tag seseorang atau sertakan nomor!\n\nContoh:\n• ${usedPrefix + command} @tag\n• ${usedPrefix + command} 6281234567890\n• ${usedPrefix + command} 081234567890`;
    }

    let who;
    let userNumber = '';
    let userName = '';
    let isMentioned = false;
    
    // Tentukan target berdasarkan konteks
    if (m.quoted) {
        who = m.quoted.sender;
        userNumber = who.split('@')[0];
        try {
            userName = await conn.getName(who) || 'Unknown';
        } catch {
            userName = 'Unknown';
        }
    } else if (m.isGroup) {
        if (m.mentionedJid && m.mentionedJid[0]) {
            who = m.mentionedJid[0];
            isMentioned = true;
            userNumber = who.split('@')[0];
            try {
                userName = await conn.getName(who) || 'Unknown';
            } catch {
                userName = 'Unknown';
            }
        } else if (args[0]) {
            userNumber = normalizePhoneNumber(args[0]);
            if (!userNumber) throw 'Format nomor tidak valid!';
            who = userNumber + '@s.whatsapp.net';
            try {
                userName = await conn.getName(who) || 'Unknown';
            } catch {
                userName = 'Unknown';
            }
        }
    } else if (args[0]) {
        userNumber = normalizePhoneNumber(args[0]);
        if (!userNumber) throw 'Format nomor tidak valid!';
        who = userNumber + '@s.whatsapp.net';
        try {
            userName = await conn.getName(who) || 'Unknown';
        } catch {
            userName = 'Unknown';
        }
    }

    // Validasi JID
    if (!who || !who.includes('@s.whatsapp.net')) {
        throw 'Target tidak valid! Pastikan tag user atau masukkan nomor yang benar.';
    }

    let users = global.db.data.users;
    
    // Cek apakah user ada di database
    if (!users[who]) {
        // Jika tidak ada, buat entry baru
        users[who] = {
            name: userName,
            premium: false,
            premiumTime: 0,
            exp: 0,
            limit: 20,
            level: 1,
            registered: false,
        };
    }
    
    let user = users[who];
    
    // Update nama jika masih "Unknown" atau "this key"
    if (user.name === 'Unknown' || user.name === 'this key' || !user.name) {
        try {
            const updatedName = await conn.getName(who);
            if (updatedName && updatedName !== 'this key') {
                user.name = updatedName;
                userName = updatedName;
            }
        } catch (e) {
            console.log('Gagal update nama:', e.message);
        }
    }
    
    // Simpan status sebelumnya untuk informasi
    const sebelumnyaPremium = user.premium;
    const sekarang = Date.now();
    const waktuSekarang = moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
    const sebelumnyaBerakhir = user.premiumTime ? 
        moment(user.premiumTime).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss') : 
        'Tidak ada';
    const sisaHari = user.premiumTime ? 
        Math.max(0, Math.ceil((user.premiumTime - sekarang) / 86400000)) : 
        0;
    
    // Hapus premium
    user.premium = false;
    user.premiumTime = 0;
    
    // Format pesan respons
    let responseMsg = `✅ *PREMIUM DIHAPUS*\n\n` +
                     `👤 *User:* ${userName}\n`;
    
    if (isMentioned) {
        responseMsg += `📌 *Mention:* @${userNumber}\n`;
    }
    
    responseMsg += `📅 *Waktu:* ${waktuSekarang}\n`;
    
    if (sebelumnyaPremium) {
        responseMsg += `⚠️ *Status sebelumnya:* Premium\n`;
        if (sisaHari > 0) {
            responseMsg += `⏳ *Sisa waktu yang dihapus:* ${sisaHari} Hari\n`;
        }
        responseMsg += `📅 *Berakhir sebelumnya:* ${sebelumnyaBerakhir}\n`;
    } else {
        responseMsg += `ℹ️ *Status sebelumnya:* Non-Premium\n`;
    }
    
    responseMsg += `⭐ *Status sekarang:* Non-Premium`;
    
    // Kirim respons
    if (isMentioned && m.isGroup) {
        await conn.sendMessage(m.chat, {
            text: responseMsg,
            mentions: [who]
        }, { quoted: m });
    } else {
        await conn.reply(m.chat, responseMsg, m);
    }
    
    // Coba kirim notifikasi ke user yang terkena dampak
    try {
        await conn.reply(who,
            `ℹ️ *INFORMASI PREMIUM*\n\n` +
            `Status premium Anda telah diubah.\n\n` +
            `*Detail:*\n` +
            `• Status: Non-Premium\n` +
            `• Diubah pada: ${waktuSekarang}\n` +
            `• Bot: ${global.namebot}\n` +
            `• Owner: ${global.owner.map(v => v[0]).join(', ')}\n\n` +
            `Hubungi owner jika ada pertanyaan.`,
            null
        );
    } catch (e) {
        console.log('Tidak bisa mengirim notifikasi ke user');
    }
};

handler.help = ['delprem [@tag/nomor]'];
handler.tags = ['owner'];
handler.command = /^(delprem|hapusprem|removeprem|-prem)$/i;
handler.owner = true;
handler.group = false;

export default handler;