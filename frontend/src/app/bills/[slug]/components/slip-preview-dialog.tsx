"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface SlipPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  slipUrl: string | null
  amount: number | null
  bankRef: string | null
}

export function SlipPreviewDialog({
  isOpen,
  onOpenChange,
  loading,
  slipUrl,
  amount,
  bankRef,
}: SlipPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[340px] mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" /> สลิปการชำระเงิน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm animate-pulse">กำลังดึงข้อมูล...</p>
            </div>
          ) : (
            <>
              {slipUrl && (
                <div className="bg-background border border-border rounded-2xl p-2.5 flex items-center justify-center max-h-[260px] overflow-hidden">
                  <img
                    src={slipUrl}
                    alt="Payment Slip"
                    className="object-contain max-h-[250px] rounded-xl"
                  />
                </div>
              )}
              <div className="bg-background border border-border rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">สถานะ:</span>
                  <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 h-5 text-[10px] font-semibold">
                    อนุมัติแล้ว ✓
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ยอดเงิน:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ฿{amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-mono">
                  <span className="text-muted-foreground">รหัสทำรายการ:</span>
                  <span className="text-foreground text-[10px] break-all max-w-[55%] text-right">
                    {bankRef}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
