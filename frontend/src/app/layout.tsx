import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-kanit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CheckBill — หารบิลกับเพื่อนอย่างชาญฉลาด',
  description: 'ระบบหารบิลออนไลน์ พร้อม QR Code PromptPay และตรวจสอบสลิปอัตโนมัติ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${kanit.variable} dark`}>
      <body>{children}</body>
    </html>
  )
}
