import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

// PATCH /api/bills/[slug]/close - ปิดบิล (บันทึกเวลาปิด)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const bill = await prisma.bill.findUnique({
      where: { publicSlug: slug },
    });

    if (!bill) {
      return NextResponse.json({ error: 'ไม่พบบิลที่ระบุ' }, { status: 404 });
    }

    const updatedBill = await prisma.bill.update({
      where: { id: bill.id },
      data: { closeAt: new Date() },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return NextResponse.json(serializeData(updatedBill));
  } catch (error: any) {
    console.error('ปิดบิลล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการปิดบิล: ' + error.message }, { status: 500 });
  }
}
