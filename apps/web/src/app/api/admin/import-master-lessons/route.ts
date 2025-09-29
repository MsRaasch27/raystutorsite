import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Extract sheet ID from Google Sheets URL
function extractSheetIdFromUrl(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetUrl, sheetId } = await request.json();

    if (!sheetUrl && !sheetId) {
      return NextResponse.json(
        { error: 'Either sheetUrl or sheetId is required' },
        { status: 400 }
      );
    }

    // Extract sheet ID from URL if provided
    let finalSheetId = sheetId;
    if (sheetUrl && !sheetId) {
      finalSheetId = extractSheetIdFromUrl(sheetUrl);
      if (!finalSheetId) {
        return NextResponse.json(
          { error: 'Invalid Google Sheets URL format' },
          { status: 400 }
        );
      }
    }

    console.log(`Importing master lessons from Google Sheet: ${finalSheetId}`);

    // Call Firebase Functions to read the Google Sheet data
    const firebaseFunctionUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/admin/read-google-sheet`;
    
    const sheetResponse = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: finalSheetId,
        range: 'A:K', // Columns A through K (A is optional Index, B-K are the lesson data)
      }),
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      console.error('Firebase Function error:', errorText);
      return NextResponse.json(
        { error: "Failed to read Google Sheet data" },
        { status: sheetResponse.status }
      );
    }

    const sheetData = await sheetResponse.json();
    const rows = sheetData.values || [];
    
    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'Spreadsheet must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Skip header row and process data
    const dataRows = rows.slice(1);
    const masterLessons = [];
    const errors = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed

      try {
        // Auto-generate index (sequential starting from 1)
        const index = i + 1;
        
        // Check if first column contains an index (optional)
        let dataStartIndex = 0;
        if (row[0] && !isNaN(parseInt(row[0]?.trim()))) {
          // First column is an index, skip it
          dataStartIndex = 1;
        }
        
        // Extract lesson data (starting from dataStartIndex)
        const cefrLevel = row[dataStartIndex]?.trim();
        const unit = row[dataStartIndex + 1]?.trim();
        const topic = row[dataStartIndex + 2]?.trim();
        const learningActivity = row[dataStartIndex + 3]?.trim();
        const vocabularyStr = row[dataStartIndex + 4]?.trim() || '';
        const powerpointStr = row[dataStartIndex + 5]?.trim() || '';
        const grammarConcept = row[dataStartIndex + 6]?.trim() || '';
        const playlist = row[dataStartIndex + 7]?.trim() || '';
        const homework = row[dataStartIndex + 8]?.trim() || '';
        const teachingNotes = row[dataStartIndex + 9]?.trim() || '';

        if (!cefrLevel || !unit || !topic || !learningActivity) {
          errors.push(`Row ${rowNumber}: Missing required fields (CEFR Level, Unit, Topic, Learning Activity)`);
          continue;
        }

        // Parse vocabulary and powerpoint (comma-separated)
        const vocabulary = vocabularyStr
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        
        const powerpoint = powerpointStr
          .split(',')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);

        const lesson = {
          index,
          cefrLevel,
          unit,
          topic,
          learningActivity,
          vocabulary,
          powerpoint,
          grammarConcept,
          playlist,
          homework,
          teachingNotes,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        masterLessons.push(lesson);
      } catch (error) {
        errors.push(`Row ${rowNumber}: Error processing data - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (masterLessons.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid lessons found in the spreadsheet',
          details: errors
        },
        { status: 400 }
      );
    }

    // Clear existing master lessons
    console.log('Clearing existing master lessons...');
    const existingLessons = await adminDb.collection('masterLessons').get();
    const batch = adminDb.batch();
    existingLessons.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Add new master lessons
    console.log(`Adding ${masterLessons.length} new master lessons...`);
    const addBatch = adminDb.batch();
    masterLessons.forEach((lesson) => {
      const docRef = adminDb.collection('masterLessons').doc();
      addBatch.set(docRef, lesson);
    });
    await addBatch.commit();

    console.log(`Successfully imported ${masterLessons.length} master lessons`);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${masterLessons.length} master lessons`,
      count: masterLessons.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error importing master lessons:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to import master lessons',
        details: 'Check console for more details'
      },
      { status: 500 }
    );
  }
}
