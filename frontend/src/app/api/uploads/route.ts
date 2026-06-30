import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// POST /api/uploads - อัปโหลดรูปภาพสลิปชำระเงินลงเซิร์ฟเวอร์
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // กำหนดโฟลเดอร์ปลายทางใน public/uploads/slips
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips');
    
    // สร้างโฟลเดอร์หากยังไม่มีอยู่
    await fs.mkdir(uploadDir, { recursive: true });

    // สุ่มตั้งชื่อไฟล์ใหม่ด้วย UUID เพื่อความปลอดภัยและหลีกเลี่ยงชื่อซ้ำ
    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // เขียนไฟล์ลงบน Disk
    await fs.writeFile(filePath, buffer);

    // คืนค่า URL สัมพัทธ์สำหรับให้เว็บบราวเซอร์เปิดดูได้ทันที
    const fileUrl = `/uploads/slips/${fileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('อัปโหลดสลิปล้มเหลว:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์สลิป: ' + error.message }, { status: 500 });
  }
}
