import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bills/[slug]/items/[itemId]/qr - ดึงค่า QR Payload และข้อมูลอ้างอิง
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params;
    const itemIdBigInt = BigInt(itemId);

    // ค้นหาบิลตาม slug
    const bill = await prisma.bill.findUnique({
      where: { publicSlug: slug },
    });

    // ค้นหารายการย่อยตาม id
    const item = await prisma.billItem.findUnique({
      where: { id: itemIdBigInt },
    });

    if (!bill || !item || item.billId !== bill.id) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบิลหรือรายการที่ระบุ' }, { status: 404 });
    }

    // กำหนดรูปแบบจำนวนเงินทศนิยม 2 ตำแหน่ง
    const amountStr = item.amount ? Number(item.amount).toFixed(2) : '0.00';
    
    // ถอดสูตรสร้าง payload จาก QrService ใน Java
    const payload = `PROMPTPAY:${bill.payeePromptPayId}|AMOUNT:${amountStr}|REF:${item.referenceCode}`;

    return NextResponse.json({
      promptpayPayload: payload,
      amount: Number(item.amount),
      referenceCode: item.referenceCode,
    });
  } catch (error: any) {
    console.error('สร้าง QR Payload ล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้าง QR: ' + error.message }, { status: 500 });
  }
}
