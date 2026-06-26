"use server"

import prisma from '@/lib/prisma';
import QRCode from 'qrcode';

export type CartItem = {
  itemType: string;
  size: string | null;
  quantity: number;
  price: number;
};

export async function submitMerchOrder(data: { name: string; email: string; phone: string; items: CartItem[] }) {
  try {
    let totalAmount = 0;
    const orderItems = data.items.map(i => {
      const subtotal = i.price * i.quantity;
      totalAmount += subtotal;
      return {
        itemType: i.itemType,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
        subtotal
      };
    });

    // Generate a unique order number like M-4829
    let orderNumber = '';
    let isUnique = false;
    while (!isUnique) {
      orderNumber = 'M-' + Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await prisma.merchandiseOrder.findUnique({ where: { orderNumber } });
      if (!existing) isUnique = true;
    }

    const order = await prisma.merchandiseOrder.create({
      data: {
        orderNumber,
        name: data.name,
        email: data.email,
        phone: data.phone,
        totalAmount,
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    });

    // Generate QR code for order
    const qrCodeDataUrl = await QRCode.toDataURL(order.orderNumber);

    // Build Email
    let itemsHtml = '';
    order.items.forEach(i => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #334155; color: #f1f5f9;">${i.itemType} ${i.size ? `(${i.size})` : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center; color: #f1f5f9;">${i.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: right; color: #f1f5f9;">RM ${Number(i.subtotal).toFixed(2)}</td>
        </tr>
      `;
    });

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: white; padding: 40px 20px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: white;">REVIVAL MERCH</h1>
          <p style="margin: 5px 0 0; color: #94a3b8;">Pre-Order Confirmation</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <p style="margin: 0 0 10px; color: #cbd5e1;">Hi ${order.name},</p>
          <p style="margin: 0; color: #cbd5e1; line-height: 1.6;">Thank you for reserving your official REVIVAL merchandise! Your pre-order is confirmed. <strong>Payment will be collected on the day of the conference at the merchandise booth.</strong></p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 5px; color: #0f172a; font-size: 24px;">Order ${order.orderNumber}</h2>
          <p style="margin: 0 0 20px; color: #64748b;">Please present this QR code at the merchandise booth for collection. We will notify you once the stock has arrived and is ready for pick-up!</p>
          <img src="cid:order_qr" alt="Order QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
        </div>

        <h3 style="color: white; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 15px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 10px; text-align: left; color: #94a3b8; font-weight: normal; border-bottom: 2px solid #334155;">Item</th>
              <th style="padding: 10px; text-align: center; color: #94a3b8; font-weight: normal; border-bottom: 2px solid #334155;">Qty</th>
              <th style="padding: 10px; text-align: right; color: #94a3b8; font-weight: normal; border-bottom: 2px solid #334155;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; color: white;">Total to Pay:</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #10b981; font-size: 18px;">RM ${Number(order.totalAmount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">See you at REVIVAL 2026!</p>
        </div>
      </div>
    `;

    const attachments = [{
      filename: `revival-merch-${order.orderNumber}.png`,
      content: qrCodeDataUrl.split("base64,")[1],
      encoding: 'base64',
      cid: `order_qr`
    }];

    const finalHtml = emailHtml + `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;

    await prisma.emailQueue.create({
      data: {
        to: order.email,
        subject: `Your REVIVAL Merch Pre-Order (${order.orderNumber})`,
        html: finalHtml
      }
    });

    return { success: true, orderNumber: order.orderNumber };
  } catch (e) {
    console.error('Failed to submit merch order', e);
    return { success: false, message: 'Failed to submit order.' };
  }
}
