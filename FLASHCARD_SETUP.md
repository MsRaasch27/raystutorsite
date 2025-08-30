# Flashcard System Setup Guide

## Overview
The flashcard system supports both shared and individual student vocabulary sets. Students can use a default vocabulary sheet or configure their own personalized vocabulary sheet. The system implements spaced repetition learning where students rate cards as Easy, Medium, or Hard, which determines when they'll see the card again.

## Vocabulary Sheet Options

### Option 1: Default Shared Vocabulary Sheet
Create a single Google Sheet that all students will use by default:

| English | Thai | Part of Speech | Example |
|---------|------|----------------|---------|
| Hello | สวัสดี | greeting | Hello, how are you? |
| Thank you | ขอบคุณ | expression | Thank you for your help. |
| Good morning | สวัสดีตอนเช้า | greeting | Good morning, everyone! |
| Water | น้ำ | noun | I need some water. |
| Beautiful | สวย | adjective | This is a beautiful day. |

### Option 2: Individual Student Vocabulary Sheets
Each student can have their own personalized vocabulary sheet:

1. **Student creates their own Google Sheet** with the same structure as above
2. **Student shares the sheet** with your Firebase service account email
3. **Student enters their sheet ID** in the Vocabulary Settings section of their dashboard
4. **System automatically uses** their personal sheet instead of the default

## Google Sheets Setup

### 1. Create a Google Sheet
Create a new Google Sheet with the following structure:

| English | Thai | Part of Speech | Example |
|---------|------|----------------|---------|
| Hello | สวัสดี | greeting | Hello, how are you? |
| Thank you | ขอบคุณ | expression | Thank you for your help. |
| Good morning | สวัสดีตอนเช้า | greeting | Good morning, everyone! |
| Water | น้ำ | noun | I need some water. |
| Beautiful | สวย | adjective | This is a beautiful day. |

### 2. Share the Sheet
- Share the Google Sheet with your Firebase service account email
- Give it "Viewer" permissions
- Copy the Sheet ID from the URL (the long string between /d/ and /edit)

### 3. Set Environment Variables
Add the following secret to your Firebase Functions:

```bash
firebase functions:secrets:set GOOGLE_VOCAB_SHEET_ID
```

When prompted, enter your Google Sheet ID.

## Student Configuration

### Setting Up Individual Vocabulary Sheets
Students can configure their own vocabulary sheets through the Vocabulary Settings in their dashboard:

1. **Navigate to Practice Tab**: Students go to the "Practice" section of their dashboard
2. **Access Vocabulary Settings**: Click on the "Vocabulary Settings" section
3. **Enter Sheet ID**: Paste their Google Sheet ID in the input field
4. **Update Settings**: Click "Update Sheet" to save their configuration
5. **Reset to Default**: Students can always reset to use the default sheet

### Student Sheet Requirements
When students create their own sheets, they must:

1. **Use the correct format**: English | Thai | Part of Speech | Example
2. **Share with service account**: Give your Firebase service account "Viewer" access
3. **Valid Sheet ID**: Use the ID from the Google Sheets URL
4. **Proper permissions**: Ensure the sheet is accessible to the service account

## How It Works

### Vocabulary Sheet Selection
1. **Default Behavior**: All students start with the default vocabulary sheet
2. **Individual Override**: If a student has set a `vocabularySheetId`, their personal sheet is used
3. **Fallback**: If a student's personal sheet fails to load, the system falls back to the default sheet
4. **API Integration**: The `/api/vocabulary?userId=...` endpoint automatically selects the appropriate sheet

### Spaced Repetition Algorithm
- **Easy**: Interval doubles (1→2→4→8→16... days, max 365)
- **Medium**: Interval increases by 1.5x (1→1.5→2.25→3.375... days, max 30)
- **Hard**: Always review tomorrow (1 day)

### Card Selection
- Cards are shown based on their next review date
- New cards (no progress) are always due
- Cards marked as "Easy" with 3+ reviews are considered "mastered"

### Progress Tracking
- Each student's progress is stored in Firestore
- Progress includes difficulty rating, review count, and next review date
- Statistics show total words, reviewed words, due words, and mastered words

## Features

### Flashcard Component
- 3D flip animation
- Shows English word and part of speech on front
- Shows Thai translation and example on back
- Difficulty rating buttons (Easy/Medium/Hard)
- **Text-to-speech audio buttons** for pronunciation
  - English pronunciation on front and back of card
  - Thai pronunciation on back of card
  - Uses Google's Text-to-Speech API
  - Supports multiple languages (en-US, th-TH)

### Vocabulary Settings Component
- Input field for Google Sheet ID
- Validation and error handling
- Success/error feedback
- Reset to default option
- Setup instructions for students

### Progress Tracking
- Visual progress bar
- Statistics dashboard
- Due cards counter
- Mastery tracking

### User Experience
- Responsive design
- Loading states
- Error handling
- Navigation between cards
- "All caught up" message when no cards are due

## API Endpoints

### GET /api/vocabulary?userId=...
Fetches vocabulary words from the appropriate Google Sheet (student-specific or default)

### GET /api/users/:id/flashcards
Gets user's flashcard progress

### POST /api/users/:id/flashcards/:wordId/rate
Updates card difficulty rating and calculates next review date

### POST /api/users/:id/vocabulary-sheet
Updates a user's vocabulary sheet ID configuration

### POST /api/text-to-speech
Converts text to speech using Google's Text-to-Speech API
- **Body**: `{ "text": "Hello", "language": "en-US" }`
- **Response**: `{ "audio": "base64_encoded_mp3", "format": "mp3" }`
- **Supported languages**: en-US, th-TH, and other Google TTS languages

## Customization

### Adding More Columns
To add more data to your flashcards, modify the `/api/vocabulary` endpoint:

```typescript
// In functions/src/index.ts, update the range and mapping:
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: "A:E", // Add more columns as needed
});

const words = rows.slice(1).map((row, index) => ({
  id: `word_${index + 1}`,
  english: row[0] || "",
  thai: row[1] || "",
  partOfSpeech: row[2] || "",
  example: row[3] || "",
  pronunciation: row[4] || "", // New column
}));
```

### Adjusting Spaced Repetition
Modify the intervals in the rating endpoint:

```typescript
// In functions/src/index.ts, update the interval calculations:
if (difficulty === "easy") {
  nextReviewDays = current ? Math.min(current.interval * 2.5, 365) : 10; // More aggressive
} else if (difficulty === "medium") {
  nextReviewDays = current ? Math.min(current.interval * 1.2, 14) : 2; // Less aggressive
} else {
  nextReviewDays = 1; // Hard - review tomorrow
}
```

## Troubleshooting

### Common Issues

1. **"Vocabulary sheet not configured"**
   - Make sure you've set the `GOOGLE_VOCAB_SHEET_ID` secret
   - Verify the sheet is shared with your service account

2. **"Failed to fetch vocabulary"**
   - Check that your Google Sheet has the correct column structure
   - Ensure the service account has read access to the sheet
   - Verify the student's personal sheet ID is correct (if using individual sheets)

3. **Cards not showing**
   - Verify the sheet has data (not just headers)
   - Check that the range in the API matches your sheet structure
   - Ensure the student's vocabulary sheet is properly shared

4. **Student can't access their vocabulary**
   - Check that the student's sheet is shared with the service account
   - Verify the sheet ID format is correct
   - Ensure the sheet has the proper column structure

### Debugging
- Check Firebase Functions logs for API errors
- Verify the Google Sheet ID is correct
- Test the Google Sheets API directly in the Google Cloud Console
- Check student's vocabulary sheet permissions and format

### Student Sheet Validation
When students report issues with their vocabulary sheets:

1. **Check Sheet ID Format**: Ensure it matches the pattern from Google Sheets URL
2. **Verify Permissions**: Confirm the sheet is shared with the service account
3. **Validate Structure**: Ensure columns are in the correct order
4. **Test Access**: Try accessing the sheet directly with the service account

175418255342-compute@developer.gserviceaccount.com