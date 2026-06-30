"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { billApi, paymentApi, uploadSlip } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, QrCode, Lock, Unlock, BarChart3,
  Upload, Copy, Check, Eye, RefreshCw, FileText,
  Image as ImageIcon, ChevronDown, ChevronUp
} from "lucide-react"
import QRCode from "qrcode"
import { ThemeToggle } from "@/components/theme-toggle"
import { MainLayout } from "@/layout/main-layout"

// ============================================================
// Interfaces
// ============================================================
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

// ============================================================
// Component: BillItemCard — Card แต่ละคนในบิล
// ============================================================
function BillItemCard({
  item,
  billStatus,
  onViewQR,
  onUploadSlip,
  onViewSlip,
}: {
  item: BillItem
  billStatus: "OPEN" | "CLOSED"
  onViewQR: (id: number) => void
  onUploadSlip: (item: BillItem) => void
  onViewSlip: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // กำหนด badge และสีตามสถานะ
  const statusConfig = {
    PAID: {
      badge: "จ่ายแล้ว ✓",
      badgeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      cardBorder: "border-l-4 border-l-emerald-500/40",
    },
    PENDING: {
      badge: "รอยืนยัน...",
      badgeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      cardBorder: "border-l-4 border-l-amber-500/40",
    },
    UNPAID: {
      badge: "ยังไม่จ่าย",
      badgeClass: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      cardBorder: "border-l-4 border-l-rose-500/20",
    },
  }

  const cfg = statusConfig[item.status]

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${cfg.cardBorder}`}>
      {/* แถวหลัก — กดเพื่อขยาย/ซ่อนปุ่ม */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* ชื่อ + ยอด */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{item.displayName}</p>
          <p className="text-lg font-mono font-black text-foreground mt-0.5">
            ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* สถานะ + ลูกศร */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`${cfg.badgeClass} text-[11px] h-6 px-2`}>{cfg.badge}</Badge>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* ส่วนขยาย — ปุ่ม Action */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 bg-secondary/20 flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
          {/* ปุ่ม QR Code */}
          <button
            onClick={() => onViewQR(item.id)}
            className="
              flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
              bg-indigo-500/10 border border-indigo-500/25
              text-indigo-400 text-xs font-bold
              hover:bg-indigo-500/20 active:scale-95 transition-all
            "
          >
            <QrCode className="h-4 w-4" />
            QR จ่ายเงิน
          </button>

          {/* ปุ่มอัปโหลดสลิป */}
          {item.status !== "PAID" && billStatus === "OPEN" && (
            <button
              onClick={() => onUploadSlip(item)}
              className="
                flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
                bg-emerald-500/10 border border-emerald-500/25
                text-emerald-400 text-xs font-bold
                hover:bg-emerald-500/20 active:scale-95 transition-all
              "
            >
              <Upload className="h-4 w-4" />
              แนบสลิป
            </button>
          )}

          {/* ปุ่มดูสลิป */}
          {(item.status === "PAID" || item.status === "PENDING") && (
            <button
              onClick={() => onViewSlip(item.id)}
              className="
                flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5
                bg-secondary border border-border
                text-muted-foreground text-xs font-bold
                hover:bg-secondary/80 active:scale-95 transition-all
              "
            >
              <Eye className="h-4 w-4" />
              ดูสลิป
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================
export default function ViewBillPage() {
  const { slug } = useParams<{ slug: string }>()
  const { toast } = useToast()

  // สถานะแอปพลิเคชัน
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [closingBill, setClosingBill] = useState(false)

  // ควบคุมโมดัลต่างๆ
  const [qrDialog, setQrDialog] = useState<{ open: boolean; data?: { amount?: number; referenceCode?: string }; qrImage?: string; loading?: boolean }>({ open: false })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item?: BillItem; loading?: boolean }>({ open: false })
  const [slipPreviewDialog, setSlipPreviewDialog] = useState<{ open: boolean; slipUrl?: string; bankRef?: string; amount?: number; loading?: boolean }>({ open: false })

  // สถานะการอัปโหลดสลิป
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [mockingScan, setMockingScan] = useState(false)
  const [detectedAmount, setDetectedAmount] = useState("")
  const [bankRef, setBankRef] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (slug) fetchBill()
  }, [slug])

  // โหลดข้อมูลบิลจาก Backend
  const fetchBill = async () => {
    try {
      const data = await billApi.getBill(slug)
      setBill(data)

      // บันทึกประวัติเข้าดูบิล (localStorage)
      if (typeof window !== "undefined" && data) {
        try {
          const recentBills = JSON.parse(localStorage.getItem("recent_bills") || "[]")
          const existingIndex = recentBills.findIndex((b: { slug: string }) => b.slug === data.publicSlug)

          if (existingIndex === 0) return

          const billRecord = {
            slug: data.publicSlug,
            title: data.title,
            createdAt: new Date().toISOString(),
            role: existingIndex >= 0 ? recentBills[existingIndex].role : "viewer"
          }

          if (existingIndex >= 0) recentBills.splice(existingIndex, 1)
          recentBills.unshift(billRecord)
          localStorage.setItem("recent_bills", JSON.stringify(recentBills.slice(0, 10)))
        } catch (e) {
          console.error("Failed to save recent bill", e)
        }
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลบิลได้", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // คัดลอกลิงก์แชร์
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast({ title: "คัดลอกลิงก์สำเร็จ!", description: "ส่งลิงก์นี้ให้เพื่อนร่วมจ่ายได้เลย" })
    setTimeout(() => setCopied(false), 2000)
  }

  // เปิดโมดัล QR Code
  const handleViewQR = async (id: number) => {
    setQrDialog({ open: true, loading: true })
    try {
      const data = await billApi.getItemQR(slug, id)
      const qrImage = await QRCode.toDataURL(data.promptpayPayload)
      setQrDialog({ open: true, data, qrImage })
    } catch {
      toast({ title: "ผิดพลาด", description: "โหลด QR Code ไม่สำเร็จ", variant: "destructive" })
      setQrDialog({ open: false })
    }
  }

  // เปิดโมดัลอัปโหลดสลิป
  const handleUploadSlipOpen = (item: BillItem) => {
    setSelectedFile(null)
    setFilePreview(null)
    setDetectedAmount("")
    setBankRef("")
    setUploadDialog({ open: true, item, loading: false })
  }

  // จัดการเลือกไฟล์รูปภาพ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // จำลองการสแกนสลิป (Mock OCR)
  const handleMockScan = () => {
    if (!selectedFile) {
      toast({ title: "ไม่พบไฟล์", description: "กรุณาเลือกไฟล์สลิปก่อน", variant: "destructive" })
      return
    }
    setMockingScan(true)
    setTimeout(() => {
      const mockRef = "TRN" + Math.floor(1000000000 + Math.random() * 9000000000).toString()
      setBankRef(mockRef)
      setDetectedAmount((uploadDialog.item?.amount || 0).toString())
      setMockingScan(false)
      toast({ title: "สแกนสำเร็จ (จำลอง)!", description: "กรอกข้อมูลจากสลิปอัตโนมัติแล้ว" })
    }, 1500)
  }

  // ส่งข้อมูลชำระเงินไป Backend
  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) return toast({ title: "เกิดข้อผิดพลาด", description: "กรุณาแนบไฟล์สลิป", variant: "destructive" })
    if (!bankRef || !detectedAmount) return toast({ title: "เกิดข้อผิดพลาด", description: "กรุณากรอกรหัสอ้างอิงและจำนวนเงิน", variant: "destructive" })

    setUploadDialog((d) => ({ ...d, loading: true }))
    try {
      const uploadedUrl = await uploadSlip(selectedFile)
      await paymentApi.createPayment({
        billItemId: uploadDialog.item!.id,
        slipUrl: uploadedUrl,
        bankRef,
        detectedAmount: parseFloat(detectedAmount)
      })
      toast({ title: "อัปโหลดสลิปเรียบร้อย!", description: "ตรวจสอบความถูกต้องสำเร็จ" })
      setUploadDialog({ open: false })
      fetchBill()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่ทราบสาเหตุ"
      toast({ title: "อัปโหลดล้มเหลว", description: msg, variant: "destructive" })
      setUploadDialog((d) => ({ ...d, loading: false }))
    }
  }

  // ดูสลิปที่แนบมาแล้ว
  const handleViewSlip = async (itemId: number) => {
    setSlipPreviewDialog({ open: true, loading: true })
    try {
      const response = await paymentApi.getPaymentByItem(itemId)
      if (response && response.length > 0) {
        const latest: PaymentHistory = response[0]
        setSlipPreviewDialog({ open: true, slipUrl: latest.slipUrl, bankRef: latest.bankRef, amount: latest.detectedAmount, loading: false })
      } else {
        toast({ title: "ไม่พบข้อมูล", description: "ไม่พบสลิปในรายการนี้", variant: "destructive" })
        setSlipPreviewDialog({ open: false })
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ดึงข้อมูลสลิปไม่สำเร็จ", variant: "destructive" })
      setSlipPreviewDialog({ open: false })
    }
  }

  // ปิดบิล
  const handleCloseBill = async () => {
    setClosingBill(true)
    try {
      await billApi.closeBill(slug)
      toast({ title: "บิลปิดแล้ว!", description: "ปิดบิลเรียกเก็บเงินเรียบร้อย" })
      fetchBill()
    } catch {
      toast({ title: "ผิดพลาด", description: "ปิดบิลไม่สำเร็จ", variant: "destructive" })
    } finally {
      setClosingBill(false)
    }
  }

  // คำนวณสรุปยอดเงิน
  const total = bill?.items.reduce((s, i) => s + Number(i.amount), 0) ?? 0
  const paid = bill?.items.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.amount), 0) ?? 0
  const pending = bill?.items.filter((i) => i.status === "PENDING").reduce((s, i) => s + Number(i.amount), 0) ?? 0
  const progressPercent = total > 0 ? Math.round((paid / total) * 100) : 0

  // === Loading State ===
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mx-auto animate-pulse">
            <FileText className="h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-muted-foreground text-sm">กำลังโหลดข้อมูลบิล...</p>
        </div>
      </div>
    )
  }

  // === Not Found State ===
  if (!bill) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ไม่พบบิลนี้</h2>
            <p className="text-muted-foreground text-sm mt-1">รหัสบิลอาจไม่ถูกต้องหรือถูกลบไปแล้ว</p>
          </div>
          <Link href="/">
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none text-white rounded-2xl w-full h-12">
              กลับหน้าแรก
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  return (
    <MainLayout
      customHeader={
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/">
                <button
                  aria-label="ย้อนกลับ"
                  className="
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    bg-secondary/60 border border-border
                    hover:bg-secondary active:scale-95 transition-all
                    text-muted-foreground hover:text-foreground
                  "
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-foreground truncate">{bill.title}</h1>
                <p className="text-[10px] text-muted-foreground font-mono">#{bill.publicSlug}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Badge สถานะบิล */}
              {bill.status === "OPEN" ? (
                <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[11px] gap-1">
                  <Unlock className="h-3 w-3" /> เปิดอยู่
                </Badge>
              ) : (
                <Badge className="bg-secondary border-border text-muted-foreground text-[11px] gap-1">
                  <Lock className="h-3 w-3" /> ปิดแล้ว
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>
      }
    >

        {/* --- Progress Bar --- */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">ความคืบหน้า</span>
            <span className="text-sm font-black text-indigo-400">{progressPercent}%</span>
          </div>

          {/* แถบ progress */}
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* สรุปตัวเลข */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">รวม</p>
              <p className="text-sm font-mono font-black text-foreground">฿{total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">จ่ายแล้ว</p>
              <p className="text-sm font-mono font-black text-emerald-400">฿{paid.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">คงเหลือ</p>
              <p className="text-sm font-mono font-black text-indigo-400">฿{(total - paid).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* แถบ pending ถ้ามี */}
          {pending > 0 && (
            <div className="flex items-center justify-between bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
              <span className="text-[11px] text-amber-400 font-bold">⏳ รอยืนยัน</span>
              <span className="text-[11px] font-mono font-black text-amber-400">฿{pending.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>

        {/* --- ข้อมูลพร้อมเพย์ + เครื่องมือ --- */}
        <div className="grid grid-cols-2 gap-3">
          {/* PromptPay ID */}
          <div className="bg-card border border-border rounded-2xl p-3.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">พร้อมเพย์รับเงิน</p>
            <p className="text-sm font-mono font-bold text-foreground truncate">{bill.payeePromptPayId}</p>
          </div>

          {/* ปุ่มแชร์ */}
          <button
            onClick={handleCopyLink}
            className="
              bg-card border border-border rounded-2xl p-3.5
              flex flex-col items-start justify-between
              hover:border-indigo-500/40 active:scale-[0.98]
              transition-all
            "
          >
            <div className="flex items-center gap-1.5">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-indigo-400" />}
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {copied ? "คัดลอกแล้ว!" : "แชร์ลิงก์"}
              </span>
            </div>
            <p className="text-xs text-foreground font-bold mt-1">
              {copied ? "ลิงก์อยู่ในคลิปบอร์ด" : "กดเพื่อคัดลอก URL"}
            </p>
          </button>
        </div>

        {/* --- รายชื่อผู้ร่วมบิล (Card per person) --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground">
              รายชื่อผู้ร่วมบิล
              <span className="ml-2 text-muted-foreground font-normal text-xs">
                (กดรายชื่อเพื่อดูตัวเลือก)
              </span>
            </h2>
          </div>

          <div className="space-y-2">
            {bill.items.map((item) => (
              <BillItemCard
                key={item.id}
                item={item}
                billStatus={bill.status}
                onViewQR={handleViewQR}
                onUploadSlip={handleUploadSlipOpen}
                onViewSlip={handleViewSlip}
              />
            ))}
          </div>
        </div>

        {/* --- เครื่องมือจัดการบิล (สำหรับผู้สร้าง) --- */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground px-1">เครื่องมือจัดการ</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/bills/${slug}/summary`} className="block">
              <button className="
                w-full h-12 rounded-2xl border border-border
                bg-card flex items-center justify-center gap-2
                text-sm font-bold text-foreground
                hover:border-indigo-500/40 hover:bg-secondary/50
                active:scale-[0.98] transition-all
              ">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                ดูรายงาน
              </button>
            </Link>

            {bill.status === "OPEN" && (
              <button
                onClick={handleCloseBill}
                disabled={closingBill}
                className="
                  w-full h-12 rounded-2xl border border-rose-500/20
                  bg-rose-500/8 flex items-center justify-center gap-2
                  text-sm font-bold text-rose-400
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

        <div className="h-2" />

      {/* ================================================================
          DIALOG 1: QR Code พร้อมเพย์
          ================================================================ */}
      <Dialog open={qrDialog.open} onOpenChange={(o) => setQrDialog({ ...qrDialog, open: o })}>
        <DialogContent className="bg-card border-border text-foreground max-w-[340px] mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-400" /> QR จ่ายเงิน
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              เปิดแอปธนาคารสแกนเพื่อโอนเงินได้ทันที
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {qrDialog.loading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
                  <QrCode className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="text-muted-foreground text-sm animate-pulse">กำลังสร้าง QR Code...</p>
              </div>
            ) : (
              qrDialog.qrImage && (
                <div className="w-full max-w-[260px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col items-center animate-in zoom-in duration-200">
                  <img src="/images/thai_qr_payment.png" alt="Thai QR Payment" className="w-full h-auto object-contain" />
                  <div className="relative w-full bg-white">
                    <img src={qrDialog.qrImage} alt="PromptPay QR" className="w-full h-auto block" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-[3px] rounded-lg shadow-sm">
                      <img src="/images/icon-thaiqr.png" alt="Thai QR Icon" className="w-8 h-8 object-contain" />
                    </div>
                  </div>
                </div>
              )
            )}

            {qrDialog.data && (
              <div className="w-full bg-background border border-border rounded-2xl p-3.5 space-y-2 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ผู้รับเงิน:</span>
                  <span className="text-foreground font-mono">{bill.payeePromptPayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">จำนวนเงิน:</span>
                  <span className="text-emerald-400 font-black font-mono">
                    ฿{qrDialog.data.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-mono">
                  <span className="text-muted-foreground">รหัสอ้างอิง:</span>
                  <span className="text-foreground text-[10px] break-all max-w-[55%] text-right">
                    {qrDialog.data.referenceCode}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================
          DIALOG 2: อัปโหลดสลิป
          ================================================================ */}
      <Dialog open={uploadDialog.open} onOpenChange={(o) => setUploadDialog({ ...uploadDialog, open: o })}>
        <DialogContent className="bg-card border-border text-foreground max-w-[380px] mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-400" />
              ยืนยันการจ่าย — {uploadDialog.item?.displayName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              แนบสลิปและตรวจสอบข้อมูลก่อนยืนยัน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* พื้นที่อัปโหลดรูปสลิป */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="
                border-2 border-dashed border-border hover:border-emerald-500/50
                bg-background rounded-2xl p-5
                flex flex-col items-center justify-center gap-2
                cursor-pointer transition-all min-h-[120px]
              "
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
                <div className="w-full max-h-[140px] overflow-hidden rounded-xl flex items-center justify-center">
                  <img src={filePreview} alt="Slip preview" className="object-contain max-h-[140px] rounded-xl" />
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground text-center">
                    แตะที่นี่เพื่อเลือกรูปสลิป<br />
                    <span className="text-[10px] opacity-60">จากกล้องหรือแกลเลอรี</span>
                  </span>
                </>
              )}
            </div>

            {/* ปุ่มสแกน Mock OCR */}
            {selectedFile && (
              <button
                type="button"
                onClick={handleMockScan}
                disabled={mockingScan}
                className="
                  w-full h-11 rounded-xl border border-indigo-500/25
                  bg-indigo-500/8 text-indigo-400 text-xs font-bold
                  flex items-center justify-center gap-2
                  hover:bg-indigo-500/15 active:scale-[0.98] transition-all
                  disabled:opacity-50
                "
              >
                <RefreshCw className={`h-3.5 w-3.5 ${mockingScan ? "animate-spin" : ""}`} />
                {mockingScan ? "กำลังสแกน..." : "🔍 สแกนและกรอกข้อมูลอัตโนมัติ"}
              </button>
            )}

            {/* ฟิลด์กรอกข้อมูล */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bankRef" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  รหัสอ้างอิง
                </Label>
                <Input
                  id="bankRef"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="Ref ID"
                  required
                  className="h-11 bg-secondary/40 border-border font-mono text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detectedAmount" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  ยอดเงิน (฿)
                </Label>
                <Input
                  id="detectedAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={detectedAmount}
                  onChange={(e) => setDetectedAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-11 bg-secondary/40 border-border font-mono text-sm rounded-xl"
                />
              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <Button
              type="submit"
              disabled={uploadDialog.loading}
              className="
                w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600
                hover:from-emerald-500 hover:to-teal-500
                border-none text-white rounded-2xl font-bold
                shadow-lg shadow-emerald-600/10
                active:scale-[0.98] disabled:opacity-60 transition-all
              "
            >
              {uploadDialog.loading ? "กำลังบันทึก..." : "✓ ยืนยันการชำระเงิน"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================
          DIALOG 3: พรีวิวสลิป
          ================================================================ */}
      <Dialog open={slipPreviewDialog.open} onOpenChange={(o) => setSlipPreviewDialog({ ...slipPreviewDialog, open: o })}>
        <DialogContent className="bg-card border-border text-foreground max-w-[340px] mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" /> สลิปการชำระเงิน
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {slipPreviewDialog.loading ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm animate-pulse">กำลังดึงข้อมูล...</p>
              </div>
            ) : (
              <>
                {slipPreviewDialog.slipUrl && (
                  <div className="bg-background border border-border rounded-2xl p-2.5 flex items-center justify-center max-h-[260px] overflow-hidden">
                    <img
                      src={slipPreviewDialog.slipUrl}
                      alt="Payment Slip"
                      className="object-contain max-h-[250px] rounded-xl"
                    />
                  </div>
                )}
                <div className="bg-background border border-border rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">สถานะ:</span>
                    <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 h-5 text-[10px]">อนุมัติแล้ว ✓</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดเงิน:</span>
                    <span className="text-emerald-400 font-mono font-black">
                      ฿{slipPreviewDialog.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-mono">
                    <span className="text-muted-foreground">รหัสทำรายการ:</span>
                    <span className="text-foreground text-[10px] break-all max-w-[55%] text-right">{slipPreviewDialog.bankRef}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
