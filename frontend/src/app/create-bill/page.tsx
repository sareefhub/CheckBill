"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ArrowLeft, Sparkles, UserPlus, Coins, Wallet } from "lucide-react"
import Link from "next/link"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// กำหนดประเภทข้อมูลของรายการเพื่อนผู้ร่วมจ่าย
type BillItem = {
  name: string
  amount: string
}

export default function CreateBillPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // ข้อมูลตั้งต้นสำหรับสร้างบิล
  const [billData, setBillData] = useState<{
    title: string
    payeePromptPayId: string
    items: BillItem[]
  }>({
    title: "",
    payeePromptPayId: "",
    items: [{ name: "", amount: "" }],
  })

  // ฟังก์ชันเพิ่มรายการเพื่อนใหม่
  const addItem = () => {
    setBillData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", amount: "" }],
    }))
  }

  // ฟังก์ชันลบเพื่อนตามดัชนี
  const removeItem = (index: number) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  // ฟังก์ชันอัปเดตข้อมูลของช่องกรอกแต่ละตัวในแถวเพื่อน
  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  // ฟังก์ชันตรวจสอบและส่งข้อมูลไปสร้างบิลที่ backend API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!billData.title.trim()) {
        return toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่ชื่อบิลก่อนสร้างนะครับ", variant: "destructive" })
      }
      if (!billData.payeePromptPayId.trim()) {
        return toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่เบอร์พร้อมเพย์สำหรับรับเงินนะครับ", variant: "destructive" })
      }

      const validItems = billData.items.filter(
        (item) =>
          item.name.trim() &&
          item.amount.trim() &&
          !isNaN(Number.parseFloat(item.amount))
      )

      if (validItems.length === 0) {
        return toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่รายการผู้ร่วมจ่ายอย่างน้อย 1 คนขึ้นไปนะครับ", variant: "destructive" })
      }

      const apiData = {
        title: billData.title.trim(),
        payeePromptPayId: billData.payeePromptPayId.trim(),
        items: validItems.map((item) => ({
          displayName: item.name.trim(),
          amount: Number(item.amount),
        })),
      }

      const response = await billApi.createBill(apiData)

      toast({
        title: "สำเร็จ!",
        description: "สร้างบิลเรียบร้อยแล้ว กำลังนำคุณไปที่หน้าบิล...",
      })

      // บันทึกบิลลงในประวัติผู้สร้าง (localStorage)
      if (typeof window !== "undefined") {
        try {
          const recentBills = JSON.parse(localStorage.getItem("recent_bills") || "[]")
          if (!recentBills.some((b: any) => b.slug === response.publicSlug)) {
            recentBills.unshift({
              slug: response.publicSlug,
              title: billData.title.trim(),
              createdAt: new Date().toISOString(),
              role: "creator"
            })
            localStorage.setItem("recent_bills", JSON.stringify(recentBills.slice(0, 10)))
          }
        } catch (e) {
          console.error("Failed to save recent bill", e)
        }
      }

      router.push(`/bills/${response.publicSlug}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถสร้างบิลได้"
      toast({ title: "เกิดข้อผิดพลาด", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // คำนวณยอดเงินรวมจำลองขณะกรอก
  const temporaryTotal = billData.items.reduce((sum, item) => {
    const val = parseFloat(item.amount)
    return isNaN(val) ? sum : sum + val
  }, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-16">
      {/* แสงสปอตไลท์ระยิบระยับพื้นหลัง */}
      <div className="absolute top-[-25%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        
        {/* ส่วนหัวหน้าเว็บและปุ่มย้อนกลับ */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl px-3 h-10 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" /> ย้อนกลับหน้าหลัก
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-3 rounded-2xl border border-indigo-500/20 shadow-inner">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                สร้างบิลใหม่
              </h1>
              <p className="text-slate-500 mt-1 text-xs sm:text-sm">
                ระบุรายละเอียดบิลพร้อมเพย์ผู้รับ และใส่รายการเพื่อนที่ต้องการหารเงิน
              </p>
            </div>
          </div>
        </div>

        {/* การ์ดฟอร์มข้อมูลบิลหลัก */}
        <Card className="bg-slate-900/30 border-slate-800/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="border-b border-slate-800/50 pb-6 pt-7 px-6 sm:px-8">
            <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-indigo-400" /> กรอกข้อมูลบิลหลัก
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-1">
              ข้อมูลเบอร์พร้อมเพย์จะถูกนำไปใช้เจนรูป QR Code เพื่อให้เพื่อนโอนจ่ายเงินได้ทันที
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 px-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. ฟิลด์กรอกชื่อบิล */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ชื่อบิลเรียกเก็บ
                </Label>
                <Input
                  id="title"
                  placeholder="เช่น ค่าชาบูร้านโปรด, ค่าทริปวันหยุด"
                  value={billData.title}
                  onChange={(e) =>
                    setBillData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="h-12 bg-slate-950/80 border-slate-800/80 focus:border-indigo-500/70 text-slate-100 placeholder-slate-600 rounded-xl focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium text-sm pl-4"
                />
              </div>

              {/* 2. ฟิลด์กรอกเบอร์พร้อมเพย์ */}
              <div className="space-y-2">
                <Label htmlFor="promptpay" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  เบอร์พร้อมเพย์ผู้รับเงิน (PromptPay ID)
                </Label>
                <Input
                  id="promptpay"
                  placeholder="เช่น 0812345678 หรือเลขบัตรประชาชน"
                  value={billData.payeePromptPayId}
                  onChange={(e) =>
                    setBillData((prev) => ({
                      ...prev,
                      payeePromptPayId: e.target.value,
                    }))
                  }
                  required
                  className="h-12 bg-slate-950/80 border-slate-800/80 focus:border-indigo-500/70 text-slate-100 placeholder-slate-600 rounded-xl focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm pl-4"
                />
              </div>

              {/* 3. ส่วนจัดการรายการคนจ่ายเงิน (เพื่อน) */}
              <div className="space-y-4 pt-6 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-indigo-400" /> รายชื่อเพื่อนที่ร่วมหาร
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="h-9 bg-slate-800/30 border-slate-800 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all duration-200 font-semibold px-3 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> เพิ่มคนหาร
                  </Button>
                </div>

                {/* ลูปแสดงรายชื่อคนหาร */}
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {billData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl animate-in fade-in duration-200 relative group"
                    >
                      {/* ช่องกรอกชื่อ */}
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`name-${index}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                          ชื่อเพื่อน
                        </Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="ชื่อเพื่อน"
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          required
                          className="h-10 bg-slate-950 border-slate-800/80 focus:border-indigo-500/60 text-slate-100 placeholder-slate-700 rounded-xl text-xs font-medium pl-3"
                        />
                      </div>

                      {/* ช่องกรอกยอดเงิน */}
                      <div className="w-28 sm:w-36 space-y-1.5">
                        <Label htmlFor={`amount-${index}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                          ยอดเงิน (บาท)
                        </Label>
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(index, "amount", e.target.value)
                          }
                          required
                          className="h-10 bg-slate-950 border-slate-800/80 focus:border-indigo-500/60 text-slate-100 placeholder-slate-700 rounded-xl font-mono text-xs pl-3"
                        />
                      </div>

                      {/* ปุ่มลบแถว */}
                      {billData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-10 w-10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* แถบสรุปเงินรวมจำลอง */}
                {temporaryTotal > 0 && (
                  <div className="flex justify-between items-center p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-indigo-300 font-bold text-xs sm:text-sm shadow-inner mt-4 animate-in slide-in-from-bottom duration-200">
                    <span className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-indigo-400" /> ยอดเงินหารรวมทั้งหมด:
                    </span>
                    <span className="text-lg font-mono text-indigo-400">฿{temporaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* ปุ่มส่งคำขอสร้างบิล */}
              <Button
                type="submit"
                className="w-full h-12 text-sm sm:text-base font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white rounded-xl shadow-lg shadow-indigo-600/15 mt-6 transition-all duration-200"
                disabled={loading}
              >
                {loading ? "กำลังบันทึกบิลลงระบบ..." : "สร้างบิลและรับ QR Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
