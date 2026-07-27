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
          <p style="margin: 0; color: #cbd5e1; line-height: 1.6;">Thank you for reserving your official REVIVAL merchandise! Your pre-order is confirmed.</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 5px; color: #0f172a; font-size: 24px;">Order ${order.orderNumber}</h2>
          <p style="margin: 0 0 20px; color: #64748b;">Please complete your payment to secure your order.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: left; font-family: monospace; color: #334155; font-size: 14px;">
            <p style="margin: 0 0 8px;"><strong>Bank Name:</strong> Maybank</p>
            <p style="margin: 0 0 8px;"><strong>Account Name:</strong> CALVARY COMMUNITY TT</p>
            <p style="margin: 0 0 8px;"><strong>Account Number:</strong> 551016737305</p>
            <p style="margin: 0;"><strong>Payment Reference:</strong> ${order.orderNumber}</p>
          </div>

          <a href="https://revival.thisiscccbilingual.com/merch-upload/${order.id}" style="display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Upload Payment Receipt &rsaquo;
          </a>
          
          <img src="cid:order_qr" alt="Order QR Code" style="width: 150px; height: 150px; margin: 25px auto 0; display: block;" />
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

export async function uploadMerchReceipt(orderId: string, formData: FormData) {
  try {
    const base64String = formData.get('receiptBase64') as string | null;
    if (!base64String) {
      return { success: false, message: 'No receipt uploaded.' };
    }

    const order = await prisma.merchandiseOrder.update({
      where: { id: orderId },
      data: {
        receiptUrl: base64String,
        receiptUploadedAt: new Date(),
        status: 'PAID', // Or 'PENDING_FOR_REVIEW' depending on flow
      },
    });

    // Notify merch team
    try {
      const adminHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2>New Merch Payment Receipt</h2>
          <p><strong>Name:</strong> ${order.name}</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Amount:</strong> RM ${order.totalAmount}</p>
          <p>Please log in to the Merchandise admin dashboard to review.</p>
        </div>
      `;
      // Currently using the general notification email, or a specific merch email. For now, default admin.
      await prisma.emailQueue.create({
        data: {
          to: 'kannanandrew101@gmail.com',
          subject: `New Merch Receipt: ${order.orderNumber}`,
          html: adminHtml,
          status: 'PENDING'
        }
      });
    } catch (emailError) {
      console.error('Error with merch notify email logic:', emailError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error uploading merch receipt:', error);
    return { success: false, message: 'Failed to upload receipt. Please try again.' };
  }
}

export async function getMerchOrderById(id: string) {
  try {
    const order = await prisma.merchandiseOrder.findUnique({
      where: { id },
    });
    return { success: true, data: order };
  } catch (error) {
    console.error("Failed to get merch order:", error);
    return { success: false, message: "Server error" };
  }
}

export async function sendMerchReminderEmail(orderId: string, testEmail?: string) {
  try {
    const order = await prisma.merchandiseOrder.findUnique({
      where: { id: orderId }
    });
    
    if (!order) return { success: false, message: "Order not found" };

    const recipientEmail = testEmail || order.email;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: white; padding: 40px 20px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: white;">REVIVAL MERCH</h1>
          <p style="margin: 5px 0 0; color: #94a3b8;">Payment Reminder</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <p style="margin: 0 0 10px; color: #cbd5e1;">Hi ${order.name},</p>
          <p style="margin: 0; color: #cbd5e1; line-height: 1.6;">This is a friendly reminder that we are waiting for your payment for your official REVIVAL merchandise pre-order.</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 5px; color: #0f172a; font-size: 24px;">Order ${order.orderNumber}</h2>
          <p style="margin: 0 0 20px; color: #64748b;">Outstanding Amount: <strong>RM ${Number(order.totalAmount).toFixed(2)}</strong></p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: left; font-family: monospace; color: #334155; font-size: 14px;">
            <p style="margin: 0 0 8px;"><strong>Bank Name:</strong> Maybank</p>
            <p style="margin: 0 0 8px;"><strong>Account Name:</strong> CALVARY COMMUNITY TT</p>
            <p style="margin: 0 0 8px;"><strong>Account Number:</strong> 551016737305</p>
            <p style="margin: 0;"><strong>Payment Reference:</strong> ${order.orderNumber}</p>
          </div>

          <a href="https://revival.thisiscccbilingual.com/merch-upload/${order.id}" style="display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Upload Payment Receipt &rsaquo;
          </a>
        </div>
      </div>
    `;

    await prisma.emailQueue.create({
      data: {
        to: recipientEmail,
        subject: `Payment Reminder: REVIVAL Merch Pre-Order (${order.orderNumber})`,
        html: emailHtml
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send merch reminder email:", error);
    return { success: false, message: "Server error" };
  }
}

