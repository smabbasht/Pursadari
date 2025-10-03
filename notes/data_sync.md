# Pursadari Data Synchronization Strategy

## Overview

Pursadari uses a hybrid approach combining local SQLite for performance with Firebase for server-side synchronization, optimized for cost-effectiveness and user experience.

## Architecture Components

### 1. Development Environment

- Local PostgreSQL database
- Acts as development replica
- Staging environment for data ingestion
- Used for testing and data preparation

### 2. Server Side (Firebase)

- Source of truth for kalaam data
- Hosts server-side tables (`kalaam_source`, `scraping_metadata`)
- Leverages Firebase's generous free tier
- Eliminates need for dedicated server maintenance

### 3. Client Side (SQLite)

- Ships with pre-populated kalaam database (~10-20k entries)
- Maintains local tables (`settings`, `favourites`)
- Provides snappy, offline-first experience
- Periodic sync with Firebase when online

## Data Flow

### Initial Setup

1. Data scraping using Scrapy
2. Ingestion into local PostgreSQL
3. Verification and testing
4. Push to Firebase (production)
5. Package SQLite DB with app installation

### Sync Process

1. App launches with pre-populated SQLite database
2. When online, checks `last_source_sync_timestamp` from settings
3. Fetches only new/modified records from Firebase since last sync
4. Updates local SQLite database
5. Updates `last_source_sync_timestamp`

## Cost Considerations

### Why This Architecture?

1. **Firebase Free Tier Benefits**

   - Generous quota for reads/writes
   - No server maintenance costs
   - Reliable infrastructure

2. **Efficient Resource Usage**

   - Initial data bundled with app (one-time cost)
   - Incremental syncs reduce data transfer
   - Local SQLite reduces API calls

3. **User Experience Benefits**
   - Instant access to content on first launch
   - Offline functionality
   - Fast local queries

## Technical Decisions

### Firebase vs Custom Backend

- Chose Firebase for:
  - Zero maintenance overhead
  - Free tier adequacy
  - Built-in scalability

### SQLite vs Firebase Persistence

- Chose SQLite for:
  - Superior performance
  - Reliable offline access
  - Smaller memory footprint
  - Better query capabilities

### APK Size Consideration

- ~50MB APK size acceptable considering:
  - One-time download
  - Immediate content availability
  - No initial sync wait

## Future Scalability

- Current architecture supports up to 20k kalaams
- Firebase can handle expected user base
- Can transition to dedicated backend if needed

