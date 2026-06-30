"use client"

import Link from "next/link"
import { Receipt } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// ============================================================
// Navbar — แถบเมนูด้านบน ใช้ร่วมกันทุกหน้า
// ============================================================
export function Navbar() {
  return (
    <header className="
      sticky top-0 z-50 w-full 
      bg-background/60 backdrop-blur-xl 
      border-b border-border/40 
      transition-colors duration-300
    ">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* ส่วนแสดงโลโก้พร้อมเอฟเฟกต์ hover หมุนและย่อขยายแบบนุ่มนวล */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="
            bg-indigo-500/10 p-1.5 rounded-xl 
            border border-indigo-500/20 
            group-hover:bg-indigo-500/20 group-hover:scale-105 group-hover:rotate-6
            transition-all duration-300 ease-out
          ">
            <Receipt className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
          </div>
          <span className="
            text-lg font-black tracking-tight 
            bg-gradient-to-r from-foreground via-foreground to-indigo-400 
            bg-clip-text text-transparent
            group-hover:to-indigo-300 transition-all duration-300
          ">
            CheckBill
          </span>
        </Link>
        {/* ปุ่มสำหรับเปลี่ยนโหมดธีมดาร์ก/ไลท์ */}
        <ThemeToggle />
      </div>
    </header>
  )
}
