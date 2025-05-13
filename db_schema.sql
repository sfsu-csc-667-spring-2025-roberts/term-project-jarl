-- Fixed db_schema.sql without syntax errors

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  balance INTEGER DEFAULT 1000
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 6,
  min_players INTEGER NOT NULL DEFAULT 2,
  buy_in INTEGER DEFAULT 1000,
  state VARCHAR(20) NOT NULL DEFAULT 'WAITING',
  created_by INTEGER REFERENCES users(id),
  current_players INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table for PG Store
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Game players table
CREATE TABLE IF NOT EXISTS game_players (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  seat_position INTEGER NOT NULL,
  chips INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  current_bet INTEGER DEFAULT 0,
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, seat_position)
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  rank VARCHAR(5) NOT NULL,
  suit VARCHAR(10) NOT NULL,
  UNIQUE(rank, suit)
);

-- Game cards table
CREATE TABLE IF NOT EXISTS game_cards (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id),
  status VARCHAR(20) NOT NULL, -- DECK, COMMUNITY, DEALT
  position INTEGER
);

-- Cards held by players table
CREATE TABLE IF NOT EXISTS cards_held (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id),
  UNIQUE(game_id, user_id, card_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id VARCHAR(255) NOT NULL, -- Can be 'global' or a game ID
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fund transactions table
CREATE TABLE IF NOT EXISTS fund_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add initial cards data if cards table is empty
INSERT INTO cards (rank, suit)
SELECT t.rank, t.suit
FROM (
  VALUES
    ('2', 'hearts'), ('3', 'hearts'), ('4', 'hearts'), ('5', 'hearts'),
    ('6', 'hearts'), ('7', 'hearts'), ('8', 'hearts'), ('9', 'hearts'),
    ('10', 'hearts'), ('J', 'hearts'), ('Q', 'hearts'), ('K', 'hearts'), ('A', 'hearts'),
    ('2', 'diamonds'), ('3', 'diamonds'), ('4', 'diamonds'), ('5', 'diamonds'),
    ('6', 'diamonds'), ('7', 'diamonds'), ('8', 'diamonds'), ('9', 'diamonds'),
    ('10', 'diamonds'), ('J', 'diamonds'), ('Q', 'diamonds'), ('K', 'diamonds'), ('A', 'diamonds'),
    ('2', 'clubs'), ('3', 'clubs'), ('4', 'clubs'), ('5', 'clubs'),
    ('6', 'clubs'), ('7', 'clubs'), ('8', 'clubs'), ('9', 'clubs'),
    ('10', 'clubs'), ('J', 'clubs'), ('Q', 'clubs'), ('K', 'clubs'), ('A', 'clubs'),
    ('2', 'spades'), ('3', 'spades'), ('4', 'spades'), ('5', 'spades'),
    ('6', 'spades'), ('7', 'spades'), ('8', 'spades'), ('9', 'spades'),
    ('10', 'spades'), ('J', 'spades'), ('Q', 'spades'), ('K', 'spades'), ('A', 'spades')
) AS t(rank, suit)
WHERE NOT EXISTS (
  SELECT 1 FROM cards
);