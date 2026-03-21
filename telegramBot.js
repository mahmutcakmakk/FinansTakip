const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const db = require('better-sqlite3')('database.sqlite');
const { format, addDays, getDate, getDaysInMonth } = require('date-fns');

// Kullanıcının oluşturduğu Telegram Bot Token:
const token = '8776156868:AAFJPxSYG2NKBShyDa2oeVpWyPv52h94aP8';

// Polling true diyerek botun sürekli mesajları dinlemesini sağlıyoruz
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram Asistanı Başarıyla Başlatıldı! Mesajlar dinleniyor...");

// Veritabanına telegramChatId ekle (Eğer yoksa)
try {
  db.prepare("ALTER TABLE profiles ADD COLUMN telegramChatId TEXT").run();
  console.log("✅ Profiller tablosuna telegramChatId kolonu eklendi.");
} catch (e) {
  // Zaten varsa column hata verir, yoksayıyoruz.
}

// Komut: /start <kullanıcı_adı> <şifre>
// Örnek: /start mc asdas
bot.onText(/\/start (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].toLowerCase();
  const password = match[2];

  // 1. GÜVENLİK KATMANI: Şifre Kontrolü
  // Sistem şifresi asdas olduğu için hardcode kontrol ediyoruz
  if (password !== 'asdas') {
    return bot.sendMessage(chatId, `❌ *Erişim Reddedildi!*\n\nHatalı şifre girdiniz. Bu asistan sadece yetkili profil sahiplerine hizmet vermektedir.`, { parse_mode: 'Markdown' });
  }

  const profile = db.prepare("SELECT * FROM profiles WHERE username = ?").get(username);
  
  if (profile) {
    // 2. GÜVENLİK KATMANI: Cihaz / Chat ID Kilidi
    if (profile.telegramChatId && profile.telegramChatId !== chatId.toString()) {
      return bot.sendMessage(chatId, `🚨 *GÜVENLİK UYARISI*\n\nBu profil (*${username}*) halihazırda başka bir Telegram hesabına bağlanmış durumda!\n\nBir güvenlik ihlali olduğunu düşünüyorsanız lütfen veritabanını kontrol edin.`, { parse_mode: 'Markdown' });
    }

    db.prepare("UPDATE profiles SET telegramChatId = ? WHERE id = ?").run(chatId.toString(), profile.id);
    bot.sendMessage(chatId, `🎉 Hoş Geldiniz! *${profile.name}* profili Telegram'a başarıyla ve GÜVENLİ olarak bağlandı.\n\nArtık yaklaşan borçlarınızı, müşteri tahsilatlarınızı ve sabit abonelik ödemelerinizi her sabah size otomatik olarak hatırlatacağım. 🚀`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, `❌ Maalesef sisteme kayıtlı '*${username}*' adında bir kullanıcı bulamadım.\nLütfen giriş adınızı ve şifrenizi araya boşluk koyarak yazın. Örnek: \`/start mc asdas\``, { parse_mode: 'Markdown' });
  }
});

bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Merhaba! Ben Kişisel Finans Asistanınızım.\n\n⚠️ *Güvenlik gereği* hesabınızı bağlamak için profil adınızla ve şifrenizle giriş yapmalısınız.\n\nÖğrenmek için yazın:\n\`/start mc asdas\`\n\`/start md asdas\`\n\`/start ortak asdas\``, { parse_mode: 'Markdown' });
});

// Bildirim Gönderme Algoritması
function checkAndSendNotifications() {
  console.log("🔔 Günlük bildirim kontrolü yapılıyor...");
  
  const profiles = db.prepare("SELECT * FROM profiles WHERE telegramChatId IS NOT NULL").all();
  const todayDate = new Date();
  const threeDaysLater = format(addDays(todayDate, 3), 'yyyy-MM-dd');
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  const currentDay = getDate(todayDate);
  const daysInMonth = getDaysInMonth(todayDate);

  profiles.forEach(profile => {
    let messageBody = `🌅 *Günaydın ${profile.name}!* İşte bugünün finansal özeti ve yaklaşan hatırlatmalar:\n\n`;
    let hasNotification = false;

    // 1. Borçlar
    const upcomingDebts = db.prepare(`
      SELECT * FROM debts 
      WHERE status = 'UNPAID' 
      AND dueDate >= ? AND dueDate <= ? 
      AND profileId = ?
    `).all(todayStr, threeDaysLater, profile.id);

    if (upcomingDebts.length > 0) {
      hasNotification = true;
      messageBody += `⏳ *YAKLAŞAN BORÇ / ALACAKLAR:*\n`;
      upcomingDebts.forEach(debt => {
        const isIncome = debt.type === 'GIVEN';
        messageBody += `🔸 *${debt.personName}* - ${isIncome ? 'Tahsil edilecek' : 'Ödenecek'}: ${debt.amount} TL (Son Gün: ${format(new Date(debt.dueDate), 'dd.MM.yyyy')})\n`;
      });
      messageBody += `\n`;
    }

    // 2. Abonelikler
    const subscriptions = db.prepare(`SELECT * FROM subscriptions WHERE profileId = ?`).all(profile.id);
    let subMessages = "";
    
    subscriptions.forEach(sub => {
      let daysUntil = sub.dueDay - currentDay;
      if (daysUntil < 0) daysUntil = (daysInMonth - currentDay) + sub.dueDay;
      if (daysUntil <= 3 && daysUntil >= 0) {
        hasNotification = true;
        subMessages += `🔹 *${sub.name}*: ${sub.amount} TL (${daysUntil === 0 ? 'BUGÜN' : daysUntil + ' gün kaldı'})\n`;
      }
    });

    if (subMessages.length > 0) {
      messageBody += `📅 *SABİT GİDER HATIRLATMASI (3 GÜN):*\n${subMessages}\n`;
    }

    // Kullanıcıya gönder
    if (hasNotification) {
      bot.sendMessage(profile.telegramChatId, messageBody, { parse_mode: 'Markdown' });
    }
  });
}

// Her gün sabah saat 09:00'da çalışacak Cron Job (Saat ve Dakika)
cron.schedule('0 9 * * *', () => {
    checkAndSendNotifications();
});

// Admin Paneli (Telegram'dan) Bakiye Sorgulama 
bot.onText(/\/durum/, (msg) => {
  const profile = db.prepare("SELECT * FROM profiles WHERE telegramChatId = ?").get(msg.chat.id.toString());
  if (!profile) return bot.sendMessage(msg.chat.id, "Önce /start <kullanıcı_adı> yazarak hesabınızı bağlayın.");

  const thisMonth = format(new Date(), 'yyyy-MM');
  const monthIncome = db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date LIKE ? AND profileId = ?`).get(`${thisMonth}%`, profile.id).total || 0;
  const monthExpense = db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date LIKE ? AND profileId = ?`).get(`${thisMonth}%`, profile.id).total || 0;

  const net = monthIncome - monthExpense;

  bot.sendMessage(msg.chat.id, `📊 *BU AYKİ DURUMUNUZ*\n\n📈 Toplam Gelir: ${monthIncome} TL\n📉 Toplam Gider: ${monthExpense} TL\n\n💰 *Net Durum:* ${net} TL`, { parse_mode: 'Markdown' });
});
