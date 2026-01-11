import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Use Service Account authentication (same as submit route)
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.warn("No Service Account Key found. Returning fallback inventory.");
      return NextResponse.json({
        inventory: { wheat: '100', alfalfa: '50' }
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read range A2:B from 'Inventory' tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Inventory!A2:B',
    });

    const rows = response.data.values;
    // Transform rows into an object: { "wheat": "100", "alfalfa": "24" }
    const inventoryMap: Record<string, string> = {};

    if (rows && rows.length > 0) {
      rows.forEach(row => {
        if (row[0]) {
          // Normalize key to lowercase for easier matching
          const key = row[0].toLowerCase().trim();
          inventoryMap[key] = row[1] || '0';
        }
      });
    }

    // Fallback if empty to avoid UI breaking
    if (Object.keys(inventoryMap).length === 0) {
      inventoryMap['wheat'] = '100';
      inventoryMap['alfalfa'] = '50';
    }

    return NextResponse.json({ inventory: inventoryMap });
  } catch (error) {
    console.error('Inventory Fetch Error:', error);
    return NextResponse.json({ inventory: {} }, { status: 500 });
  }
}
