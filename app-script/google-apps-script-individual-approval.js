/**
 * Pursadari Individual Email Approval - Google Apps Script
 * 
 * This script:
 * 1. Triggers on each form submission
 * 2. Sends individual approval email for each submission
 * 3. Processes approved submissions immediately
 * 4. Compiles daily CDC entries at end of day
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
 * Trigger function - runs when form is submitted
 */
function onFormSubmit(e) {
  try {
    console.log('Form submission received:', e);
    
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      console.log('No data in sheet');
      return;
    }
    
    // Get the latest submission
    const submission = getLatestSubmission(sheet, lastRow);
    
    if (!submission) {
      console.log('No valid submission found');
      return;
    }
    
    console.log('Processing submission:', submission.title);
    
    // Send individual approval email
    sendIndividualApprovalEmail(submission);
    
  } catch (error) {
    console.error('Error processing form submission:', error);
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
 * Get the latest submission from sheet
 */
function getLatestSubmission(sheet, rowNumber) {
  const row = sheet.getRange(rowNumber, 1, 1, 9).getValues()[0];
  
  // Skip empty rows
  if (!row[0] || row[0].toString().trim() === '') {
    return null;
  }
  
  return {
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
}

/**
 * Send individual approval email
 */
function sendIndividualApprovalEmail(submission) {
  const subject = `Pursadari Submission - "${submission.title}" - Approval Required`;
  
  // Create approval URL
  const approvalUrl = createIndividualApprovalUrl(submission);
  const rejectionUrl = createRejectionUrl(submission);
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Kalaam Submission</h2>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">${submission.title}</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 120px;">Reciter:</td>
            <td style="padding: 8px;">${submission.reciter}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Poet:</td>
            <td style="padding: 8px;">${submission.poet}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Masaib:</td>
            <td style="padding: 8px;">${submission.masaib}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Submitted by:</td>
            <td style="padding: 8px;">${submission.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Time:</td>
            <td style="padding: 8px;">${new Date(submission.timestamp).toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="margin-top: 15px;">
          <h4>English Lyrics:</h4>
          <div style="background-color: white; padding: 10px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
            ${submission.lyricsEng.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        ${submission.lyricsUrdu ? `
        <div style="margin-top: 15px;">
          <h4>Urdu Lyrics:</h4>
          <div style="background-color: white; padding: 10px; border-radius: 4px; max-height: 150px; overflow-y: auto; direction: rtl; text-align: right;">
            ${submission.lyricsUrdu.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}
        
        ${submission.yt ? `
        <div style="margin-top: 15px;">
          <h4>YouTube Link:</h4>
          <a href="${submission.yt}" target="_blank" style="color: #1a73e8;">${submission.yt}</a>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalUrl}" 
           style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; margin-right: 10px;">
          ✅ APPROVE
        </a>
        
        <a href="${rejectionUrl}" 
           style="background-color: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
          ❌ REJECT
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; text-align: center;">
        This submission will be added to the daily CDC batch for Firebase sync.
      </p>
    </div>
  `;
  
  GmailApp.sendEmail(
    CONFIG.ADMIN_EMAIL,
    subject,
    '',
    {
      htmlBody: htmlContent,
      name: 'Pursadari Bot'
    }
  );
  
  console.log(`Individual approval email sent for: ${submission.title}`);
}

/**
 * Create individual approval URL
 */
function createIndividualApprovalUrl(submission) {
  const webAppUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  return `${webAppUrl}?action=approve&rowId=${submission.rowNumber}&title=${encodeURIComponent(submission.title)}`;
}

/**
 * Create rejection URL
 */
function createRejectionUrl(submission) {
  const webAppUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  return `${webAppUrl}?action=reject&rowId=${submission.rowNumber}&title=${encodeURIComponent(submission.title)}`;
}

/**
 * Process approved individual submission
 */
function processApprovedSubmission(submission) {
  console.log(`Processing approved submission: ${submission.title}`);
  
  // Initialize Firebase
  const firebase = initializeFirebase();
  
  // Add to pending CDC entries (will be compiled at end of day)
  addToPendingCDC(submission);
  
  // Remove from sheet
  removeSubmissionFromSheet(submission.rowNumber);
  
  console.log(`Submission processed and removed from sheet: ${submission.title}`);
}

/**
 * Add submission to pending CDC entries
 */
function addToPendingCDC(submission) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  // Get or create pending CDC entry for today
  const pendingKey = `pending_cdc_${today}`;
  let pendingEntries = PropertiesService.getScriptProperties().getProperty(pendingKey);
  
  if (!pendingEntries) {
    pendingEntries = [];
  } else {
    pendingEntries = JSON.parse(pendingEntries);
  }
  
  // Add new submission
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
  
  pendingEntries.push(change);
  
  // Save back to properties
  PropertiesService.getScriptProperties().setProperty(pendingKey, JSON.stringify(pendingEntries));
  
  console.log(`Added to pending CDC. Total pending for ${today}: ${pendingEntries.length}`);
}

/**
 * End of day function - compiles all pending CDC entries
 */
function endOfDayCDCCompilation() {
  try {
    console.log('Starting end of day CDC compilation...');
    
    const today = new Date().toISOString().split('T')[0];
    const pendingKey = `pending_cdc_${today}`;
    const pendingEntries = PropertiesService.getScriptProperties().getProperty(pendingKey);
    
    if (!pendingEntries) {
      console.log('No pending CDC entries for today.');
      return;
    }
    
    const changes = JSON.parse(pendingEntries);
    
    if (changes.length === 0) {
      console.log('No changes to compile for today.');
      return;
    }
    
    // Create CDC entry
    const cdcEntry = {
      date: today,
      timestamp: new Date().toISOString(),
      changes: changes,
      total_changes: changes.length,
      processed: false
    };
    
    // Send to Firebase
    const firebase = initializeFirebase();
    const firestore = firebase.firestore();
    const cdcRef = firestore.collection('kalaam_cdc').doc(today);
    
    cdcRef.set(cdcEntry)
      .then(() => {
        console.log(`CDC entry created for ${today} with ${changes.length} changes`);
        
        // Clear pending entries
        PropertiesService.getScriptProperties().deleteProperty(pendingKey);
        
        // Send summary email
        sendCDCSummaryEmail(today, changes.length);
      })
      .catch(error => {
        console.error('Error creating CDC entry:', error);
        throw error;
      });
    
  } catch (error) {
    console.error('Error in end of day CDC compilation:', error);
    sendErrorEmail(error);
  }
}

/**
 * Send CDC summary email
 */
function sendCDCSummaryEmail(date, changeCount) {
  const subject = `Pursadari Daily CDC Summary - ${changeCount} changes processed (${date})`;
  const body = `
    Daily CDC compilation completed successfully!
    
    Date: ${date}
    Total Changes: ${changeCount}
    Time: ${new Date().toISOString()}
    
    All approved submissions have been compiled into a single CDC entry and sent to Firebase.
    Clients will sync these changes on their next sync cycle.
  `;
  
  GmailApp.sendEmail(
    CONFIG.ADMIN_EMAIL,
    subject,
    body,
    { name: 'Pursadari Bot' }
  );
}

/**
 * Remove submission from sheet
 */
function removeSubmissionFromSheet(rowNumber) {
  const sheet = getSheet();
  sheet.deleteRow(rowNumber);
  console.log(`Removed row ${rowNumber} from sheet`);
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
  const subject = 'Pursadari Individual Approval Process - ERROR';
  const body = `
    An error occurred in the individual approval process:
    
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
 * Web App Handler - for approval/rejection buttons
 */
function doGet(e) {
  const action = e.parameter.action;
  const rowId = e.parameter.rowId;
  const title = e.parameter.title;
  
  if (action === 'approve') {
    // Get submission from sheet
    const sheet = getSheet();
    const submission = getSubmissionByRowId(sheet, parseInt(rowId));
    
    if (!submission) {
      return HtmlService.createHtmlOutput(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #f44336;">❌ Error</h2>
            <p>Submission not found. It may have already been processed.</p>
          </body>
        </html>
      `);
    }
    
    // Process approved submission
    processApprovedSubmission(submission);
    
    // Return success page
    return HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #4CAF50;">✅ Submission Approved!</h2>
          <p><strong>"${title}"</strong> has been approved and added to the daily CDC batch.</p>
          <p>It will be compiled and sent to Firebase at the end of the day.</p>
          <p><small>You can close this window now.</small></p>
        </body>
      </html>
    `);
    
  } else if (action === 'reject') {
    // Remove submission from sheet
    removeSubmissionFromSheet(parseInt(rowId));
    
    // Return rejection page
    return HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #f44336;">❌ Submission Rejected</h2>
          <p><strong>"${title}"</strong> has been rejected and removed from the sheet.</p>
          <p><small>You can close this window now.</small></p>
        </body>
      </html>
    `);
  }
  
  return HtmlService.createHtmlOutput('<h2>Invalid request</h2>');
}

/**
 * Get submission by row ID
 */
function getSubmissionByRowId(sheet, rowNumber) {
  const row = sheet.getRange(rowNumber, 1, 1, 9).getValues()[0];
  
  // Check if row exists and has data
  if (!row[0] || row[0].toString().trim() === '') {
    return null;
  }
  
  return {
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
}

/**
 * Test function - run this manually to test the script
 */
function testIndividualApproval() {
  console.log('Running test...');
  
  // Simulate a form submission
  const testSubmission = {
    rowNumber: 2,
    title: 'Test Kalaam',
    reciter: 'Test Reciter',
    poet: 'Test Poet',
    masaib: 'Test Masaib',
    lyricsEng: 'Test English lyrics',
    lyricsUrdu: 'Test Urdu lyrics',
    yt: 'https://youtube.com/test',
    email: 'test@example.com',
    timestamp: new Date()
  };
  
  sendIndividualApprovalEmail(testSubmission);
}
