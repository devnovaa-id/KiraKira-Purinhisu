let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
    const isEnable = /^(true|enable|(turn)?on|1)$/i.test(command);
    let type = (args[0] || '').toLowerCase();
    let isAll = false;
    let isUser = false;

    switch (type) {
        case 'welcome':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
            global.db.data.chats[m.chat].welcome = isEnable;
            break;
        case 'detect':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
            global.db.data.chats[m.chat].detect = isEnable;
            break;
        case 'antidelete':
        case 'delete':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
            global.db.data.chats[m.chat].delete = isEnable;
            break;
        case 'autolevelup':
            isUser = true;
            if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
            global.db.data.users[m.sender].autolevelup = isEnable;
            break;
        case 'autoread':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
            global.db.data.settings[conn.user.jid].autoread = isEnable;
            break;
        case 'public':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
            global.db.data.settings[conn.user.jid].public = isEnable;
            break;
        case 'gconly':
        case 'grouponly':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
            global.db.data.settings[conn.user.jid].gconly = isEnable;
            break;
        case 'anticall':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
            global.db.data.settings[conn.user.jid].anticall = isEnable;
            break;
        default:
            if (!/[01]/.test(command))
                return m.reply(`
*Daftar opsi yang bisa diatur:*

*Untuk User:*
- autolevelup

*Untuk Admin Grup:*
- welcome
- detect
- antidelete
${isOwner ? `
*Untuk Owner Bot:*
- autoread
- self
- anticall
- gconly
` : ''}
*Contoh penggunaan:*
- ${usedPrefix}enable welcome
- ${usedPrefix}disable welcome
`.trim());
            throw false;
    }

    m.reply(`*${type}* berhasil di *${isEnable ? 'aktifkan' : 'nonaktifkan'}* ${isAll ? 'untuk bot' : isUser ? '' : 'untuk chat ini'}`);
};

handler.help = ['enable', 'disable'];
handler.tags = ['main'];
handler.command = /^((en|dis)able|(true|false)|(turn)?(on|off)|[01])$/i;

export default handler;