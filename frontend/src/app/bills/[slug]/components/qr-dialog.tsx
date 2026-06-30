"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
              <div className="w-full max-w-[260px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col items-center animate-in zoom-in duration-200">
                <img src="/images/thai_qr_payment.png" alt="Thai QR Payment" className="w-full h-auto object-contain" />
                <div className="relative w-full bg-white">
                  <img src={qrImage} alt="PromptPay QR" className="w-full h-auto block" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-[3px] rounded-lg shadow-sm">
                    <img src="/images/icon-thaiqr.png" alt="Thai QR Icon" className="w-8 h-8 object-contain" />
                  </div>
                </div>
              </div>
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
