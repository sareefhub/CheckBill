"use client"

import Link from "next/link"
import { Receipt } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// ============================================================
// Navbar — แถบเมนูด้านบน ใช้ร่วมกันทุกหน้า
// ============================================================
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* โลโก้ */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-indigo-500/15 p-1.5 rounded-lg border border-indigo-500/25">
            <Receipt className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-foreground to-indigo-400 bg-clip-text text-transparent">
            CheckBill
          </span>
        </Link>
        {/* ปุ่มสลับธีม */}
        <ThemeToggle />
      </div>
    </header>
  )
}
