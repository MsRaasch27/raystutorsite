# Master English Lessons Library Setup

## Overview
This feature automatically copies the "Master English Lessons Library" spreadsheet for each new student account, creating a personalized lesson queue for each student. **This is purely for teacher use - students cannot access or view these spreadsheets.**

## Setup Instructions

### 1. Set Environment Variable
You need to add the following environment variable to your Firebase Functions:

```bash
GOOGLE_MASTER_LESSONS_LIBRARY_ID=1lPLZ-N09Iz2nj11sVnIicw0uThdAxmgPAA2oAAbihnc
```

### 2. Firebase Functions Environment Setup

#### Option A: Using Firebase CLI (Recommended)
```bash
# Set the environment variable for your Firebase project
firebase functions:config:set google.master_lessons_library_id="1lPLZ-N09Iz2nj11sVnIicw0uThdAxmgPAA2oAAbihnc"

# Deploy the updated functions
firebase deploy --only functions
```

#### Option B: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Functions > Configuration
4. Add the environment variable:
   - Key: `GOOGLE_MASTER_LESSONS_LIBRARY_ID`
   - Value: `1lPLZ-N09Iz2nj11sVnIicw0uThdAxmgPAA2oAAbihnc`

### 3. Google Drive Permissions
Ensure that the Firebase service account or OAuth client has access to:
- Read the Master English Lessons Library spreadsheet
- Create copies in the same Google Drive account
- **Note: Students do NOT get access to these spreadsheets**

### 4. Spreadsheet Naming Convention
Each student's copied spreadsheet will be named:
```
{Student's Name} Lesson Queue
```

If no name is provided, it will use:
```
{Student's Email} Lesson Queue
```

## How It Works

1. **User Account Creation**: When a new student submits the form, the system automatically:
   - Creates a copy of the Master English Lessons Library
   - Names it according to the student's name
   - **Does NOT share it with the student**
   - Stores the new spreadsheet ID in the user's profile (for teacher reference only)

2. **Teacher Access**: Teachers can:
   - Update the master library to affect all future student copies
   - Access individual student lesson queues through the shared permissions
   - Maintain centralized lesson content
   - Use the copied spreadsheets for lesson planning and tracking

3. **Student Experience**: Students:
   - **Cannot see or access their lesson queue spreadsheets**
   - Continue to use the existing vocabulary and flashcard systems
   - The lessons library is purely for teacher organization

## Teacher Workflow

1. **Create Master Library**: Set up your master lessons library with all available lessons
2. **Automatic Copying**: Each new student gets their own copy automatically
3. **Lesson Planning**: Use the student's copy to plan their specific lesson sequence
4. **Progress Tracking**: Track student progress through their lesson queue
5. **Content Updates**: Update the master library to improve future student copies

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the Firebase service account has access to the master spreadsheet
2. **Copy Failed**: Check that the master spreadsheet ID is correct and accessible
3. **Student Can't Access**: This is expected behavior - students should not access these spreadsheets

### Debugging
Check the Firebase Functions logs for detailed error messages:
```bash
firebase functions:log
```

## Security Notes

- Each student gets their own copy of the lessons library
- **Students cannot access their lesson queue spreadsheets**
- The master library remains under teacher control
- All operations are logged for audit purposes
- This is a teacher-only organizational tool
