import type { Metadata, Viewport } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-kanit',
  display: 'swap',
})

export const metadata: Metadata = {
  // กำหนดชื่อเว็บและรายละเอียดสำหรับ SEO
  title: 'CheckBill — เช็คบิลอย่างชาญฉลาด',
  description: 'ระบบเช็คบิลออนไลน์ พร้อม QR Code PromptPay และตรวจสอบสลิปอัตโนมัติ',
}

// กำหนด viewport สำหรับ mobile
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // รองรับ safe area บน iPhone
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${kanit.variable}`}>
      <body>
        {/* ThemeProvider จัดการ class dark/light บน html element */}
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
