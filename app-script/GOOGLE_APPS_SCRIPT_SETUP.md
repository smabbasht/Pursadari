# Google Apps Script Setup Guide for Pursadari

This guide provides step-by-step instructions for setting up automated form submission processing using Google Apps Script and Firebase.

## Prerequisites

1. Google Form connected to Google Sheet
2. Firebase project with Firestore enabled
3. Firebase Admin SDK service account key
4. Gmail account for receiving approval emails

## Option 1: Daily Batch Processing (Recommended for CDC)

### Step 1: Firebase Setup

1. **Create Firebase Service Account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Note down: `project_id`, `private_key`, `client_email`

2. **Create Firestore Collection:**
   - Go to Firestore Database
   - Create collection: `kalaam_cdc`
   - Set up security rules (see below)

### Step 2: Google Apps Script Setup

1. **Open Google Apps Script:**
   - Go to your Google Sheet
   - Click Extensions → Apps Script
   - Delete the default code
   - Paste the code from `google-apps-script-daily-batch.js`

2. **Configure the Script:**
   ```javascript
   const CONFIG = {
     ADMIN_EMAIL: 'your-email@gmail.com',
     FIREBASE_PROJECT_ID: 'your-firebase-project-id',
     FIREBASE_PRIVATE_KEY: 'your-firebase-private-key',
     FIREBASE_CLIENT_EMAIL: 'your-firebase-client-email@your-project.iam.gserviceaccount.com',
     SHEET_NAME: 'Form Responses 1', // Update to match your sheet tab name
     // ... update form field mappings to match your columns
   };
   ```

3. **Add Firebase Admin SDK Library:**
   - In Apps Script, go to Resources → Libraries
   - Add library ID: `1hguuh4Zc_x2D3EAz7A3-wA_3k-s3VS5l`
   - Select latest version
   - Click Save

4. **Deploy as Web App:**
   - Click Deploy → New Deployment
   - Type: Web App
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy
   - Copy the web app URL and update in the script

### Step 3: Set Up Triggers

1. **Daily Trigger:**
   - In Apps Script, click Triggers (clock icon)
   - Click Add Trigger
   - Function: `dailyBatchProcess`
   - Event source: Time-driven
   - Type: Day timer
   - Time: Choose your preferred time (e.g., 6:00 AM)
   - Click Save

2. **Test Trigger:**
   - Run `testDailyBatch()` function manually
   - Check logs for any errors

### Step 4: Test the Setup

1. **Submit Test Form:**
   - Fill out your Google Form with test data
   - Submit the form

2. **Check Email:**
   - You should receive an approval email
   - Click the approval button
   - Verify the sheet is cleared
   - Check Firebase for the CDC entry

## Option 2: Individual Email Approval

### Step 1: Firebase Setup
(Same as Option 1)

### Step 2: Google Apps Script Setup

1. **Open Google Apps Script:**
   - Go to your Google Sheet
   - Click Extensions → Apps Script
   - Delete the default code
   - Paste the code from `google-apps-script-individual-approval.js`

2. **Configure the Script:**
   (Same configuration as Option 1)

3. **Add Firebase Admin SDK Library:**
   (Same as Option 1)

4. **Deploy as Web App:**
   (Same as Option 1)

### Step 3: Set Up Triggers

1. **Form Submit Trigger:**
   - In Apps Script, click Triggers (clock icon)
   - Click Add Trigger
   - Function: `onFormSubmit`
   - Event source: From spreadsheet
   - Event type: On form submit
   - Click Save

2. **End of Day Trigger:**
   - Click Add Trigger
   - Function: `endOfDayCDCCompilation`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 11:55 PM (or your preferred end-of-day time)
   - Click Save

### Step 4: Test the Setup

1. **Submit Test Form:**
   - Fill out your Google Form with test data
   - Submit the form

2. **Check Email:**
   - You should receive an individual approval email
   - Click approve or reject
   - Verify the sheet is updated accordingly

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to CDC entries for syncing
    match /kalaam_cdc/{date} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
    
    // Existing kalaam collection rules
    match /kalaam/{document} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

## Troubleshooting

### Common Issues:

1. **"Firebase not defined" error:**
   - Make sure you added the Firebase Admin SDK library
   - Check the library ID is correct: `1hguuh4Zc_x2D3EAz7A3-wA_3k-s3VS5l`

2. **"Sheet not found" error:**
   - Check the `SHEET_NAME` in CONFIG matches your actual sheet tab name
   - Sheet names are case-sensitive

3. **"Form field mapping" errors:**
   - Update the `FORM_FIELDS` object to match your actual column letters
   - Check your Google Form response sheet structure

4. **Email not sending:**
   - Check Gmail API is enabled in Google Cloud Console
   - Verify your email address in CONFIG

5. **Firebase connection issues:**
   - Verify your Firebase project ID
   - Check the service account key is properly formatted
   - Ensure Firestore is enabled in your Firebase project

### Testing Commands:

```javascript
// Test daily batch (Option 1)
testDailyBatch();

// Test individual approval (Option 2)
testIndividualApproval();

// Check sheet data
function debugSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  console.log('Last row:', lastRow);
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow-1, 9).getValues();
    console.log('Data:', data);
  }
}
```

## Cost Analysis

### Daily Batch Processing:
- **Firebase writes:** 1 per day (CDC entry)
- **Email sends:** 1 per day (if submissions exist)
- **Apps Script executions:** 1 per day
- **Total cost:** ~$0 (within free tiers)

### Individual Email Approval:
- **Firebase writes:** 1 per day (CDC entry) + 1 per approval (properties)
- **Email sends:** 1 per submission
- **Apps Script executions:** 1 per submission + 1 per day
- **Total cost:** ~$0 (within free tiers)

## Recommendation

For your CDC approach, **Option 1 (Daily Batch Processing)** is recommended because:

1. **Perfect for CDC:** One daily entry per user
2. **Lower costs:** Minimal Firebase writes
3. **Simpler workflow:** One approval per day
4. **Better for bulk operations:** Handles multiple submissions efficiently
5. **Uninterrupted flow:** Sheet clearing ensures clean daily cycles

The individual approval approach is better if you need immediate feedback to submitters, but it's more complex and doesn't align as well with the CDC pattern you're implementing.
