import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ฟังก์ชันคำนวณ CRC-16 CCITT (สำหรับ EMVCo Checksum แปะท้ายพร้อมเพย์)
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ฟังก์ชันสร้าง PromptPay EMVCo Payload ที่สแกนได้จริงกับทุกแอปพลิเคชันธนาคารในไทย
function generatePromptPayPayload(promptpayId: string, amount?: number): string {
  // ทำความสะอาดข้อมูล นำช่องว่างและเครื่องหมายขีดออก
  let target = promptpayId.replace(/[- ]/g, '');
  
  let idType = '';
  if (target.length === 15) {
    // เลขบัญชี e-Wallet (เช่น TrueMoney)
    idType = '0315' + target;
  } else if (target.length === 13) {
    // เลขบัตรประชาชน
    idType = '0213' + target;
  } else if (target.length === 10) {
    // เบอร์มือถือไทย (แปลง 0812345678 -> 0066812345678)
    const mobileFormat = '0066' + target.substring(1);
    idType = '0113' + mobileFormat;
  } else {
    // กรณีข้อมูลอื่นๆ
    idType = '0113' + target.padStart(13, '0');
  }

  // Merchant Account Information (Tag 29) สำหรับพร้อมเพย์ไทย
  const merchantInfo = '0016A000000677010111' + idType;
  const tag29 = '29' + merchantInfo.length.toString().padStart(2, '0') + merchantInfo;

  // ประกอบร่างข้อมูลพื้นฐาน (Payload Indicator, Point of Initiation, Merchant Info, Currency 764 THB)
  let payload = '000201' + '010211' + tag29 + '5303764';

  // แทรกจำนวนเงิน (Tag 54) ก่อนหน้า Tag 58 เสมอตามมาตรฐาน EMVCo
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    payload += '54' + amountStr.length.toString().padStart(2, '0') + amountStr;
  }

  // แทรกรหัสประเทศ TH (Tag 58)
  payload += '5802TH';

  // สตริง Checksum รอคำนวณ (Tag 63)
  payload += '6304';

  // คำนวณหาผลลัพธ์ CRC16 แล้วนำมาต่อท้าย
  const checksum = crc16(payload);
  return payload + checksum;
}

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

    // สร้าง EMVCo Payload มาตรฐานพร้อมเพย์ไทยตัวจริงที่สแกนได้
    const realPayload = generatePromptPayPayload(
      bill.payeePromptPayId,
      Number(item.amount)
    );

    return NextResponse.json({
      promptpayPayload: realPayload,
      amount: Number(item.amount),
      referenceCode: item.referenceCode,
    });
  } catch (error: any) {
    console.error('สร้าง QR Payload ล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้าง QR: ' + error.message }, { status: 500 });
  }
}
