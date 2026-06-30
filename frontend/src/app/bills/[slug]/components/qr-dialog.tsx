"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode, Download, Upload } from "lucide-react"

interface QrDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  qrImage: string | null
  payeeName: string | null | undefined
  payeePromptPayId: string
  amount: number | null
  referenceCode: string | null
  onUploadSlip?: () => void
}

export function QrDialog({
  isOpen,
  onOpenChange,
  loading,
  qrImage,
  payeeName,
  payeePromptPayId,
  amount,
  referenceCode,
  onUploadSlip,
}: QrDialogProps) {
  const [downloading, setDownloading] = useState(false)

  // ฟังก์ชันช่วยดาวน์โหลดรูปภาพ QR Code ที่รวมหัวกระดาษและโลโก้ตรงกลางเข้าด้วยกัน
  const handleDownload = async () => {
    if (!qrImage) return
    setDownloading(true)

    // ฟังก์ชันสร้าง Image object และจัดการ CORS สำหรับดึงรูปภาพมาวาดบน Canvas
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        img.src = src
      })
    }

    try {
      // โหลดรูปภาพที่เกี่ยวข้องทั้งหมด (หัวกระดาษ, ตัว QR Code, และไอคอนพร้อมเพย์ขนาดเล็ก)
      const [headerImg, qrImg, iconImg] = await Promise.all([
        loadImage("/images/thai_qr_payment.png"),
        loadImage(qrImage),
        loadImage("/images/icon-thaiqr.png"),
      ])

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      // กำหนดความกว้างของรูปที่เซฟ (600px เพื่อความคมชัดในการสแกนผ่านมือถือ)
      const canvasWidth = 600
      
      // คำนวณความสูงของ Header และส่วนของ QR Code
      const headerHeight = (canvasWidth / headerImg.naturalWidth) * headerImg.naturalHeight
      const qrHeight = canvasWidth // ตัว QR code เป็นทรงจัตุรัส
      const canvasHeight = headerHeight + qrHeight

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // วาดพื้นหลังขาวให้กับการ์ด
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // วาดแบนเนอร์ด้านบน (Thai QR Payment Header)
      ctx.drawImage(headerImg, 0, 0, canvasWidth, headerHeight)

      // วาดภาพ QR Code หลัก
      ctx.drawImage(qrImg, 0, headerHeight, canvasWidth, qrHeight)

      // วาดโลโก้พร้อมเพย์ตรงกลางของ QR Code เพื่อความถูกต้องตามมาตรฐาน
      const iconSize = canvasWidth * 0.12 // อัตราส่วน 12% ของขนาด QR
      const iconX = (canvasWidth - iconSize) / 2
      const iconY = headerHeight + (qrHeight - iconSize) / 2

      // ทำกรอบสี่เหลี่ยมสีขาวมนมุมรอบตัวโลโก้เพื่อให้ตัดกับลวดลายของ QR Code
      const padding = 6
      const bgX = iconX - padding
      const bgY = iconY - padding
      const bgSize = iconSize + padding * 2
      const radius = 12

      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(bgX, bgY, bgSize, bgSize, radius)
      } else {
        ctx.rect(bgX, bgY, bgSize, bgSize)
      }
      ctx.fill()

      // วาดตัวไอคอนลงบน Canvas
      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)

      // แปลงข้อมูล Canvas เป็น Data URL (PNG) และทำปุ่มดาวน์โหลดอัตโนมัติ
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      
      const formattedAmount = amount !== null ? amount.toFixed(2) : "payment"
      link.download = `PromptPay-QR-${formattedAmount}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างไฟล์ดาวน์โหลด QR Code:", error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[340px] mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-400" /> QR จ่ายเงิน
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            เปิดแอปธนาคารสแกนเพื่อโอนเงินได้ทันที
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
                <QrCode className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">กำลังสร้าง QR Code...</p>
            </div>
          ) : (
            qrImage && (
              <>
                <div className="w-full max-w-[260px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col items-center animate-in zoom-in duration-200">
                  <img src="/images/thai_qr_payment.png" alt="Thai QR Payment" className="w-full h-auto object-contain" />
                  <div className="relative w-full bg-white">
                    <img src={qrImage} alt="PromptPay QR" className="w-full h-auto block" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-[3px] rounded-lg shadow-sm">
                      <img src="/images/icon-thaiqr.png" alt="Thai QR Icon" className="w-8 h-8 object-contain" />
                    </div>
                  </div>
                </div>

                {/* ปุ่มดาวน์โหลดรูปภาพ QR Code ที่รวมแบนเนอร์และโลโก้ในรูปเดียวสำเร็จรูป */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full max-w-[260px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดรูปภาพ QR"}
                </button>

                {/* ปุ่มแนบสลิปเพื่อแจ้งโอนเงิน สำหรับผู้ใช้งานที่สแกนจ่ายเงินเสร็จแล้ว */}
                {onUploadSlip && (
                  <button
                    onClick={() => {
                      onOpenChange(false)
                      onUploadSlip()
                    }}
                    className="w-full max-w-[260px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 cursor-pointer mt-1"
                  >
                    <Upload className="h-4 w-4" />
                    แนบสลิปแจ้งโอนเงิน
                  </button>
                )}
              </>
            )
          )}

          {amount !== null && (
            <div className="w-full bg-secondary/20 border border-border/60 rounded-2xl p-4 space-y-3 text-xs">
              {payeeName && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground/90">ผู้รับเงิน</span>
                  <span className="text-sm font-bold text-foreground">{payeeName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground/90">พร้อมเพย์</span>
                <span className="text-sm font-bold text-foreground">{payeePromptPayId}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border/30 pt-2.5">
                <span className="text-xs font-medium text-muted-foreground/90">จำนวนเงิน</span>
                <span className="text-base font-bold text-emerald-600">
                  ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {referenceCode && (
                <div className="flex justify-between items-start border-t border-border/30 pt-2.5">
                  <span className="text-xs font-medium text-muted-foreground/90 mt-0.5">รหัสอ้างอิง</span>
                  <span className="text-[11px] font-normal text-muted-foreground break-all max-w-[65%] text-right leading-relaxed">
                    {referenceCode}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
