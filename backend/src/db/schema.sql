-- Enable trigram extension for efficient fuzzy search on song titles, artists, and albums
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    image_url VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    release_year INTEGER,
    cover_art_path VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Songs Table
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    duration NUMERIC(10, 2) NOT NULL DEFAULT 0,
    genre VARCHAR(100),
    track_number INTEGER,
    release_year INTEGER,
    file_path VARCHAR(1024) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    artwork_path VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_path VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Playlist Songs (Many-to-Many Join with explicit track ordering)
CREATE TABLE IF NOT EXISTS playlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_playlist_song_position UNIQUE (playlist_id, position)
);

-- 6. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Play History Table
CREATE TABLE IF NOT EXISTS play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    played_duration INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES WITH DOCUMENTED RATIONALE:
-- Fast lookup of songs by artist
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);

-- Fast lookup of songs by album
CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);

-- GIN Trigram index for high performance song title search
CREATE INDEX IF NOT EXISTS idx_songs_title_trgm ON songs USING gin (title gin_trgm_ops);

-- GIN Trigram index for artist name search
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING gin (name gin_trgm_ops);

-- GIN Trigram index for album title search
CREATE INDEX IF NOT EXISTS idx_albums_title_trgm ON albums USING gin (title gin_trgm_ops);

-- Composite index to load playlist tracks directly in ordered sequence
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id, position);

-- Instant reverse chronological query for recently played songs
CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at DESC);

-- Unique index ensuring only one song per title
CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_unique_lower_title ON songs (LOWER(TRIM(title)));
