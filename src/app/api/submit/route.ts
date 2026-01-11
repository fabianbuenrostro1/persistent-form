import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
    const data = await req.json();

    try {
        // Note: Writing to Sheets requires OAUTH or SERVICE ACCOUNT. 
        // API KEY is restricted to Read-Only for user data usually.
        // If GOOGLE_SERVICE_ACCOUNT_KEY is present, we use it.

        let auth;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            // Fallback or API Key (This usually fails for WRITE, but we try)
            console.warn("No Service Account Key found. Submissions might fail to write to Sheet if using only API Key.");
            return NextResponse.json({ success: true, warning: "Mock Submit - Service Account Needed for Write" });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Prepare row data: Timestamp, Name, Phone, Product, Quantity, Type, Address, Feedback
        const timestamp = new Date().toISOString();
        const row = [
            timestamp,
            data.name,
            data.phone,
            data.product,
            data.quantity,
            data.type,
            data.delivery, // logic for address or pickup
            data.feedback
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Submissions!A:H',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row],
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submission Error:', error);
        return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
    }
}
