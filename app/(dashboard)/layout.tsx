import Sidebar from '@/components/Sidebar';
import AssistantWidget from '@/components/AssistantWidget';
import TutorialModal from '@/components/TutorialModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[260px] p-4 md:p-8 transition-all">
        {children}
      </main>
      
      {/* Gezgin Asistan (Bildirim Zili) */}
      <AssistantWidget />
      
      {/* Eğitici Karşılama Ekranı */}
      <TutorialModal />
    </div>
  );
}
