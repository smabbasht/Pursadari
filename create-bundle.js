// create-bundle.js
// Run this with: node create-bundle.js

const admin = require('firebase-admin');
const fs = require('fs');

// Make sure you have a service account JSON downloaded from Firebase Console
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

const db = admin.firestore();

async function createBundle() {
  const bundle = db.bundle('kalaam-v1');

  // Query all docs in 'kalaam'
  const kalaamQuery = db.collection('kalaam');
  const kalaamSnap = await kalaamQuery.get();

  // Add snapshot to bundle under a named query
  const bundleBuffer = bundle.add('allKalaam', kalaamSnap).build();

  fs.writeFileSync('kalaam-v1.bundle', bundleBuffer);
  console.log('Bundle written: kalaam-v1.bundle');
}

createBundle();
