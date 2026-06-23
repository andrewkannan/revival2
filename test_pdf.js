const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  const reg = await prisma.registration.findFirst({
    where: {
      receiptUrl: {
        contains: 'application/pdf'
      }
    }
  });

  if (reg) {
    console.log("Found PDF receipt for:", reg.attendeeName);
    const data = reg.receiptUrl;
    console.log("Data URI prefix:", data.substring(0, 50));
    
    // Test base64 extraction
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    console.log("Base64 start:", base64Data.substring(0, 50));
    
    // Save to test file
    fs.writeFileSync('test.pdf', Buffer.from(base64Data, 'base64'));
    console.log("Saved to test.pdf");
  } else {
    console.log("No PDF receipts found.");
  }
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
