const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, 
    TextInputStyle, StringSelectMenuBuilder, ComponentType 
} = require('discord.js');

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

// ================= KONFIGURASI WHO IS THE SPY =================
const activeSpyGames = new Map(); // Menyimpan sesi game per channel

const EXTRA_SPY_WORDS = [
    // Makanan & Minuman
    { normal: 'Nasi Goreng', spy: 'Mie Goreng' }, { normal: 'Bakso', spy: 'Mie Ayam' },
    { normal: 'Sate', spy: 'Tongseng' }, { normal: 'Rendang', spy: 'Gulai' },
    { normal: 'Gado-gado', spy: 'Ketoprak' }, { normal: 'Es Teh', spy: 'Es Jeruk' },
    { normal: 'Kopi Susu', spy: 'Kopi Hitam' }, { normal: 'Martabak Manis', spy: 'Martabak Telur' },
    { normal: 'Bubur Ayam', spy: 'Nasi Uduk' }, { normal: 'Soto', spy: 'Rawon' },
    { normal: 'Sambal', spy: 'Kecap' }, { normal: 'Tempe', spy: 'Tahu' },
    { normal: 'Kerupuk', spy: 'Rempeyek' }, { normal: 'Pecel', spy: 'Lotek' },
    { normal: 'Cendol', spy: 'Dawet' }, { normal: 'Roti Bakar', spy: 'Pisang Bakar' },
    { normal: 'Indomie', spy: 'Mie Sedap' }, { normal: 'Siomay', spy: 'Batagor' },

    // Transportasi & Jalanan
    { normal: 'Ojek', spy: 'Taksi' }, { normal: 'Angkot', spy: 'Bus' },
    { normal: 'Motor', spy: 'Sepeda' }, { normal: 'Mobil', spy: 'Truk' },
    { normal: 'Helm', spy: 'Jas Hujan' }, { normal: 'Lampu Merah', spy: 'Lampu Kuning' },
    { normal: 'Trotoar', spy: 'Jembatan Penyeberangan' }, { normal: 'Stasiun', spy: 'Terminal' },
    { normal: 'Bandara', spy: 'Pelabuhan' }, { normal: 'Polisi Tidur', spy: 'Lubang Jalan' },

    // Benda di Rumah
    { normal: 'Kipas Angin', spy: 'AC' }, { normal: 'Sapu', spy: 'Pel' },
    { normal: 'Kasur', spy: 'Bantal' }, { normal: 'Guling', spy: 'Selimut' },
    { normal: 'Televisi', spy: 'Radio' }, { normal: 'Piring', spy: 'Mangkuk' },
    { normal: 'Gelas', spy: 'Cangkir' }, { normal: 'Kompor', spy: 'Magic Com' },
    { normal: 'Dispenser', spy: 'Galon' }, { normal: 'Handuk', spy: 'Sikat Gigi' },
    { normal: 'Sabun', spy: 'Shampoo' }, { normal: 'Cermin', spy: 'Sisir' },
    { normal: 'Pintu', spy: 'Jendela' }, { normal: 'Gorden', spy: 'Tirai' },
    { normal: 'Sofa', spy: 'Kursi Kayu' }, { normal: 'Lampu', spy: 'Senter' },

    // Sekolah & Kantor
    { normal: 'Buku Tulis', spy: 'Buku Gambar' }, { normal: 'Penghapus', spy: 'Tipe-x' },
    { normal: 'Penggaris', spy: 'Jangka' }, { normal: 'Tas', spy: 'Dompet' },
    { normal: 'Seragam', spy: 'Batik' }, { normal: 'Papan Tulis', spy: 'Proyektor' },
    { normal: 'Guru', spy: 'Dosen' }, { normal: 'Murid', spy: 'Mahasiswa' },
    { normal: 'Kertas', spy: 'Amplop' }, { normal: 'Printer', spy: 'Scanner' },
    { normal: 'Laptop', spy: 'Tablet' }, { normal: 'Keyboard', spy: 'Mouse' },

    // Alam & Luar Ruangan
    { normal: 'Gunung', spy: 'Bukit' }, { normal: 'Pantai', spy: 'Laut' },
    { normal: 'Pohon', spy: 'Semak' }, { normal: 'Bunga', spy: 'Rumput' },
    { normal: 'Awan', spy: 'Kabut' }, { normal: 'Petir', spy: 'Guntur' },
    { normal: 'Pasir', spy: 'Tanah' }, { normal: 'Batu', spy: 'Kerikil' },
    { normal: 'Ikan', spy: 'Udang' }, { normal: 'Burung', spy: 'Kupu-kupu' },
    { normal: 'Malam', spy: 'Siang' }, { normal: 'Senja', spy: 'Fajar' },

    // Profesi
    { normal: 'Petani', spy: 'Nelayan' }, { normal: 'Pedagang', spy: 'Pembeli' },
    { normal: 'Pilot', spy: 'Masinis' }, { normal: 'Koki', spy: 'Pelayan' },
    { normal: 'Satpam', spy: 'Bodyguard' }, { normal: 'Artis', spy: 'Influencer' },
    { normal: 'Atlet', spy: 'Wasit' }, { normal: 'Penyanyi', spy: 'Penari' },
    { normal: 'Arsitek', spy: 'Insinyur' }, { normal: 'Montir', spy: 'Supir' },

    // Random / Budaya Indo
    { normal: 'Warteg', spy: 'Angkringan' }, { normal: 'Pondok Pesantren', spy: 'Sekolah' },
    { normal: 'Pos Ronda', spy: 'Balai Desa' }, { normal: 'Pasar', spy: 'Supermarket' },
    { normal: 'Mall', spy: 'Alun-alun' }, { normal: 'Warnet', spy: 'Game Center' },
    { normal: 'Kondangan', spy: 'Arisan' }, { normal: 'Pengajian', spy: 'Kebaktian' },
    { normal: 'Sepak Bola', spy: 'Futsal' }, { normal: 'Bulutangkis', spy: 'Tenis Meja' },
    { normal: 'Main Layangan', spy: 'Main Kelereng' }, { normal: 'Petak Umpet', spy: 'Benteng' },
    { normal: 'Tahlilan', spy: 'Syukuran' }, { normal: 'Lebaran', spy: 'Tahun Baru' },
    { normal: 'Mudik', spy: 'Liburan' }, { normal: 'KTP', spy: 'SIM' },
    { normal: 'Baju Tidur', spy: 'Baju Renang' }, { normal: 'Topi', spy: 'Ikat Kepala' },
    { normal: 'Dasi', spy: 'Sabuk' }, { normal: 'Kaos Kaki', spy: 'Sarung Tangan' },
    { normal: 'Payung', spy: 'Jas Hujan' }, { normal: 'Senter', spy: 'Lilin' },
    { normal: 'Korek Api', spy: 'Korek Gas' }, { normal: 'Obeng', spy: 'Tang' },
    { normal: 'Palu', spy: 'Gergaji' }, { normal: 'Kabel', spy: 'Colokan' },
    { normal: 'Baterai', spy: 'Powerbank' }, { normal: 'Speaker', spy: 'Headset' },
    { normal: 'Kamera', spy: 'Handphone' }, { normal: 'Jam Tangan', spy: 'Jam Dinding' },
    { normal: 'Kalender', spy: 'Buku Diary' }, { normal: 'Bantal Kursi', spy: 'Keset' },
    { normal: 'Timbangan', spy: 'Meteran' }, { normal: 'Parfum', spy: 'Deodoran' },
    { normal: 'Lipstik', spy: 'Bedak' }, { normal: 'Sisir', spy: 'Jepitan Rambut' },
    { normal: 'Tas Sekolah', spy: 'Tas Laptop' }, { normal: 'Koper', spy: 'Tas Ransel' },
    { normal: 'Botol Minum', spy: 'Tumblr' }, { normal: 'Kotak Makan', spy: 'Piring Plastik' },
    { normal: 'Sapu Lidi', spy: 'Kemoceng' }, { normal: 'Ember', spy: 'Gayung' },
    { normal: 'Handuk', spy: 'Tisu' }, { normal: 'Sabun Cair', spy: 'Sabun Batang' },
    { normal: 'Pasta Gigi', spy: 'Obat Kumur' }, { normal: 'Sikat', spy: 'Busa' },
    { normal: 'Baju', spy: 'Celana' }, { normal: 'Jaket', spy: 'Rompi' },
    { normal: 'Sandal Jepit', spy: 'Sepatu Kets' }, { normal: 'Kacamata Hitam', spy: 'Topi Pantai' },
    { normal: 'Dompet', spy: 'Tas Pinggang' }, { normal: 'Cincin', spy: 'Gelang' },
    { normal: 'Kalung', spy: 'Anting' }, { normal: 'Payung Lipat', spy: 'Jas Hujan Ponco' },
    { normal: 'Kipas Lipat', spy: 'Kipas Listrik' }, { normal: 'Tikar', spy: 'Karpet' },
    { normal: 'Sprei', spy: 'Sarung Bantal' }, { normal: 'Gordyn', spy: 'Krey' },
    { normal: 'Hanger', spy: 'Jemuran' }, { normal: 'Jepitan Baju', spy: 'Tali Jemuran' },
    { normal: 'Parutan', spy: 'Ulekan' }, { normal: 'Telenan', spy: 'Pisau' },
    { normal: 'Saringan', spy: 'Corong' }, { normal: 'Teko', spy: 'Termos' },
    { normal: 'Wajan', spy: 'Panci' }, { normal: 'Spatula', spy: 'Sendok Sayur' },
    { normal: 'Tutup Panci', spy: 'Tatakan Piring' }, { normal: 'Tisu Makan', spy: 'Serbet' },
    { normal: 'Alat Pancing', spy: 'Jaring Ikan' }, { normal: 'Umpan', spy: 'Kail' },
    { normal: 'Pelampung', spy: 'Jaket Renang' }, { normal: 'Kacamata Renang', spy: 'Topi Renang' },
    { normal: 'Rak Sepatu', spy: 'Rak Buku' }, { normal: 'Lemari Baju', spy: 'Lemari Makan' },
    { normal: 'Meja Makan', spy: 'Meja Belajar' }, { normal: 'Kursi Tamu', spy: 'Kursi Malas' },
    { normal: 'Jam Weker', spy: 'Alarm HP' }, { normal: 'Kalender Dinding', spy: 'Agenda' },
    { normal: 'Peta', spy: 'Kompas' }, { normal: 'Senter Kepala', spy: 'Lampu Belajar' },
    { normal: 'Korek Api Kayu', spy: 'Pemantik' }, { normal: 'Obeng Plus', spy: 'Obeng Minus' },
    { normal: 'Palu Besi', spy: 'Palu Kayu' }, { normal: 'Lakban', spy: 'Lem' },
    { normal: 'Kabel Roll', spy: 'Stop Kontak' }, { normal: 'Baterai Cas', spy: 'Baterai Biasa' },
    { normal: 'Speaker Aktif', spy: 'Earphone' }, { normal: 'Kamera DSLR', spy: 'Webcam' },
    { normal: 'Jam Tangan Digital', spy: 'Jam Tangan Analog' }, { normal: 'Kalender Meja', spy: 'Catatan Tempel' },
    { normal: 'Bantal Leher', spy: 'Bantal Sofa' }, { normal: 'Timbangan Badan', spy: 'Timbangan Dapur' },
    { normal: 'Parfum Mobil', spy: 'Pengharum Ruangan' }, { normal: 'Lip Balm', spy: 'Lip Gloss' },
    { normal: 'Sisir Sasak', spy: 'Sisir Bulat' }, { normal: 'Tas Serut', spy: 'Tas Belanja' },
    { normal: 'Botol Kaca', spy: 'Botol Plastik' }, { normal: 'Kotak Bekal', spy: 'Bento Box' },
    { normal: 'Sapu Lantai', spy: 'Vacuum Cleaner' }, { normal: 'Ember Plastik', spy: 'Bak Mandi' },
    { normal: 'Handuk Mandi', spy: 'Handuk Muka' }, { normal: 'Sabun Muka', spy: 'Sabun Cuci Tangan' },
    { normal: 'Pasta Gigi Anak', spy: 'Pasta Gigi Herbal' }, { normal: 'Sikat Cuci', spy: 'Spons Cuci Piring' },
    { normal: 'Kemeja', spy: 'Kaos' }, { normal: 'Jaket Hoodie', spy: 'Sweater' },
    { normal: 'Sandal Selop', spy: 'Sepatu Boots' }, { normal: 'Kacamata Baca', spy: 'Kacamata Renang' },
    { normal: 'Dompet Koin', spy: 'Tempat Kartu' }, { normal: 'Cincin Kawin', spy: 'Cincin Batu' },
    { normal: 'Kalung Emas', spy: 'Kalung Manik-manik' }, { normal: 'Payung Golf', spy: 'Payung Hujan' },
    { normal: 'Tikar Lipat', spy: 'Matras Yoga' }, { normal: 'Sprei Waterproof', spy: 'Sprei Katun' },
    { normal: 'Gordyn Blackout', spy: 'Gordyn Tipis' }, { normal: 'Hanger Kayu', spy: 'Hanger Plastik' },
    { normal: 'Jepitan Jemuran', spy: 'Peniti' }, { normal: 'Parutan Keju', spy: 'Parutan Kelapa' },
    { normal: 'Telenan Kayu', spy: 'Telenan Plastik' }, { normal: 'Saringan Teh', spy: 'Saringan Santan' },
    { normal: 'Teko Listrik', spy: 'Teko Tanah' }, { normal: 'Wajan Teflon', spy: 'Wajan Besi' },
    { normal: 'Spatula Kayu', spy: 'Spatula Silikon' }, { normal: 'Tisu Toilet', spy: 'Tisu Wajah' },
    { normal: 'Kail Pancing', spy: 'Jala' }, { normal: 'Pelampung Renang', spy: 'Papan Seluncur' }
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
        db.users[userId] = { cash: STARTING_CASH, lastDaily: 0, spyPoints: 0 };
        saveDB();
    }

    if (db.users[userId].spyPoints === undefined) {
        db.users[userId].spyPoints = 0;
        saveDB();
    }

    return db.users[userId];

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

    /// ================= COMMAND UTAMA: WHO IS THE SPY =================
if (command === 'spy' && args[0]?.toLowerCase() === 'start') {
    if (activeSpyGames.has(message.channel.id)) {
        return message.reply('❌ Sedang ada permainan Spy yang berlangsung di channel ini!');
    }

    let gameState = {
        host: message.author.id,
        players: [message.author.id],
        maxRounds: 5,
        currentRound: 1,
        clues: {},
        status: 'lobby'
    };
    activeSpyGames.set(message.channel.id, gameState);

    const buildLobbyEmbed = () => new EmbedBuilder()
        .setColor('#ffc0cb')
        .setTitle('🕵️ WHO IS THE SPY? (Lobby)')
        // Update: Batasan pemain 1 - 15
        .setDescription(`**Host:** <@${gameState.host}>\nMINIMAL 1 - MAXIMAL 15 PEMAIN.\n\n**Pemain Terdaftar (${gameState.players.length}/15):**\n${gameState.players.map(p => `<@${p}>`).join('\n')}`);

    const lobbyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('spy_join').setLabel('Gabung').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('spy_start').setLabel('Mulai Game (Host)').setStyle(ButtonStyle.Success)
    );

    const lobbyMsg = await message.channel.send({ embeds: [buildLobbyEmbed()], components: [lobbyRow] });
    const lobbyCollector = lobbyMsg.createMessageComponentCollector({ time: 120000 });

    lobbyCollector.on('collect', async i => {
        if (i.customId === 'spy_join') {
            if (gameState.players.includes(i.user.id)) return i.reply({ content: 'Kamu sudah bergabung!', ephemeral: true });
            if (gameState.players.length >= 15) return i.reply({ content: 'Lobby penuh!', ephemeral: true });
            gameState.players.push(i.user.id);
            await i.update({ embeds: [buildLobbyEmbed()] });
        }

        if (i.customId === 'spy_start') {
            if (i.user.id !== gameState.host) return i.reply({ content: 'Hanya host yang bisa memulai game!', ephemeral: true });
            if (gameState.players.length < 1) return i.reply({ content: 'Dibutuhkan minimal 1 pemain!', ephemeral: true });

            // FIX: Beri respon instan agar tidak terjadi 'interaction failed'
            await i.update({ content: '✅ Game dimulai! Mengirim pesan rahasia ke para pemain...', embeds: [], components: [] });

            lobbyCollector.stop('start');
            gameState.status = 'playing';

            const wordPair = SPY_WORD_PAIRS[Math.floor(Math.random() * SPY_WORD_PAIRS.length)];
            gameState.spyId = gameState.players[Math.floor(Math.random() * gameState.players.length)];
            gameState.wordNormal = wordPair.normal;
            gameState.wordSpy = wordPair.spy;
            gameState.turnIndex = 0;

            // Proses DM sekarang aman dijalankan setelah i.update
            for (const playerId of gameState.players) {
                try {
                    const user = await client.users.fetch(playerId);
                    const isSpy = playerId === gameState.spyId;
                    const roleEmbed = new EmbedBuilder()
                        .setColor('#ffc0cb')
                        .setTitle('Tugas Rahasia Kamu 🕵️')
                        .setDescription(`Kamu adalah **${isSpy ? 'SPY' : 'INNOCENT'}**\nKata kamu adalah: **${isSpy ? gameState.wordSpy : gameState.wordNormal}**`);
                    await user.send({ embeds: [roleEmbed] });
                    gameState.clues[playerId] = [];
                } catch (err) {}
            }
            startInterrogationPhase(message.channel, gameState);
        }
    });

        lobbyCollector.on('end', (c, reason) => {
            if (reason === 'time') {
                activeSpyGames.delete(message.channel.id);
                lobbyMsg.edit({ content: 'WAKTU DI LOBBY HABIS, GAME DIBATALKAN.', embeds: [], components: [] }).catch(()=>{});
            }
        });
    }

    // Fungsi Interogasi (Tanya Jawab)
    async function startInterrogationPhase(channel, gameState) {
        if (gameState.currentRound > gameState.maxRounds) return startVotingPhase(channel, gameState);

        const currentPlayerId = gameState.players[gameState.turnIndex];
        
        let historyDesc = `**Round ${gameState.currentRound} / ${gameState.maxRounds}**\n\n`;
        gameState.players.forEach(pId => {
            const userClues = (gameState.clues[pId] || []).map((c, idx) => `[R${idx+1}]: ${c}`).join(' | ');
            historyDesc += `🔹 <@${pId}>: ${userClues || '*Belum ada ciri-ciri*'}\n`;
        });

        const turnEmbed = new EmbedBuilder()
            .setColor('#ffc0cb')
            .setTitle('🎙️ Sesi Interogasi')
            .setDescription(`${historyDesc}\n\n👉 **GILIRAN:** <@${currentPlayerId}>\nTekan tombol di bawah untuk memberikan ciri-ciri kata milikmu.`);

        const turnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`clue_${currentPlayerId}`).setLabel('Beri Ciri Ciri').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('force_vote').setLabel('Lanjut Voting (Host)').setStyle(ButtonStyle.Danger)
        );

        const turnMsg = await channel.send({ content: `<@${currentPlayerId}>`, embeds: [turnEmbed], components: [turnRow] });
        const turnCollector = turnMsg.createMessageComponentCollector({ time: 90000 }); // 90 detik per giliran

        turnCollector.on('collect', async i => {
            if (i.customId === 'force_vote') {
                if (i.user.id !== gameState.host) return i.reply({ content: 'Hanya host yang bisa mempercepat ke sesi voting!', ephemeral: true });
                turnCollector.stop('forced');
                await i.update({ content: '⏩ Host memotong sesi interogasi. Melanjutkan ke sesi voting...', embeds: [], components: [] });
                return startVotingPhase(channel, gameState);
            }

            if (i.customId.startsWith('clue_')) {
                if (i.user.id !== currentPlayerId) return i.reply({ content: 'Bukan giliranmu!', ephemeral: true });

                // Tampilkan Modal
                const modal = new ModalBuilder().setCustomId('clue_modal').setTitle('Masukkan Ciri-Ciri Kata Kamu');
                const clueInput = new TextInputBuilder()
                    .setCustomId('clue_text').setLabel("Deskripsikan kata rahasiamu (Singkat)")
                    .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50);
                
                modal.addComponents(new ActionRowBuilder().addComponents(clueInput));
                await i.showModal(modal);

                try {
                    const modalSubmit = await i.awaitModalSubmit({ time: 60000, filter: mi => mi.user.id === currentPlayerId });
                    const clue = modalSubmit.fields.getTextInputValue('clue_text');
                    
                    if(!gameState.clues[currentPlayerId]) gameState.clues[currentPlayerId] = [];
                    gameState.clues[currentPlayerId].push(clue);
                    
                    turnCollector.stop('answered');
                    await modalSubmit.update({ content: `✅ Ciri-ciri diterima!`, embeds: [], components: [] });

                    // Pindah giliran
                    gameState.turnIndex++;
                    if (gameState.turnIndex >= gameState.players.length) {
                        gameState.turnIndex = 0;
                        gameState.currentRound++;
                    }
                    startInterrogationPhase(channel, gameState);

                } catch (err) {
                    turnCollector.stop('timeout');
                    channel.send(`<@${currentPlayerId}> terlalu lama mengisi! Lanjut ke giliran berikutnya.`);
                    gameState.turnIndex++;
                    if (gameState.turnIndex >= gameState.players.length) {
                        gameState.turnIndex = 0;
                        gameState.currentRound++;
                    }
                    startInterrogationPhase(channel, gameState);
                }
            }
        });

        turnCollector.on('end', (c, reason) => {
            if (reason === 'time') {
                channel.send(`Waktu habis untuk <@${currentPlayerId}>! Lanjut giliran.`);
                gameState.turnIndex++;
                if (gameState.turnIndex >= gameState.players.length) {
                    gameState.turnIndex = 0;
                    gameState.currentRound++;
                }
                startInterrogationPhase(channel, gameState);
            }
        });
    }

    // Fungsi Voting
    async function startVotingPhase(channel, gameState) {
        gameState.status = 'voting';
        const votes = {}; 
        
        const options = gameState.players.map(p => ({
            label: `Vote: Player ${p.substring(p.length - 4)}`, // Fallback jika tidak fetch
            value: p,
            description: `Tuduh pemain ini sebagai Spy`
        }));

        const voteMenu = new StringSelectMenuBuilder()
            .setCustomId('vote_menu')
            .setPlaceholder('Pilih siapa yang kamu curigai...')
            .addOptions(options);

        const voteEmbed = new EmbedBuilder()
            .setColor('#ffc0cb')
            .setTitle('🗳️ TAHAP VOTING')
            .setDescription('Waktunya menebak! Siapa mata-matanya? Pilih dari menu di bawah.\nWaktu: 60 detik.');

        const voteMsg = await channel.send({ content: gameState.players.map(p => `<@${p}>`).join(' '), embeds: [voteEmbed], components: [new ActionRowBuilder().addComponents(voteMenu)] });
        const voteCollector = voteMsg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

        voteCollector.on('collect', async i => {
            if (!gameState.players.includes(i.user.id)) return i.reply({ content: 'Kamu bukan bagian dari game ini!', ephemeral: true });
            votes[i.user.id] = i.values[0];
            await i.reply({ content: `Tuduhanmu telah direkam secara rahasia.`, ephemeral: true });

            if (Object.keys(votes).length === gameState.players.length) {
                voteCollector.stop('all_voted');
            }
        });

        voteCollector.on('end', async () => {
            await voteMsg.edit({ components: [] });
            
            // Hitung hasil vote
            const tally = {};
            Object.values(votes).forEach(v => tally[v] = (tally[v] || 0) + 1);
            
            let highestVoteTarget = null;
            let highestVoteCount = 0;
            
            for (const [target, count] of Object.entries(tally)) {
                if (count > highestVoteCount) {
                    highestVoteCount = count;
                    highestVoteTarget = target;
                }
            }

            const halfPlayers = Math.ceil(gameState.players.length / 2);
            let resultDesc = `**Hasil Voting:**\n`;
            for (const [target, count] of Object.entries(tally)) {
                resultDesc += `<@${target}> mendapat ${count} suara.\n`;
            }

            // Kondisi Jika Spy Tertangkap (>50% votes)
            if (highestVoteTarget === gameState.spyId && highestVoteCount >= halfPlayers) {
                resultDesc += `\n🚨 **SPY TERTANGKAP!** Identitas Spy adalah <@${gameState.spyId}>!\nNamun, Spy memiliki satu kesempatan terakhir. Jika Spy bisa menebak kata asli yang dimiliki pemain lain, Spy memenangkan game ini!`;
                
                const finalEmbed = new EmbedBuilder().setColor('#ffc0cb').setTitle('Spy Tertangkap!').setDescription(resultDesc);
                const spyRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('spy_guess').setLabel('Spy: Tebak Kata Asli').setStyle(ButtonStyle.Danger));
                
                const finalMsg = await channel.send({ embeds: [finalEmbed], components: [spyRow] });
                const spyCollector = finalMsg.createMessageComponentCollector({ time: 45000 });
                
                spyCollector.on('collect', async i => {
                    if (i.customId === 'spy_guess') {
                        if (i.user.id !== gameState.spyId) return i.reply({ content: 'Hanya Spy yang bisa menebak!', ephemeral: true });
                        
                        const modal = new ModalBuilder().setCustomId('spy_word_modal').setTitle('Kesempatan Terakhir');
                        const wordInput = new TextInputBuilder().setCustomId('spy_word_text').setLabel("Tebak kata asli mereka").setStyle(TextInputStyle.Short).setRequired(true);
                        modal.addComponents(new ActionRowBuilder().addComponents(wordInput));
                        
                        await i.showModal(modal);
                        try {
                            const mSubmit = await i.awaitModalSubmit({ time: 30000, filter: mi => mi.user.id === gameState.spyId });
                            const guess = mSubmit.fields.getTextInputValue('spy_word_text').trim().toLowerCase();
                            spyCollector.stop();
                            
                            if (guess === gameState.wordNormal.toLowerCase()) {
                                handleWin(channel, gameState, 'spy', `🤯 SPY <@${gameState.spyId}> BENAR! Kata aslinya adalah **${gameState.wordNormal}**. Spy membalikkan keadaan dan Menang!`);
                            } else {
                                handleWin(channel, gameState, 'innocent', `❌ Tebakan Spy salah! (Dia menebak: ${guess}). Kata aslinya adalah **${gameState.wordNormal}**. Innocents Menang!`);
                            }
                            await mSubmit.update({ components: [] });
                        } catch(e) {}
                    }
                });

                spyCollector.on('end', (c, reason) => {
                    if (reason === 'time') {
                        handleWin(channel, gameState, 'innocent', `⏱️ Waktu habis! Spy tidak menebak. Kata aslinya adalah **${gameState.wordNormal}**. Innocents Menang!`);
                        finalMsg.edit({ components: [] }).catch(()=>{});
                    }
                });

            } else {
                // Spy Berhasil Lolos
                resultDesc += `\n👻 **SPY LOLOS!** Kalian gagal menebak dengan suara mayoritas, atau kalian menuduh orang yang salah. Spy sebenarnya adalah <@${gameState.spyId}>!`;
                handleWin(channel, gameState, 'spy', resultDesc);
            }
        });
    }

    // UBAH: Fungsi diperbaiki struktur kurungnya yang tadinya terpotong
    function getUserData(userId) {
        // 1. Cek apakah user sudah ada di database
        if (!db.users[userId]) {
            db.users[userId] = { spyPoints: 0 };
            saveDB();
        }
        // 2. Jika user sudah ada, cek apakah dia pemain lama (belum punya spyPoints)
        else if (db.users[userId].spyPoints === undefined) {
            db.users[userId].spyPoints = 0; // Tambahkan field spyPoints tanpa menghapus cash
            saveDB();
        }
        
        return db.users[userId];
    }

    // Eksekusi Pemenang dan Pembagian Poin
    function handleWin(channel, gameState, winner, messageDesc) {
        const spyReward = 500;
        const innocentReward = Math.floor(200 / (gameState.players.length - 1)); // Poin dibagi rata
        
        let pointsDesc = `\n\n**HADIAH POIN:**\n`;
        
        if (winner === 'spy') {
            const sData = getUserData(gameState.spyId);
            sData.spyPoints += spyReward;
            pointsDesc += `🕵️ <@${gameState.spyId}> (Spy) mendapatkan **+${spyReward}** Spy Points!\n👥 Pemain lain mendapatkan **0** poin.`;
        } else {
            gameState.players.forEach(p => {
                if (p !== gameState.spyId) {
                    const pData = getUserData(p);
                    pData.spyPoints += innocentReward;
                }
            });
            pointsDesc += `👥 Para Innocent mendapatkan masing-masing **+${innocentReward}** Spy Points!\n🕵️ Spy mendapatkan **0** poin.`;
        }
        
        saveDB();
        activeSpyGames.delete(channel.id);
        
        const winEmbed = new EmbedBuilder()
            .setColor(winner === 'spy' ? '#ED4245' : '#57F287')
            .setTitle('🏁 PERMAINAN SELESAI')
            .setDescription(messageDesc + pointsDesc)
            .addFields(
                { name: 'Kata Innocent', value: gameState.wordNormal, inline: true },
                { name: 'Kata Spy', value: gameState.wordSpy, inline: true }
            );
            
        channel.send({ embeds: [winEmbed] });
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

// ================= PVP INVITE: BLACKJACK DENGAN POLA RAHASIA (sbj inv) =================
    if (command === 'sbj' && args[0]?.toLowerCase() === 'inv') {
        const targetUser = message.mentions.users.first();
        const betAmt = parseInt(args[2]);

        if (!targetUser || targetUser.bot || targetUser.id === message.author.id) {
            return message.reply('❌ Format salah! Gunakan: `sbj inv @user <jumlah_taruhan>`');
        }
        if (isNaN(betAmt) || betAmt <= 0) return message.reply('❌ Masukkan jumlah taruhan yang valid!');

        const authorData = getUserData(message.author.id);
        const targetData = getUserData(targetUser.id);

        if (authorData.cash < betAmt) return message.reply('❌ Saldo kamu tidak cukup!');
        if (targetData.cash < betAmt) return message.reply(`❌ Saldo **${targetUser.username}** tidak cukup!`);

        const inviteEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `${message.author.tag} | Blackjack PvP`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`⚔️ <@${message.author.id}> mengajak <@${targetUser.id}> berduel **Blackjack**!\n**Taruhan:** ${betAmt.toLocaleString()} cash\n\nKlik **Setuju** untuk memulai!`);

        const inviteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pvp_accept').setLabel('Setuju').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('pvp_decline').setLabel('Tolak').setStyle(ButtonStyle.Danger)
        );

        const inviteMsg = await message.reply({ content: `<@${targetUser.id}>`, embeds: [inviteEmbed], components: [inviteRow] });
        
        const filter = i => [message.author.id, targetUser.id].includes(i.user.id);
        const inviteCollector = inviteMsg.createMessageComponentCollector({ filter, time: 30000 });

        inviteCollector.on('collect', async i => {
            if (i.customId === 'pvp_decline') {
                if (i.user.id !== targetUser.id) return i.reply({ content: 'Hanya yang diajak yang bisa menolak!', ephemeral: true });
                inviteCollector.stop();
                return i.update({ content: `❌ <@${targetUser.id}> menolak ajakan duel.`, embeds: [], components: [] });
            }

            if (i.customId === 'pvp_accept') {
                if (i.user.id !== targetUser.id) return i.reply({ content: 'Hanya yang diajak yang bisa menerima!', ephemeral: true });
                inviteCollector.stop();

                // Potong saldo
                authorData.cash -= betAmt;
                targetData.cash -= betAmt;
                saveDB();

                // --- SISTEM POLA KARTU RAHASIA ---
                // Urutan kartu paten (angka kecil 1-7). Pemain pro bisa menghafal urutan ini!
                const PVP_PATTERN = [2, 4, 3, 5, 2, 6, 3, 7, 2, 4, 5, 1, 3, 6];
                // Mulai dari titik acak, tapi akan bergerak berurutan ke kanan terus-menerus
                let cardIndex = Math.floor(Math.random() * PVP_PATTERN.length); 

                function getPvPCard() {
                    const val = PVP_PATTERN[cardIndex % PVP_PATTERN.length];
                    cardIndex++; // Geser ke pola selanjutnya
                    return { display: val, emoji: BJ_CARD_EMOJIS[val], value: val }; 
                }

                // Bagikan masing-masing 2 kartu awal dari pola rahasia
                let p1Hand = [getPvPCard(), getPvPCard()];
                let p2Hand = [getPvPCard(), getPvPCard()];
                
                let turn = message.author.id;
                let gameOver = false;

                const getVal = hand => {
                    let t = 0, a = 0;
                    for (const c of hand) { if (c.value === 1) { a++; t+=11; } else t+=c.value; }
                    while (t > 21 && a > 0) { t -= 10; a--; }
                    return t;
                };

                const buildGameEmbed = () => {
                    let p1Score = getVal(p1Hand);
                    let p2Score = getVal(p2Hand);
                    
                    const e = new EmbedBuilder()
                        .setAuthor({ name: `BLACKJACK DUEL | JUMLAH TARUHAN: ${betAmt * 2}`, iconURL: message.guild.iconURL() })
                        .setDescription(`**${message.author.username}** [${p1Score}]\n${p1Hand.map(c=>c.emoji).join(' ')}\n\n**${targetUser.username}** [${p2Score}]\n${p2Hand.map(c=>c.emoji).join(' ')}\n\n${gameOver ? '🏁 **GAME BERAKHIR**' : `<a:31830redloading:1520420716003196978> GILIRAN: <@${turn}>`}`)
                        .setColor(gameOver ? '#070707' : '#5865F2');

                    const r = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('duel_hit').setEmoji('<:next:1520401265455009905> ').setStyle(ButtonStyle.Primary).setDisabled(gameOver),
                        new ButtonBuilder().setCustomId('duel_stand').setEmoji('<:9219stop:1520401130990075904>').setStyle(ButtonStyle.Danger).setDisabled(gameOver)
                    );
                    return { embeds: [e], components: [r] };
                };

                await i.update({ content: 'Duel Dimulai!', embeds: [], components: [] });
                const gameMsg = await message.channel.send(buildGameEmbed());
                const gameCollector = gameMsg.createMessageComponentCollector({ time: 60000 });

                gameCollector.on('collect', async action => {
                    if (action.user.id !== turn) return action.reply({ content: 'Bukan giliranmu!', ephemeral: true });

                    if (action.customId === 'duel_hit') {
                        // Tarik kartu dengan mengikuti pola
                        if (turn === message.author.id) p1Hand.push(getPvPCard());
                        else p2Hand.push(getPvPCard());

                        let currentTotal = turn === message.author.id ? getVal(p1Hand) : getVal(p2Hand);

                        if (currentTotal > 21) {
                            gameOver = true;
                            gameCollector.stop();
                            let winner = turn === message.author.id ? targetUser.id : message.author.id;
                            getUserData(winner).cash += (betAmt * 2);
                            saveDB();
                            
                            const em = buildGameEmbed();
                            em.embeds[0].setDescription(em.embeds[0].data.description + `\n\n💥 <@${turn}> BUST! <@${winner}> WIN ${betAmt*2} cash!`);
                            return action.update(em);
                        }
                    }

                    if (action.customId === 'duel_stand') {
                        if (turn === message.author.id) {
                            turn = targetUser.id; // Ganti giliran ke Pemain 2
                        } else {
                            gameOver = true;
                            gameCollector.stop();
                            let v1 = getVal(p1Hand), v2 = getVal(p2Hand);
                            let winnerMsg = '';
                            
                            if (v1 > v2) {
                                getUserData(message.author.id).cash += (betAmt * 2);
                                winnerMsg = `<@${message.author.id}> WIN!`;
                            } else if (v2 > v1) {
                                getUserData(targetUser.id).cash += (betAmt * 2);
                                winnerMsg = `<@${targetUser.id}> WIN!`;
                            } else {
                                getUserData(message.author.id).cash += betAmt;
                                getUserData(targetUser.id).cash += betAmt;
                                winnerMsg = `TIE! Taruhan dikembalikan.`;
                            }
                            saveDB();
                            const em = buildGameEmbed();
                            em.embeds[0].setDescription(em.embeds[0].data.description + `\n\n${winnerMsg}`);
                            return action.update(em);
                        }
                    }
                    await action.update(buildGameEmbed());
                });
            }
        });
        return;
    }

    // ================= PVP INVITE: MINES (smine inv) =================
    if (command === 'smine' && args[0]?.toLowerCase() === 'inv') {
        const targetUser = message.mentions.users.first();
        const betAmt = parseInt(args[2]);

        if (!targetUser || targetUser.bot || targetUser.id === message.author.id) {
            return message.reply('❌ Format salah! Gunakan: `smine inv @user <jumlah_taruhan>`');
        }
        if (isNaN(betAmt) || betAmt <= 0) return message.reply('❌ Masukkan jumlah taruhan yang valid!');

        const authorData = getUserData(message.author.id);
        const targetData = getUserData(targetUser.id);

        if (authorData.cash < betAmt) return message.reply('❌ Saldo kamu tidak cukup!');
        if (targetData.cash < betAmt) return message.reply(`❌ Saldo **${targetUser.username}** tidak cukup!`);

        const inviteEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `${message.author.tag} | DUEL MINE`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`💣 <@${message.author.id}> mengajak <@${targetUser.id}> berduel **Mines**!\n**Taruhan:** ${betAmt.toLocaleString()} cash\n\nSiapa yang terkena bom kalah! Klik **Setuju** untuk memulai!`);

        const inviteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('mine_pvp_acc').setLabel('Setuju').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('mine_pvp_dec').setLabel('Tolak').setStyle(ButtonStyle.Danger)
        );

        const inviteMsg = await message.reply({ content: `<@${targetUser.id}>`, embeds: [inviteEmbed], components: [inviteRow] });
        
        const filter = i => [message.author.id, targetUser.id].includes(i.user.id);
        const inviteCollector = inviteMsg.createMessageComponentCollector({ filter, time: 30000 });

        inviteCollector.on('collect', async i => {
            if (i.customId === 'mine_pvp_dec') {
                if (i.user.id !== targetUser.id) return i.reply({ content: 'Hanya yang diajak yang bisa menolak!', ephemeral: true });
                inviteCollector.stop();
                return i.update({ content: `❌ <@${targetUser.id}> menolak ajakan duel.`, embeds: [], components: [] });
            }

            if (i.customId === 'mine_pvp_acc') {
                if (i.user.id !== targetUser.id) return i.reply({ content: 'Hanya yang diajak yang bisa menerima!', ephemeral: true });
                inviteCollector.stop();

                // Potong saldo
                authorData.cash -= betAmt;
                targetData.cash -= betAmt;
                saveDB();

                let turnPlayer = Math.random() < 0.5 ? message.author.id : targetUser.id;
                let bombs = [];
                while(bombs.length < 2) {
                    let r = Math.floor(Math.random() * 9);
                    if(!bombs.includes(r)) bombs.push(r);
                }
                
                let boardState = Array(9).fill("hidden");
                let gameOver = false;
                let safeClicks = 0;

                const buildGrid = () => {
                    const rows = [];
                    for (let r = 0; r < 3; r++) {
                        const row = new ActionRowBuilder();
                        for (let c = 0; c < 3; c++) {
                            let idx = r * 3 + c;
                            let btn = new ButtonBuilder().setCustomId(`pvpmine_${idx}`);
                            
                            if (gameOver) {
                                btn.setDisabled(true);
                                if (bombs.includes(idx)) btn.setEmoji('💣').setStyle(ButtonStyle.Danger);
                                else btn.setEmoji('💎').setStyle(ButtonStyle.Secondary);
                            } else {
                                if (boardState[idx] === "hidden") btn.setLabel('?').setStyle(ButtonStyle.Secondary);
                                else btn.setEmoji('💎').setStyle(ButtonStyle.Primary).setDisabled(true);
                            }
                            row.addComponents(btn);
                        }
                        rows.push(row);
                    }
                    return rows;
                };

                const gameEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('MINE DUEL')
                    .setDescription(`Pot: **${betAmt * 2} cash**\nGiliran: <@${turnPlayer}> (Pilih kotak!)`);

                await i.update({ content: 'DUEL DIMULAI!', embeds: [], components: [] });
                const gameMsg = await message.channel.send({ embeds: [gameEmbed], components: buildGrid() });
                const gameCollector = gameMsg.createMessageComponentCollector({ time: 60000 });

                gameCollector.on('collect', async action => {
                    if (action.user.id !== turnPlayer) return action.reply({ content: 'bukan giliran you!', ephemeral: true });
                    
                    let idx = parseInt(action.customId.split('_')[1]);
                    if (boardState[idx] !== "hidden") return action.deferUpdate();

                    if (bombs.includes(idx)) {
                        gameOver = true;
                        gameCollector.stop();
                        let winner = turnPlayer === message.author.id ? targetUser.id : message.author.id;
                        getUserData(winner).cash += (betAmt * 2);
                        saveDB();

                        gameEmbed.setColor('#ED4245').setDescription(`💥 **BOM!** <@${turnPlayer}> terkena ledakan!\n <@${winner}> menang sebesar **${betAmt * 2}** cash!`);
                        return action.update({ embeds: [gameEmbed], components: buildGrid() });
                    } else {
                        boardState[idx] = "safe";
                        safeClicks++;
                        
                        if (safeClicks === 7) {
                            gameOver = true;
                            gameCollector.stop();
                            getUserData(message.author.id).cash += betAmt;
                            getUserData(targetUser.id).cash += betAmt;
                            saveDB();
                            gameEmbed.setColor('#57F287').setDescription(` <:12870loading:1520411622156406785>Semua berlian ditemukan! Permainan Seri, taruhan dikembalikan.`);
                            return action.update({ embeds: [gameEmbed], components: buildGrid() });
                        }

                        turnPlayer = turnPlayer === message.author.id ? targetUser.id : message.author.id;
                        gameEmbed.setDescription(`Pot: **${betAmt * 2} cash**\nGiliran: <@${turnPlayer}> (Pilih kotak!)`);
                        return action.update({ embeds: [gameEmbed], components: buildGrid() });
                    }
                });
            }
        });
        return;
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
                statusText = `\n\n${loadingEmoji} *sedang membuka kartu...*`;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: `${message.author.username}, you bet ${bet.toLocaleString()} to play blackjack `, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`\n\n**Dealer ${dealerScoreText}**\n${dealerCardString}\n\n**${message.author.username} ${playerScoreText}**\n${playerCardString}${statusText}`);

            if (status === 'won') {
                embed.setColor('#57F287');
            } else if (status === 'lost') {
                embed.setColor('#ED4245');
            } else if (status === 'tied') {
                embed.setColor('#151414');
            } else {
                embed.setColor('#5865F2');
            }

            const isGameOver = status !== 'playing';
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bj_hit').setEmoji('<:next:1520401265455009905>').setStyle(ButtonStyle.Primary).setDisabled(isGameOver || isLoading || playerHandVisible.length >= 5),
                new ButtonBuilder().setCustomId('bj_stand').setEmoji('<:9219stop:1520401130990075904>').setStyle(ButtonStyle.Danger).setDisabled(isGameOver || isLoading)
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
                        return msg.edit(generateBjEmbed('lost', `\n\n<:4413bereft:1520419005150531595> **YOU LOSE ${bet.toLocaleString()} slotcash!**`));
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

            // LOGIKA BARU: Jika salah satu mendapat 21 dari awal dan player stand, dealer tidak draw kartu lagi
            if (pTotal !== 21 && dTotal !== 21) {
                while (dTotal < 17 && dTotal < pTotal && dealerHandVisible.length < 5) {
                    dealerHandVisible.push(getSmallBjCard());
                    dTotal = getHandValue(dealerHandVisible);
                }
            }

            let finalPlayerTotal = getHandValue(playerHandVisible);
            let finalDealerTotal = getHandValue(dealerHandVisible);

            let resultText = '';
            let endStatus = 'lost';
            const finalUserData = getUserData(message.author.id);

            if (finalDealerTotal > 21) {
                finalUserData.cash += (bet * 2);
                resultText = `\n\n<a:42410pengubitcoin:1520404843200516137>  ~ You won ${bet.toLocaleString()} slotcash! (Dealer Bust)`;
                endStatus = 'won';
            } else if (finalPlayerTotal > finalDealerTotal) {
                finalUserData.cash += (bet * 2);
                resultText = `\n\n<a:42410pengubitcoin:1520404843200516137>  ~ You won ${bet.toLocaleString()} slotcash!`;
                endStatus = 'won';
            } else if (finalPlayerTotal < finalDealerTotal) {
                resultText = `\n\n<a:42410pengubitcoin:1520404843200516137>  ~ You lost ${bet.toLocaleString()} slotcash!`;
                endStatus = 'lost';
            } else {
                finalUserData.cash += bet;
                resultText = `\n\n <a:42410pengubitcoin:1520404843200516137> ~ You tied!`;
                endStatus = 'tied';
            }
            saveDB();

            return msg.edit(generateBjEmbed(endStatus, resultText));
        }

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ content: '⏱️ | sesi bermain BJ berakhir karena terlalu lama diam.', components: [] }).catch(() => {});
            }
        });
    }

    // 8. GAME SLOTS: Slots (ss atau slot) - Maksimal 300.000
    if (command === 'ss' || command === 'slot') {
        const authorData = getUserData(message.author.id);
        
        let bet = null;
        args.forEach(arg => {
            const a = arg.toLowerCase();
            if (a === 'all') bet = authorData.cash;
            else if (!isNaN(a)) bet = parseInt(a);
        });

        if (bet === null) bet = 1;  
        
        // Batasan Maksimal diganti ke 300.000
        if (bet > 300000) bet = 300000;   

        if (bet <= 0) return message.reply('❌ Jumlah taruhan harus di atas 0.');
        if (authorData.cash < bet) return message.reply('❌ Saldo kamu tidak mencukupi.');

        authorData.cash -= bet;
        saveDB();

        const processMsg = await message.reply(`**  \`___SLOTS___\`**\n\` \` ${EMOJI_SLOTS_SPIN} ${EMOJI_SLOTS_SPIN} ${EMOJI_SLOTS_SPIN} **${message.author.username}** bet ${EMOJI_MONEY} ${bet.toLocaleString()}\n  \`|         |\`    spinning...\n  \`|         |\``);

        setTimeout(async () => {
            let slot1, slot2, slot3;
            let winRatio = 0;
            let statusText = '';

            const RNG = Math.random(); 

            if (RNG < 0.10) { 
                winRatio = 3;
                const randEmoji = EMOJI_SLOTS[Math.floor(Math.random() * EMOJI_SLOTS.length)];
                slot1 = randEmoji; slot2 = randEmoji; slot3 = randEmoji;
                const winnings = Math.floor(bet * winRatio);
                statusText = `and won ${EMOJI_MONEY} ${winnings.toLocaleString()}!!`;

            } else if (RNG < 0.45) { 
                winRatio = 1.5;
                const pairEmoji = EMOJI_SLOTS[Math.floor(Math.random() * EMOJI_SLOTS.length)];
                const remaining = EMOJI_SLOTS.filter(e => e !== pairEmoji);
                const diffEmoji = remaining[Math.floor(Math.random() * remaining.length)];
                
                const positions = [pairEmoji, pairEmoji, diffEmoji].sort(() => Math.random() - 0.5);
                slot1 = positions[0]; slot2 = positions[1]; slot3 = positions[2];
                const winnings = Math.floor(bet * winRatio);
                statusText = `and won ${EMOJI_MONEY} ${winnings.toLocaleString()}!!`;

            } else { 
                winRatio = 0;
                const shuffled = [...EMOJI_SLOTS].sort(() => Math.random() - 0.5);
                slot1 = shuffled[0]; slot2 = shuffled[1]; slot3 = shuffled[2];
                statusText = `and won nothing... :c`;
            }

            if (winRatio > 0) {
                authorData.cash += Math.floor(bet * winRatio);
                saveDB();
            }

            await processMsg.edit(`**  \`___SLOTS___\`**\n\` \` ${slot1} ${slot2} ${slot3} **${message.author.username}** bet ${EMOJI_MONEY} ${bet.toLocaleString()}\n  \`|         |\`    ${statusText}\n  \`|         |\``);
        }, 3000);
    }

    // 9. GAME MINE: Mines Game Interaktif (smine) - Maksimal 300.000
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
