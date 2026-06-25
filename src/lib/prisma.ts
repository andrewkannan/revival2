import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter }).$extends({
    query: {
      emailQueue: {
        async create({ args, query }) {
          const subject = args.data.subject;
          if (typeof subject === 'string' && (subject.includes('Registration Invoice') || subject.includes('Your E-Tickets'))) {
            args.data.createdAt = new Date(0);
          }
          return query(args);
        }
      }
    }
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
