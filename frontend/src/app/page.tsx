"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Receipt, Plus, Search, Share2, FileCheck,
  ArrowRight, Clock, ChevronRight, Trash2
} from "lucide-react"
import { MainLayout } from "@/layout/main-layout"

// ============================================================
// ประเภทข้อมูลประวัติบิลล่าสุด
// ============================================================
interface RecentBill {
  slug: string
  title: string
  createdAt: string
  role: "creator" | "viewer"
}

export default function HomePage() {
  const [slug, setSlug] = useState("")
  const [recentBills, setRecentBills] = useState<RecentBill[]>([])

  // โหลดประวัติบิลจาก localStorage หลังเปิดหน้าเว็บ
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recent_bills")
      if (stored) {
        try {
          setRecentBills(JSON.parse(stored))
        } catch (e) {
          console.error("Failed to parse recent bills", e)
        }
      }
    }
  }, [])

  // นำทางไปหน้าบิลตาม slug ที่พิมพ์
  const handleSearch = () => {
    if (slug.trim()) {
      window.location.href = `/bills/${slug.trim()}`
    }
  }

  // ล้างประวัติบิลทั้งหมด
  const handleClearHistory = () => {
    localStorage.removeItem("recent_bills")
    setRecentBills([])
  }

  return (
    <MainLayout>

      {/* --- Hero Section (Compact Mobile) --- */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-indigo-400 bg-clip-text text-transparent">
          หารบิลกับเพื่อน
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          สร้าง QR Code พร้อมเพย์ และตรวจสอบสลิปอัตโนมัติ
        </p>
      </div>

      {/* --- Action Cards --- */}
      <div className="space-y-3">

        {/* การ์ด: สร้างบิลใหม่ */}
        <Link href="/create-bill" className="block">
          <div className="
            group flex items-center gap-4 p-4 rounded-2xl
            bg-gradient-to-r from-indigo-600 to-violet-600
            hover:from-indigo-500 hover:to-violet-500
            active:scale-[0.98] transition-all duration-200
            shadow-lg shadow-indigo-600/25
          ">
            <div className="bg-white/20 p-2.5 rounded-xl flex-shrink-0">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base">สร้างบิลใหม่</p>
              <p className="text-indigo-100/80 text-xs mt-0.5 truncate">
                ใส่ชื่อ เพื่อน และยอดเงิน แล้วแชร์ลิงก์
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-white/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </div>
        </Link>

        {/* การ์ด: ค้นหาบิลเดิมด้วยรหัส */}
        <div className="
          flex items-center gap-3 p-4 rounded-2xl
          bg-card border border-border
          shadow-sm
        ">
          <div className="bg-secondary p-2.5 rounded-xl flex-shrink-0">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm mb-2">ดูบิลเดิมด้วยรหัส</p>
            <div className="flex gap-2">
              <input
                id="slug-input"
                type="text"
                inputMode="text"
                placeholder="ใส่รหัสบิล เช่น 3a2c5f10"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                className="
                  flex-1 h-11 px-3 rounded-xl text-sm
                  bg-background border border-border
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
                  text-foreground placeholder:text-muted-foreground
                  transition-all outline-none
                "
              />
              <Button
                onClick={handleSearch}
                disabled={!slug.trim()}
                className="
                  h-11 px-4 rounded-xl
                  bg-indigo-600 hover:bg-indigo-500 text-white
                  disabled:opacity-40 transition-all
                  flex-shrink-0
                "
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- ประวัติบิลล่าสุด (Recent Bills) --- */}
      {recentBills.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              บิลล่าสุด
            </h2>
            <button
              onClick={handleClearHistory}
              className="
                flex items-center gap-1 text-xs text-muted-foreground
                hover:text-destructive transition-colors px-2 py-1 rounded-lg
                hover:bg-destructive/10 active:scale-95 min-h-8
              "
            >
              <Trash2 className="h-3 w-3" />
              ล้างประวัติ
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
            {recentBills.map((b) => (
              <Link
                key={b.slug}
                href={`/bills/${b.slug}`}
                className="
                  flex items-center gap-3 px-4 py-3.5
                  hover:bg-secondary/50 active:bg-secondary
                  transition-colors group
                "
              >
                {/* ไอคอนสถานะ creator / viewer */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${b.role === "creator"
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : "bg-secondary border border-border"}
                `}>
                  <Receipt className={`h-4 w-4 ${b.role === "creator" ? "text-indigo-400" : "text-muted-foreground"}`} />
                </div>

                {/* ข้อมูลบิล */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-indigo-400 transition-colors">
                    {b.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {b.slug} · {new Date(b.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.role === "creator" ? (
                    <Badge className="bg-indigo-500/10 border-indigo-500/25 text-indigo-400 text-[10px] h-5 px-1.5">
                      ผู้สร้าง
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary border-border text-muted-foreground text-[10px] h-5 px-1.5">
                      ผู้เข้าดู
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- วิธีใช้งาน (How It Works) --- */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground px-1">ใช้งานยังไง?</h2>
        <div className="space-y-2">
          {[
            { num: "1", icon: Receipt, title: "ใส่ข้อมูลบิล", desc: "ชื่อบิล เบอร์พร้อมเพย์ และรายชื่อเพื่อนพร้อมยอดเงิน" },
            { num: "2", icon: Share2, title: "แชร์ลิงก์ให้เพื่อน", desc: "เพื่อนแต่ละคนจะเห็นหน้าจ่ายเงินส่วนตัวของตัวเอง" },
            { num: "3", icon: FileCheck, title: "ตรวจสลิปอัตโนมัติ", desc: "เพื่อนสแกน QR และอัปโหลดสลิป ระบบจะตรวจสอบให้ทันที" },
          ].map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 p-4 bg-card border border-border rounded-2xl"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 font-black text-base">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <step.icon className="h-3.5 w-3.5 text-indigo-400" />
                  {step.title}
                </p>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </MainLayout>
  )
}
