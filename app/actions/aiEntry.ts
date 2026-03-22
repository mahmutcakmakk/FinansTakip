'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function processAiEntry(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Yetkisiz oturum." };

  const promptText = formData.get('prompt') as string;
  if (!promptText || promptText.trim() === '') return { error: "Lütfen bir metin girin." };

  try {
    // Profilin API anahtarını alıyoruz
    const profile = await db.prepare(`SELECT geminiApiKey as "geminiApiKey" FROM profiles WHERE id = ?`).get(session.profileId) as any;
    
    if (!profile || !profile.geminiApiKey) {
      return { error: "Ayarlar sayfasından lütfen Gemini API anahtarınızı (Token) kaydedin." };
    }

    const genAI = new GoogleGenerativeAI(profile.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Veritabanındaki cüzdanları ve kategorileri çekip yapay zekaya öğretelim
    const wallets = await db.prepare(`SELECT id, name FROM wallets WHERE profileId = ?`).all(session.profileId) as any[];
    const categories = await db.prepare(`SELECT id, name, type FROM categories WHERE profileId = ?`).all(session.profileId) as any[];
    const customers = await db.prepare(`SELECT id, name FROM customers WHERE profileId = ?`).all(session.profileId) as any[];

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
      - Eğer kullanıcının yazdığı metin bir TRANSFER içeriyorsa, 'type' alanı 'TRANSFER' olacak ve 'fromWalletId', 'toWalletId', 'amount', 'description' döndürülecek.
      - Eğer INCOME veya EXPENSE ise 'type' alanı ('INCOME' veya 'EXPENSE') olacak ve 'walletId', 'amount', 'categoryId', 'customerId' (varsa), 'description' döndürülecek.
      - Kullanıcının yazdığı metindeki cüzdan veya kategori ismine EN YAKIN olan Mevcut Şirket tablolarındaki "id" değerlerini bul. Tam eşleşmiyorsa sana mantıklı geleni seç.
      - Eğer uygun kategori ID'si bulamazsan null yolla.
      - Kullanıcının metninde "dün" veya "bugün" gibi tarihler geçse bile varsayılan tarih yolla. Tarih döndürmene gerek yok.

      Dönmen gereken örnek JSON çıktısı formu: (BİRDEN FAZLA İŞLEM OLABİLİR)
      [
        {
          "type": "INCOME",
          "walletId": 2,
          "categoryId": 5,
          "customerId": 1,
          "amount": 1000,
          "description": "Ahmetten nakit alındı"
        },
        {
          "type": "TRANSFER",
          "fromWalletId": 2,
          "toWalletId": 3,
          "amount": 500,
          "description": "Kirayı yatırmak için Ziraat'e gönderdim"
        }
      ]
      
      Hiçbir açıklama metni veya \`\`\`json ekleme! Sadece JSON Array dön.
    `;

    const result = await model.generateContent(systemPrompt + "\n\nKullanıcının Cümlesi: " + promptText);
    const responseText = result.response.text();
    
    // Saf JSON'ı temizle (Bazen markdown kod bloku içinde gelebilir)
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const transactions = JSON.parse(cleanedJson);

    // İşlemleri SQLite veritabanına teker teker kaydetme
    for (const trx of transactions) {
      const generatedDescription = (trx.description || "Yapay Zeka İşlemi") + " 🤖";
      
      if (trx.type === 'TRANSFER') {
        await db.prepare(`
          INSERT INTO transfers (profileId, fromWalletId, toWalletId, amount, date, description) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.profileId, 
          trx.fromWalletId, 
          trx.toWalletId, 
          trx.amount, 
          todayDate, 
          generatedDescription
        );
        // Cüzdan Bakiyeleri Güncellemesi
        await db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(trx.amount, trx.fromWalletId);
        await db.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?").run(trx.amount, trx.toWalletId);
        
      } else if (trx.type === 'INCOME' || trx.type === 'EXPENSE') {
        await db.prepare(`
          INSERT INTO transactions (profileId, walletId, categoryId, customerId, type, amount, date, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          session.profileId, 
          trx.walletId || null, 
          trx.categoryId || null, 
          trx.customerId || null, 
          trx.type, 
          trx.amount, 
          todayDate, 
          generatedDescription
        );

        // Cüzdan Güncellemesi
        if (trx.walletId) {
          if (trx.type === 'INCOME') {
            await db.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?").run(trx.amount, trx.walletId);
          } else {
            await db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(trx.amount, trx.walletId);
          }
        }
      }
    }

    revalidatePath('/');
    return { success: true, count: transactions.length };

  } catch (error: any) {
    console.error("Yapay Zeka İşlem Hatası (Tam Log):", error);
    return { error: "İşlem Hatası: " + (error.message || "Bilinmeyen bir hata oluştu. Lütfen logları kontrol edin.") };
  }
}
