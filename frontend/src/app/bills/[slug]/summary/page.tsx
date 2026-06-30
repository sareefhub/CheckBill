"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, Sparkles, AlertCircle, PieChart, Users, DollarSign, Wallet } from "lucide-react"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// กำหนดประเภทข้อมูล
interface BillItem {
  id: number
  displayName: string
  amount: number
  status: "PAID" | "UNPAID" | "PENDING"
  referenceCode?: string
}

interface Bill {
  id: number
  title: string
  publicSlug: string
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
    } catch (error) {
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse text-lg">กำลังโหลดสรุปบิล...</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-slate-955 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">ไม่พบข้อมูลของบิลนี้ในฐานข้อมูล</h1>
          <Link href={`/bills/${slug}`}>
            <Button className="bg-indigo-600 hover:bg-indigo-500">กลับไปหน้าบิล</Button>
          </Link>
        </div>
      </div>
    )
  }

  // คำนวณสรุปข้อมูลและประมวลผลตัวเลข
  const totalItems = bill.items.length
  const paid = bill.items.filter((i) => i.status === "PAID")
  const unpaid = bill.items.filter((i) => i.status !== "PAID")
  const paidAmount = paid.reduce((sum, i) => sum + Number(i.amount), 0)
  const unpaidAmount = unpaid.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalAmount = paidAmount + unpaidAmount
  const completionRate = totalItems > 0 ? Math.round((paid.length / totalItems) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 relative overflow-hidden pb-12">
      {/* แสงสปอตไลท์ตกแต่งพื้นหลัง */}
      <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-violet-500/5 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* ส่วนหัวหน้าจอ (Header) */}
        <div className="mb-8">
          <Link href={`/bills/${slug}`}>
            <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white hover:bg-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปหน้ารายละเอียดบิล
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 p-2.5 rounded-2xl border border-indigo-500/20">
              <PieChart className="h-6 w-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              รายงานสรุปบิล: {bill.title}
            </h1>
          </div>
          <p className="text-slate-500 mt-2 text-sm">
            แสดงสถานะและภาพรวมการชำระเงินของบิลในรูปแบบสรุปเข้าใจง่าย
          </p>
        </div>

        {/* แผงข้อมูลสถิติรวม (Stats Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          
          {/* สถิติ 1: เพื่อนทั้งหมด */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-center">
            <CardContent className="pt-6">
              <div className="bg-indigo-500/10 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-slate-200">{totalItems} คน</div>
              <p className="text-xs text-slate-500 mt-1">ผู้ร่วมหารทั้งหมด</p>
            </CardContent>
          </Card>

          {/* สถิติ 2: คนจ่ายแล้ว */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-center">
            <CardContent className="pt-6">
              <div className="bg-emerald-500/10 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{paid.length} คน</div>
              <p className="text-xs text-slate-500 mt-1">จ่ายครบเรียบร้อย</p>
            </CardContent>
          </Card>

          {/* สถิติ 3: คนที่ยังไม่จ่าย */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-center">
            <CardContent className="pt-6">
              <div className="bg-amber-500/10 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{unpaid.length} คน</div>
              <p className="text-xs text-slate-500 mt-1">ยังค้างชำระเงิน</p>
            </CardContent>
          </Card>

          {/* สถิติ 4: ยอดบิลรวม */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-center">
            <CardContent className="pt-6">
              <div className="bg-violet-500/10 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5">
                <DollarSign className="h-5 w-5 text-violet-400" />
              </div>
              <div className="text-xl font-black text-slate-200">฿{totalAmount.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1.5">ยอดบิลทั้งหมด</p>
            </CardContent>
          </Card>

        </div>

        {/* แผงแยกแยะสองฝั่ง (Paid list vs Unpaid list) */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* ฝั่งคนจ่ายแล้ว (Paid List) */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4 flex flex-row items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-200">ชำระแล้ว ({paid.length})</CardTitle>
                <CardDescription className="text-xs text-slate-500">ยอดเงินรวม: ฿{paidAmount.toLocaleString()}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {paid.length ? (
                  paid.map((i) => (
                    <div key={i.id} className="flex justify-between items-center p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{i.displayName}</span>
                        {i.referenceCode && (
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 break-all">Ref: {i.referenceCode.substring(0, 18)}...</span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-400 font-mono">฿{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-600 text-sm">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                    ยังไม่มีใครทำรายการจ่ายเงินเข้ามาครับ
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ฝั่งยังไม่จ่าย (Unpaid List) */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4 flex flex-row items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-200">ยังไม่จ่าย ({unpaid.length})</CardTitle>
                <CardDescription className="text-xs text-slate-500">ยอดเงินค้าง: ฿{unpaidAmount.toLocaleString()}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {unpaid.length ? (
                  unpaid.map((i) => (
                    <div key={i.id} className="flex justify-between items-center p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-sm font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{i.displayName}</span>
                        <span className="text-[10px] text-amber-500/60 mt-0.5">รอการชำระเงิน</span>
                      </div>
                      <span className="font-bold text-amber-400 font-mono">฿{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-emerald-400 text-sm font-semibold flex flex-col items-center justify-center gap-2">
                    <Sparkles className="h-8 w-8 text-emerald-400 animate-bounce" />
                    <span>เย้! ทุกคนชำระเงินครบหมดแล้ว 100%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}
