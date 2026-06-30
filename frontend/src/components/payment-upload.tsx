"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { paymentApi, uploadSlip } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// ---------- Types ----------
interface BillItem {
  id: string
  name: string
  amount: number
}

interface PaymentUploadButtonProps {
  item: BillItem
  onPaymentSuccess?: () => void
}

export function PaymentUploadButton({ item, onPaymentSuccess }: PaymentUploadButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const file = formData.get("slipFile") as File | null
    const bankRef = formData.get("bankRef") as string | null
    const detectedAmount = formData.get("detectedAmount") as string | null

    if (!file || !bankRef || !detectedAmount) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // อัปโหลดไฟล์สลิปไปยังเซิร์ฟเวอร์ก่อน
      const slipUrl = await uploadSlip(file)

      // บันทึกข้อมูลการชำระเงิน
      const paymentData = {
        billItemId: item.id,
        slipUrl,
        bankRef,
        detectedAmount: Number.parseFloat(detectedAmount),
      }

      await paymentApi.createPayment(paymentData)

      toast({
        title: "สำเร็จ!",
        description: "อัปโหลดสลิปเรียบร้อยแล้ว รอการยืนยัน",
      })

      setOpen(false)
      onPaymentSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ไม่สามารถอัปโหลดสลิปได้"
      toast({
        title: "เกิดข้อผิดพลาด",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* ปุ่มเปิด Dialog ใช้ธีม indigo สอดคล้องกับ design system */}
        <Button
          variant="outline"
          size="sm"
          className="bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-lg transition-all duration-200"
        >
          <Upload className="h-4 w-4 mr-1" />
          อัปโหลด
        </Button>
      </DialogTrigger>

      {/* Dialog ใช้ธีม slate-900 สม่ำเสมอกับ dialog อื่นๆ */}
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-400" />
            อัปโหลดสลิปการโอนเงิน
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            อัปโหลดสลิปสำหรับ:{" "}
            <span className="text-slate-200 font-medium">{item.name}</span>{" "}
            (<span className="text-emerald-400 font-mono">฿{item.amount?.toLocaleString()}</span>)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* ช่องเลือกไฟล์สลิป */}
          <div className="space-y-2">
            <Label htmlFor="slipFile" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ไฟล์สลิป
            </Label>
            <Input
              id="slipFile"
              name="slipFile"
              type="file"
              accept="image/*"
              required
              className="cursor-pointer bg-slate-950 border-slate-800 text-slate-300 file:bg-indigo-600/10 file:border-0 file:text-indigo-400 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:text-xs hover:file:bg-indigo-600 hover:file:text-white transition-all"
            />
            <p className="text-xs text-slate-500">รองรับไฟล์รูปภาพ (JPG, PNG)</p>
          </div>

          {/* รหัสอ้างอิงธนาคาร */}
          <div className="space-y-2">
            <Label htmlFor="bankRef" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              รหัสอ้างอิงธนาคาร
            </Label>
            <Input
              id="bankRef"
              name="bankRef"
              placeholder="เช่น 202412251234567890"
              required
              className="h-10 bg-slate-950 border-slate-800 focus:border-indigo-500/70 text-slate-100 placeholder-slate-600 rounded-xl font-mono text-sm focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          {/* จำนวนเงินที่โอน */}
          <div className="space-y-2">
            <Label htmlFor="detectedAmount" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              จำนวนเงินที่โอน (บาท)
            </Label>
            <Input
              id="detectedAmount"
              name="detectedAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={item.amount}
              required
              className="h-10 bg-slate-950 border-slate-800 focus:border-indigo-500/70 text-slate-100 placeholder-slate-600 rounded-xl font-mono text-sm focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          {/* ปุ่มยกเลิก / ยืนยัน */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-all"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/15 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
