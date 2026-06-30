import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// ============================================================
// MainLayout — โครงสร้างหลักของทุกหน้า
// รวม Navbar, พื้นหลังตกแต่ง, และ Footer ไว้ในที่เดียว
// ============================================================
interface MainLayoutProps {
  readonly children: React.ReactNode
  readonly customHeader?: React.ReactNode
}

export function MainLayout({ children, customHeader }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">

      {/* === แสงตกแต่งพื้นหลัง === */}
      {/* ใช้ wrapper ครอบเพื่อจำกัดขอบเขตของแสงตกแต่งไม่ให้ล้นจอ (overflow-hidden) โดยไม่ส่งผลกระทบกับตำแหน่ง sticky ของ Navbar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/8 blur-[120px] dark:bg-indigo-500/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/8 blur-[120px] dark:bg-violet-500/10" />
      </div>

      {customHeader ?? <Navbar />}

      {/* เนื้อหาหลักของแต่ละหน้า — ควบคุมความกว้างสูงสุดและจัดกึ่งกลางไว้ที่นี่จุดเดียวเพื่อความสม่ำเสมอของเนื้อหา */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-safe-lg relative z-10 space-y-6">
        {children}
      </main>

      <Footer />
    </div>
  )
}
