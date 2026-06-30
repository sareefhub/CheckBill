import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

// GET /api/bills/[slug]/summary - ดึงรายละเอียดสรุปบิล
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
    console.error('ดึงรายงานสรุปล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงสรุปบิล: ' + error.message }, { status: 500 });
  }
}
