const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ================= KONFIGURASI UTAMA =================
const OWNER_ID = 'ID_AKUN_DISCORD_KAMU'; 
const STARTING_CASH = 50000;
const DATA_FILE = './database.json';

// KONFIGURASI EMOJI UTAMA
const EMOJI_COIN_SPIN = '<a:coindark:1519943946267004968>'; 
const EMOJI_COIN_STOP = '🪙';                               
const EMOJI_SLOTS_SPIN = '<a:spin:1519947196483502142>';     
const EMOJI_MONEY = '<:moneyslot:1519946191880720384>';

const EMOJI_SLOTS = [
    '<:emoji_3:1519947110206935140>',
    '<:manis:1519947169946406963>',
    '<:pisang:1519947217215946822>'
];

// --- KONFIGURASI TAMBAHAN ---
const CARD_EMOJIS = {
    1: '<:1slot:1520112935207305428>', 2: '<:2slot:1520112819813482777>', 3: '<:3slot:1520114143137366036>',
    4: '<:4slot:1520114200242946069>', 5: '<:5slot:1520114273924288552>', 6: '<:6slot:1520114429386166406>',
    7: '<:7slot:1520114471115161651>', 8: '<:8slot:1520114575448473641>', 9: '<:9slot:1520114687440589000>',
    10: '<:10slot:1520114768701161533>', 11: '<:11slot:1520115002336350288>', 12: '<:1520115044262609027>',
    'J': '<:Jslot:1520115970549612696>', 'Q': '<:Qslot:1520116024161075331>', 'K': '<:Kslot:1520116100568715415>'
};

// Struktur penyimpanan data cooldown pengguna
const gameCooldowns = new Map();

const checkCooldown = (userId, commandName, message) => {
    const now = Date.now();
    const cooldownAmount = 5000; // Jeda waktu 5 detik dalam milidetik

    if (!gameCooldowns.has(userId)) {
        gameCooldowns.set(userId, {});
    }

    const userCooldowns = gameCooldowns.get(userId);

    if (userCooldowns[commandName]) {
        const expirationTime = userCooldowns[commandName] + cooldownAmount;

        if (now < expirationTime) {
            message.reply('Sabar kimak! lagi cooldown').catch(() => {});
            return true; // Mengembalikan nilai true jika user masih cooldown
        }
    }

    // Perbarui waktu pemicuan perintah terakhir user
    userCooldowns[commandName] = now;
    return false;
};

const BJ_CARD_EMOJIS = {
    1: '<:1slot:1520112935207305428>', 2: '<:2slot:1520112819813482777>', 3: '<:3slot:1520114143137366036>',
    4: '<:4slot:1520114200242946069>', 5: '<:5slot:1520114273924288552>', 6: '<:6slot:1520114429386166406>',
    7: '<:7slot:1520114471115161651>', 8: '<:8slot:1520114575448473641>', 9: '<:9slot:1520114687440589000>',
    10: '<:10slot:1520114768701161533>', 11: '<:11slot:1520115002336350288>', 12: '<:12slot:1520115044262609027>',
    13: '<:13slot:1520115105839321213>', 14: '<:14slot:1520115155499749457>', 15: '<:15slot:1520115224093397053>',
    16: '<:16slot:1520115406592020550>', 17: '<:17slot:1520115460484497479>', 18: '<:18slot:1520115511440965753>',
    19: '<:19slot:1520115562196242472>', 20: '<:20slot:1520115607012376637>', 21: '<:21slot:1520115652642476094>',
    'J': '<:Jslot:1520115970549612696>', 'Q': '<:Qslot:1520116024161075331>', 'K': '<:Kslot:1520116100568715415>'
};

const getBjCardValue = (val) => {
    if (['J', 'Q', 'K'].includes(val)) return 10;
    return parseInt(val);
};

const getRandomBjCard = () => {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 'J', 'Q', 'K'];
    const val = keys[Math.floor(Math.random() * keys.length)];
    return { display: val, emoji: BJ_CARD_EMOJIS[val], value: getBjCardValue(val) };
};

// Fungsi menghitung total nilai Blackjack dengan penanganan fleksibel
const calculateHand = (hand) => {
    let total = 0;
    for (const card of hand) {
        total += card.value;
    }
    return total;
};

const getCardValue = (val) => (['J', 'Q', 'K'].includes(val) ? 10 : val);

const getRandomCard = () => {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'J', 'Q', 'K'];
    const val = keys[Math.floor(Math.random() * keys.length)];
    return { display: val, emoji: CARD_EMOJIS[val], value: getCardValue(val) };
};

// Tambahan Anti-Toxic
let antiToxicEnabled = {}; // Menyimpan channel yang aktif
let warningList = {}; // Menyimpan data peringatan pengguna

const TOXIC_WORDS = ['anjir', 'babi', 'lonte', 'kimak', 'asu', 'anjeng', 'anjr', 'anjing', 'bapak kau', 'memek', 'pepek', 'kontol', 'totong'];
const TOXIC_REASONS = ['TOXIC UDAH DIPERINGATIN SAMA BOT 🚨', 'DILARANG TOXIC ❗️'];

// Tabel Multiplier Mines (3 Mines dari total 9 slot)
const MULTIPLIERS = [1.00, 1.41, 1.95, 2.26, 3.95, 5.12, 7.40, 11.80, 19.50];
// ====================================================

let db = { users: {}, channels: {}, ownerRoles: {} };

if (fs.existsSync(DATA_FILE)) {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
if (!db.ownerRoles) db.ownerRoles = {};

function saveDB() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function getUserData(userId) {
    if (!db.users[userId]) {
        db.users[userId] = { cash: STARTING_CASH, lastDaily: 0 };
        saveDB();
    }
    return db.users[userId];
}

client.once('ready', () => {
    console.log(`[BERHASIL] Bot sudah online sebagai ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Command: /menolaktoxic (Hanya Admin)
    if (message.content.startsWith('/menolaktoxic')) {
        if (!message.member.permissions.has('Administrator')) return;
        
        const channel = message.mentions.channels.first() || message.channel;
        antiToxicEnabled[message.guild.id] = channel.id;
        saveDB(); // Simpan ke file jika perlu
        return message.reply('**FITUR ANTI TOXIC BERHASIL DI NYALAKAN! ⚠️**');
    }

    // Deteksi Anti-Toxic
    if (antiToxicEnabled[message.guild.id] === message.channel.id && 
        !message.member.permissions.has('Administrator') && 
        !message.author.bot) {
        
        const content = message.content.toLowerCase();
        const isToxic = TOXIC_WORDS.some(word => content.includes(word));

        if (isToxic) {
            const now = Date.now();
            const userId = message.author.id;

            // Cek apakah user pernah kena peringatan dalam 1 menit terakhir
            if (warningList[userId] && (now - warningList[userId] < 60000)) {
                // Timeout user selama 30 menit
                const reason = TOXIC_REASONS[Math.floor(Math.random() * TOXIC_REASONS.length)];
                try {
                    await message.member.timeout(30 * 60 * 1000, reason);
                    message.channel.send(`<a:anim_punch:1011474831369322496> <@${userId}> has been timed out!\n> **Reason:** ${reason}\n> **Duration:** 30 minutes`);
                    delete warningList[userId];
                } catch (err) {
                    message.reply('❌ gagal melakukan timeout (bot mungkin tidak memiliki izin/posisi role bot rendah).');
                }
            } else {
                // Peringatan pertama
                warningList[userId] = now;
                message.reply('WOI, GABOLE TOKSIK GABOLE TOKSIK <a:cats_nomnom_ramble:1517101274443677717>');
            }
            return; // Hentikan proses jika pesan toksik
        }
    }

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. Perintah Set Channel Game (!set ch)
    if (command === '!set' && args[0]?.toLowerCase() === 'ch') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Kamu memerlukan permission `Administrator` untuk menjalankan perintah ini.');
        }
        db.channels[message.guild.id] = message.channel.id;
        saveDB();
        return message.reply(`✅ berhasil mengatur channel game khusus server ini ke <#${message.channel.id}>`);
    }

    // 2. Perintah Set Role Owner Manual (!set owner @Role)
    if (command === '!set' && args[0]?.toLowerCase() === 'owner') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ kamu memerlukan permission `Administrator` untuk menjalankan perintah ini.');
        }
        const role = message.mentions.roles.first();
        if (!role) return message.reply('❌ Format salah! Gunakan: `!set owner @NamaRole`');

        db.ownerRoles[message.guild.id] = role.id;
        saveDB();
        return message.reply(`✅ berhasil mengatur Role Owner server ini ke role: **${role.name}**`);
    }

    // Perintah Admin Set Cash Sendiri (!setcash <jumlah>)
    if (command === '!setcash' || command === 'setcash') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Perintah ini hanya bisa digunakan oleh user dengan role `Administrator`.');
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 0) {
            return message.reply('❌ Format salah! Gunakan: `!setcash <jumlah>`');
        }

        const authorData = getUserData(message.author.id);
        authorData.cash = amount;
        saveDB();
        return message.reply(`👑 | **${message.author.username}** (Admin), kamu berhasil mengatur saldocash kamu sendiri menjadi **${EMOJI_MONEY} ${amount.toLocaleString()}**!`);
    }

    // VALIDASI OTORISASI OWNER & CHANNEL
    const manualOwnerRoleId = db.ownerRoles[message.guild.id];
    const hasOwnerRole = manualOwnerRoleId ? message.member.roles.cache.has(manualOwnerRoleId) : false;
    const isBotOwner = (message.author.id === OWNER_ID || hasOwnerRole);

    const allowedChannelId = db.channels[message.guild.id];
    const gameCommands = ['scash', 'sdaily', 'slotsend', 'scf', 'ss', 'slot', 'sleaderboard', 'slb', 'smine'];
    
    if (!allowedChannelId && gameCommands.includes(command)) {
        return message.reply('⚠️ Game channel belum dikonfigurasi. Minta Admin mengetik `!set ch` di channel khusus game.');
    }
    
    if (allowedChannelId && message.channel.id !== allowedChannelId && gameCommands.includes(command)) {
        return;
    }

    // 3. Command: Owner Set Cash (set cash [target] <jumlah>)
    if (command === 'set' && args[0]?.toLowerCase() === 'cash') {
        if (!isBotOwner) return;
        const targetUser = message.mentions.users.first();
        const amountStr = targetUser ? args[2] : args[1];
        const amount = parseInt(amountStr);
        
        if (isNaN(amount)) return message.reply('❌ Format salah. Gunakan: `set cash <jumlah>` atau `set cash @user <jumlah>`');
        
        if (targetUser) {
            const targetData = getUserData(targetUser.id);
            targetData.cash = amount;
            saveDB();
            return message.reply(`💰 Berhasil mengatur balance ${targetUser.username} menjadi **${amount.toLocaleString()}**.`);
        } else {
            const authorData = getUserData(message.author.id);
            authorData.cash = amount;
            saveDB();
            return message.reply(`💰 Berhasil mengatur balance kamu sendiri menjadi **${amount.toLocaleString()}**.`);
        }
    }

    // 4. Command: Cek saldocash (scash)
    if (command === 'scash') {
        const userData = getUserData(message.author.id);
        return message.reply(`💵 | **${message.author.username}**, saat ini kamu memiliki **${userData.cash.toLocaleString()}** cash!`);
    }

    // 6. Command: Kirim Uang (slotsend)
    if (command === 'slotsend') {
        const targetUser = message.mentions.users.first();
        const amountStr = args.find(arg => arg.toLowerCase() === 'all' || !isNaN(arg) && !arg.includes('<@'));
        
        if (!targetUser || targetUser.id === message.author.id || targetUser.bot) {
            return message.reply('❌ Format: `slotsend @user <jumlah/all>`');
        }

        const authorData = getUserData(message.author.id);
        let amount = amountStr?.toLowerCase() === 'all' ? authorData.cash : parseInt(amountStr);

        if (isNaN(amount) || amount <= 0) return message.reply('❌ masukkan jumlah yang valid untuk dikirim.');
        if (authorData.cash < amount) return message.reply('❌ saldocash kamu tidak mencukupi.');
        
        const embed = new EmbedBuilder()
            .setColor('#ffc0cb')
            .setAuthor({ name: `${message.author.username}, konfirmasi pengiriman` })
            .setDescription(`Klik <:approve:1520096857211273417> **CONFIRM** untuk mengirim atau <:not:1520096893357527162>  **CANCEL** untuk membatalkan.`)
            .addFields({ name: 'Detail', value: `**${message.author.username}** ➥ **${amount.toLocaleString()}** ➥ **${targetUser.username}**` });
            
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_send').setLabel('Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_send').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );
        
        const msg = await message.reply({ embeds: [embed], components: [row] });
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 20000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_send') {
                if (authorData.cash < amount) return i.update({ content: '❌ saldocash kamu tidak cukup!', embeds: [], components: [] });
                
                const targetData = getUserData(targetUser.id);
                authorData.cash -= amount;
                targetData.cash += amount;
                saveDB();

                await i.update({ content: `💳 | **${message.author.username}** berhasil mengirim **${amount.toLocaleString()}** kepada **${targetUser.username}**!`, embeds: [], components: [] });
            } else {
                await i.update({ content: '❌ transaksi dibatalkan.', embeds: [], components: [] });
            }
            collector.stop();
        });
    }

    // 7. Command: Coinflip (scf) - Maksimal 300.000
    if (command === 'scf') {
        if (checkCooldown(message.author.id, 'scf', message)) return;
        const authorData = getUserData(message.author.id);
        let bet = null;
        let side = 'heads'; 

        args.forEach(arg => {
            const a = arg.toLowerCase();
            if (a === 'all') bet = authorData.cash;
            else if (!isNaN(a)) bet = parseInt(a);
            else if (a === 'h') side = 'heads';
            else if (a === 't') side = 'tails';
        });

        if (bet === null) bet = 1;
        // Batasan Maksimal diganti ke 300.000
        if (bet > 300000) bet = 300000;
        
        if (bet <= 0) return message.reply('❌ jumlah taruhan harus di atas 0.');
        if (authorData.cash < bet) return message.reply('❌ saldocash kamu tidak mencukupi.');

        authorData.cash -= bet;
        saveDB();
        
        const processMsg = await message.reply(`**${message.author.username}** spent **${EMOJI_MONEY} ${bet.toLocaleString()}** and chose **${side}**\nThe coin spins... ${EMOJI_COIN_SPIN}`);
        
        setTimeout(async () => {
            const outcomes = ['heads', 'tails'];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];
            
            if (result === side) {
                const winnings = bet * 2;
                authorData.cash += winnings;
                saveDB();
                await processMsg.edit(`**${message.author.username}** spent **${EMOJI_MONEY} ${bet.toLocaleString()}** and chose **${side}**\nThe coin spins... ${EMOJI_COIN_STOP} and you won **${EMOJI_MONEY} ${winnings.toLocaleString()}**!!`);
            } else {
                await processMsg.edit(`**${message.author.username}** spent **${EMOJI_MONEY} ${bet.toLocaleString()}** and chose **${side}**\nThe coin spins... ${EMOJI_COIN_STOP} and you lost it all... :c`);
            }
        }, 2500);
    }

    // ================= GAME HIGHLOW (shl) =================
    if (command === 'shl') {
        // Sistem Cooldown 5 detik
        if (checkCooldown(message.author.id, 'shl', message)) return;

        const authorData = getUserData(message.author.id);
        let bet = null;

        // Membaca argumen taruhan
        args.forEach(arg => {
            const a = arg.toLowerCase();
            if (a === 'all') bet = authorData.cash;
            else if (!isNaN(a)) bet = parseInt(a);
        });

        if (bet === null) bet = 1000; 
        if (bet > 300000) bet = 300000; // Maksimal All-in 300.000
        if (bet <= 0) return message.reply('❌ Masukkan jumlah taruhan yang valid!');
        if (authorData.cash < bet) return message.reply(`❌ Saldo cash kamu tidak mencukupi untuk bertaruh **${bet.toLocaleString()}** cash.`);

        // Potong saldo di awal permainan
        authorData.cash -= bet;
        saveDB();

        // Menggunakan fungsi bawaan bot kamu untuk mendapatkan objek kartu asli (yang berisi .value dan .emoji angka)
        let firstCard = getRandomCard();
        // Memastikan kartu pertama berada di rentang angka maksimal 12
        while (firstCard.value > 12) {
            firstCard = getRandomCard();
        }

        let cardHistory = [firstCard]; 
        let streak = 0;
        const cardbackEmoji = '<:cardback:1520298633981988955>';

        // Fungsi kalkulasi nominal profit dinamis pada tombol (disesuaikan batas maksimal 12)
        const getNextProfit = (currentValue, type) => {
            let chance = type === 'higher' ? (13 - currentValue) / 12 : (currentValue - 1) / 12;
            if (chance <= 0) chance = 0.1; 
            const multiplier = (1 / chance) * 1.15; 
            return Math.floor(bet * multiplier);
        };

        // Fungsi utama pembuat struktur pesan Embed
        function generateGameMessage(statusType = 'playing', selectedChoice = null, revealedCard = null) {
            const currentCard = cardHistory[cardHistory.length - 1];
            
            // Perhitungan rate cash out (Multiplier 1.45x per streak beruntun)
            let currentCashOut = streak === 0 ? 0 : Math.floor(bet * Math.pow(1.45, streak));
            let currentMultiplier = streak === 0 ? 0.00 : Math.pow(1.45, streak);

            // Menyusun barisan kartu menggunakan emoji angka bawaan
            let cardDisplayPath = cardHistory.map(c => c.emoji).join(' ‣ ');
            if (statusType === 'playing' && cardHistory.length < 3) {
                cardDisplayPath += ` ‣ ${cardbackEmoji}`;
            } else if (statusType === 'lost' && revealedCard) {
                cardDisplayPath += ` ‣ ${revealedCard.emoji}`;
            }

            // Bagian info diletakkan di paling atas deskripsi setelah judul
            const infoHeader = `Bet: ${bet.toLocaleString()}  Streak: ${streak}  Cash Out: ${currentCashOut.toLocaleString()} ( ${currentMultiplier.toFixed(2)}x )\n${'—'.repeat(30)}`;

            const embed = new EmbedBuilder()
                .setDescription(`🃏 <@${message.author.id}> **started a HighLow game.**\n${infoHeader}\n\n## ${cardDisplayPath}\n\nIs the next card higher or lower?\n### Current Card: ${currentCard.value}`);

            const nextHigherProfit = getNextProfit(currentCard.value, 'higher');
            const nextLowerProfit = getNextProfit(currentCard.value, 'lower');

            // Set status disable tombol berdasarkan apakah game masih berjalan atau sudah selesai (tombol menetap)
            const isFinished = statusType !== 'playing';

            const rowButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('hl_higher')
                    .setLabel(`Higher (+${nextHigherProfit.toLocaleString()})`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isFinished),
                new ButtonBuilder()
                    .setCustomId('hl_lower')
                    .setLabel(`Lower (+${nextLowerProfit.toLocaleString()})`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isFinished)
            );

            const rowCashout = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('hl_cashout')
                    .setLabel(streak === 0 ? 'Cash Out' : `Cash Out: ${currentCashOut.toLocaleString()}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(streak === 0 || isFinished)
            );

            if (statusType === 'playing') {
                embed.setColor('#5865F2');
                return { embeds: [embed], components: [rowButtons, rowCashout] };
            } 
            
            if (statusType === 'lost') {
                embed.setColor('#ED4245')
                    .setDescription(`👎 <@${message.author.id}> **guessed incorrectly!!**\n${infoHeader}\n\n## ${cardDisplayPath}\n\nYou guessed ${selectedChoice}. You lost.\n### Current Card: ${revealedCard.value}`);
                return { embeds: [embed], components: [rowButtons, rowCashout] };
            }

            if (statusType === 'max_win') {
                embed.setColor('#57F287')
                    .setDescription(`🎉 <@${message.author.id}> **reached max cards!**\n${infoHeader}\n\n## ${cardDisplayPath}\n\nGame selesai! Kemenangan maksimal otomatis disimpan: **${EMOJI_MONEY} ${currentCashOut.toLocaleString()}**`);
                return { embeds: [embed], components: [rowButtons, rowCashout] };
            }

            if (statusType === 'cashed_out') {
                embed.setColor('#57F287')
                    .setDescription(`💰 <@${message.author.id}> **Cashed Out!**\n${infoHeader}\n\n## ${cardDisplayPath}\n\nBerhasil dicairkan ke saldo slotcash senilai **${EMOJI_MONEY} ${currentCashOut.toLocaleString()}**`);
                return { embeds: [embed], components: [rowButtons, rowCashout] };
            }
        }

        const msg = await message.reply(generateGameMessage('playing'));
        
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id
        });

        collector.on('collect', async i => {
            if (i.customId === 'hl_cashout') {
                collector.stop('cashout');
                let finalWinnings = Math.floor(bet * Math.pow(1.45, streak));
                
                const finalUserData = getUserData(message.author.id);
                finalUserData.cash += finalWinnings;
                saveDB();

                return i.update(generateGameMessage('cashed_out'));
            }

            let cardDisplayPath = cardHistory.map(c => c.emoji).join(' ‣ ');
            
            let currentCashOut = streak === 0 ? 0 : Math.floor(bet * Math.pow(1.45, streak));
            let currentMultiplier = streak === 0 ? 0.00 : Math.pow(1.45, streak);
            const infoHeader = `Bet: ${bet.toLocaleString()}  Streak: ${streak}  Cash Out: ${currentCashOut.toLocaleString()} ( ${currentMultiplier.toFixed(2)}x )\n${'—'.repeat(30)}`;

            const animEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription(`🃏 <@${message.author.id}> **started a HighLow game.**\n${infoHeader}\n\n## ${cardDisplayPath} ‣ <a:loadings:1520313495537586237>`);

            await i.update({ embeds: [animEmbed], components: [] });

            setTimeout(async () => {
                let isHigher = i.customId === 'hl_higher';
                const currentCard = cardHistory[cardHistory.length - 1];
                
                // SISTEM JUDI MURNI (RNG KASINO): Mengambil kartu emoji asli dari dek dan mengunci nilai maksimal 12
                let nextCard = getRandomCard();
                while (nextCard.value > 12 || nextCard.value === currentCard.value) {
                    nextCard = getRandomCard();
                }

                // Evaluasi keabsahan hasil tebakan akhir pemain
                let isWon = isHigher ? (nextCard.value >= currentCard.value) : (nextCard.value <= currentCard.value);

                if (isWon) {
                    streak++;
                    cardHistory.push(nextCard);

                    if (cardHistory.length >= 3) {
                        collector.stop('max_win');
                        let finalWinnings = Math.floor(bet * Math.pow(1.45, streak));
                        
                        const finalUserData = getUserData(message.author.id);
                        finalUserData.cash += finalWinnings;
                        saveDB();

                        await msg.edit(generateGameMessage('max_win'));
                    } else {
                        await msg.edit(generateGameMessage('playing'));
                    }
                } else {
                    collector.stop('lost');
                    await msg.edit(generateGameMessage('lost', isHigher ? 'Higher' : 'Lower', nextCard));
                }
            }, 1000);
        });
    }

    // ================= GAME BLACKJACK JUDI MURNI (sbj) =================
    if (command === 'sbj') {
        if (checkCooldown(message.author.id, 'sbj', message)) return;

        const authorData = getUserData(message.author.id);
        let bet = null;
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'all') {
            bet = authorData.cash;
        } else if (!isNaN(subCommand)) {
            bet = parseInt(subCommand);
        }

        if (bet === null) bet = 1000;
        if (bet > 300000) bet = 300000; 
        if (bet <= 0) return message.reply('❌ Masukkan jumlah taruhan yang valid!');
        if (authorData.cash < bet) return message.reply(`❌ Saldo tidak mencukupi.`);

        authorData.cash -= bet;
        saveDB();

        // Mengambil kartu awal secara acak murni
        let playerHand = [getRandomBjCard()];
        let dealerHand = [getRandomBjCard()];
        
        // Kartu kedua disimpan tersembunyi terlebih dahulu untuk simulasi meja judi asli
        let playerHiddenCard = getRandomBjCard();
        let dealerHiddenCard = getRandomBjCard();

        let playerHandVisible = [playerHand[0]];
        let dealerHandVisible = [dealerHand[0]];

        const cardbackEmoji = '<:cardback:1520298633981988955>';
        const loadingEmoji = '<a:loadings:1520313495537586237>';

        // Fungsi khusus untuk mendapatkan kartu lanjutan yang nilainya cenderung kecil (1-6) agar tidak langsung kelewatan
        function getSmallBjCard() {
            const card = getRandomBjCard();
            if (card.value > 6) {
                card.value = Math.floor(Math.random() * 6) + 1; // Konversi paksa ke angka kecil demi stabilitas game
            }
            return card;
        }

        // Fungsi kalkulasi nilai Blackjack adaptif (Kartu bernilai 1 otomatis dihitung 11 jika menguntungkan untuk dapat 21)
        function getHandValue(hand) {
            let total = 0;
            let aces = 0;

            for (const card of hand) {
                if (card.value === 1) {
                    aces++;
                    total += 11; // Biasanya diasumsikan 11 untuk mengejar hoki angka 21
                } else {
                    total += card.value;
                }
            }

            // Jika total melebihi 21 tetapi ada kartu bernilai 1 (Ace), turunkan nilainya kembali menjadi 1
            while (total > 21 && aces > 0) {
                total -= 10;
                aces--;
            }

            return total > 25 ? 25 : total;
        }

        function generateBjEmbed(status = 'playing', statusText = '', isLoading = false) {
            const playerTotal = getHandValue(playerHandVisible);
            const dealerTotal = getHandValue(dealerHandVisible);

            let dealerCardString = dealerHandVisible.map(c => c.emoji).join(' ');
            if (status === 'playing' && dealerHandVisible.length === 1) dealerCardString += ` ${cardbackEmoji}`;

            let playerCardString = playerHandVisible.map(c => c.emoji).join(' ');
            if (status === 'playing' && playerHandVisible.length === 1) playerCardString += ` ${cardbackEmoji}`;

            let dealerScoreText = `[${dealerTotal}${status === 'playing' && dealerHandVisible.length === 1 ? ' + ?' : ''}]`;
            let playerScoreText = `[${playerTotal}${status === 'playing' && playerHandVisible.length === 1 ? ' + ?' : ''}]`;

            if (isLoading) {
                statusText = `\n\n${loadingEmoji} *Sedang membagikan/membuka kartu...*`;
            }

            const embed = new EmbedBuilder()
                .setDescription(`👤 <@${message.author.id}>, you bet ${bet.toLocaleString()} to play blackjack\n\n**Dealer ${dealerScoreText}**\n${dealerCardString}\n\n**${message.author.username} ${playerScoreText}**\n${playerCardString}${statusText}`);

            // Pewarnaan embed sesuai hasil permainan
            if (status === 'won') {
                embed.setColor('#57F287'); // HIJAU
            } else if (status === 'lost') {
                embed.setColor('#ED4245'); // MERAH
            } else if (status === 'tied') {
                embed.setColor('#57F287'); // HIJAU UNTUK SERI (UANG KEMBALI)
            } else {
                embed.setColor('#5865F2'); // BIRU SAAT BERMAIN
            }

            const isGameOver = status !== 'playing';
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bj_hit').setEmoji('👊').setStyle(ButtonStyle.Primary).setDisabled(isGameOver || isLoading || playerHandVisible.length >= 5),
                new ButtonBuilder().setCustomId('bj_stand').setEmoji('🛑').setStyle(ButtonStyle.Danger).setDisabled(isGameOver || isLoading)
            );

            return { embeds: [embed], components: [buttons] };
        }

        const msg = await message.reply(generateBjEmbed('playing'));
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'bj_hit') {
                await i.update(generateBjEmbed('playing', '', true));

                setTimeout(async () => {
                    if (playerHandVisible.length === 1) {
                        playerHandVisible.push(playerHiddenCard);
                    } else {
                        // Kartu ke-3 sampai ke-5 menggunakan filter kartu angka kecil agar stabil
                        playerHandVisible.push(getSmallBjCard());
                    }

                    let pTotal = getHandValue(playerHandVisible);

                    if (pTotal > 21) {
                        collector.stop('lost');
                        return msg.edit(generateBjEmbed('lost', `\n\n🪙 ~ You lost ${bet.toLocaleString()} cowoncy! (Bust [${pTotal}])`));
                    }

                    // Jika menyentuh batas aman maksimal 5 kartu tanpa bust, paksa stand otomatis
                    if (playerHandVisible.length >= 5) {
                        collector.stop('stand');
                        return triggerDealerTurn();
                    }

                    return msg.edit(generateBjEmbed('playing'));
                }, 1200);
            }

            if (i.customId === 'bj_stand') {
                collector.stop('stand');
                await i.update(generateBjEmbed('playing', '', true));
                setTimeout(() => { triggerDealerTurn(); }, 1200);
            }
        });

        // Fungsi giliran dealer setelah pemain selesai menambah kartu
        function triggerDealerTurn() {
            dealerHandVisible.push(dealerHiddenCard);
            
            if (playerHandVisible.length === 1) {
                playerHandVisible.push(playerHiddenCard);
            }

            let dTotal = getHandValue(dealerHandVisible);
            let pTotal = getHandValue(playerHandVisible);

            // Dealer menarik kartu kecil lanjutan hingga batas aman minimal 17
            while (dTotal < 17 && dTotal < pTotal && dealerHandVisible.length < 5) {
                dealerHandVisible.push(getSmallBjCard());
                dTotal = getHandValue(dealerHandVisible);
            }

            let finalPlayerTotal = getHandValue(playerHandVisible);
            let finalDealerTotal = getHandValue(dealerHandVisible);

            let resultText = '';
            let endStatus = 'lost';
            const finalUserData = getUserData(message.author.id);

            if (finalDealerTotal > 21) {
                finalUserData.cash += (bet * 2);
                resultText = `\n\n🪙 ~ You won ${bet.toLocaleString()} cowoncy! (Dealer Bust)`;
                endStatus = 'won';
            } else if (finalPlayerTotal > finalDealerTotal) {
                finalUserData.cash += (bet * 2);
                resultText = `\n\n🪙 ~ You won ${bet.toLocaleString()} cowoncy!`;
                endStatus = 'won';
            } else if (finalPlayerTotal < finalDealerTotal) {
                resultText = `\n\n🪙 ~ You lost ${bet.toLocaleString()} cowoncy!`;
                endStatus = 'lost';
            } else {
                finalUserData.cash += bet;
                resultText = `\n\n🪙 ~ You tied!`;
                endStatus = 'tied';
            }
            saveDB();

            return msg.edit(generateBjEmbed(endStatus, resultText));
        }

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ content: '⏱️ | Sesi Blackjack berakhir karena terlalu lama diam.', components: [] }).catch(() => {});
            }
        });
    }

    // 9. Perintah Baru: Mines Game Interaktif (smine) - Maksimal 300.000
    if (command === 'smine') {
        if (checkCooldown(message.author.id, 'smine', message)) return;
        const authorData = getUserData(message.author.id);
        let bet = null;
        args.forEach(arg => {
            const a = arg.toLowerCase();
            if (a === 'all') bet = authorData.cash;
            else if (!isNaN(a)) bet = parseInt(a);
        });
        
        if (bet === null) bet = 100;  
        
        // Batasan Maksimal diganti ke 300.000
        if (bet > 300000) bet = 300000;
        
        if (bet <= 0) return message.reply('❌ jumlah taruhan harus di atas 0.');
        if (authorData.cash < bet) return message.reply(`❌ saldocash kamu tidak mencukupi untuk bertaruh **${bet.toLocaleString()}** cash.`);

        authorData.cash -= bet;
        saveDB();
        
        const bombPositions = [];
        while (bombPositions.length < 3) {
            const randPos = Math.floor(Math.random() * 9);
            if (!bombPositions.includes(randPos)) bombPositions.push(randPos);
        }

        const HIGHER_MULTIPLIERS = [1.00, 1.50, 2.15, 3.20, 5.50, 9.80, 25.00];
        let gemCount = 0;
        let currentMultiplier = 0; 
        let nextMultiplier = HIGHER_MULTIPLIERS[1];
        let currentWinnings = 0;
        let nextWinnings = Math.floor(bet * nextMultiplier);
        
        const gridState = Array(9).fill("hidden");
        
        function generateComponents(isGameOver = false) {
            const rows = [];
            for (let r = 0; r < 3; r++) {
                const actionRow = new ActionRowBuilder();
                for (let c = 0; c < 3; c++) {
                    const index = r * 3 + c;
                    const btn = new ButtonBuilder().setCustomId(`mine_tile_${index}`);
                    
                    if (isGameOver) {
                        btn.setDisabled(true);
                        if (bombPositions.includes(index)) {
                            if (gridState[index] === "exploded") {
                                btn.setEmoji('💥').setStyle(ButtonStyle.Danger);
                            } else {
                                btn.setEmoji('💣').setStyle(ButtonStyle.Secondary);
                            }
                        } else {
                            btn.setEmoji('💎').setStyle(ButtonStyle.Primary);
                        }
                    } else {
                        if (gridState[index] === "hidden") {
                            btn.setLabel('?').setStyle(ButtonStyle.Secondary);
                        } else if (gridState[index] === "gem") {
                            btn.setEmoji('💎').setStyle(ButtonStyle.Primary).setDisabled(true);
                        }
                    }
                    actionRow.addComponents(btn);
                }
                rows.push(actionRow);
            }

            const actionRowControl = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('mine_action_cashout')
                    .setLabel(`Cash Out (${currentWinnings.toLocaleString()})`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('1519946191880720384')
                    .setDisabled(isGameOver || gemCount === 0)
            );
            rows.push(actionRowControl);
            return rows;
        }

        const embed = new EmbedBuilder()
            .setColor('#ffc0cb')
            .setDescription(`### <a:berlianslot:1520006116891951104> ${message.author.username} started a mines game.\n-# **Bet**: \`${bet.toLocaleString()}\`    **Mines**: \`3\`\n-# **Cash Out**: \`0\` \`(0.00x)\`\n-# **Next**: \`${nextWinnings.toLocaleString()}\` \`(${nextMultiplier.toFixed(2)}x)\``);
            
        const gameMessage = await message.reply({
            embeds: [embed],
            components: generateComponents(false)
        });
        
        const collector = gameMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });
        
        collector.on('collect', async interaction => {
            const customId = interaction.customId;

            if (customId === 'mine_action_cashout') {
                collector.stop('cashout');
                
                const finalUserData = getUserData(message.author.id);
                finalUserData.cash += currentWinnings;
                saveDB();

                embed.setDescription(`### <a:berlianslot:1520006116891951104> ${message.author.username} cashed out!\n-# **Bet**: \`${bet.toLocaleString()}\`    **Mines**: \`3\`\n-# **Winnings**: \`${currentWinnings.toLocaleString()}\` \`(${currentMultiplier.toFixed(2)}x)\`\n-# ~~**Next**: \`${nextWinnings.toLocaleString()}\` \`(${nextMultiplier.toFixed(2)}x)\`~~`);
                
                return interaction.update({
                    embeds: [embed],
                    components: generateComponents(true)
                });
            }

            if (customId.startsWith('mine_tile_')) {
                const clickedIndex = parseInt(customId.split('_')[2]);
                if (gridState[clickedIndex] !== "hidden") {
                    return interaction.deferUpdate();
                }

                if (bombPositions.includes(clickedIndex)) {
                    gridState[clickedIndex] = "exploded";
                    collector.stop('exploded');

                    embed.setDescription(`### 💥 ${message.author.username} touched a mine!\n-# **Bet**: \`${bet.toLocaleString()}\`    **Mines**: \`3\`\n-# **Winnings**: \`0\` \`(0.00x)\`\n-# ~~**Next**: \`${nextWinnings.toLocaleString()}\` \`(${nextMultiplier.toFixed(2)}x)\`~~`);
                    return interaction.update({
                        embeds: [embed],
                        components: generateComponents(true)
                    });
                } 
                else {
                    gridState[clickedIndex] = "gem";
                    gemCount++;

                    currentMultiplier = HIGHER_MULTIPLIERS[gemCount];
                    nextMultiplier = HIGHER_MULTIPLIERS[gemCount + 1] || currentMultiplier;

                    currentWinnings = Math.floor(bet * currentMultiplier);
                    nextWinnings = Math.floor(bet * nextMultiplier);

                    if (gemCount === 6) {
                        collector.stop('cashout');
                        const finalUserData = getUserData(message.author.id);
                        finalUserData.cash += currentWinnings;
                        saveDB();

                        embed.setDescription(`### <a:berlianslot:1520006116891951104> ${message.author.username} cleared the board!\n-# **Bet**: \`${bet.toLocaleString()}\`    **Mines**: \`3\`\n-# **Winnings**: \`${currentWinnings.toLocaleString()}\` \`(${currentMultiplier.toFixed(2)}x)\`\n-# ~~**Next**: \`Maxed Out!\`~~`);
                        return interaction.update({
                            embeds: [embed],
                            components: generateComponents(true)
                        });
                    }

                    embed.setDescription(`### <a:berlianslot:1520006116891951104> ${message.author.username} is playing...\n-# **Bet**: \`${bet.toLocaleString()}\`    **Mines**: \`3\`\n-# **Cash Out**: \`${currentWinnings.toLocaleString()}\` \`(${currentMultiplier.toFixed(2)}x)\`\n-# **Next**: \`${nextWinnings.toLocaleString()}\` \`(${nextMultiplier.toFixed(2)}x)\``);
                    return interaction.update({
                        embeds: [embed],
                        components: generateComponents(false)
                    });
                }
            }
        });
        
        // Mengunci modul tombol secara otomatis jika pengguna mendadak AFK melewati 1 menit
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                gameMessage.edit({
                    components: generateComponents(true)
                }).catch(() => {});
            }
        });
    }

    // === TAMBAHAN COMMAND SPRAY ===
    if (command === 'spray') {
        const authorData = getUserData(message.author.id);
        const luckEarned = Math.floor(Math.random() * 10) + 1;
        
        if (!authorData.luck) authorData.luck = 0;
        authorData.luck += luckEarned;
        saveDB();
        
        return message.reply(`<a:berlianslot:1520006116891951104> | prays... You feel very lucky!\n**<:suprises:1520008441069047878> |** You have **${authorData.luck}** luck point(s)!`);
    }

    // === UPDATE COMMAND SDAILY ===
    if (command === 'sdaily') {
        const userData = getUserData(message.author.id);
        const cooldown = 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (now - userData.lastDaily < cooldown) {
            const timeLeft = cooldown - (now - userData.lastDaily);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return message.reply(`**⏱️ |** Your next daily is in: **${hours}h ${minutes}m**`);
        }

        const cashReward = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
        const luckReward = Math.floor(Math.random() * 5) + 1;

        userData.cash += cashReward;
        if (!userData.luck) userData.luck = 0;
        userData.luck += luckReward;
        userData.lastDaily = now;
        saveDB();

        return message.reply(`<:moneyslot:1519946191880720384> **| ${message.author.username}**, here is ur daily <:moneyslot:1519946191880720384> **${cashReward.toLocaleString()}**!\n<a:berlianslot:1520006116891951104>  **|** You’re on a **${luckReward}** daily luck point(s)!\n**⏱️ |** Your next daily is in: **24h**`);
    }

    // Leaderboard (!sleaderboard / !slb)
    if (command === 'sleaderboard' || command === 'slb') {
        const sortedUsers = Object.entries(db.users)
            .map(([id, data]) => ({ id, cash: data.cash }))
            .sort((a, b) => b.cash - a.cash)
            .slice(0, 5);
            
        let leaderboardText = '';
        
        for (let i = 0; i < sortedUsers.length; i++) {
            try {
                const user = await client.users.fetch(sortedUsers[i].id);
                leaderboardText += `${i + 1}. **${user.username}** — ${EMOJI_MONEY} ${sortedUsers[i].cash.toLocaleString()}\n`;
            } catch {
                leaderboardText += `${i + 1}. **User Keluar (${sortedUsers[i].id})** — ${EMOJI_MONEY} ${sortedUsers[i].cash.toLocaleString()}\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#ffc0cb')
            .setTitle('🏆 TOP RANKING 5 PLAYER SULTAN 🏆')
            .setDescription(leaderboardText || 'belum ada data pemain terdaftar.')
            .setTimestamp();
            
        return message.reply({ embeds: [embed] });
    }
});
client.login(process.env.DISCORD_TOKEN);
