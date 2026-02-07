import moment from 'moment-timezone';

let handler = async (m) => {
    let response = '• *PREMIUM SUBSCRIPTION*\n\n';
    let totalPremium = 0;
    
    // Dapatkan semua user premium
    const premiumUsers = [];
    
    for (let userJid in global.db.data.users) {
        const user = global.db.data.users[userJid];
        if (user.premium) {
            premiumUsers.push({
                jid: userJid,
                name: user.name,
                premiumTime: user.premiumTime
            });
        }
    }
    
    // Urutkan berdasarkan nama
    premiumUsers.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    if (premiumUsers.length === 0) {
        response += `📭 *Tidak ada user premium saat ini*\n\n`;
        response += `┌  ◦  Total Premium : *0*\n`;
        response += '└  ◦  Upgrade Premium: *.owner*';
        return m.reply(response);
    }
    
    for (const user of premiumUsers) {
        let displayName = user.name || 'Unknown';
        
        // Coba perbaiki nama jika "this key" atau tidak ada
        if (displayName === 'Unknown' || displayName === 'this key' || !displayName) {
            try {
                const updatedName = await conn.getName(user.jid);
                if (updatedName && updatedName !== 'this key') {
                    displayName = updatedName;
                    // Update di database
                    global.db.data.users[user.jid].name = updatedName;
                }
            } catch (e) {
                // Biarkan displayName seperti semula
            }
        }
        
        // Hitung sisa waktu
        let timeInfo = '';
        if (user.premiumTime === null) {
            timeInfo = '⭐ *Status:* Permanen';
        } else {
            const timeLeft = user.premiumTime - Date.now();
            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
                const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                
                if (days > 0) {
                    timeInfo = `⏳ *Sisa waktu:* ${days} Hari ${hours} Jam ${minutes} Menit`;
                } else if (hours > 0) {
                    timeInfo = `⏳ *Sisa waktu:* ${hours} Jam ${minutes} Menit`;
                } else {
                    timeInfo = `⏳ *Sisa waktu:* ${minutes} Menit`;
                }
                
                // Tambahkan tanggal berakhir
                const endDate = moment(user.premiumTime).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm');
                timeInfo += `\n📅 *Berakhir:* ${endDate}`;
            } else {
                timeInfo = '⚠️ *Status:* Sudah berakhir';
            }
        }
        
        response += `∝───────•••───────\n`;
        response += `👤 *${displayName}*\n`;
        response += `${timeInfo}\n`;
        response += `∝───────•••───────\n`;

        totalPremium++;
    }
    
    response += `\n┌  ◦  Total Premium : *${totalPremium}*\n`;
    response += '└  ◦  Upgrade Premium: *.owner*';

    // Kirim pesan tanpa mention
    m.reply(response);
};

handler.help = ['listpremium'];
handler.command = /^(listprem(ium|iums)?)$/i;
handler.tags = ['info'];

export default handler;