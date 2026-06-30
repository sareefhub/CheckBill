"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Plus, Search, Sparkles, Share2, FileCheck, ArrowRight } from "lucide-react"

export default function HomePage() {
  const [slug, setSlug] = useState("")

  const handleSearch = () => {
    if (slug.trim()) {
      window.location.href = `/bills/${slug.trim()}`
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* เอฟเฟกต์แสงสะท้อนหลังสากล (Background Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* เนื้อหาหลัก */}
      <div className="container mx-auto px-4 py-16 max-w-5xl relative z-10 my-auto">
        
        {/* ส่วนหัวเว็บบอร์ด (Hero Section) */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-indigo-300 text-sm font-medium mb-4 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>ปรับปรุงระบบ API & UI แบบ Monolith เรียบร้อยแล้ว</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-indigo-600/20 p-4 rounded-3xl border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
              <Receipt className="h-14 w-14 text-indigo-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              CheckBill
            </h1>
          </div>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            หารบิลกับเพื่อนอย่างชาญฉลาดและรวดเร็ว พร้อมสร้าง QR Code และระบบตรวจสอบการโอนเงินอัตโนมัติ
          </p>
        </div>

        {/* ส่วนกล่องควบคุมหลัก (Main Action Cards) */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-20">
          
          {/* การ์ดสร้างบิลใหม่ */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-slate-200">
                <div className="bg-indigo-500/10 p-2 rounded-lg mr-3">
                  <Plus className="h-5 w-5 text-indigo-400" />
                </div>
                สร้างบิลใหม่
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                สร้างบิลค่าใช้จ่ายและเพิ่มรายชื่อเพื่อนสำหรับจ่ายเงินอย่างรวดเร็ว
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/create-bill">
                <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white shadow-lg shadow-indigo-600/20 rounded-xl transition-all duration-200">
                  เริ่มสร้างบิล <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* การ์ดค้นหาบิลเก่าด้วยรหัส */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-slate-200">
                <div className="bg-indigo-500/10 p-2 rounded-lg mr-3">
                  <Search className="h-5 w-5 text-indigo-400" />
                </div>
                ดูบิลเดิมที่มีอยู่
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                ระบุรหัส Slug ของบิลที่สร้างไว้แล้วเพื่อดูสถานะหรือทำการจ่ายเงิน
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="เช่น 3a2c5f10"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch()
                    }}
                    className="w-full h-12 pl-4 pr-12 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-base text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center transition-colors duration-200"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 pl-1">พิมพ์รหัสแล้วกดปุ่มค้นหาหรือกด Enter เพื่อไปต่อ</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ส่วนคำแนะนำการใช้งาน (How It Works) */}
        <div className="text-center space-y-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            ขั้นตอนการใช้ระบบ
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            
            {/* สเต็ปที่ 1 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl relative">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2 text-lg flex items-center justify-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-400" /> ใส่ข้อมูลบิล
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                กรอกชื่อบิล เบอร์พร้อมเพย์ของคุณ และใส่ชื่อพร้อมยอดเงินของเพื่อนแต่ละคน
              </p>
            </div>

            {/* สเต็ปที่ 2 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl relative">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2 text-lg flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4 text-indigo-400" /> แชร์ลิงก์
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                คัดลอกลิงก์ของบิลนั้นแล้วแชร์ให้เพื่อนๆ เพื่อนทุกคนจะเห็นหน้าจอจ่ายเงินส่วนตัว
              </p>
            </div>

            {/* สเต็ปที่ 3 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl relative">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2 text-lg flex items-center justify-center gap-2">
                <FileCheck className="h-4 w-4 text-indigo-400" /> ตรวจสอบสลิปอัตโนมัติ
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                เพื่อนสแกน QR และอัปโหลดรูปสลิป ระบบจะตรวจสอบยอดเงินให้อัตโนมัติและเปลี่ยนสถานะทันที
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ส่วนท้าย (Footer) */}
      <footer className="w-full text-center py-6 text-slate-600 text-xs border-t border-slate-900">
        © 2026 CheckBill Utility. Built for modern split-bills.
      </footer>
    </div>
  )
}
