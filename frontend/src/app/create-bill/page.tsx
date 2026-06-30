"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, UserPlus, Coins, Wallet, Phone, ArrowLeft } from "lucide-react"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/layout/main-layout"

// ============================================================
// ประเภทข้อมูลรายการเพื่อนผู้ร่วมจ่าย
// ============================================================
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

  // เพิ่มรายการเพื่อนใหม่
  const addItem = () => {
    setBillData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", amount: "" }],
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
    } finally {
      setLoading(false)
    }
  }

  // คำนวณยอดเงินรวมขณะกรอก
  const temporaryTotal = billData.items.reduce((sum, item) => {
    const val = parseFloat(item.amount)
    return isNaN(val) ? sum : sum + val
  }, 0)

  return (
    <MainLayout>

      {/* small page header (inside main layout) */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/">
          <button
            aria-label="ย้อนกลับ"
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              bg-secondary/60 border border-border
              hover:bg-secondary transition-all active:scale-95
              text-muted-foreground hover:text-foreground
            `}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-base font-black text-foreground">สร้างบิลใหม่</h1>
          <p className="text-[11px] text-muted-foreground leading-none">ใส่ข้อมูลบิลและรายชื่อเพื่อน</p>
        </div>
      </div>

      {/* ================================================================
          FORM CONTENT
          ================================================================ */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-4 relative z-10 space-y-4">

          {/* --- Section: ข้อมูลบิลหลัก --- */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* แถบสี gradient ด้านบน card */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500" />

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-foreground">ข้อมูลบิลหลัก</span>
              </div>

              {/* ชื่อบิล */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ชื่อบิลเรียกเก็บ
                </Label>
                <Input
                  id="title"
                  placeholder="เช่น ค่าชาบูร้านโปรด, ค่าทริปวันหยุด"
                  value={billData.title}
                  onChange={(e) => setBillData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="
                    h-12 bg-secondary/40 border-border
                    focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                    text-foreground placeholder:text-muted-foreground/60
                    rounded-xl transition-all font-medium
                  "
                />
              </div>

              {/* เบอร์พร้อมเพย์ */}
              <div className="space-y-1.5">
                <Label htmlFor="promptpay" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> เบอร์พร้อมเพย์ผู้รับเงิน
                </Label>
                <Input
                  id="promptpay"
                  inputMode="numeric"
                  placeholder="เช่น 0812345678 หรือเลขบัตรประชาชน"
                  value={billData.payeePromptPayId}
                  onChange={(e) => setBillData((prev) => ({ ...prev, payeePromptPayId: e.target.value }))}
                  required
                  className="
                    h-12 bg-secondary/40 border-border
                    focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                    text-foreground placeholder:text-muted-foreground/60
                    rounded-xl transition-all font-mono
                  "
                />
              </div>
            </div>
          </div>

          {/* --- Section: รายชื่อเพื่อน --- */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-foreground">รายชื่อเพื่อน</span>
                <span className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {billData.items.length} คน
                </span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="
                  h-9 px-3 rounded-xl text-xs font-bold
                  bg-indigo-600 hover:bg-indigo-500
                  text-white flex items-center gap-1.5
                  active:scale-95 transition-all
                "
              >
                <Plus className="h-3.5 w-3.5" /> เพิ่มคน
              </button>
            </div>

            {/* รายการเพื่อนแต่ละคน */}
            <div className="divide-y divide-border/50">
              {billData.items.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-3.5 flex items-end gap-3 animate-in fade-in duration-150"
                >
                  {/* ลำดับ */}
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0 mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground">{index + 1}</span>
                  </div>

                  {/* ชื่อเพื่อน */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`name-${index}`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      ชื่อ
                    </Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="ชื่อเพื่อน"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      required
                      className="
                        h-11 bg-secondary/40 border-border
                        focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50
                        text-foreground placeholder:text-muted-foreground/60
                        rounded-xl text-sm
                      "
                    />
                  </div>

                  {/* ยอดเงิน */}
                  <div className="w-28 space-y-1">
                    <Label htmlFor={`amount-${index}`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      ยอด (฿)
                    </Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => updateItem(index, "amount", e.target.value)}
                      required
                      className="
                        h-11 bg-secondary/40 border-border
                        focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50
                        text-foreground placeholder:text-muted-foreground/60
                        rounded-xl font-mono text-sm
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
                        w-10 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                        text-muted-foreground hover:text-red-400
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
              <div className="mx-4 mb-4 mt-1 flex justify-between items-center p-3.5 bg-indigo-500/8 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" /> ยอดรวมทั้งหมด
                </span>
                <span className="text-base font-mono font-black text-indigo-400">
                  ฿{temporaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* padding เว้นพื้นที่ให้ sticky button */}
          <div className="h-2" />
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
                w-full h-13 text-sm font-bold
                bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600
                hover:from-indigo-500 hover:to-violet-500
                border-none text-white rounded-2xl
                shadow-lg shadow-indigo-600/20
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-60
              "
            >
              {loading ? "กำลังบันทึก..." : "✨ สร้างบิลและรับ QR Code"}
            </Button>
          </div>
        </div>
      </form>
    </MainLayout>
  )
}
