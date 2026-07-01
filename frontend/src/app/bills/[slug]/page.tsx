"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { billApi, paymentApi, uploadSlip } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, Unlock, Copy, Check, FileText, Wallet, ChevronRight } from "lucide-react"
import QRCode from "qrcode"
import { MainLayout } from "@/layout/main-layout"

// นำเข้า Local Components ย่อย
import { BillItem, BillItemCard } from "./components/bill-item-card"
import { VerifySlipDialog } from "./components/verify-slip-dialog"
import { SlipPreviewDialog } from "./components/slip-preview-dialog"
import { QrDialog } from "./components/qr-dialog"
import { AdminPanel } from "./components/admin-panel"

// ============================================================
// Interfaces
// ============================================================
interface Bill {
  id: number
  title: string
  publicSlug: string
  status: "OPEN" | "CLOSED"
  payeeName?: string | null
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

  // ควบคุมโมดัลต่างๆ (เพิ่มการเก็บข้อมูล item เพื่อส่งต่อไปยังหน้ารับสลิป)
  const [qrDialog, setQrDialog] = useState<{ 
    open: boolean 
    item?: BillItem 
    data?: { amount?: number; referenceCode?: string } 
    qrImage?: string 
    loading?: boolean 
  }>({ open: false })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item?: BillItem; loading?: boolean }>({ open: false })
  const [slipPreviewDialog, setSlipPreviewDialog] = useState<{ open: boolean; slipUrl?: string; bankRef?: string; amount?: number; loading?: boolean }>({ open: false })

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
    // ค้นหาข้อมูลไอเทมของคนนี้เพื่อเก็บเข้า State ไว้สำหรับให้กดแนบสลิปต่อ
    // แปลงเป็น String ทั้งคู่เพื่อความปลอดภัยในการเปรียบเทียบข้ามประเภทข้อมูล (เช่น string vs number จาก BigInt ของฐานข้อมูล)
    const item = bill?.items.find((i) => String(i.id) === String(id))
    setQrDialog({ open: true, item, loading: true })
    try {
      const data = await billApi.getItemQR(slug, id)
      const qrImage = await QRCode.toDataURL(data.promptpayPayload)
      setQrDialog({ open: true, item, data, qrImage })
    } catch {
      toast({ title: "ผิดพลาด", description: "โหลด QR Code ไม่สำเร็จ", variant: "destructive" })
      setQrDialog({ open: false })
    }
  }

  // เปิดโมดัลอัปโหลดสลิป
  const handleUploadSlipOpen = (item: BillItem) => {
    setUploadDialog({ open: true, item, loading: false })
  }

  // ส่งข้อมูลชำระเงินไป Backend
  const handlePaymentSubmit = async (file: File, ref: string, amount: string) => {
    setUploadDialog((d) => ({ ...d, loading: true }))
    try {
      const uploadedUrl = await uploadSlip(file)
      await paymentApi.createPayment({
        billItemId: uploadDialog.item!.id,
        slipUrl: uploadedUrl,
        bankRef: ref,
        detectedAmount: parseFloat(amount)
      })
      toast({ title: "อัปโหลดสลิปเรียบร้อย!", description: "ตรวจสอบความถูกต้องสำเร็จ" })
      setUploadDialog({ open: false })
      fetchBill()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่ทราบสาเหตุ"
      toast({ title: "อัปโหลดล้มเหลว", description: msg, variant: "destructive" })
      setUploadDialog((d) => ({ ...d, loading: false, item: d.item }))
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
    <MainLayout>
      <div className="flex items-center justify-between gap-3 mb-2">
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
            <h1 className="text-base font-bold text-foreground truncate">{bill.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">#{bill.publicSlug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {bill.status === "OPEN" ? (
            <Badge className="bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs gap-1 font-semibold">
              <Unlock className="h-3 w-3" /> เปิดอยู่
            </Badge>
          ) : (
            <Badge className="bg-secondary/60 border-border/80 text-muted-foreground/80 text-xs gap-1 font-semibold">
              <Lock className="h-3 w-3" /> ปิดแล้ว
            </Badge>
          )}
        </div>
      </div>

        <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">ความคืบหน้า</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
          </div>

          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground/80">รวม</p>
              <p className="text-base font-mono font-bold text-foreground mt-0.5">฿{total.toLocaleString()}</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-xs font-semibold text-muted-foreground/80">จ่ายแล้ว</p>
              <p className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">฿{paid.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground/80">คงเหลือ</p>
              <p className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">฿{(total - paid).toLocaleString()}</p>
            </div>
          </div>

          {pending > 0 && (
            <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">⏳ รอยืนยัน</span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">฿{pending.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* PromptPay ID + Payee Name */}
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-muted-foreground/80">ผู้รับเงิน</span>
            </div>
            {bill.payeeName ? (
              <div className="mt-1">
                <p className="text-xs font-bold text-foreground truncate leading-snug">{bill.payeeName}</p>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{bill.payeePromptPayId}</p>
              </div>
            ) : (
              <p className="text-sm font-mono font-bold text-foreground truncate mt-1">{bill.payeePromptPayId}</p>
            )}
          </div>

          {/* ปุ่มแชร์ */}
          <button
            onClick={handleCopyLink}
            className="
              bg-card border border-border rounded-2xl p-3
              flex items-center justify-between gap-2 w-full
              hover:border-indigo-500/40 hover:bg-secondary/20 active:scale-[0.98]
              transition-all text-left
            "
          >
            <div className="flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5">
                {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                <span className="text-xs font-semibold text-muted-foreground/80">
                  {copied ? "คัดลอกแล้ว!" : "แชร์ลิงก์"}
                </span>
              </div>
              <p className="text-xs text-foreground font-bold mt-1 truncate">
                {copied ? "ลิงก์อยู่ในคลิปบอร์ด" : "กดเพื่อคัดลอก URL"}
              </p>
            </div>
            <div className="bg-indigo-500/5 p-1.5 rounded-xl border border-indigo-500/10 flex-shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </button>
        </div>

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

        <AdminPanel
          slug={slug}
          billStatus={bill.status}
          closingBill={closingBill}
          onCloseBill={handleCloseBill}
        />

        <div className="h-2" />

        {/* DIALOG 1: QR Code พร้อมเพย์ */}
        <QrDialog
          isOpen={qrDialog.open}
          onOpenChange={(o) => setQrDialog((prev) => ({ ...prev, open: o }))}
          loading={qrDialog.loading || false}
          qrImage={qrDialog.qrImage || null}
          payeeName={bill.payeeName}
          payeePromptPayId={bill.payeePromptPayId}
          amount={qrDialog.data ? (qrDialog.data.amount || null) : null}
          referenceCode={qrDialog.data ? (qrDialog.data.referenceCode || null) : null}
        />

        {/* DIALOG 2: อัปโหลดสลิป */}
        <VerifySlipDialog
          isOpen={uploadDialog.open}
          onOpenChange={(o) => setUploadDialog((prev) => ({ ...prev, open: o }))}
          item={uploadDialog.item || null}
          loading={uploadDialog.loading || false}
          onSubmit={handlePaymentSubmit}
        />

        {/* DIALOG 3: พรีวิวสลิป */}
        <SlipPreviewDialog
          isOpen={slipPreviewDialog.open}
          onOpenChange={(o) => setSlipPreviewDialog((prev) => ({ ...prev, open: o }))}
          loading={slipPreviewDialog.loading || false}
          slipUrl={slipPreviewDialog.slipUrl || null}
          amount={slipPreviewDialog.amount || null}
          bankRef={slipPreviewDialog.bankRef || null}
        />
      </MainLayout>
    )
  }
