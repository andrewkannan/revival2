import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function DbUpdatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const result: string[] = [];

  if (searchParams.run === 'true') {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "wristbandCollected" BOOLEAN NOT NULL DEFAULT false;`);
      result.push("Successfully checked/added wristbandCollected column");
      
      await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "starterPackCollected" BOOLEAN NOT NULL DEFAULT false;`);
      result.push("Successfully checked/added starterPackCollected column");

      await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);`);
      result.push("Successfully checked/added checkedInAt column");

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Sowing" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "outreach" "OutreachLocation" NOT NULL,
          "amount" DECIMAL(10,2) NOT NULL,
          "receiptUrl" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Sowing_pkey" PRIMARY KEY ("id")
        );
      `);
      result.push("Successfully checked/added Sowing table");
      
      revalidatePath('/admin/db-update');
    } catch (error: any) {
      result.push(`Error: ${error.message}`);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Database Migration Tool</h1>
      <p className="text-slate-400">Click the button below to apply the new database columns directly from the web.</p>
      
      <form action="">
        <input type="hidden" name="run" value="true" />
        <button type="submit" className="px-6 py-3 bg-poster-accent text-poster-bg font-bold rounded-lg hover:bg-poster-accent-bright transition-colors">
          Run Schema Update
        </button>
      </form>

      {result.length > 0 && (
        <div className="bg-black/50 p-4 border border-white/10 rounded-lg font-mono text-sm space-y-2">
          {result.map((line, i) => (
            <div key={i} className={line.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
