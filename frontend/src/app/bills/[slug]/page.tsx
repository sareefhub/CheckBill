"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { billApi, paymentApi, uploadSlip } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, QrCode, Lock, Unlock, BarChart3, 
  Upload, Copy, Check, Eye, RefreshCw, FileText, Image as ImageIcon 
} from "lucide-react"
import QRCode from "qrcode"

// กำหนดโครงสร้างข้อมูล Interfaces
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

interface PaymentHistory {
  id: string
  slipUrl: string
  bankRef: string
  detectedAmount: number
  status: string
  createdAt: string
}

export default function ViewBillPage() {
  const { slug } = useParams<{ slug: string }>()
  const { toast } = useToast()
  
  // สถานะแอปพลิเคชัน
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [closingBill, setClosingBill] = useState(false)
  
  // ควบคุมโมดัลป๊อปอัพต่างๆ
  const [qrDialog, setQrDialog] = useState<{ open: boolean; data?: any; qrImage?: string; loading?: boolean }>({ open: false })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item?: BillItem; loading?: boolean }>({ open: false })
  const [slipPreviewDialog, setSlipPreviewDialog] = useState<{ open: boolean; slipUrl?: string; bankRef?: string; amount?: number; loading?: boolean }>({ open: false })
  
  // สถานะเกี่ยวกับการอัปโหลดและ Mock สแกนสลิป
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [mockingScan, setMockingScan] = useState(false)
  const [detectedAmount, setDetectedAmount] = useState("")
  const [bankRef, setBankRef] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (slug) fetchBill()
  }, [slug])

  // โหลดข้อมูลบิลใหม่จาก Backend
  const fetchBill = async () => {
    try {
      setBill(await billApi.getBill(slug))
    } catch {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันคัดลอกลิงก์แชร์ลงคลิปบอร์ด
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast({
      title: "คัดลอกลิงก์สำเร็จ!",
      description: "ส่งลิงก์นี้ให้เพื่อนเข้ามาร่วมจ่ายเงินได้เลย",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // ฟังก์ชันเปิดดู QR Code
  const handleViewQR = async (id: number) => {
    setQrDialog({ open: true, loading: true })
    try {
      const data = await billApi.getItemQR(slug, id)
      // ใช้ qrcode Library แปลง Payload เป็น Base64 Image
      const qrImage = await QRCode.toDataURL(data.promptpayPayload)
      setQrDialog({ open: true, data, qrImage })
    } catch {
      toast({
        title: "ผิดพลาด",
        description: "โหลด QR Code สำหรับพร้อมเพย์ไม่สำเร็จ",
        variant: "destructive",
      })
      setQrDialog({ open: false })
    }
  }

  // ฟังก์ชันเปิดโมดัลอัปโหลดสลิป
  const handleUploadSlipOpen = (item: BillItem) => {
    setSelectedFile(null)
    setFilePreview(null)
    setDetectedAmount("")
    setBankRef("")
    setUploadDialog({ open: true, item, loading: false })
  }

  // ควบคุมการเลือกไฟล์รูปภาพ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // ฟังก์ชันจำลองการสแกนสลิปอัจฉริยะ (Mock OCR Scan)
  const handleMockScan = () => {
    if (!selectedFile) {
      toast({
        title: "ไม่พบไฟล์",
        description: "กรุณาเลือกไฟล์สลิปก่อนกดปุ่มสแกนนะครับ",
        variant: "destructive",
      })
      return
    }

    setMockingScan(true)
    
    // จำลองการดึงยอดเงินและสร้างรหัสอ้างอิงของธนาคาร
    setTimeout(() => {
      const mockRef = "TRN" + Math.floor(1000000000 + Math.random() * 9000000000).toString()
      const itemAmount = uploadDialog.item?.amount || 0
      
      setBankRef(mockRef)
      setDetectedAmount(itemAmount.toString())
      setMockingScan(false)
      
      toast({
        title: "สแกนสำเร็จ (จำลอง)!",
        description: "ระบบสแกนข้อมูลจากรูปสลิปและกรอกฟิลด์ให้อัตโนมัติ",
      })
    }, 1500)
  }

  // ส่งข้อมูลชำระเงิน/สลิปไปยัง Backend API
  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      return toast({ title: "เกิดข้อผิดพลาด", description: "กรุณาแนบไฟล์สลิป", variant: "destructive" })
    }
    if (!bankRef || !detectedAmount) {
      return toast({ title: "เกิดข้อผิดพลาด", description: "กรุณากรอกรหัสอ้างอิงและจำนวนเงิน หรือใช้ระบบสแกน", variant: "destructive" })
    }

    setUploadDialog(d => ({ ...d, loading: true }))
    try {
      // 1. อัปโหลดไฟล์ภาพสลิปไปยังเซิร์ฟเวอร์
      const uploadedUrl = await uploadSlip(selectedFile)

      // 2. ส่งข้อมูลบันทึก Payment
      await paymentApi.createPayment({
        billItemId: uploadDialog.item!.id,
        slipUrl: uploadedUrl,
        bankRef: bankRef,
        detectedAmount: parseFloat(detectedAmount)
      })

      toast({ 
        title: "อัปโหลดสลิปเรียบร้อย!", 
        description: "ระบบตรวจสอบความถูกต้องสำเร็จ ยอดเงินถูกต้อง",
      })
      setUploadDialog({ open: false })
      fetchBill()
    } catch (err: any) {
      console.error(err)
      toast({ 
        title: "อัปโหลดล้มเหลว", 
        description: "เกิดข้อผิดพลาดในการแนบสลิป: " + err.message, 
        variant: "destructive" 
      })
      setUploadDialog(d => ({ ...d, loading: false }))
    }
  }

  // ฟังก์ชันดูรูปสลิปที่จ่ายเงินเข้ามาแล้ว
  const handleViewSlip = async (itemId: number) => {
    setSlipPreviewDialog({ open: true, loading: true })
    try {
      // ดึงรายการจ่ายเงินล่าสุดของไอเทมย่อย
      const response = await paymentApi.getPaymentByItem(itemId)
      if (response && response.length > 0) {
        // ดึงสลิปตัวล่าสุด
        const latestPayment: PaymentHistory = response[0]
        setSlipPreviewDialog({
          open: true,
          slipUrl: latestPayment.slipUrl,
          bankRef: latestPayment.bankRef,
          amount: latestPayment.detectedAmount,
          loading: false
        })
      } else {
        toast({ title: "ไม่พบข้อมูล", description: "ไม่พบรูปสลิปที่แนบมากับรายการนี้", variant: "destructive" })
        setSlipPreviewDialog({ open: false })
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถดึงภาพสลิปได้", variant: "destructive" })
      setSlipPreviewDialog({ open: false })
    }
  }

  // ฟังก์ชันปิดการเรียกเก็บเงินของบิลนี้
  const handleCloseBill = async () => {
    setClosingBill(true)
    try {
      await billApi.closeBill(slug)
      toast({ title: "บิลปิดแล้ว!", description: "ปิดบิลเรียกเก็บเงินเรียบร้อยแล้ว" })
      fetchBill()
    } catch {
      toast({ title: "ผิดพลาด", description: "ปิดบิลไม่สำเร็จ", variant: "destructive" })
    } finally {
      setClosingBill(false)
    }
  }

  // จัดการ badge แสดงสถานะของเพื่อนร่วมบิล
  const renderStatusBadge = (status: BillItem["status"]) => {
    if (status === "PAID") {
      return <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">จ่ายแล้ว</Badge>
    }
    if (status === "PENDING") {
      return <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">รอการยืนยัน</Badge>
    }
    return <Badge className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20">ยังไม่จ่าย</Badge>
  }

  // คำนวณสรุปยอดเงิน
  const total = bill?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const paid = bill?.items.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0) ?? 0
  const progressPercent = total > 0 ? Math.round((paid / total) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse text-lg">กำลังโหลดข้อมูลบิล...</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">ไม่พบบิลที่คุณระบุในระบบ</h2>
          <Link href="/"><Button className="bg-indigo-600 hover:bg-indigo-500">กลับไปหน้าแรก</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 relative overflow-hidden pb-12">
      {/* แสงสปอตไลท์ตกแต่งพื้นหลัง */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* ส่วนหัวหน้าจอ (Header) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="h-10 text-slate-400 hover:text-white hover:bg-slate-900 px-3 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">{bill.title}</h1>
              <p className="text-slate-500 text-xs mt-1">รหัสบิล: {bill.publicSlug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            {bill.status === "OPEN" ? (
              <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Unlock className="h-3 w-3" /> เปิดให้โอน
              </Badge>
            ) : (
              <Badge className="bg-slate-800 border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="h-3 w-3" /> ปิดบิลแล้ว
              </Badge>
            )}
            
            {/* ปุ่มคัดลอกลิงก์แชร์ด่วน */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 bg-slate-800/30 border-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? "คัดลอกแล้ว" : "แชร์บิล"}
            </Button>
          </div>
        </div>

        {/* แถบแถบความคืบหน้าการโอนเงิน (Progress Bar) */}
        <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl mb-8 space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">ความคืบหน้าการเก็บเงิน</span>
            <span className="text-indigo-400">{progressPercent}% ({paid.toLocaleString()} / {total.toLocaleString()} บาท)</span>
          </div>
          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800/50">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ส่วนกล่องข้อมูลและการบริหารจัดการ (Stats & Actions) */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* การ์ดรายงานสถานะการเงิน */}
          <Card className="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-base text-slate-200">รายละเอียดการชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-sm font-medium text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">บัญชีพร้อมเพย์รับเงิน:</span>
                <span className="font-mono text-slate-100">{bill.payeePromptPayId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดเงินบิลรวมทั้งหมด:</span>
                <span className="text-slate-100 font-semibold">฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ได้รับเงินแล้ว:</span>
                <span className="text-emerald-400 font-semibold">฿{paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2.5 font-bold">
                <span className="text-slate-400">คงเหลือต้องโอนอีก:</span>
                <span className="text-indigo-400">฿{(total - paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          {/* การ์ดสำหรับผู้สร้างในการควบคุมบิล */}
          <Card className="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-base text-slate-200">เครื่องมือจัดการบิล</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 flex-1 flex flex-col justify-center">
              <Link href={`/bills/${slug}/summary`} className="w-full">
                <Button variant="outline" className="w-full h-11 bg-slate-800/20 border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl">
                  <BarChart3 className="h-4 w-4 mr-2 text-indigo-400" /> ดูรายงานสรุปบิล
                </Button>
              </Link>
              {bill.status === "OPEN" && (
                <Button 
                  variant="destructive" 
                  className="w-full h-11 bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 rounded-xl transition-all" 
                  onClick={handleCloseBill} 
                  disabled={closingBill}
                >
                  <Lock className="h-4 w-4 mr-2" /> ปิดบิลเรียกเก็บเงิน
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ตารางรายชื่อผู้ร่วมบิล (Participants Table) */}
        <Card className="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="text-base text-slate-200">รายชื่อผู้จ่ายเงินทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/40 border-b border-slate-800/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold h-11">ชื่อผู้ร่วมบิล</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-right h-11">ยอดที่ต้องจ่าย</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center h-11">สถานะ</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center h-11">รับ QR Code</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center h-11">อัปโหลดสลิป</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center h-11">ดูสลิป</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((i) => (
                  <TableRow key={i.id} className="border-slate-800 hover:bg-slate-800/10">
                    <TableCell className="font-semibold text-slate-200 py-3.5">{i.displayName}</TableCell>
                    <TableCell className="text-right font-mono py-3.5">฿{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center py-3.5">{renderStatusBadge(i.status)}</TableCell>
                    
                    {/* ปุ่มสแกน QR Code เพื่อจ่ายเงิน */}
                    <TableCell className="text-center py-3.5">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleViewQR(i.id)}
                        className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TableCell>

                    {/* ปุ่มอัปโหลดสลิป */}
                    <TableCell className="text-center py-3.5">
                      {i.status !== "PAID" && bill.status === "OPEN" ? (
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleUploadSlipOpen(i)}
                          className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      ) : "-"}
                    </TableCell>

                    {/* ปุ่มดูสลิปที่อัปโหลดไปแล้ว */}
                    <TableCell className="text-center py-3.5">
                      {i.status === "PAID" || i.status === "PENDING" ? (
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleViewSlip(i.id)}
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

      {/* 1. โมดัลป๊อปอัพ QR Code พร้อมเพย์ */}
      <Dialog open={qrDialog.open} onOpenChange={(o) => setQrDialog({ ...qrDialog, open: o })}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-400" /> QR Code สำหรับจ่ายเงิน
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              เพื่อนสามารถเปิดแอปธนาคารสแกนยอดพร้อมรหัสอ้างอิงตรงนี้ได้ทันทีครับ
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4">
            {qrDialog.loading ? (
              <p className="text-slate-400 animate-pulse text-sm py-8">กำลังสร้างภาพ QR Code...</p>
            ) : (
              qrDialog.qrImage && (
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                  <img src={qrDialog.qrImage} alt="PromptPay QR Code" className="h-56 w-56 mx-auto" />
                </div>
              )
            )}
            
            {qrDialog.data && (
              <div className="w-full mt-5 bg-slate-950 p-3.5 border border-slate-800 rounded-xl text-xs space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้รับเงิน:</span>
                  <span className="text-slate-200">{bill.payeePromptPayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">จำนวนเงิน:</span>
                  <span className="text-emerald-400 font-bold">฿{qrDialog.data.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2 font-mono">
                  <span className="text-slate-500">รหัสอ้างอิง:</span>
                  <span className="text-slate-300 text-[10px] break-all">{qrDialog.data.referenceCode}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. โมดัลอัปโหลดสลิปและระบบ Mock OCR Scan */}
      <Dialog open={uploadDialog.open} onOpenChange={(o) => setUploadDialog({ ...uploadDialog, open: o })}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-400" /> ยืนยันการจ่ายเงิน ({uploadDialog.item?.displayName})
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              อัปโหลดรูปภาพสลิปที่โอน และตรวจสอบข้อมูลให้ถูกต้องเพื่อปรับสถานะเป็นจ่ายแล้ว
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
            
            {/* พื้นที่เลือกและอัปโหลดรูปภาพสลิป */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-300">แนบรูปภาพสลิป</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 p-6 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                  className="hidden"
                />
                
                {filePreview ? (
                  <div className="relative w-full max-h-[160px] overflow-hidden rounded-lg flex items-center justify-center">
                    <img src={filePreview} alt="Slip preview" className="object-contain max-h-[160px]" />
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-slate-600" />
                    <span className="text-xs text-slate-500">คลิกที่นี่เพื่อเปิดแกลเลอรีรูปภาพ</span>
                  </>
                )}
              </div>
            </div>

            {/* ปุ่มช่วยสแกนจำลอง (Mock Scan) */}
            {selectedFile && (
              <Button
                type="button"
                onClick={handleMockScan}
                disabled={mockingScan}
                className="w-full h-10 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${mockingScan ? 'animate-spin' : ''}`} />
                {mockingScan ? "ระบบกำลังสแกนหาข้อความในสลิป..." : "จำลองการสแกนสลิป (สแกนกรอกฟิลด์ด่วน)"}
              </Button>
            )}

            {/* ฟิลด์ รหัสอ้างอิง และ ยอดเงินสแกนได้ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankRef" className="text-xs font-semibold text-slate-400">รหัสอ้างอิงสลิป (Ref)</Label>
                <Input 
                  id="bankRef" 
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="เช่น Ref ID" 
                  required 
                  className="h-10 bg-slate-950 border-slate-800 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detectedAmount" className="text-xs font-semibold text-slate-400">ยอดเงินโอน (บาท)</Label>
                <Input 
                  id="detectedAmount" 
                  type="number" 
                  step="0.01" 
                  value={detectedAmount}
                  onChange={(e) => setDetectedAmount(e.target.value)}
                  placeholder="0.00" 
                  required 
                  className="h-10 bg-slate-950 border-slate-800 text-sm font-mono"
                />
              </div>
            </div>

            {/* ปุ่มยื่นหลักฐาน */}
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/10 transition-all duration-200 mt-2"
              disabled={uploadDialog.loading}
            >
              {uploadDialog.loading ? "กำลังบันทึกข้อมูลสลิป..." : "ยืนยันการชำระเงิน"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. โมดัลแสดงพรีวิวรูปสลิปของเพื่อนที่จ่ายเงินแล้ว */}
      <Dialog open={slipPreviewDialog.open} onOpenChange={(o) => setSlipPreviewDialog({ ...slipPreviewDialog, open: o })}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" /> สลิปหลักฐานการชำระเงิน
            </DialogTitle>
          </DialogHeader>

          <div className="p-2 space-y-4">
            {slipPreviewDialog.loading ? (
              <p className="text-slate-400 animate-pulse text-sm text-center py-12">กำลังดึงข้อมูลรูปสลิป...</p>
            ) : (
              <>
                {slipPreviewDialog.slipUrl && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center max-h-[280px]">
                    <img 
                      src={slipPreviewDialog.slipUrl} 
                      alt="Payment Slip" 
                      className="object-contain max-h-[260px] rounded-lg"
                    />
                  </div>
                )}

                <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">สถานะ:</span>
                    <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 h-5">อนุมัติเรียบร้อย</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ยอดเงินในสลิป:</span>
                    <span className="text-emerald-400 font-bold">฿{slipPreviewDialog.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">รหัสทำรายการ:</span>
                    <span className="text-slate-300">{slipPreviewDialog.bankRef}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
