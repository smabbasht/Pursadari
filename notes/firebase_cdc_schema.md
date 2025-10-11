# Firebase CDC Table Structure for Pursadari

## Kalaam CDC Collection

The `kalaam_cdc` collection will store daily change data capture entries for efficient syncing.

### Document Structure

```json
{
  "date": "2024-01-15",                    // YYYY-MM-DD format for daily batching
  "timestamp": "2024-01-15T10:30:00.000Z", // When the CDC entry was created
  "changes": [
    {
      "id": "auto_generated_id_1",         // Auto-generated ID for new kalaam
      "title": "Kalaam Title",
      "lyrics_urdu": "Urdu lyrics...",
      "lyrics_eng": "English lyrics...",
      "poet": "Poet Name",
      "reciter": "Reciter Name", 
      "masaib": "Masaib Name",
      "yt_link": "YouTube URL",
      "submitted_by": "user@email.com",    // Email from form submission
      "submitted_at": "2024-01-15T09:15:00.000Z", // When form was submitted
      "approved_at": "2024-01-15T10:30:00.000Z",  // When you approved it
      "action": "INSERT"                   // INSERT, UPDATE, DELETE
    }
  ],
  "total_changes": 1,                      // Count of changes in this CDC entry
  "processed": false                       // Whether clients have synced this
}
```

### Benefits of This Structure

1. **Daily Batching**: One document per day containing all changes
2. **Cost Efficient**: Clients only need to query once per day
3. **CDC Compliant**: Tracks all changes with timestamps
4. **Approval Tracking**: Maintains audit trail of approvals
5. **Scalable**: Can handle multiple submissions per day

### Client Sync Logic

```javascript
// Client queries for unprocessed CDC entries since last sync
const lastSyncDate = await getLastSyncDate(); // e.g., "2024-01-14"
const cdcEntries = await firestore
  .collection('kalaam_cdc')
  .where('date', '>', lastSyncDate)
  .where('processed', '==', false)
  .orderBy('date')
  .get();

// Process each CDC entry
for (const doc of cdcEntries.docs) {
  const cdcData = doc.data();
  for (const change of cdcData.changes) {
    if (change.action === 'INSERT') {
      await insertKalaam(change);
    } else if (change.action === 'UPDATE') {
      await updateKalaam(change);
    } else if (change.action === 'DELETE') {
      await deleteKalaam(change.id);
    }
  }
  
  // Mark as processed
  await doc.ref.update({ processed: true });
}
```

### Firebase Security Rules

```javascript
// Allow read access to CDC entries
match /kalaam_cdc/{date} {
  allow read: if true; // Public read for syncing
  allow write: if false; // Only server can write
}
```
