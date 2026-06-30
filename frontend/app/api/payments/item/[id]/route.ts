import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

// GET /api/payments/item/[id] - ดึงรายการประวัติการชำระเงินตาม Bill Item ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = BigInt(id);

    // ค้นหาข้อมูล payments ทั้งหมดของ item ย่อยนั้น
    const payments = await prisma.payment.findMany({
      where: { billItemId: itemId },
      include: {
        billItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ปรับรูปแบบข้อมูลให้ออกมาเหมือน DTO (PaymentResponse) ฝั่ง Java เดิม
    const response = payments.map((p) => ({
      id: p.id.toString(),
      billItemId: p.billItem.id.toString(),
      displayName: p.billItem.displayName,
      amount: Number(p.billItem.amount),
      itemStatus: p.billItem.status,
      referenceCode: p.billItem.referenceCode,
      slipUrl: p.slipUrl,
      bankRef: p.bankRef,
      detectedAmount: p.detectedAmount ? Number(p.detectedAmount) : null,
      detectedTime: p.detectedTime,
      verifyScore: p.verifyScore,
      status: p.status,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(serializeData(response));
  } catch (error: any) {
    console.error('ดึงประวัติการชำระเงินล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน: ' + error.message }, { status: 500 });
  }
}
