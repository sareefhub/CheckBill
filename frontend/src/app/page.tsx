"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Plus, List } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Receipt className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">CheckBill</h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ระบบแบ่งจ่ายบิลอย่างง่าย พร้อม QR Code และการอัปโหลดสลิป
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <Plus className="h-6 w-6 mr-3 text-primary" />
                สร้างบิลใหม่
              </CardTitle>
              <CardDescription className="text-base">สร้างบิลใหม่และเพิ่มรายการผู้ร่วมจ่าย</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create-bill">
                <Button className="w-full h-12 text-base font-medium">เริ่มสร้างบิล</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <List className="h-6 w-6 mr-3 text-primary" />
                ดูบิลที่มีอยู่
              </CardTitle>
              <CardDescription className="text-base">เข้าดูบิลที่สร้างไว้แล้วด้วย slug</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ใส่ slug ของบิล"
                  className="w-full px-4 py-3 border border-input rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      window.location.href = `/bills/${e.currentTarget.value}`
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">กด Enter เพื่อไปยังบิล</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">วิธีใช้งาน</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">สร้างบิล</h3>
              <p className="text-muted-foreground leading-relaxed">ใส่ชื่อบิล เบอร์พร้อมเพย์ และรายการผู้ร่วมจ่าย</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">แชร์ลิงก์</h3>
              <p className="text-muted-foreground leading-relaxed">แชร์ลิงก์บิลให้เพื่อนเพื่อดู QR Code และจ่ายเงิน</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">อัปโหลดสลิป</h3>
              <p className="text-muted-foreground leading-relaxed">อัปโหลดสลิปการโอนเงินเพื่อยืนยันการจ่าย</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
