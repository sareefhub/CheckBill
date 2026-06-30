"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ArrowLeft, Sparkles, UserPlus } from "lucide-react"
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
      // 1. ตรวจสอบชื่อบิล
      if (!billData.title.trim()) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาใส่ชื่อบิลก่อนสร้างนะครับ",
          variant: "destructive",
        })
        return
      }

      // 2. ตรวจสอบเบอร์พร้อมเพย์
      if (!billData.payeePromptPayId.trim()) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาใส่เบอร์พร้อมเพย์สำหรับรับเงินนะครับ",
          variant: "destructive",
        })
        return
      }

      // 3. กรองเฉพาะรายการเพื่อนที่มีข้อมูลครบและถูกต้อง
      const validItems = billData.items.filter(
        (item) =>
          item.name.trim() &&
          item.amount.trim() &&
          !isNaN(Number.parseFloat(item.amount))
      )

      if (validItems.length === 0) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาใส่รายการผู้ร่วมจ่ายอย่างน้อย 1 คนขึ้นไปนะครับ",
          variant: "destructive",
        })
        return
      }

      // เตรียมข้อมูล DTO ส่งให้ API Next.js Route Handler
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

      // บันทึกบิลนี้ลงในประวัติผู้สร้าง (localStorage) เพื่อให้จดจำได้โดยไม่ต้องมี Login
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

      // ไปยังหน้ารายละเอียดบิลที่เพิ่งสร้าง
      router.push(`/bills/${response.publicSlug}`)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "ไม่สามารถสร้างบิลได้"
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      })
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
    <div className="min-h-screen bg-slate-955 text-slate-100 relative overflow-hidden pb-12">
      {/* แสงสปอตไลท์พื้นหลัง */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          
          {/* ส่วนหัวหน้าเว็บและปุ่มย้อนกลับ */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white hover:bg-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" /> ย้อนกลับหน้าหลัก
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/10 p-2.5 rounded-2xl border border-indigo-500/20">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                สร้างบิลใหม่
              </h1>
            </div>
            <p className="text-slate-400 mt-2 text-sm">
              ระบุรายละเอียดบิลพร้อมเพย์ผู้รับ และใส่รายการเพื่อนที่ต้องการหารเงิน
            </p>
          </div>

          {/* การ์ดฟอร์มข้อมูลบิลหลัก */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md shadow-2xl">
            <CardHeader className="border-b border-slate-800/80 pb-6">
              <CardTitle className="text-lg text-slate-200">กรอกข้อมูลสำหรับเรียกเก็บเงิน</CardTitle>
              <CardDescription className="text-slate-500">
                ข้อมูลเบอร์พร้อมเพย์จะถูกนำไปใช้เจนรูป QR Code เพื่อให้สแกนจ่ายเงินได้ง่ายขึ้น
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. ฟิลด์กรอกชื่อบิล */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-300">
                    ชื่อบิลเรียกเก็บ
                  </Label>
                  <Input
                    id="title"
                    placeholder="เช่น ค่าพิซซ่าเที่ยงวันนี้, ค่าบอร์ดเกมวันเสาร์"
                    value={billData.title}
                    onChange={(e) =>
                      setBillData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="h-12 bg-slate-950/80 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600 rounded-xl"
                  />
                </div>

                {/* 2. ฟิลด์กรอกเบอร์พร้อมเพย์ */}
                <div className="space-y-2">
                  <Label htmlFor="promptpay" className="text-sm font-semibold text-slate-300">
                    เบอร์พร้อมเพย์ (PromptPay ID)
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
                    className="h-12 bg-slate-950/80 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600 rounded-xl font-mono"
                  />
                </div>

                {/* 3. ส่วนจัดการรายการคนจ่ายเงิน (เพื่อน) */}
                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-indigo-400" /> รายชื่อเพื่อนที่ต้องการหารเงิน
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="h-9 bg-slate-800/20 border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> เพิ่มเพื่อน
                    </Button>
                  </div>

                  {/* ลูปแสดงรายชื่อคนหาร */}
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {billData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-end bg-slate-950/40 p-3 border border-slate-800/50 rounded-xl animate-in fade-in duration-200"
                      >
                        {/* ช่องกรอกชื่อ */}
                        <div className="flex-1">
                          <Label htmlFor={`name-${index}`} className="text-xs font-semibold text-slate-400">
                            ชื่อเพื่อน
                          </Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="ระบุชื่อเรียก"
                            value={item.name}
                            onChange={(e) => updateItem(index, "name", e.target.value)}
                            required
                            className="h-10 bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-700 rounded-lg mt-1 text-sm"
                          />
                        </div>

                        {/* ช่องกรอกยอดเงิน */}
                        <div className="w-28 sm:w-32">
                          <Label htmlFor={`amount-${index}`} className="text-xs font-semibold text-slate-400">
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
                            className="h-10 bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-700 rounded-lg mt-1 font-mono text-sm"
                          />
                        </div>

                        {/* ปุ่มลบแถว (แสดงเมื่อมีรายการมากกว่า 1) */}
                        {billData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-10 w-10 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* แถบสรุปเงินรวมจำลอง */}
                  {temporaryTotal > 0 && (
                    <div className="flex justify-between items-center p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-300 font-semibold text-sm">
                      <span>สรุปยอดเงินหารรวมทั้งหมด:</span>
                      <span className="text-lg font-mono">฿{temporaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* ปุ่มส่งคำขอสร้างบิล */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white rounded-xl shadow-lg shadow-indigo-600/15 mt-6 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "กำลังบันทึกบิลลงระบบ..." : "สร้างบิลและรับ QR Code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
