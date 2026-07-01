import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper function to serialize Prisma objects (converting BigInt to string)
 * to avoid JSON serialization issues in Next.js response.
 */
export function serializeData<T>(data: T): any {
  const serialized = JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );

  // จัดการเพิ่มฟิลด์ status ให้กับโมเดล Bill แบบไดนามิก
  if (serialized && typeof serialized === 'object') {
    const addStatusToBill = (obj: any) => {
      if (obj && typeof obj === 'object') {
        // หากพบว่าเป็นข้อมูลบิล (มี publicSlug และ payeePromptPayId)
        if ('publicSlug' in obj && 'payeePromptPayId' in obj) {
          // หากไม่มีเวลาปิดบิล (closeAt) ให้เป็น OPEN ไม่เช่นนั้นเป็น CLOSED
          obj.status = obj.closeAt ? 'CLOSED' : 'OPEN';
        }
      }
    };

    if (Array.isArray(serialized)) {
      serialized.forEach(addStatusToBill);
    } else {
      addStatusToBill(serialized);
    }
  }

  return serialized;
}
