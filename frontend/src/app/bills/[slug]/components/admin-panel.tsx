"use client"

import Link from "next/link"
import { BarChart3, Lock } from "lucide-react"

interface AdminPanelProps {
  slug: string
  billStatus: "OPEN" | "CLOSED"
  closingBill: boolean
  onCloseBill: () => Promise<void>
}

export function AdminPanel({
  slug,
  billStatus,
  closingBill,
  onCloseBill,
}: AdminPanelProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground/80 px-1">เครื่องมือจัดการ</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/bills/${slug}/summary`} className="block">
          <button
            type="button"
            className="
              w-full h-12 rounded-2xl border border-border
              bg-card flex items-center justify-center gap-2
              text-sm font-semibold text-foreground
              hover:border-indigo-500/40 hover:bg-secondary/50
              active:scale-[0.98] transition-all
            "
          >
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            ดูรายงาน
          </button>
        </Link>

        {billStatus === "OPEN" && (
          <button
            type="button"
            onClick={onCloseBill}
            disabled={closingBill}
            className="
              w-full h-12 rounded-2xl border border-rose-500/20
              bg-rose-500/8 flex items-center justify-center gap-2
              text-sm font-semibold text-rose-400
              hover:bg-rose-500/15 active:scale-[0.98] transition-all
              disabled:opacity-50
            "
          >
            <Lock className="h-4 w-4" />
            {closingBill ? "กำลังปิด..." : "ปิดบิล"}
          </button>
        )}
      </div>
    </div>
  )
}
