"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { billApi, paymentApi, uploadSlip } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, QrCode, Lock, Unlock, BarChart3, Upload } from "lucide-react"
import QRCode from "qrcode"

interface BillItem {
  id: number
  displayName: string
  amount: number
  status: "PAID" | "PENDING" | "UNPAID"
  referenceCode?: string
}

interface Bill {
  id: number
  title: string
  publicSlug: string
  status: "OPEN" | "CLOSED"
  payeePromptPayId: string
  items: BillItem[]
}

export default function ViewBillPage() {
  const { slug } = useParams<{ slug: string }>()
  const { toast } = useToast()
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrDialog, setQrDialog] = useState<{ open: boolean; data?: any; qrImage?: string; loading?: boolean }>({ open: false })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item?: BillItem; loading?: boolean }>({ open: false })
  const [closingBill, setClosingBill] = useState(false)

  useEffect(() => { if (slug) fetchBill() }, [slug])
  const fetchBill = async () => {
    try { setBill(await billApi.getBill(slug)) }
    catch { toast({ title: "ผิดพลาด", description: "โหลดบิลไม่สำเร็จ", variant: "destructive" }) }
    finally { setLoading(false) }
  }

  const handleViewQR = async (id: number) => {
    setQrDialog({ open: true, loading: true })
    try {
      const data = await billApi.getItemQR(slug, id)
      const qrImage = await QRCode.toDataURL(data.promptpayPayload)
      setQrDialog({ open: true, data, qrImage })
    } catch {
      toast({ title: "ผิดพลาด", description: "โหลด QR ไม่สำเร็จ", variant: "destructive" })
      setQrDialog({ open: false })
    }
  }

  const handleUploadSlip = (item: BillItem) => setUploadDialog({ open: true, item })

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("slipFile") as File
    const bankRef = formData.get("bankRef") as string
    const amt = formData.get("detectedAmount") as string
    if (!file || !bankRef || !amt) return toast({ title: "ผิดพลาด", description: "กรอกข้อมูลไม่ครบ", variant: "destructive" })

    setUploadDialog(d => ({ ...d, loading: true }))
    try {
      await paymentApi.createPayment({
        billItemId: uploadDialog.item!.id,
        slipUrl: await uploadSlip(file),
        bankRef,
        detectedAmount: parseFloat(amt)
      })
      toast({ title: "สำเร็จ!", description: "อัปโหลดสลิปแล้ว" })
      setUploadDialog({ open: false })
      fetchBill()
    } catch {
      toast({ title: "ผิดพลาด", description: "อัปโหลดไม่สำเร็จ", variant: "destructive" })
    }
  }

  const handleCloseBill = async () => {
    setClosingBill(true)
    try {
      await billApi.closeBill(slug)
      toast({ title: "สำเร็จ!", description: "ปิดบิลแล้ว" })
      fetchBill()
    } catch {
      toast({ title: "ผิดพลาด", description: "ปิดบิลไม่สำเร็จ", variant: "destructive" })
    } finally {
      setClosingBill(false)
    }
  }

  const badge = (s: BillItem["status"]) =>
    s === "PAID" ? <Badge className="bg-green-100 text-green-800">จ่ายแล้ว</Badge> :
    s === "PENDING" ? <Badge variant="secondary">รอการยืนยัน</Badge> :
    <Badge variant="outline">ยังไม่จ่าย</Badge>

  const total = bill?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const paid = bill?.items.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0) ?? 0

  if (loading) return <p className="text-center mt-10">กำลังโหลดข้อมูลบิล...</p>
  if (!bill) return <p className="text-center mt-10">ไม่พบบิล</p>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />กลับ</Button></Link>
        <h1 className="text-3xl font-bold">{bill.title}</h1>
        {bill.status === "OPEN"
          ? <Badge className="bg-green-100 text-green-800"><Unlock className="h-3 w-3 mr-1" />เปิดอยู่</Badge>
          : <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />ปิดแล้ว</Badge>}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card><CardHeader><CardTitle>การชำระเงิน</CardTitle></CardHeader>
          <CardContent>
            <p>พร้อมเพย์: {bill.payeePromptPayId}</p>
            <p>ยอดรวม: ฿{total.toLocaleString()}</p>
            <p>จ่ายแล้ว: ฿{paid.toLocaleString()}</p>
            <p>คงเหลือ: ฿{(total - paid).toLocaleString()}</p>
          </CardContent></Card>
        <Card><CardHeader><CardTitle>จัดการบิล</CardTitle></CardHeader>
          <CardContent>
            <Link href={`/bills/${slug}/summary`}><Button variant="outline" className="w-full"><BarChart3 className="h-4 w-4 mr-2" />สรุปบิล</Button></Link>
            {bill.status === "OPEN" &&
              <Button variant="destructive" className="w-full mt-2" onClick={handleCloseBill} disabled={closingBill}>
                <Lock className="h-4 w-4 mr-2" />ปิดบิล
              </Button>}
          </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>ผู้ร่วมจ่าย</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow>
            <TableHead>ชื่อ</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead>สถานะ</TableHead>
            <TableHead>รหัสอ้างอิง</TableHead><TableHead>QR</TableHead><TableHead>สลิป</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {bill.items.map(i => (
              <TableRow key={i.id}>
                <TableCell>{i.displayName}</TableCell>
                <TableCell className="text-right">฿{i.amount.toLocaleString()}</TableCell>
                <TableCell>{badge(i.status)}</TableCell>
                <TableCell>{i.referenceCode ?? "-"}</TableCell>
                <TableCell><Button size="sm" onClick={() => handleViewQR(i.id)}><QrCode className="h-4 w-4" /></Button></TableCell>
                <TableCell>
                  {i.status !== "PAID" && <Button size="sm" onClick={() => handleUploadSlip(i)}><Upload className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card>

      <Dialog open={qrDialog.open} onOpenChange={o => setQrDialog({ ...qrDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR สำหรับจ่ายเงิน</DialogTitle>
            <DialogDescription>สแกนเพื่อชำระเงิน</DialogDescription>
          </DialogHeader>
          {qrDialog.loading
            ? <p>กำลังโหลด...</p>
            : qrDialog.qrImage && <img src={qrDialog.qrImage} className="h-64 w-64 mx-auto" />}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialog.open} onOpenChange={o => setUploadDialog({ ...uploadDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>อัปโหลดสลิป {uploadDialog.item?.displayName}</DialogTitle></DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-2">
            <Input id="slipFile" name="slipFile" type="file" accept="image/*" required />
            <Input id="bankRef" name="bankRef" placeholder="Ref" required />
            <Input id="detectedAmount" name="detectedAmount" type="number" step="0.01" defaultValue={uploadDialog.item?.amount} required />
            <Button type="submit" disabled={uploadDialog.loading}>อัปโหลด</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
