"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, UserPlus, Coins, Wallet, Phone, ArrowLeft, User } from "lucide-react"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/layout/main-layout"

// ============================================================
// ประเภทข้อมูลรายการเพื่อนผู้ร่วมจ่าย
// ============================================================
type BillItem = {
  id: string
  name: string
  amount: string
}

export default function CreateBillPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // ฟังก์ชันสุ่มค่า ID สำหรับ React Keys (แก้เรื่อง Do not use Array index in keys)
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // ข้อมูลตั้งต้นสำหรับสร้างบิล
  const [billData, setBillData] = useState<{
    title: string
    payeeName: string
    payeePromptPayId: string
    items: BillItem[]
  }>({
    title: "",
    payeeName: "",
    payeePromptPayId: "",
    items: [{ id: generateId(), name: "", amount: "" }],
  })

  // เพิ่มรายการเพื่อนใหม่
  const addItem = () => {
    setBillData((prev) => ({
      ...prev,
      items: [...prev.items, { id: generateId(), name: "", amount: "" }],
    }))
  }

  // ลบเพื่อนตามดัชนี
  const removeItem = (index: number) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  // อัปเดตข้อมูลในแต่ละแถวเพื่อน
  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  // ตรวจสอบและส่งข้อมูลสร้างบิลไป backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!billData.title.trim()) {
        toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่ชื่อบิลก่อนสร้างนะครับ", variant: "destructive" })
        setLoading(false)
        return
      }
      if (!billData.payeeName.trim()) {
        toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่ชื่อผู้รับเงินด้วยนะครับ", variant: "destructive" })
        setLoading(false)
        return
      }
      if (!billData.payeePromptPayId.trim()) {
        toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่เบอร์พร้อมเพย์สำหรับรับเงินนะครับ", variant: "destructive" })
        setLoading(false)
        return
      }

      const validItems = billData.items.filter(
        (item) =>
          item.name.trim() &&
          item.amount.trim() &&
          !Number.isNaN(Number.parseFloat(item.amount))
      )

      if (validItems.length === 0) {
        toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาใส่รายการผู้ร่วมจ่ายอย่างน้อย 1 คนขึ้นไปนะครับ", variant: "destructive" })
        setLoading(false)
        return
      }

      const apiData = {
        title: billData.title.trim(),
        payeeName: billData.payeeName.trim(),
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
      if (typeof globalThis.window !== "undefined") {
        try {
          const recentBills = JSON.parse(localStorage.getItem("recent_bills") || "[]")
          if (!recentBills.some((b: { slug: string }) => b.slug === response.publicSlug)) {
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
      setLoading(false)
    }
  }

  // คำนวณยอดเงินรวมขณะกรอก
  const temporaryTotal = billData.items.reduce((sum, item) => {
    const val = Number.parseFloat(item.amount)
    return Number.isNaN(val) ? sum : sum + val
  }, 0)

  return (
    <MainLayout>
      {/* ส่วนหัวหน้าจอ (ย้อนกลับ / สร้างบิลใหม่) */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/">
          <button
            type="button"
            aria-label="ย้อนกลับ"
            className="
              w-10 h-10 rounded-xl flex items-center justify-center
              bg-secondary/60 border border-border
              hover:bg-secondary transition-all active:scale-95
              text-muted-foreground hover:text-foreground
            "
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-base font-bold text-foreground">สร้างบิลใหม่</h1>
          <p className="text-sm font-medium text-muted-foreground/90 mt-0.5">ระบุรายละเอียดบิลและเพื่อนร่วมหาร</p>
        </div>
      </div>

      {/* ================================================================
          ฟอร์มกรอกข้อมูล
          ================================================================ */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 pt-5 pb-4 relative z-10 space-y-4">
          
          {/* --- การ์ดหลัก: รายละเอียดบิล --- */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 px-0.5">
              <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/15">
                <Wallet className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-foreground">รายละเอียดบิล</span>
            </div>

            {/* ชื่อบิล */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-bold text-foreground/90 pl-0.5">
                ชื่อบิลหรือรายการเรียกเก็บ
              </Label>
              <Input
                id="title"
                placeholder="เช่น ค่าอาหารมื้อพิเศษ, ค่าทริปท่องเที่ยว"
                value={billData.title}
                onChange={(e) => setBillData((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="
                  h-11 bg-secondary/40 border-border
                  focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                  text-foreground placeholder:text-muted-foreground/75
                  rounded-xl transition-all text-sm font-normal
                "
              />
            </div>

            {/* ชื่อผู้รับเงิน */}
            <div className="space-y-1.5">
              <Label htmlFor="payeeName" className="text-sm font-bold text-foreground/90 pl-0.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-400" /> ชื่อผู้รับเงิน (ชื่อบัญชีปลายทาง)
              </Label>
              <Input
                id="payeeName"
                placeholder="เช่น นายสมชาย ใจดี"
                value={billData.payeeName}
                onChange={(e) => setBillData((prev) => ({ ...prev, payeeName: e.target.value }))}
                required
                className="
                  h-11 bg-secondary/40 border-border
                  focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                  text-foreground placeholder:text-muted-foreground/75
                  rounded-xl transition-all text-sm font-normal
                "
              />
            </div>

            {/* เบอร์พร้อมเพย์ */}
            <div className="space-y-1.5">
              <Label htmlFor="promptpay" className="text-sm font-bold text-foreground/90 pl-0.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> หมายเลขพร้อมเพย์ผู้รับเงิน
              </Label>
              <Input
                id="promptpay"
                inputMode="numeric"
                placeholder="ระบุเบอร์โทรศัพท์ หรือเลขบัตรประชาชน"
                value={billData.payeePromptPayId}
                onChange={(e) => setBillData((prev) => ({ ...prev, payeePromptPayId: e.target.value }))}
                required
                className="
                  h-11 bg-secondary/40 border-border
                  focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                  text-foreground placeholder:text-muted-foreground/75
                  rounded-xl transition-all font-mono text-sm font-normal
                "
              />
            </div>
          </div>

          {/* --- การ์ดรอง: รายชื่อเพื่อนร่วมหาร --- */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/15">
                  <UserPlus className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-sm font-bold text-foreground">รายชื่อเพื่อนร่วมหาร</span>
                <span className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {billData.items.length} คน
                </span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="
                  h-9 px-3.5 rounded-xl text-sm font-semibold
                  bg-indigo-600 hover:bg-indigo-500
                  text-white flex items-center gap-1
                  active:scale-95 transition-all shadow-sm shadow-indigo-600/10
                "
              >
                <Plus className="h-3.5 w-3.5" />
                <span>เพิ่มเพื่อนร่วมหาร</span>
              </button>
            </div>

            {/* แถวแนะนำหัวคอลัมน์ */}
            <div className="px-4 pt-2.5 pb-1 flex items-center gap-2 text-xs font-bold text-muted-foreground/80 bg-secondary/20 border-b border-border/30">
              <div className="w-6 flex-shrink-0 text-center">#</div>
              <div className="flex-1 pl-1">ชื่อเพื่อนร่วมหาร</div>
              <div className="w-24 pl-1">ยอดเงิน (บาท)</div>
              {billData.items.length > 1 && <div className="w-9 flex-shrink-0" />}
            </div>

            {/* รายการเพื่อนแต่ละคน */}
            <div className="divide-y divide-border/30 px-2 py-1.5 space-y-1">
              {billData.items.map((item, index) => (
                <div
                  key={item.id}
                  className="px-2 py-1 flex items-center gap-2 animate-in fade-in duration-150"
                >
                  {/* ลำดับตัวเลขวงกลมมน */}
                  <div className="w-6 h-6 rounded-full bg-secondary border border-border/80 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground/90">{index + 1}</span>
                  </div>

                  {/* ชื่อเพื่อน */}
                  <div className="flex-1">
                    <Input
                      id={`name-${index}`}
                      placeholder="กรอกชื่อเพื่อน"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      required
                      className="
                        h-10 bg-secondary/40 border-border
                        focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50
                        text-foreground placeholder:text-muted-foreground/75
                        rounded-xl text-sm font-normal
                      "
                    />
                  </div>

                  {/* ยอดเงิน */}
                  <div className="w-24">
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="ระบุจำนวนเงิน"
                      value={item.amount}
                      onChange={(e) => updateItem(index, "amount", e.target.value)}
                      required
                      className="
                        h-10 bg-secondary/40 border-border
                        focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50
                        text-foreground placeholder:text-muted-foreground/75
                        rounded-xl font-mono text-sm font-normal
                        [appearance:textfield]
                        [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none
                      "
                    />
                  </div>

                  {/* ปุ่มลบ */}
                  {billData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="ลบรายการนี้"
                      className="
                        w-9 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        text-muted-foreground/50 hover:text-red-400
                        hover:bg-red-500/10 active:scale-95
                        transition-all
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* สรุปยอดรวมชั่วคราว */}
            {temporaryTotal > 0 && (
              <div className="mx-4 mb-4 mt-2.5 flex justify-between items-center p-3 bg-indigo-500/8 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-indigo-400" /> ยอดเงินรวมทั้งหมด
                </span>
                <span className="text-base font-mono font-bold text-indigo-400">
                  ฿{temporaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            STICKY SUBMIT BAR — ติดด้านล่างเสมอ
            ================================================================ */}
        <div className="sticky bottom-0 z-50 bg-background/90 backdrop-blur-md border-t border-border/60 pb-safe">
          <div className="max-w-lg mx-auto px-4 pt-3 pb-3">
            <Button
              type="submit"
              disabled={loading}
              className="
                w-full h-13 text-sm font-semibold
                bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600
                hover:from-indigo-500 hover:to-violet-500
                border-none text-white rounded-2xl
                shadow-lg shadow-indigo-600/20
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-60
              "
            >
              {loading ? "กำลังบันทึก..." : "✨ สร้างบิลและรับ QR Code สแกนจ่าย"}
            </Button>
          </div>
        </div>
      </form>
    </MainLayout>
  )
}
