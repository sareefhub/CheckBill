import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

// POST /api/payments - บันทึกประวัติการจ่ายเงินและตรวจสอบความถูกต้องอัตโนมัติ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      billItemId,
      slipUrl,
      bankRef,
      detectedAmount,
      detectedTime,
      verifyScore,
    } = body;

    // ตรวจสอบฟิลด์บังคับเบื้องต้น
    if (!billItemId || !slipUrl) {
      return NextResponse.json({ error: 'ข้อมูลการชำระเงินไม่ครบถ้วน' }, { status: 400 });
    }

    const itemIdBigInt = BigInt(billItemId);

    // ดึงข้อมูลรายการสินค้าเพื่อตรวจสอบยอดบิลจริง
    const item = await prisma.billItem.findUnique({
      where: { id: itemIdBigInt },
    });

    if (!item) {
      return NextResponse.json({ error: 'ไม่พบรายการบิลที่ต้องการชำระเงิน' }, { status: 404 });
    }

    // เปรียบเทียบยอดสลิปกับยอดบิลจริง (ยินยอมให้มีผลต่างทศนิยมไม่เกิน 0.01 บาท)
    const isAmountMatch =
      detectedAmount !== undefined &&
      detectedAmount !== null &&
      Math.abs(Number(detectedAmount) - Number(item.amount)) < 0.01;

    let paymentStatus = 'AUTO_FAIL';
    let itemStatus = 'UNPAID';
    let paidAt: Date | null = null;

    if (isAmountMatch) {
      paymentStatus = 'AUTO_OK';
      itemStatus = 'PAID';
      paidAt = new Date();
    }

    // ดำเนินการอัปเดตสถานะบิลและสร้างใบจ่ายเงินภายใน Transaction
    const saved = await prisma.$transaction(async (tx) => {
      // 1. อัปเดตสถานะของ BillItem (เพื่อล็อคและบันทึกว่าจ่ายเงินแล้ว)
      await tx.billItem.update({
        where: { id: itemIdBigInt },
        data: {
          status: itemStatus,
          paidAt: paidAt,
        },
      });

      // 2. บันทึกประวัติการชำระเงิน (Payment)
      return await tx.payment.create({
        data: {
          billItemId: itemIdBigInt,
          slipUrl,
          bankRef,
          detectedAmount: detectedAmount ? parseFloat(detectedAmount) : null,
          detectedTime: detectedTime ? new Date(detectedTime) : null,
          verifyScore: verifyScore ? parseInt(verifyScore) : 0,
          status: paymentStatus,
        },
        include: {
          billItem: true,
        },
      });
    });

    // ปรับรูปแบบข้อมูลให้ออกมาเป็น PaymentResponse เหมือนฝั่ง Backend เดิม
    const response = {
      id: saved.id.toString(),
      billItemId: saved.billItem.id.toString(),
      displayName: saved.billItem.displayName,
      amount: Number(saved.billItem.amount),
      itemStatus: saved.billItem.status,
      referenceCode: saved.billItem.referenceCode,
      slipUrl: saved.slipUrl,
      bankRef: saved.bankRef,
      detectedAmount: saved.detectedAmount ? Number(saved.detectedAmount) : null,
      detectedTime: saved.detectedTime,
      verifyScore: saved.verifyScore,
      status: saved.status,
      createdAt: saved.createdAt,
    };

    return NextResponse.json(serializeData(response));
  } catch (error: any) {
    console.error('ประมวลผลชำระเงินล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกชำระเงิน: ' + error.message }, { status: 500 });
  }
}
