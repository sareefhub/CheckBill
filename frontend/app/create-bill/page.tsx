"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { billApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// type สำหรับ item
type BillItem = {
  name: string
  amount: string
}

export default function CreateBillPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [billData, setBillData] = useState<{
    title: string
    payeePromptPayId: string
    items: BillItem[]
  }>({
    title: "",
    payeePromptPayId: "",
    items: [{ name: "", amount: "" }],
  })

  const addItem = () => {
    setBillData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", amount: "" }],
    }))
  }

  const removeItem = (index: number) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validate form
      if (!billData.title.trim()) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาใส่ชื่อบิล",
          variant: "destructive",
        })
        return
      }

      if (!billData.payeePromptPayId.trim()) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาใส่เบอร์พร้อมเพย์",
          variant: "destructive",
        })
        return
      }

      // Validate items
      const validItems = billData.items.filter(
        (item) =>
          item.name.trim() &&
          item.amount.trim() &&
          !isNaN(Number.parseFloat(item.amount))
      )

      if (validItems.length === 0) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาใส่รายการอย่างน้อย 1 รายการ",
          variant: "destructive",
        })
        return
      }

      // Prepare data for API (แก้เป็น displayName)
      const apiData = {
        title: billData.title.trim(),
        payeePromptPayId: billData.payeePromptPayId.trim(),
        items: validItems.map((item) => ({
          displayName: item.name.trim(),   // ✅ ตรงกับ backend DTO
          amount: Number(item.amount),
        })),
      }

      console.log("👉 ส่งไป backend:", apiData)

      const response = await billApi.createBill(apiData)

      toast({
        title: "สำเร็จ!",
        description: "สร้างบิลเรียบร้อยแล้ว",
      })

      // Redirect
      router.push(`/bills/${response.publicSlug}`)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "ไม่สามารถสร้างบิลได้"
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> กลับหน้าหลัก
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">สร้างบิลใหม่</h1>
            <p className="text-muted-foreground mt-3 text-base md:text-lg">
              กรอกข้อมูลบิลและรายการผู้ร่วมจ่าย
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">ข้อมูลบิล</CardTitle>
              <CardDescription className="text-base">
                ใส่ชื่อบิลและเบอร์พร้อมเพย์สำหรับรับเงิน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="title"
                    className="text-base font-medium"
                  >
                    ชื่อบิล
                  </Label>
                  <Input
                    id="title"
                    placeholder="เช่น ค่าอาหารเที่ยงวันนี้"
                    value={billData.title}
                    onChange={(e) =>
                      setBillData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="promptpay"
                    className="text-base font-medium"
                  >
                    เบอร์พร้อมเพย์
                  </Label>
                  <Input
                    id="promptpay"
                    placeholder="0812345678"
                    value={billData.payeePromptPayId}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        payeePromptPayId: e.target.value,
                      }))
                    }
                    required
                    className="h-12 text-base font-mono"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      รายการผู้ร่วมจ่าย
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="h-10 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" /> เพิ่มรายการ
                    </Button>
                  </div>

                  {billData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-3 items-end"
                    >
                      <div className="flex-1 w-full">
                        <Label
                          htmlFor={`name-${index}`}
                          className="text-sm font-medium"
                        >
                          ชื่อผู้จ่าย
                        </Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="ชื่อ"
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          className="h-11 text-base mt-1"
                        />
                      </div>

                      <div className="w-full sm:w-32">
                        <Label
                          htmlFor={`amount-${index}`}
                          className="text-sm font-medium"
                        >
                          จำนวนเงิน
                        </Label>
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(index, "amount", e.target.value)
                          }
                          className="h-11 text-base mt-1"
                        />
                      </div>

                      {billData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-11 w-11 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? "กำลังสร้างบิล..." : "สร้างบิล"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
