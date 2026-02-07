import moment from 'moment-timezone';

let handler = async (m, { args, usedPrefix, command }) => {
    // Fungsi untuk normalisasi nomor telepon dengan berbagai format
    function normalizePhoneNumber(phone) {
        if (!phone) return '';
        
        // Hapus semua karakter non-digit
        phone = phone.replace(/\D/g, '');
        
        // Jika kosong setelah dihapus, return kosong
        if (!phone) return '';
        
        // Koreksi format umum nomor Indonesia
        if (phone.startsWith('0')) {
            // 08xxx -> 628xxx
            phone = '62' + phone.substring(1);
        } else if (phone.startsWith('620')) {
            // 6208xxx -> 628xxx (koreksi double 62)
            phone = '62' + phone.substring(3);
        } else if (phone.startsWith('8')) {
            // 8xxx -> 628xxx
            phone = '62' + phone;
        } else if (phone.startsWith('+62')) {
            // +628xxx -> 628xxx
            phone = phone.substring(1);
        } else if (phone.startsWith('62')) {
            // 628xxx -> sudah benar
        } else {
            // Jika tidak diawali dengan kode negara, tambahkan 62
            phone = '62' + phone;
        }
        
        // Pastikan panjang minimal 10 digit (62 + 8xxx...)
        if (phone.length < 10) return '';
        
        return phone;
    }

    let who;
    let userName = '';
    let userNumber = '';
    
    // Logika menentukan target user
    if (m.quoted) {
        // Jika ada quoted message
        who = m.quoted.sender;
        userName = await conn.getName(who) || 'Unknown';
        userNumber = who.split('@')[0];
    } else if (m.isGroup) {
        // Jika di grup
        if (m.mentionedJid && m.mentionedJid[0]) {
            // Jika ada mention
            who = m.mentionedJid[0];
            userName = await conn.getName(who) || 'Unknown';
            userNumber = who.split('@')[0];
        } else if (args[1]) {
            // Jika ada argumen berupa nomor
            userNumber = normalizePhoneNumber(args[1]);
            if (!userNumber) throw 'Format nomor tidak valid!';
            who = userNumber + '@s.whatsapp.net';
            userName = await conn.getName(who) || 'Unknown';
        } else {
            throw `Tag seseorang atau sertakan nomor!\n\nContoh:\n• ${usedPrefix + command} 30 @tag\n• ${usedPrefix + command} 30 6281234567890\n• ${usedPrefix + command} permanen 081234567890`;
        }
    } else if (args[1]) {
        // Jika di private chat
        userNumber = normalizePhoneNumber(args[1]);
        if (!userNumber) throw 'Format nomor tidak valid!';
        who = userNumber + '@s.whatsapp.net';
        userName = await conn.getName(who) || 'Unknown';
    } else {
        throw `Siapa yang ingin diubah status premium-nya?\n\nContoh:\n• ${usedPrefix + command} 30 6281234567890\n• ${usedPrefix + command} permanen 081234567890`;
    }

    // Validasi akhir: pastikan who adalah JID yang valid
    if (!who.includes('@s.whatsapp.net')) {
        throw 'Format nomor WhatsApp tidak valid!';
    }

    // Dapatkan user dari database atau buat baru
    let user = global.db.data.users[who];
    
    // Jika user belum ada di database, inisialisasi dengan data default
    if (!user) {
        global.db.data.users[who] = {
            name: userName,
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
        user = global.db.data.users[who];
    }

    // Update nama jika masih "Unknown"
    if (user.name === 'Unknown' || !user.name) {
        user.name = userName;
    }

    switch (command) {
        case 'addprem':
        case 'tambahprem':
        case '+prem':
            if (!args[0]) throw `Berapa hari premium?\n\nContoh:\n• ${usedPrefix + command} 30 @tag\n• ${usedPrefix + command} permanen 6281234567890`;

            const durasi = args[0].toLowerCase();
            
            if (durasi === 'permanen') {
                user.premium = true;
                user.premiumTime = null; // null untuk permanen
                
                const replyMsg = `✅ *PREMIUM DITAMBAHKAN (PERMANEN)*\n\n` +
                               `👤 *Nama:* ${user.name}\n` +
                               `📞 *Nomor:* ${userNumber || who.split('@')[0]}\n` +
                               `⭐ *Status:* Premium Permanen\n` +
                               `📅 *Tanggal:* ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}\n` +
                               `⏰ *Waktu:* ${moment().tz('Asia/Jakarta').format('HH:mm:ss')}`;
                
                await m.reply(replyMsg);
                
                // Coba kirim notifikasi ke user
                try {
                    await conn.reply(who, 
                        `🎉 *SELAMAT!*\n\n` +
                        `Anda mendapatkan akses premium permanen!\n\n` +
                        `*Detail:*\n` +
                        `• Premium: Permanen\n` +
                        `• Mulai: ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}\n` +
                        `• Bot: ${global.namebot}\n\n` +
                        `Gunakan fitur premium dengan bijak! 😊`, 
                        null
                    );
                } catch (e) {
                    console.log('Tidak bisa mengirim notifikasi ke user:', e.message);
                }
            } else {
                // Validasi durasi
                const hari = parseInt(durasi);
                if (isNaN(hari) || hari <= 0) {
                    throw `Durasi harus berupa angka positif!\nContoh: ${usedPrefix + command} 30 @tag`;
                }
                if (hari > 3650) { // Maksimal 10 tahun
                    throw `Durasi maksimal 3650 hari (10 tahun)!`;
                }
                
                const jumlahMilidetik = 86400000 * hari;
                const sekarang = new Date().getTime();
                
                // Hitung waktu berakhir
                if (user.premium && user.premiumTime && sekarang < user.premiumTime) {
                    // Jika sudah premium, tambahkan durasi
                    user.premiumTime += jumlahMilidetik;
                } else {
                    // Jika belum premium atau sudah expired
                    user.premiumTime = sekarang + jumlahMilidetik;
                }
                user.premium = true;
                
                const mulai = moment(sekarang).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
                const berakhir = moment(user.premiumTime).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
                const sisaHari = Math.ceil((user.premiumTime - sekarang) / 86400000);
                
                const replyMsg = `✅ *PREMIUM DITAMBAHKAN*\n\n` +
                               `👤 *Nama:* ${user.name}\n` +
                               `📞 *Nomor:* ${userNumber || who.split('@')[0]}\n` +
                               `⏳ *Durasi:* ${hari} Hari\n` +
                               `📅 *Mulai:* ${mulai}\n` +
                               `📅 *Berakhir:* ${berakhir}\n` +
                               `⏰ *Sisa:* ${sisaHari} Hari\n` +
                               `⭐ *Status:* Premium Aktif`;
                
                await m.reply(replyMsg);
                
                // Coba kirim notifikasi ke user
                try {
                    await conn.reply(who,
                        `🎉 *SELAMAT!*\n\n` +
                        `Anda mendapatkan akses premium selama ${hari} hari!\n\n` +
                        `*Detail Premium:*\n` +
                        `• Durasi: ${hari} Hari\n` +
                        `• Mulai: ${mulai}\n` +
                        `• Berakhir: ${berakhir}\n` +
                        `• Sisa: ${sisaHari} Hari\n` +
                        `• Bot: ${global.namebot}\n\n` +
                        `Nikmati fitur premium sepenuhnya! ✨`,
                        null
                    );
                } catch (e) {
                    console.log('Tidak bisa mengirim notifikasi ke user:', e.message);
                }
            }
            break;

        case 'delprem':
        case 'hapusprem':
        case '-prem':
            const sebelumnyaPremium = user.premium;
            const sebelumnyaBerakhir = user.premiumTime ? 
                moment(user.premiumTime).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss') : 
                'Tidak ada';
            
            user.premium = false;
            user.premiumTime = 0;
            
            const replyMsg = `⚠️ *PREMIUM DIHAPUS*\n\n` +
                           `👤 *Nama:* ${user.name}\n` +
                           `📞 *Nomor:* ${userNumber || who.split('@')[0]}\n` +
                           `📅 *Dihapus pada:* ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}\n` +
                           `📅 *Sebelumnya berakhir:* ${sebelumnyaBerakhir}\n` +
                           `⭐ *Status sebelumnya:* ${sebelumnyaPremium ? 'Premium' : 'Non-Premium'}`;
            
            await m.reply(replyMsg);
            
            // Coba kirim notifikasi ke user
            try {
                await conn.reply(who,
                    `ℹ️ *INFORMASI PREMIUM*\n\n` +
                    `Akses premium Anda telah dihentikan.\n\n` +
                    `*Detail:*\n` +
                    `• Status: Non-Premium\n` +
                    `• Dihentikan: ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}\n` +
                    `• Bot: ${global.namebot}\n\n` +
                    `Hubungi owner jika ini kesalahan.`,
                    null
                );
            } catch (e) {
                console.log('Tidak bisa mengirim notifikasi ke user:', e.message);
            }
            break;

        default:
            throw `Command tidak valid. Gunakan:\n• ${usedPrefix}addprem [hari/permanen] [@tag/nomor]\n• ${usedPrefix}delprem [@tag/nomor]`;
    }
    
    // Simpan perubahan ke database
    global.db.data = global.db.data || {};
    global.db.data.users = global.db.data.users || {};
};

handler.help = ['addprem [hari/permanen] [@tag/nomor]', 'delprem [@tag/nomor]'];
handler.tags = ['owner'];
handler.command = /^(add|tambah|\+|del|hapus|-)p(rem)?$/i;
handler.group = false;
handler.owner = true;
handler.premium = false;

export default handler;