"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Clock, Sparkles, Wallet } from "lucide-react"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/layout/main-layout"

// ============================================================
// ประเภทข้อมูล
// ============================================================
interface BillItem {
  id: number
  displayName: string
  amount: number
  status: "PAID" | "UNPAID" | "PENDING"
  referenceCode?: string
  paidAt?: string | null
}

interface Bill {
  id: number
  title: string
  publicSlug: string
  payeeName?: string | null
  payeePromptPayId: string
  currency: string
  createdAt: string
  closeAt?: string | null
  items: BillItem[]
}

export default function BillSummaryPage() {
  const params = useParams()
  const { toast } = useToast()
  const slug = params.slug as string

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchSummary()
    }
  }, [slug])

  // ดึงข้อมูลบิลสำหรับแสดงรายงานสรุป
  const fetchSummary = async () => {
    try {
      setLoading(true)
      const data: Bill = await billApi.getBillSummary(slug)
      setBill(data)
    } catch {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสรุปรายงานบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mx-auto animate-pulse">
            <Trophy className="h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-muted-foreground text-sm">กำลังโหลดสรุปบิล...</p>
        </div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ไม่พบข้อมูล</h2>
            <p className="text-muted-foreground text-sm mt-1">ไม่พบข้อมูลของบิลนี้ในระบบ</p>
          </div>
          <Link href="/">
            <button className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white rounded-2xl font-bold transition-all">
              กลับหน้าแรก
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // คำนวณสรุปข้อมูล
  const totalItems = bill.items.length
  const paid = bill.items.filter((i) => i.status === "PAID")
  const unpaid = bill.items.filter((i) => i.status !== "PAID")
  
  const paidAmount = paid.reduce((sum, i) => sum + Number(i.amount), 0)
  const unpaidAmount = unpaid.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalAmount = paidAmount + unpaidAmount
  const completionRate = totalItems > 0 ? Math.round((paid.length / totalItems) * 100) : 0

  // จัดเรียงคนที่จ่ายเงินแล้วเรียงตามวันเวลาที่โอนสำเร็จ (โอนไวแชมเปี้ยนชิพ!)
  const sortedPaidItems = [...paid].sort((a, b) => {
    if (!a.paidAt) return 1
    if (!b.paidAt) return -1
    return new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
  })

  // สัญลักษณ์เหรียญรางวัล
  const getTrophyEmoji = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `${index + 1}`
  };

  const getTrophyColorClass = (index: number) => {
    if (index === 0) return "text-amber-500 bg-amber-500/10 border-amber-500/25"
    if (index === 1) return "text-slate-400 bg-slate-400/10 border-slate-400/25"
    if (index === 2) return "text-amber-700 bg-amber-700/10 border-amber-700/25"
    return "text-muted-foreground bg-secondary/80 border-border"
  }

  return (
    <MainLayout>
      {/* ส่วนหัวจอ (เหมือนหน้าดีเทลบิลเพื่อคุมธีม) */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/bills/${slug}`}>
            <button
              aria-label="ย้อนกลับ"
              className="
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                bg-secondary/60 border border-border
                hover:bg-secondary active:scale-95 transition-all
                text-muted-foreground hover:text-foreground
              "
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">สรุปยอดบิล: {bill.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">#{bill.publicSlug}</p>
          </div>
        </div>
      </div>

      {/* --- Progress Bar --- */}
      <div className="bg-card border border-border p-4 rounded-2xl space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">ความคืบหน้าการจ่ายเงิน</span>
          <span className="text-sm font-bold text-indigo-400">{completionRate}%</span>
        </div>

        {/* แถบ progress */}
        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* สรุปตัวเลขสถิติภาพรวม */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground/80">ยอดเงินรวม</p>
            <p className="text-base font-mono font-bold text-foreground mt-0.5">฿{totalAmount.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-xs font-semibold text-muted-foreground/80">ชำระแล้ว</p>
            <p className="text-base font-mono font-bold text-emerald-500 mt-0.5">฿{paidAmount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground/80">ค้างจ่าย</p>
            <p className="text-base font-mono font-bold text-indigo-500 mt-0.5">฿{unpaidAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* --- ตารางแชมเปี้ยนโอนไว (🥇 🥈 🥉) --- */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground px-1 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            โอนไวแชมเปี้ยนชิพ ({paid.length} คน)
          </h2>
          
          <div className="space-y-2">
            {sortedPaidItems.length > 0 ? (
              sortedPaidItems.map((item, index) => {
                const trophyClass = getTrophyColorClass(index)
                return (
                  <div 
                    key={item.id} 
                    className="
                      bg-card border border-border rounded-2xl p-3 px-4
                      flex items-center gap-3 transition-all
                      border-l-4 border-l-emerald-500/40
                    "
                  >
                    {/* ถ้วยรางวัล/ลำดับ */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold border
                      ${trophyClass}
                    `}>
                      {getTrophyEmoji(index)}
                    </div>

                    {/* ชื่อ + เวลาจ่าย */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{item.displayName}</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        {item.paidAt 
                          ? `โอนเมื่อ ${new Date(item.paidAt).toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'})} น.` 
                          : "จ่ายเงินสำเร็จแล้ว"
                        }
                      </p>
                    </div>

                    {/* ยอดเงินโอน */}
                    <span className="font-bold text-emerald-500 font-mono text-sm">
                      ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 bg-card border border-border rounded-2xl text-muted-foreground text-sm font-medium">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                ยังไม่มีการชำระเงินเข้ามาในบิลนี้ครับ
              </div>
            )}
          </div>
        </div>

        {/* --- รายชื่อคนที่ยังไม่จ่าย --- */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground px-1">
            ยังค้างชำระเงิน ({unpaid.length} คน)
          </h2>

          <div className="space-y-2">
            {unpaid.length > 0 ? (
              unpaid.map((item) => (
                <div 
                  key={item.id} 
                  className="
                    bg-card border border-border rounded-2xl p-3 px-4
                    flex items-center justify-between gap-3
                    border-l-4 border-l-rose-500/20
                  "
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/15 flex items-center justify-center flex-shrink-0 text-rose-400 font-bold text-xs">
                      {item.status === "PENDING" ? "⏳" : "#"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{item.displayName}</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {item.status === "PENDING" ? "รอยืนยันการชำระเงิน" : "รอการชำระเงิน"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`
                      text-[10px] font-semibold h-5 px-1.5
                      ${item.status === "PENDING" 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      }
                    `}>
                      {item.status === "PENDING" ? "รอยืนยัน" : "ยังไม่จ่าย"}
                    </Badge>
                    <span className="font-bold text-foreground font-mono text-sm">
                      ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-card border border-border rounded-2xl text-emerald-500 text-sm font-semibold flex flex-col items-center justify-center gap-2 shadow-sm">
                <Sparkles className="h-7 w-7 text-emerald-500 animate-bounce" />
                <span>เย้! ทุกคนชำระเงินครบหมดเรียบร้อยแล้วครับ 🥇</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
