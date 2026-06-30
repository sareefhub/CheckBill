import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/bills - สร้างบิลใหม่พร้อมรายการสินค้า
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, payeeName, payeePromptPayId, items } = body;

    // ตรวจสอบความถูกต้องของข้อมูลนำเข้า
    if (!title || !payeeName || !payeePromptPayId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'ข้อมูลสำหรับสร้างบิลไม่ถูกต้อง' }, { status: 400 });
    }

    // สร้าง slug สุ่ม 8 อักขระ
    const publicSlug = crypto.randomUUID().substring(0, 8);

    // บันทึกบิลและรายการย่อยลงฐานข้อมูล
    const bill = await prisma.bill.create({
      data: {
        title,
        payeeName,
        payeePromptPayId,
        currency: 'THB',
        publicSlug,
        items: {
          create: items.map((item: any) => ({
            displayName: item.displayName,
            amount: parseFloat(item.amount),
            status: 'UNPAID',
            referenceCode: crypto.randomUUID(),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(serializeData(bill));
  } catch (error: any) {
    console.error('สร้างบิลล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างบิล: ' + error.message }, { status: 500 });
  }
}
