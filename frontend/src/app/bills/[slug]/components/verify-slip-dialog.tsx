"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BillItem } from "./bill-item-card"

interface VerifySlipDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: BillItem | null
  loading: boolean
  onSubmit: (file: File, bankRef: string, amount: string) => Promise<void>
}

export function VerifySlipDialog({
  isOpen,
  onOpenChange,
  item,
  loading,
  onSubmit,
}: VerifySlipDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State ภายใน Dialog
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [mockingScan, setMockingScan] = useState(false)
  const [bankRef, setBankRef] = useState("")
  const [detectedAmount, setDetectedAmount] = useState("")

  // เคลียร์ค่าภายในเมื่อปิด Dialog
  const handleCloseChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null)
      setFilePreview(null)
      setMockingScan(false)
      setBankRef("")
      setDetectedAmount("")
    }
    onOpenChange(open)
  }

  // จัดการการเปลี่ยนไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // ล้างข้อมูลเก่า
      setBankRef("")
      setDetectedAmount("")
    }
  }

  // จำลองการสแกน OCR สลิป
  const handleMockScan = () => {
    if (!selectedFile) return
    setMockingScan(true)
    
    // จำลองระยะเวลาสแกน 1.5 วินาที
    setTimeout(() => {
      // สุ่มรหัส Ref และใช้ยอดเงินของเพื่อนร่วมหารเป็นไกด์จำลอง
      const randomRef = "2026" + Math.floor(Math.random() * 1000000000).toString()
      const targetAmount = item ? item.amount.toFixed(2) : "0.00"
      
      setBankRef(randomRef)
      setDetectedAmount(targetAmount)
      setMockingScan(false)
      
      toast({
        title: "สแกนสำเร็จ!",
        description: "ระบบตรวจพบรหัสอ้างอิงและจำนวนเงินนำมาป้อนให้อัตโนมัติ",
      })
    }, 1500)
  }

  // ส่งผลการอัปเดตสลิป
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาแนบรูปภาพสลิปก่อนนะครับ", variant: "destructive" })
      return
    }
    if (!bankRef.trim() || !detectedAmount.trim()) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาระบุรหัสอ้างอิงและยอดเงินให้ครบถ้วนนะครับ", variant: "destructive" })
      return
    }
    await onSubmit(selectedFile, bankRef.trim(), detectedAmount.trim())
    handleCloseChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[380px] mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            ยืนยันการจ่าย — {item?.displayName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            แนบสลิปและตรวจสอบข้อมูลก่อนยืนยัน
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* พื้นที่อัปโหลดรูปสลิป */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="
              border-2 border-dashed border-border hover:border-emerald-500/50
              bg-background rounded-2xl p-5
              flex flex-col items-center justify-center gap-2
              cursor-pointer transition-all min-h-[120px]
            "
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {filePreview ? (
              <div className="w-full max-h-[140px] overflow-hidden rounded-xl flex items-center justify-center">
                <img src={filePreview} alt="Slip preview" className="object-contain max-h-[140px] rounded-xl" />
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground text-center">
                  แตะที่นี่เพื่อเลือกรูปสลิป<br />
                  <span className="text-[10px] opacity-60">จากกล้องหรือแกลเลอรี</span>
                </span>
              </>
            )}
          </div>

          {/* ปุ่มสแกน Mock OCR */}
          {selectedFile && (
            <button
              type="button"
              onClick={handleMockScan}
              disabled={mockingScan}
              className="
                w-full h-11 rounded-xl border border-indigo-500/25
                bg-indigo-500/8 text-indigo-400 text-xs font-semibold
                flex items-center justify-center gap-2
                hover:bg-indigo-500/15 active:scale-[0.98] transition-all
                disabled:opacity-50
              "
            >
              <RefreshCw className={`h-3.5 w-3.5 ${mockingScan ? "animate-spin" : ""}`} />
              {mockingScan ? "กำลังสแกน..." : "🔍 สแกนและกรอกข้อมูลอัตโนมัติ"}
            </button>
          )}

          {/* ฟิลด์กรอกข้อมูล */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bankRef" className="text-xs font-semibold text-muted-foreground">
                รหัสอ้างอิง
              </Label>
              <Input
                id="bankRef"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="Ref ID"
                required
                className="h-11 bg-secondary/40 border-border font-mono text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detectedAmount" className="text-xs font-semibold text-muted-foreground">
                ยอดเงิน (฿)
              </Label>
              <Input
                id="detectedAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={detectedAmount}
                onChange={(e) => setDetectedAmount(e.target.value)}
                placeholder="0.00"
                required
                className="
                  h-11 bg-secondary/40 border-border font-mono text-sm rounded-xl
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </div>

          {/* ปุ่มยืนยัน */}
          <Button
            type="submit"
            disabled={loading}
            className="
              w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600
              hover:from-emerald-500 hover:to-teal-500
              border-none text-white rounded-2xl font-bold
              shadow-lg shadow-emerald-600/10
              active:scale-[0.98] disabled:opacity-60 transition-all
            "
          >
            {loading ? "กำลังบันทึก..." : "✓ ยืนยันการชำระเงิน"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
