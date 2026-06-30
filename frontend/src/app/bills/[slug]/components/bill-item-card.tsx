"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, QrCode, Upload, Eye } from "lucide-react"

// ============================================================
// ประเภทข้อมูล
// ============================================================
export interface BillItem {
  id: number
  displayName: string
  amount: number
  status: "PAID" | "PENDING" | "UNPAID"
  referenceCode?: string
}

interface BillItemCardProps {
  item: BillItem
  billStatus: "OPEN" | "CLOSED"
  onViewQR: (id: number) => void
  onUploadSlip: (item: BillItem) => void
  onViewSlip: (id: number) => void
}

export function BillItemCard({
  item,
  billStatus,
  onViewQR,
  onUploadSlip,
  onViewSlip,
}: BillItemCardProps) {
  const [expanded, setExpanded] = useState(false)

  // กำหนด badge และสีตามสถานะ
  const statusConfig = {
    PAID: {
      badge: "จ่ายแล้ว ✓",
      badgeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      cardBorder: "border-l-4 border-l-emerald-500/40",
    },
    PENDING: {
      badge: "รอยืนยัน...",
      badgeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      cardBorder: "border-l-4 border-l-amber-500/40",
    },
    UNPAID: {
      badge: "ยังไม่จ่าย",
      badgeClass: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      cardBorder: "border-l-4 border-l-rose-500/20",
    },
  }

  const cfg = statusConfig[item.status]

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${cfg.cardBorder}`}>
      {/* แถวหลัก — กดเพื่อขยาย/ซ่อนปุ่ม */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* ชื่อ + ยอด */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{item.displayName}</p>
          <p className="text-lg font-mono font-bold text-foreground mt-0.5">
            ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* สถานะ + ลูกศร */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`${cfg.badgeClass} text-xs font-semibold h-6 px-2`}>{cfg.badge}</Badge>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* ส่วนขยาย — ปุ่ม Action */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 bg-secondary/20 flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
          {/* ปุ่ม QR Code */}
          <button
            type="button"
            onClick={() => onViewQR(item.id)}
            className="
              flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
              bg-indigo-500/10 border border-indigo-500/25
              text-indigo-400 text-xs font-semibold
              hover:bg-indigo-500/20 active:scale-95 transition-all
            "
          >
            <QrCode className="h-4 w-4" />
            QR จ่ายเงิน
          </button>

          {/* ปุ่มอัปโหลดสลิป */}
          {item.status !== "PAID" && billStatus === "OPEN" && (
            <button
              type="button"
              onClick={() => onUploadSlip(item)}
              className="
                flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
                bg-emerald-500/10 border border-emerald-500/25
                text-emerald-400 text-xs font-semibold
                hover:bg-emerald-500/20 active:scale-95 transition-all
              "
            >
              <Upload className="h-4 w-4" />
              แนบสลิป
            </button>
          )}

          {/* ปุ่มดูสลิป */}
          {(item.status === "PAID" || item.status === "PENDING") && (
            <button
              type="button"
              onClick={() => onViewSlip(item.id)}
              className="
                flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
                bg-secondary border border-border
                text-muted-foreground text-xs font-semibold
                hover:bg-secondary/80 active:scale-95 transition-all
              "
            >
              <Eye className="h-4 w-4" />
              ดูสลิป
            </button>
          )}
        </div>
      )}
    </div>
  )
}
