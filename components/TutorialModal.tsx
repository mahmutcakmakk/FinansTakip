'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Handshake, Wallet, BellRing, Target, ShieldCheck, ArrowRightLeft, CalendarDays, MessageCircle, BarChart3, TrendingUp, TrendingDown, Users, PieChart, LayoutDashboard, Smartphone, Coins } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    title: "1. FinansTakip'e Hoş Geldiniz! 🚀",
    description: "Bu sistem, dev kurumsal şriketlerin kullandığı SAP tarzı devasa altyapıların, sizin dükkanınız/ajansınız için basitleştirilmiş ve yapay zeka ile güçlendirilmiş en modern halidir. Lütfen bu hızlı turu dikkatle okuyun.",
    icon: <ShieldCheck className="w-16 h-16 text-[var(--color-neon-blue)]" />,
    color: "var(--color-neon-blue)"
  },
  {
    title: "2. Kasa ve Cüzdan Mantığı 💼",
    description: "Öncelikle paranızın nerede durduğunu sisteme tanıtmalısınız. Sol menüden 'Cüzdanlar (Kasa)' sayfasına giderek Nakit, Ziraat Bankası, Papara veya Kredi Kartı gibi tüm cüzdanlarınızı oluşturun. İşlemler bu kasalardan düşer.",
    icon: <Wallet className="w-16 h-16 text-[var(--color-neon-green)]" />,
    color: "var(--color-neon-green)"
  },
  {
    title: "3. Gelir, Gider ve Cari Sırrı 💸",
    description: "Gelirler veya Giderler sayfasından işlem yaparken 'Kasa (Cüzdan)' seçerseniz para anında cüzdanınıza yansır. Eğer işlemi bir müşterinize (Cari Rehber) bağlarsanız, ileride Ahmet Abinin size ne kadar kazandırdığını tek tıkla görebilirsiniz.",
    icon: <TrendingUp className="w-16 h-16 text-yellow-400" />,
    color: "#facc15"
  },
  {
    title: "4. Borç ve Alacak (Vade) Sistemi 🤝",
    description: "Peşin ödenmeyen işlemler için 'Borç / Alacak' sayfasını kullanın. Vadeli bir alacak eklediğinizde, ödeme günü geldiği an sistem kırmızı alarmlar yakarak sizi uyarır.",
    icon: <Handshake className="w-16 h-16 text-[var(--color-neon-red)]" />,
    color: "var(--color-neon-red)"
  },
  {
    title: "5. Kredi Kartı (Taksitlendirme) Motoru 💳",
    description: "Büyük bir harcama (Örn: 60.000 TL Bilgisayar) mı yaptınız? Borç ekleme sayfasındaki 'Taksit Sayısı' kutusuna '6' yazın. Sistem o an bulunduğunuz günden itibaren 6 ayı otomatik hesaplayıp borçları aydan aya vadeli şekilde arkaplanda bölecektir.",
    icon: <Coins className="w-16 h-16 text-[#0ea5e9]" />,
    color: "#0ea5e9"
  },
  {
    title: "6. Parçalı (Kısmi) Tahsilat Özelliği 💰",
    description: "10.000 TL'lik bir alacağınızın 4.000 TL'si mi yattı? Borçlar listesinde işlemin hizasındaki kutucuğa '4000' yazıp ödeyin. Bakiye anında Kasaya yansır, ana borcun da 'Kalan Tutarını' otomatik düşer.",
    icon: <PieChart className="w-16 h-16 text-[var(--color-neon-purple)]" />,
    color: "var(--color-neon-purple)"
  },
  {
    title: "7. Akıllı Sabit Gider Asistanı 🔔",
    description: "Her ay Spotify veya Kira girmekle uğraşmayın. 'Sabit Giderler' sayfasından kiranızı takvime bağlayın. Gününe 3 gün kaldığında, sağ alttaki Yüzen ZİL ikonu parlayacaktır. Zile tıklayıp 'Kasadan Öde' dediğinizde sihirli şekilde sistem sizin yerinize faturayı keser.",
    icon: <BellRing className="w-16 h-16 text-[var(--color-neon-green)]" />,
    color: "var(--color-neon-green)"
  },
  {
    title: "8. Gelişmiş Tarih Raporları (Kâr/Zarar) 📈",
    description: "Patron sizsiniz! Sol menüden 'Gelişmiş Raporlar'a tıkladığınızda istediğiniz iki tarih aralığını (Örn: Geçen yılın ilk üç ayı) seçebilir, o aralığa ait Net Kâr, Tahsilat ve Kategori bazlı grafik dağılımını (P&L) milisaniyeler içinde inceleyebilirsiniz.",
    icon: <BarChart3 className="w-16 h-16 text-[var(--color-neon-blue)]" />,
    color: "var(--color-neon-blue)"
  },
  {
    title: "9. Trello/Kanban İş ve Proje Panosu 📌",
    description: "Finans bitti, sırada Ajans/Dükkan işleri var! 'İş & Proje Panosu'na girerek 'Yapılacaklar', 'Sürüyor', 'Bitti' bölümlerine yeni görev kartları açın. Farenizle kartları tutup sütunlar arasında sürükleyerek (Drag&Drop) iş akışınızı görselleştirin.",
    icon: <LayoutDashboard className="w-16 h-16 text-yellow-400" />,
    color: "#facc15"
  },
  {
    title: "10. Ciro Limitleri ve Bütçe Hedefleri 🎯",
    description: "Ofis masraflarınız çok mu can sıkıyor? 'Ayarlar' sekmesinden Yemek veya Reklam kategorilerine aylık maksimum bütçe koyun. Sınırı aştığınızda Ana Dashboard'daki ilerleme çubukları patlayarak sizi sert uyarır.",
    icon: <Target className="w-16 h-16 text-[var(--color-neon-red)]" />,
    color: "var(--color-neon-red)"
  },
  {
    title: "11. Doğal Dil (Yapay Zeka) İşleyicisi 🧠",
    description: "Google Gemini API anahtarınızı Ayarlardan kaydettiğinizde, ana ekranda yapay zeka çubuğu açılır. Oraya sadece 'Bugün Ahmetten 5 bin lira kaporanın yarısını nakit yarısını bankaya aldım' diye yazın, bırakın tüm finansı robot kendi kendine işletsin.",
    icon: <MessageCircle className="w-16 h-16 text-[var(--color-neon-purple)]" />,
    color: "var(--color-neon-purple)"
  },
  {
    title: "12. Mobil Uygulama Kurulumu (PWA) 📱",
    description: "Uygulamamızı App Store gibi kullanın! Telefonunuzun (iPhone/Android) Safari veya Chrome tarayıcısından siteye girin. Paylaş/Seçenekler menüsünden 'Ana Ekrana Ekle' butonuna basın. Uygulama logonuzla birlikte telefonunuza saniyeler içinde Tam Ekran olarak yüklenecektir!",
    icon: <Smartphone className="w-16 h-16 text-[var(--color-neon-blue)]" />,
    color: "var(--color-neon-blue)"
  }
];

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Sistemi ilk kez açanlara otomatik gösterme (LocalStorage ile)
  useEffect(() => {
    const isTutorialSeen = localStorage.getItem('tutorial_seen_v3');
    if (!isTutorialSeen) {
      setIsOpen(true);
      localStorage.setItem('tutorial_seen_v3', 'true'); // Anında kaydet ki refresh atınca tekrar çıkmasın
    }
    
    // Uygulama genelinde 'open-tutorial' eventini dinleyelim (Sidebar butonundan tetiklemek için)
    const handleOpenTutorial = () => {
      setStep(0);
      setIsOpen(true);
    };
    window.addEventListener('open-tutorial', handleOpenTutorial);
    return () => window.removeEventListener('open-tutorial', handleOpenTutorial);
  }, []);

  const handleClose = () => {
    localStorage.setItem('tutorial_seen', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!isOpen) return null;

  const currentData = TUTORIAL_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Arka plan karartması */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        // onClick={handleClose} kasten kapatmıyoruz ki zorunlu olarak hızlıca okusun
      />

      <div className="relative w-full max-w-lg bg-[#0a0d17] border border-[#ffffff14] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 transform animate-in zoom-in-95 data-[state=closed]:zoom-out-95">
        
        {/* Tepe Parıltısı */}
        <div 
          className="absolute top-0 left-0 w-full h-1 opacity-80"
          style={{ backgroundColor: currentData.color, boxShadow: `0 0 20px ${currentData.color}` }}
        />

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#8e95a5] hover:text-white rounded-full hover:bg-[#ffffff14] transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-10 flex flex-col items-center text-center mt-4">
          
          <div className="mb-8 relative transition-transform duration-500 ease-in-out transform hover:scale-110">
            <div 
              className="absolute inset-0 blur-2xl opacity-20 rounded-full"
              style={{ backgroundColor: currentData.color }}
            />
            <div className="relative z-10 w-24 h-24 rounded-full bg-[#ffffff05] border border-[#ffffff14] flex items-center justify-center">
              {currentData.icon}
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-4" style={{ color: currentData.color }}>
            {currentData.title}
          </h3>
          
          <p className="text-[#8e95a5] text-base leading-relaxed min-h-[80px]">
            {currentData.description}
          </p>

        </div>

        {/* Alt Navigasyon Barı */}
        <div className="bg-[#ffffff05] p-6 border-t border-[#ffffff14] flex items-center justify-between">
          
          {/* İlerleme Noktaları */}
          <div className="flex gap-2">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-6' : 'w-2 bg-[#ffffff14]'}`}
                style={{ backgroundColor: idx === step ? currentData.color : '' }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={prevStep}
              disabled={step === 0}
              className={`p-2 rounded-xl transition-colors ${step === 0 ? 'opacity-30 cursor-not-allowed text-[#8e95a5]' : 'bg-[#ffffff0a] text-white hover:bg-[#ffffff14]'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-black transition-transform hover:scale-105"
              style={{ backgroundColor: currentData.color, boxShadow: `0 4px 15px ${currentData.color}40` }}
            >
              {step === TUTORIAL_STEPS.length - 1 ? "Başlayalım!" : "Sıradaki"}
              {step !== TUTORIAL_STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
