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
            <div className="w-full bg-background border border-border rounded-2xl p-3.5 space-y-2 text-xs font-medium">
              {payeeName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ผู้รับเงิน:</span>
                  <span className="text-foreground font-bold">{payeeName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">พร้อมเพย์:</span>
                <span className="text-foreground font-mono">{payeePromptPayId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">จำนวนเงิน:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {referenceCode && (
                <div className="flex justify-between border-t border-border pt-2 font-mono">
                  <span className="text-muted-foreground">รหัสอ้างอิง:</span>
                  <span className="text-foreground text-[10px] break-all max-w-[55%] text-right">
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
