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

      // Upload slip file
      const slipUrl = await uploadSlip(file)

      // Submit payment
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
        <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100">
          <Upload className="h-4 w-4 mr-1" />
          อัปโหลด
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>อัปโหลดสลิปการโอนเงิน</DialogTitle>
          <DialogDescription>
            อัปโหลดสลิปสำหรับ: {item.name} (฿{item.amount?.toLocaleString()})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slipFile">ไฟล์สลิป</Label>
            <Input id="slipFile" name="slipFile" type="file" accept="image/*" required className="cursor-pointer" />
            <p className="text-xs text-muted-foreground">รองรับไฟล์รูปภาพ (JPG, PNG)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankRef">รหัสอ้างอิงธนาคาร</Label>
            <Input id="bankRef" name="bankRef" placeholder="เช่น 202412251234567890" required className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detectedAmount">จำนวนเงินที่โอน</Label>
            <Input
              id="detectedAmount"
              name="detectedAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={item.amount}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
