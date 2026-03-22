import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { format } from 'date-fns';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId: string, text: string) {
  if (!TELEGRAM_TOKEN) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
}

export async function POST(req: Request) {
  let chatId = "";
  let aiMessageId: number | undefined;

  try {
    const body = await req.json();
    
    if (!body || !body.message || !body.message.text) return NextResponse.json({ ok: true });

    chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    // 1. Veritabanında bu Telegram hesabı kayıtlı mı?
    const profile = await db.prepare('SELECT * FROM profiles WHERE telegramChatId = ?').get(chatId) as any;

    if (!profile) {
      if (text.startsWith('/start')) {
         await sendMessage(chatId, "👋 <b>FinansTakip Yapay Zeka (CFO) Yönetimine Hoş Geldiniz!</b>\n\nYetkilendirilmeniz için lütfen sisteme giriş yaptığınız <b>Kullanıcı Adınızı</b> ve <b>Şifrenizi</b> aralarında boşluk bırakarak gönderin.\n\n<i>Örnek Format:</i>\n<code>ortak 123456</code>");
         return NextResponse.json({ ok: true });
      }

      const parts = text.split(' ');
      if (parts.length === 2) {
         const match = await db.prepare('SELECT * FROM profiles WHERE username = ? AND password = ?').get(parts[0], parts[1]) as any;
         if (match) {
            await db.prepare('UPDATE profiles SET telegramChatId = ? WHERE id = ?').run(chatId, match.id);
            await sendMessage(chatId, `✅ <b>Kimlik doğrulama başarılı!</b>\n\nHoş geldin, <b>${match.name}</b>. Artık güvenlik onayınız tanımlandı.\n\nBana doğal dilde harcama veya tahsilatlarını yazabilirsin, ben anlayıp veritabanına işleyeceğim.\n\n<i>Örnek Kullanım:</i>\n"Ahmet Abiden bugün 5000 lira nakit tahsil ettim."\n"Şok marketten 200 lira ofis malzemesi aldım."`);
         } else {
            await sendMessage(chatId, "❌ <b>Hatalı kullanıcı adı veya şifre.</b> Lütfen tekrar deneyin.\n\n<i>Örnek Format:</i>\n<code>mc 123456</code>");
         }
      } else {
         await sendMessage(chatId, "⚠️ Lütfen <b>Kullanıcı Adı</b> ve <b>Şifrenizi</b> arasında bir boşluk bırakarak eksiksiz girin.\n\n<i>Örnek:</i>\n<code>ortak 123456</code>");
      }
      return NextResponse.json({ ok: true }); 
    }

    if (text === '/rapor' || text.toLowerCase() === 'rapor') {
      await sendMessage(chatId, "📊 Aylık raporunuz hazırlanıyor, birkaç saniye sürebilir...");
      return NextResponse.json({ ok: true });
    }

    // 3. Gemini AI İşlemi Bildirimi:
    try {
      const waitRes = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: "🤖 <i>Sisteme işleniyor... (Gemini AI)</i>", parse_mode: 'HTML' })
      }).then(r => r.json());
      aiMessageId = waitRes?.result?.message_id;
    } catch {}

    const apiKey = profile.geminiApiKey || profile.geminiapikey;

    if (!apiKey) {
      await sendMessage(chatId, "⚠️ Ayarlar sayfasından lütfen Gemini API anahtarınızı (Token) sisteme kaydedin. Şifre alanı boş.");
      if (aiMessageId) {
         await fetch(`${TELEGRAM_API}/deleteMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: aiMessageId }) });
      }
      return NextResponse.json({ ok: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const wallets = await db.prepare(`SELECT id, name FROM wallets WHERE profileId = ?`).all(profile.id) as any[];
    const categories = await db.prepare(`SELECT id, name, type FROM categories WHERE profileId = ?`).all(profile.id) as any[];
    const customers = await db.prepare(`SELECT id, name FROM customers WHERE profileId = ?`).all(profile.id) as any[];

    const todayDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const systemPrompt = `
      Sen profesyonel bir şirket ön muhasebe yapay zekasısın.
      Kullanıcının yazdığı serbest cümlenin içinden işlemleri ÇIKARIP bana kesinlikle sadece JSON formatında bir array dönmelisin (Markdown kullanma, sadece saf JSON verisi döneceksin, dizi [ ile başlayıp ] ile bitecek).

      Gelebilecek işlem tipleri:
      1. INCOME (Kullanıcıya/Şirkete para girmiş)
      2. EXPENSE (Kullanıcıdan/Şirketten para çıkmış)
      3. TRANSFER (Kullanıcı kendi iki cüzdanı/bankası arasında para taşımış)

      Mevcut Şirket Cüzdanları: ${JSON.stringify(wallets)}
      Mevcut Şirket Kategorileri: ${JSON.stringify(categories)}
      Mevcut Müşteriler (Cariler): ${JSON.stringify(customers)}

      Kurallar:
      - Eğer TRANSFER ise, 'type' alanı 'TRANSFER' olacak ve 'fromWalletId', 'toWalletId', 'amount', 'description' döndürülecek.
      - Eğer INCOME veya EXPENSE ise 'type' alanı ('INCOME' veya 'EXPENSE') olacak ve 'walletId', 'amount', 'categoryId', 'customerId' (varsa), 'description' döndürülecek.
      - Kullanıcının yazdığı metindeki isimlere EN YAKIN olan ID'leri bul.
      - Eğer uygun kategori ID'si bulamazsan null yolla.
      
      Hiçbir açıklama metni veya \`\`\`json ekleme! Sadece JSON Array dön.
    `;

    const result = await model.generateContent(systemPrompt + "\n\nKullanıcının Cümlesi: " + text);
    const cleanedJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const transactions = JSON.parse(cleanedJson);

    let infoText = `✅ İşlem Başarıyla Eklendi:\n\n`;

    for (const trx of transactions) {
      const generatedDescription = (trx.description || "Telegram AI İşlemi") + " 📱";
      if (trx.type === 'TRANSFER') {
        infoText += `🔄 <b>Transfer:</b> ${trx.amount} TL\n`;
        await db.prepare('INSERT INTO transfers (profileId, fromWalletId, toWalletId, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)').run(profile.id, trx.fromWalletId, trx.toWalletId, trx.amount, todayDate, generatedDescription);
        await db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(trx.amount, trx.fromWalletId);
        await db.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?").run(trx.amount, trx.toWalletId);
      } else {
        infoText += `${trx.type === 'INCOME' ? '📈 <b>Gelir:</b>' : '📉 <b>Gider:</b>'} ${trx.amount} TL (<i>${trx.description}</i>)\n`;
        await db.prepare('INSERT INTO transactions (profileId, walletId, categoryId, customerId, type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(profile.id, trx.walletId || null, trx.categoryId || null, trx.customerId || null, trx.type, trx.amount, todayDate, generatedDescription);
        if (trx.walletId) {
          const query = trx.type === 'INCOME' ? "UPDATE wallets SET balance = balance + ? WHERE id = ?" : "UPDATE wallets SET balance = balance - ? WHERE id = ?";
          await db.prepare(query).run(trx.amount, trx.walletId);
        }
      }
    }

    if (aiMessageId) {
       await fetch(`${TELEGRAM_API}/deleteMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ chat_id: chatId, message_id: aiMessageId })
       });
    }

    await sendMessage(chatId, infoText);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("Telegram Webhook Sunucu Hatası:", error);
    
    if (chatId) {
      let errorMsg = `❌ İşlem sırasında teknik bir hata oluştu veya yapay zeka cümlenizi anlayamadı.\n\n<b>Hata Kaynağı:</b> <code>${error?.message || "Bilinmiyor"}</code>`;
      
      if (error?.message?.includes('API key not valid')) {
        errorMsg = "❌ <b>Girdiğiniz Gemini API anahtarı geçersiz veya süresi dolmuş!</b>\nLütfen Google AI Studio üzerinden aldığınız doğru şifreyi Ayarlar sayfasına kaydedin.";
      } else if (error?.message?.includes('Unexpected token')) {
        errorMsg = `🤖 Anlayamadığım bir durum oluştu, lütfen harcamayı daha net ve sade bir dille yazın. (Örn: A marketinden 50 tl gıda alışverişi yaptım)\n\n<i>Özel Hata: ${error?.message}</i>`;
      }

      await sendMessage(chatId, errorMsg);
      if (aiMessageId) {
        await fetch(`${TELEGRAM_API}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: aiMessageId })
        });
      }
    }
    
    return NextResponse.json({ ok: true }); 
  }
}
