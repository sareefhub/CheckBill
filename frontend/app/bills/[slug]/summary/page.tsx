"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// ---------- Types ----------
interface BillItem {
  id: number
  displayName: string
  amount: number
  status: "PAID" | "UNPAID" | "PENDING"
  referenceCode?: string
}

interface Bill {
  id: number
  title: string
  publicSlug: string
  payeePromptPayId: string
  currency: string
  createdAt: string
  closeAt?: string | null
  items: BillItem[]
}

export default function BillSummaryPage() {
  const params = useParams()
  const { toast } = useToast()
  const slug = params.slug as string

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchSummary()
    }
  }, [slug])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const data: Bill = await billApi.getBillSummary(slug)
      setBill(data)
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดสรุปบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดสรุปบิล...</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">ไม่พบข้อมูล</h1>
          <Link href={`/bills/${slug}`}>
            <Button>กลับไปดูบิล</Button>
          </Link>
        </div>
      </div>
    )
  }

  // --- Process summary ---
  const totalItems = bill.items.length
  const paid = bill.items.filter((i) => i.status === "PAID")
  const unpaid = bill.items.filter((i) => i.status !== "PAID")
  const paidAmount = paid.reduce((sum, i) => sum + i.amount, 0)
  const unpaidAmount = unpaid.reduce((sum, i) => sum + i.amount, 0)
  const totalAmount = paidAmount + unpaidAmount

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/bills/${slug}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปดูบิล
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">สรุปบิล: {bill.title}</h1>
            <p className="text-muted-foreground mt-1">ภาพรวมการชำระเงินของทุกคน</p>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center"><CardContent className="pt-6"><div className="text-2xl font-bold">{totalItems}</div><p>ทั้งหมด</p></CardContent></Card>
            <Card className="text-center"><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{paid.length}</div><p>จ่ายแล้ว</p></CardContent></Card>
            <Card className="text-center"><CardContent className="pt-6"><div className="text-2xl font-bold text-orange-600">{unpaid.length}</div><p>ยังไม่จ่าย</p></CardContent></Card>
            <Card className="text-center"><CardContent className="pt-6"><div className="text-2xl font-bold">฿{totalAmount.toLocaleString()}</div><p>ยอดรวม</p></CardContent></Card>
          </div>

          {/* Paid list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-2"/>จ่ายแล้ว ({paid.length})</CardTitle>
              <CardDescription>รายการที่จ่ายเงินแล้ว</CardDescription>
            </CardHeader>
            <CardContent>
              {paid.length ? paid.map((i) => (
                <div key={i.id} className="flex justify-between p-2 bg-green-50 rounded mb-2">
                  <span>{i.displayName} {i.referenceCode && <span className="text-sm text-muted-foreground">({i.referenceCode})</span>}</span>
                  <span className="font-semibold">฿{i.amount}</span>
                </div>
              )) : <p className="text-muted-foreground">ยังไม่มีคนจ่าย</p>}
            </CardContent>
          </Card>

          {/* Unpaid list */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600"><Clock className="h-5 w-5 mr-2"/>ยังไม่จ่าย ({unpaid.length})</CardTitle>
              <CardDescription>รอการชำระเงิน</CardDescription>
            </CardHeader>
            <CardContent>
              {unpaid.length ? unpaid.map((i) => (
                <div key={i.id} className="flex justify-between p-2 bg-orange-50 rounded mb-2">
                  <span>{i.displayName}</span>
                  <span className="font-semibold">฿{i.amount}</span>
                </div>
              )) : <p className="text-green-600">ทุกคนจ่ายครบแล้ว!</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
