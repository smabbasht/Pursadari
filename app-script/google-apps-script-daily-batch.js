/**
 * Pursadari Daily Batch Processing - Google Apps Script
 * 
 * This script runs daily to:
 * 1. Check if Google Sheet has new submissions
 * 2. Send email with approval button if submissions exist
 * 3. Process approved submissions and send to Firebase
 * 4. Clear the sheet for next day's submissions
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this script
 * 4. Set up Firebase Admin SDK (see setup instructions)
 * 5. Configure triggers (see setup instructions)
 */

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  // Your email address for receiving approval emails
  ADMIN_EMAIL: 'your-email@gmail.com',
  
  // Firebase configuration
  FIREBASE_PROJECT_ID: 'your-firebase-project-id',
  FIREBASE_PRIVATE_KEY: 'your-firebase-private-key',
  FIREBASE_CLIENT_EMAIL: 'your-firebase-client-email@your-project.iam.gserviceaccount.com',
  
  // Sheet configuration
  SHEET_NAME: 'Form Responses 1', // Name of your sheet tab
  DATA_START_ROW: 2, // Row where data starts (assuming row 1 has headers)
  
  // Form field mappings (update these to match your Google Form)
  FORM_FIELDS: {
    title: 'A',        // Column A
    reciter: 'B',      // Column B  
    poet: 'C',         // Column C
    masaib: 'D',       // Column D
    lyricsEng: 'E',    // Column E
    lyricsUrdu: 'F',   // Column F
    yt: 'G',           // Column G
    email: 'H',        // Column H
    timestamp: 'I'     // Column I (form submission timestamp)
  }
};

/**
 * Main function - runs daily via trigger
 */
function dailyBatchProcess() {
  try {
    console.log('Starting daily batch process...');
    
    const sheet = getSheet();
    const submissions = getNewSubmissions(sheet);
    
    if (submissions.length === 0) {
      console.log('No new submissions found.');
      return;
    }
    
    console.log(`Found ${submissions.length} new submissions.`);
    
    // Send approval email
    sendApprovalEmail(submissions);
    
    console.log('Daily batch process completed successfully.');
    
  } catch (error) {
    console.error('Error in daily batch process:', error);
    sendErrorEmail(error);
  }
}

/**
 * Get the Google Sheet
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);
  }
  
  return sheet;
}

/**
 * Get new submissions from the sheet
 */
function getNewSubmissions(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow < CONFIG.DATA_START_ROW) {
    return [];
  }
  
  const submissions = [];
  const dataRange = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, 9);
  const values = dataRange.getValues();
  
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNumber = CONFIG.DATA_START_ROW + i;
    
    // Skip empty rows
    if (!row[0] || row[0].toString().trim() === '') {
      continue;
    }
    
    const submission = {
      rowNumber: rowNumber,
      title: row[0]?.toString().trim() || '',
      reciter: row[1]?.toString().trim() || '',
      poet: row[2]?.toString().trim() || '',
      masaib: row[3]?.toString().trim() || '',
      lyricsEng: row[4]?.toString().trim() || '',
      lyricsUrdu: row[5]?.toString().trim() || '',
      yt: row[6]?.toString().trim() || '',
      email: row[7]?.toString().trim() || '',
      timestamp: row[8] || new Date()
    };
    
    submissions.push(submission);
  }
  
  return submissions;
}

/**
 * Send approval email with HTML content
 */
function sendApprovalEmail(submissions) {
  const today = new Date().toISOString().split('T')[0];
  const subject = `Pursadari Daily Submissions - ${submissions.length} new kalaams (${today})`;
  
  // Create HTML email content
  const htmlContent = createEmailHTML(submissions);
  
  // Create approval URL (this will be a web app URL)
  const approvalUrl = createApprovalUrl(submissions);
  
  const emailBody = `
    <h2>Daily Kalaam Submissions Review</h2>
    <p>You have <strong>${submissions.length}</strong> new kalaam submissions for ${today}.</p>
    
    <h3>Submissions:</h3>
    ${htmlContent}
    
    <div style="margin: 20px 0; text-align: center;">
      <a href="${approvalUrl}" 
         style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
        APPROVE ALL SUBMISSIONS
      </a>
    </div>
    
    <p><small>This will approve all submissions and send them to Firebase, then clear the sheet.</small></p>
  `;
  
  GmailApp.sendEmail(
    CONFIG.ADMIN_EMAIL,
    subject,
    '',
    {
      htmlBody: emailBody,
      name: 'Pursadari Bot'
    }
  );
  
  console.log(`Approval email sent to ${CONFIG.ADMIN_EMAIL}`);
}

/**
 * Create HTML content for submissions table
 */
function createEmailHTML(submissions) {
  let html = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
  html += '<tr style="background-color: #f2f2f2;">';
  html += '<th style="padding: 8px;">Title</th>';
  html += '<th style="padding: 8px;">Reciter</th>';
  html += '<th style="padding: 8px;">Poet</th>';
  html += '<th style="padding: 8px;">Masaib</th>';
  html += '<th style="padding: 8px;">Submitted By</th>';
  html += '<th style="padding: 8px;">Time</th>';
  html += '</tr>';
  
  submissions.forEach(submission => {
    html += '<tr>';
    html += `<td style="padding: 8px;">${submission.title}</td>`;
    html += `<td style="padding: 8px;">${submission.reciter}</td>`;
    html += `<td style="padding: 8px;">${submission.poet}</td>`;
    html += `<td style="padding: 8px;">${submission.masaib}</td>`;
    html += `<td style="padding: 8px;">${submission.email}</td>`;
    html += `<td style="padding: 8px;">${new Date(submission.timestamp).toLocaleString()}</td>`;
    html += '</tr>';
  });
  
  html += '</table>';
  return html;
}

/**
 * Create approval URL for web app
 */
function createApprovalUrl(submissions) {
  // This will be the URL of your deployed web app
  const webAppUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  const submissionIds = submissions.map(s => s.rowNumber).join(',');
  
  return `${webAppUrl}?action=approve&submissions=${submissionIds}&date=${new Date().toISOString().split('T')[0]}`;
}

/**
 * Process approved submissions and send to Firebase
 */
function processApprovedSubmissions(submissions) {
  console.log(`Processing ${submissions.length} approved submissions...`);
  
  // Initialize Firebase
  const firebase = initializeFirebase();
  
  // Create CDC entry
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  const cdcEntry = {
    date: today,
    timestamp: now,
    changes: [],
    total_changes: submissions.length,
    processed: false
  };
  
  // Process each submission
  submissions.forEach(submission => {
    const kalaamId = generateKalaamId();
    
    const change = {
      id: kalaamId,
      title: submission.title,
      lyrics_urdu: submission.lyricsUrdu,
      lyrics_eng: submission.lyricsEng,
      poet: submission.poet,
      reciter: submission.reciter,
      masaib: submission.masaib,
      yt_link: submission.yt,
      submitted_by: submission.email,
      submitted_at: submission.timestamp,
      approved_at: now,
      action: 'INSERT'
    };
    
    cdcEntry.changes.push(change);
  });
  
  // Send to Firebase
  const firestore = firebase.firestore();
  const cdcRef = firestore.collection('kalaam_cdc').doc(today);
  
  cdcRef.set(cdcEntry)
    .then(() => {
      console.log(`CDC entry created for ${today} with ${submissions.length} changes`);
    })
    .catch(error => {
      console.error('Error creating CDC entry:', error);
      throw error;
    });
  
  // Clear the sheet
  clearSheet(submissions);
  
  console.log('All submissions processed and sheet cleared.');
}

/**
 * Clear processed submissions from sheet
 */
function clearSheet(submissions) {
  const sheet = getSheet();
  
  // Sort by row number in descending order to avoid index shifting
  const sortedSubmissions = submissions.sort((a, b) => b.rowNumber - a.rowNumber);
  
  sortedSubmissions.forEach(submission => {
    sheet.deleteRow(submission.rowNumber);
  });
  
  console.log(`Cleared ${submissions.length} rows from sheet`);
}

/**
 * Generate unique ID for new kalaam
 */
function generateKalaamId() {
  return 'user_submitted_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  const firebaseConfig = {
    projectId: CONFIG.FIREBASE_PROJECT_ID,
    privateKey: CONFIG.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: CONFIG.FIREBASE_CLIENT_EMAIL
  };
  
  // Note: You'll need to add the Firebase Admin SDK library to your Apps Script project
  // Go to Resources > Libraries and add: 1hguuh4Zc_x2D3EAz7A3-wA_3k-s3VS5l
  const firebase = FirebaseApp.getDatabaseByUrl(`https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com/`, firebaseConfig);
  
  return firebase;
}

/**
 * Send error notification email
 */
function sendErrorEmail(error) {
  const subject = 'Pursadari Daily Batch Process - ERROR';
  const body = `
    An error occurred in the daily batch process:
    
    Error: ${error.toString()}
    Time: ${new Date().toISOString()}
    
    Please check the Apps Script logs for more details.
  `;
  
  GmailApp.sendEmail(
    CONFIG.ADMIN_EMAIL,
    subject,
    body,
    { name: 'Pursadari Bot' }
  );
}

/**
 * Web App Handler - for approval button
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'approve') {
    const submissionIds = e.parameter.submissions.split(',');
    const date = e.parameter.date;
    
    // Get submissions from sheet
    const sheet = getSheet();
    const submissions = getSubmissionsByIds(sheet, submissionIds);
    
    // Process approved submissions
    processApprovedSubmissions(submissions);
    
    // Return success page
    return HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #4CAF50;">✅ Submissions Approved!</h2>
          <p>All ${submissions.length} submissions have been processed and sent to Firebase.</p>
          <p>The Google Sheet has been cleared for new submissions.</p>
          <p><small>You can close this window now.</small></p>
        </body>
      </html>
    `);
  }
  
  return HtmlService.createHtmlOutput('<h2>Invalid request</h2>');
}

/**
 * Get submissions by row IDs
 */
function getSubmissionsByIds(sheet, rowIds) {
  const submissions = [];
  
  rowIds.forEach(rowId => {
    const rowNumber = parseInt(rowId);
    const row = sheet.getRange(rowNumber, 1, 1, 9).getValues()[0];
    
    const submission = {
      rowNumber: rowNumber,
      title: row[0]?.toString().trim() || '',
      reciter: row[1]?.toString().trim() || '',
      poet: row[2]?.toString().trim() || '',
      masaib: row[3]?.toString().trim() || '',
      lyricsEng: row[4]?.toString().trim() || '',
      lyricsUrdu: row[5]?.toString().trim() || '',
      yt: row[6]?.toString().trim() || '',
      email: row[7]?.toString().trim() || '',
      timestamp: row[8] || new Date()
    };
    
    submissions.push(submission);
  });
  
  return submissions;
}

/**
 * Test function - run this manually to test the script
 */
function testDailyBatch() {
  console.log('Running test...');
  dailyBatchProcess();
}
