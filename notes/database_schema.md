# Pursadari Database Schema

## Overview

Pursadari uses SQLite with 5 tables split across client and server responsibilities.

### Client-Side Tables

These table reside solely on client (end-user mobile devices) and we don't sync it to server since we don't want per user settings store as we haven't implemented users thinking it would be expensive and also it hinders quick access; signup singin sucks.

#### 1. Settings Metadata

Stores app configuration and user preferences.

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,      -- Setting identifier
    value TEXT NOT NULL,       -- Setting value
    updated_at DATETIME        -- Last modification timestamp
);
```

Decided keys list (expandable):

- theme
- accent_color
- urdu_font
- eng_font
- urdu_font_size
- eng_font_size
- default_language_of_lyrics
- last_source_sync_timestamp etc.

#### 2. Favourites

Tracks user's favourite kalaams.

```sql
CREATE TABLE favourites (
    kalaam_id INTEGER PRIMARY KEY,  -- Reference to kalaam table
    created_at DATETIME            -- When was it marked favourite
);
```

### Common Table(s)

There is just one table that exists both on server side and on client side with the server side being the source of truth and client side syncing changes from server side periodically like in 30 mins or so if app has internet connectivity and app gets open.

#### 3. Kalaam

Primary content table, synced to client.

```sql
CREATE TABLE kalaam (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    lyrics_urdu TEXT,
    lyrics_eng TEXT,
    poet TEXT,
    reciter TEXT,
    masaib TEXT,
    yt_link TEXT,
    last_modified TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);
```

### Server-side Tables

These table reside solely on server and client (end user devices) never get these table since they aren't relevant to them.

#### 4. Kalaam Source

Tracks origin of each kalaam for data management.

```sql
CREATE TABLE kalaam_source (
    source TEXT NOT NULL,          -- e.g., 'nohayonline', 'nauhalyrics'
    id_at_source TEXT NOT NULL,    -- Original ID at source
    kalaam_id INTEGER,             -- Reference to kalaam table
    PRIMARY KEY (source, id_at_source),
    FOREIGN KEY (kalaam_id) REFERENCES kalaam(id)
);
```

#### 5. Scraping Metadata

Manages scraping operations and scheduling.

```sql
CREATE TABLE scraping_metadata (
    source TEXT PRIMARY KEY,    -- Source identifier
    last_run DATETIME,         -- Last successful scrape
);
```

## Sync Strategy

- Kalaam table syncs hourly when online
- Manual sync available
- Client-side tables remain local
- Server-side tables (kalaam_sources, scraping_metadata) remain on server
- New content propagates through kalaam table sync
- Soft delete support: records marked as `deleted = TRUE` are filtered out on client
- Updates and deletions are handled via `last_modified` timestamp tracking

## Data Flow

1. Server scrapes sources using scraping_metadata
2. New content added to kalaam and kalaam_sources
3. Kalaam table syncs to clients
4. Clients maintain their settings and favourites locally

## Notes

- All timestamps use UTC
- Source IDs must be preserved for update tracking
- Client sync is one-way (server to client) for kalaam table

