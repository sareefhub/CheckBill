import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/bills/[slug] - ดึงรายละเอียดบิลและรายการย่อย
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const bill = await prisma.bill.findUnique({
      where: { publicSlug: slug },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'ไม่พบบิลที่ระบุ' }, { status: 404 });
    }

    return NextResponse.json(serializeData(bill));
  } catch (error: any) {
    console.error('ดึงบิลล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงบิล: ' + error.message }, { status: 500 });
  }
}

// PUT /api/bills/[slug] - อัปเดตรายละเอียดบิลและรายการย่อย
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { title, payeeName, payeePromptPayId, items } = body;

    if (!title || !payeeName || !payeePromptPayId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'ข้อมูลสำหรับอัปเดตบิลไม่ถูกต้อง' }, { status: 400 });
    }

    // ค้นหาบิลเดิมก่อน
    const bill = await prisma.bill.findUnique({
      where: { publicSlug: slug },
      include: { items: true },
    });

    if (!bill) {
      return NextResponse.json({ error: 'ไม่พบบิลที่ต้องการอัปเดต' }, { status: 404 });
    }

    // เริ่ม Transaction เพื่อบำรุงรักษาข้อมูลฐานข้อมูลให้สอดคล้องกัน
    const updatedBill = await prisma.$transaction(async (tx) => {
      // 1. อัปเดตข้อมูลบิลหลัก
      await tx.bill.update({
        where: { id: bill.id },
        data: {
          title,
          payeeName,
          payeePromptPayId,
        },
      });

      // 2. จัดการรายการย่อย (Items)
      for (const item of items) {
        const existing = bill.items.find(
          (i) => i.displayName === item.displayName
        );

        if (existing) {
          // หากมีอยู่แล้ว ให้ปรับปรุงจำนวนเงิน
          await tx.billItem.update({
            where: { id: existing.id },
            data: { amount: parseFloat(item.amount) },
          });
        } else {
          // หากไม่มี ให้สร้างใหม่
          await tx.billItem.create({
            data: {
              billId: bill.id,
              displayName: item.displayName,
              amount: parseFloat(item.amount),
              status: 'UNPAID',
              referenceCode: crypto.randomUUID(),
            },
          });
        }
      }

      // 3. ดึงผลลัพธ์ข้อมูลล่าสุด
      return await tx.bill.findUnique({
        where: { id: bill.id },
        include: {
          items: {
            orderBy: { id: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(serializeData(updatedBill));
  } catch (error: any) {
    console.error('อัปเดตบิลล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตบิล: ' + error.message }, { status: 500 });
  }
}
