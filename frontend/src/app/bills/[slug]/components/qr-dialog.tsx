"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { QrCode } from "lucide-react"

interface QrDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  qrImage: string | null
  payeeName: string | null | undefined
  payeePromptPayId: string
  amount: number | null
  referenceCode: string | null
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
}: QrDialogProps) {
  const [combinedImage, setCombinedImage] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)

  // เริ่มต้นกระบวนการรวมภาพ QR Code เมื่อเปิดหน้าต่างขึ้นมา
  useEffect(() => {
    if (isOpen && qrImage) {
      generateCombinedImage()
    } else {
      setCombinedImage(null)
    }
  }, [isOpen, qrImage])

  // ฟังก์ชันวาดรวมแบนเนอร์และ QR Code เข้าด้วยกันเป็นรูปภาพเดียวแบบไดนามิก
  const generateCombinedImage = async () => {
    if (!qrImage) return
    setGeneratingImage(true)

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
      // โหลดแบนเนอร์, QR Code และโลโก้พร้อมเพย์
      const [headerImg, qrImg, iconImg] = await Promise.all([
        loadImage("/images/thai_qr_payment.png"),
        loadImage(qrImage),
        loadImage("/images/icon-thaiqr.png"),
      ])

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      const canvasWidth = 600
      const headerHeight = (canvasWidth / headerImg.naturalWidth) * headerImg.naturalHeight
      const qrHeight = canvasWidth
      const canvasHeight = headerHeight + qrHeight

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // วาดพื้นหลังการ์ดสีขาว
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // วาดหัวกระดาษ Thai QR Payment
      ctx.drawImage(headerImg, 0, 0, canvasWidth, headerHeight)

      // วาด QR Code
      ctx.drawImage(qrImg, 0, headerHeight, canvasWidth, qrHeight)

      // วาดโลโก้พร้อมเพย์ตรงกลาง QR Code
      const iconSize = canvasWidth * 0.12
      const iconX = (canvasWidth - iconSize) / 2
      const iconY = headerHeight + (qrHeight - iconSize) / 2

      // ทำขอบสีขาวมนมุมรอบโลโก้
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

      // วาดตัวไอคอนพร้อมเพย์ลงไป
      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)

      // แปลง Canvas เป็น Data URL (Base64 PNG) เพื่อนำไปใส่ในแท็ก img
      const dataUrl = canvas.toDataURL("image/png")
      setCombinedImage(dataUrl)
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการรวมภาพ QR Code:", error)
    } finally {
      setGeneratingImage(false)
    }
  }

  const showLoading = loading || generatingImage

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[340px] mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> QR จ่ายเงิน
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            เปิดแอปธนาคารสแกนเพื่อโอนเงินได้ทันที
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {showLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center animate-pulse">
                <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">กำลังเตรียมภาพ QR Code...</p>
            </div>
          ) : (
            combinedImage && (
              <>
                {/* แสดงภาพรวมสำเร็จรูปใบเดียว เพื่อให้ผู้ใช้กดค้างเพื่อบันทึกลงเครื่องได้ทันที */}
                <div className="w-full max-w-[260px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col items-center animate-in zoom-in duration-200">
                  <img src={combinedImage} alt="PromptPay QR Code" className="w-full h-auto block object-contain" />
                </div>

                {/* กล่องข้อความแนะนำผู้ใช้ในการบันทึกภาพลงเครื่อง */}
                <div className="w-full max-w-[260px] bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-3 text-center">
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    💡 วิธีบันทึกรูปภาพลงคลังภาพ
                  </p>
                  <p className="text-[10px] text-muted-foreground/90 mt-1 leading-relaxed">
                    <strong>กดค้างที่รูปภาพ QR Code ด้านบน</strong><br />
                    แล้วเลือกเมนู <strong>&quot;บันทึกรูปภาพ&quot;</strong> หรือ <strong>&quot;เพิ่มไปยังแอปรูปภาพ&quot;</strong>
                  </p>
                </div>
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
