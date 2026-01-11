import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Static admin email
const ADMIN_EMAIL = process.env.EMAIL_TO || 'orders@growerdirect.com';

export async function POST(req: Request) {
    const data = await req.json();

    try {
        // 1. Google Sheets Integration
        let auth;
        let sheetResult = "Skipped";

        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            const timestamp = new Date().toISOString();

            // Extended row with financial data
            const row = [
                timestamp,
                `${data.firstName} ${data.lastName}`,
                data.phone,
                data.email,
                data.product,
                data.quantity,
                data.type,
                data.delivery,
                data.address || 'N/A',
                data.distanceMiles || 0,
                data.productSubtotal || 0,
                data.deliveryFee || 0,
                data.estimatedTotal || 0,
                data.feedback,
                data.balesEquivalent || 0,  // Column O: Bales Equivalent
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Submissions!A:O', // Updated range for balesEquivalent
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [row] },
            });
            sheetResult = "Success";
        } else {
            console.warn("No Service Account Key found. Skipping Sheet write.");
            sheetResult = "Missing Credentials";
        }

        // 2. Email Integration - Dual Emails
        let adminEmailResult = "Skipped";
        let customerEmailResult = "Skipped";

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                // Verify connection
                await new Promise((resolve, reject) => {
                    transporter.verify((error, success) => {
                        if (error) {
                            console.error("Transporter Verify Error:", error);
                            reject(error);
                        } else {
                            resolve(success);
                        }
                    });
                });

                // ========== ADMIN EMAIL ==========
                const adminMailOptions = {
                    from: process.env.EMAIL_FROM || '"Grower Direct" <noreply@growerdirect.com>',
                    to: ADMIN_EMAIL,
                    subject: `🚜 New Order: ${data.product} - ${data.firstName} ${data.lastName}`,
                    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1e3a1e; border-bottom: 2px solid #d4a34c; padding-bottom: 10px;">New Order Received</h2>
    
    <h3 style="color: #333;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f8f7f4;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-transform: capitalize;">${data.product}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.quantity} ${data.type}</td>
        </tr>
        <tr style="background: #f8f7f4;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Delivery Method</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.delivery === 'delivered' ? 'Delivery' : 'Farm Pickup'}</td>
        </tr>
        ${data.delivery === 'delivered' ? `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Address</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.address || 'N/A'}</td>
        </tr>
        <tr style="background: #f8f7f4;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Distance</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.distanceMiles || 0} miles</td>
        </tr>
        ` : ''}
    </table>

    <h3 style="color: #333; margin-top: 20px;">Financial Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f8f7f4;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product Subtotal</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${(data.productSubtotal || 0).toLocaleString()}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Delivery Fee</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${(data.deliveryFee || 0).toLocaleString()}</td>
        </tr>
        <tr style="background: #1e3a1e; color: white;">
            <td style="padding: 12px; border: 1px solid #ddd;"><strong>ESTIMATED TOTAL</strong></td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 18px;"><strong>$${(data.estimatedTotal || 0).toLocaleString()}</strong></td>
        </tr>
    </table>

    <h3 style="color: #333; margin-top: 20px;">Customer Information</h3>
    <ul style="list-style: none; padding: 0;">
        <li style="padding: 5px 0;"><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
        <li style="padding: 5px 0;"><strong>Phone:</strong> ${data.phone}</li>
        <li style="padding: 5px 0;"><strong>Email:</strong> ${data.email}</li>
        <li style="padding: 5px 0;"><strong>Notes:</strong> ${data.feedback || 'None'}</li>
    </ul>
</div>
                    `,
                };

                await transporter.sendMail(adminMailOptions);
                adminEmailResult = "Sent";

                // ========== CUSTOMER EMAIL ==========
                if (data.email) {
                    const customerMailOptions = {
                        from: process.env.EMAIL_FROM || '"Grower Direct" <noreply@growerdirect.com>',
                        to: data.email,
                        subject: `Your Order Request - Grower Direct`,
                        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #1e3a1e 0%, #2c532c 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Thank You, ${data.firstName}!</h1>
        <p style="color: #d4a34c; margin: 10px 0 0;">Your order request has been received.</p>
    </div>
    
    <div style="padding: 30px; background: #fdfdf9;">
        <h2 style="color: #1e3a1e; border-bottom: 2px solid #d4a34c; padding-bottom: 10px;">Order Summary</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background: #f8f7f4;">
                <td style="padding: 12px; border: 1px solid #e0e0e0;"><strong>Product</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0; text-transform: capitalize;">${data.product}</td>
            </tr>
            <tr>
                <td style="padding: 12px; border: 1px solid #e0e0e0;"><strong>Quantity</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0;">${data.quantity} ${data.type}</td>
            </tr>
            <tr style="background: #f8f7f4;">
                <td style="padding: 12px; border: 1px solid #e0e0e0;"><strong>Fulfillment</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0;">${data.delivery === 'delivered' ? 'Delivery' : 'Farm Pickup'}</td>
            </tr>
            ${data.delivery === 'delivered' ? `
            <tr>
                <td style="padding: 12px; border: 1px solid #e0e0e0;"><strong>Delivery Address</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0;">${data.address}</td>
            </tr>
            ` : ''}
        </table>

        <div style="background: #1e3a1e; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">Estimated Total</p>
            <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold;">$${(data.estimatedTotal || 0).toLocaleString()}</p>
        </div>

        <div style="margin-top: 25px; padding: 15px; background: #fff8e1; border-left: 4px solid #d4a34c; border-radius: 4px;">
            <p style="margin: 0; color: #5d4e37;">
                <strong>What's Next?</strong><br>
                We will review your order and reach out shortly to confirm availability and schedule ${data.delivery === 'delivered' ? 'delivery' : 'pickup'}.
            </p>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
            Questions? Reply to this email or call us directly.
        </p>
    </div>
</div>
                        `,
                    };

                    await transporter.sendMail(customerMailOptions);
                    customerEmailResult = "Sent";
                }

            } catch (emailErr) {
                console.error("Email Sending Failed:", emailErr);
                adminEmailResult = "Failed: " + (emailErr as Error).message;
            }
        } else {
            console.warn("No SMTP Credentials found. Skipping Email.");
            adminEmailResult = "Missing Credentials";
        }

        return NextResponse.json({
            success: true,
            details: {
                sheet: sheetResult,
                adminEmail: adminEmailResult,
                customerEmail: customerEmailResult
            }
        });

    } catch (error) {
        console.error('Submission Error:', error);
        return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
    }
}
