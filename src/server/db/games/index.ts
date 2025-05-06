// import db from "../connection";

// const CREATE_SQL = `
// INSERT INTO games (name, min_players, max_players, password)
// VALUES ($1, $2, $3, $4)
// RETURNING game_id
// `;

// const create = async (
//   creator: number,
//   name?: string,
//   min?: number,
//   max?: number,
//   password?: string,
// ) => {
//   const { game_id } = await db.one(CREATE_SQL, [name, min, max, password]);
//   await join(game_id, creator, true);
//   return game_id;
// };

// const JOIN_SQL = `
// INSERT INTO "gamePlayers" (game_id, user_id, is_host)
// VALUES ($1, $2, $3)
// `;

// const join = async (gameId: number, userId: number, isHost = false) => {
//   await db.none(JOIN_SQL, [gameId, userId, isHost]);
// };

// const CONDITIONAL_JOIN_SQL = `
//     INSERT INTO gamePlayers (game_id, user_id)
//     SELECT $(gameId), $(userId) 
//     WHERE NOT EXISTS (
//     SELECT 'value-doesnt-matter' 
//     FROM gamePlayers 
//     WHERE game_id=$(gameId) AND user_id=$(userId)
//     )
//     AND (
//     SELECT COUNT(*) FROM games WHERE id=$(gameId) AND password=$(password)
//     ) = 1
//     AND (
//     (
//         SELECT COUNT(*) FROM gamePlayers WHERE game_id=$(gameId)
//     ) < (
//         SELECT max_players FROM games WHERE id=$(gameId)
//     )
//     )
//     RETURNING (
//     SELECT COUNT(*) FROM gamePlayers WHERE game_id=$(gameId)
//     )
// `;

// const conditionalJoin = async (
//   gameId: number,
//   userId: number,
//   password: string,
// ) => {
//   const { player_count } = await db.one(CONDITIONAL_JOIN_SQL, [
//     gameId,
//     userId,
//     password,
//   ]);
//   return player_count;
// };

// const playerCount = async (gameId: number) => {
//   const { count } = await db.one(
//     "SELECT COUNT(*) FROM gamePlayers WHERE game_id = $1",
//     [gameId],
//   );
// };

// export default { create, join, conditionalJoin, playerCount };
// File: src/server/db/games/index.ts

import mongoose, { Schema, Document } from 'mongoose';

interface Card {
  suit: string;
  value: string;
  code: string;
}

export interface IGame extends Document {
  name: string;
  maxPlayers: number;
  createdBy: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  isActive: boolean;
  isStarted: boolean;
  currentTurn: mongoose.Types.ObjectId | null;
  deck: Card[];
  pot: number;
  round: 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';
  communityCards: Card[];
  playerCards: Map<string, Card[]>;
  bets: Map<string, number>;
  startTime: Date | null;
  endTime: Date | null;
  winner: mongoose.Types.ObjectId | null;
}

const gameSchema = new Schema<IGame>({
  name: { type: String, required: true },
  maxPlayers: { type: Number, required: true, default: 6 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  isStarted: { type: Boolean, default: false },
  currentTurn: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  deck: [{ 
    suit: String, 
    value: String, 
    code: String 
  }],
  pot: { type: Number, default: 0 },
  round: { 
    type: String, 
    enum: ['waiting', 'pre-flop', 'flop', 'turn', 'river', 'showdown', 'ended'],
    default: 'waiting' 
  },
  communityCards: [{ 
    suit: String, 
    value: String, 
    code: String 
  }],
  playerCards: {
    type: Map,
    of: [{
      suit: String,
      value: String,
      code: String
    }],
    default: new Map()
  },
  bets: {
    type: Map,
    of: Number,
    default: new Map()
  },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  winner: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

export const GameModel = mongoose.model<IGame>('Game', gameSchema);

export const createGame = async (gameData: Partial<IGame>) => {
  const game = new GameModel(gameData);
  await game.save();
  return game;
};

export const getGameById = async (gameId: string) => {
  return await GameModel.findById(gameId).populate('players').populate('createdBy');
};

export const updateGame = async (gameId: string, update: any) => {
  return await GameModel.findByIdAndUpdate(gameId, update, { new: true });
};

export const getAllActiveGames = async () => {
  return await GameModel.find({ isActive: true }).populate('players').populate('createdBy');
};

export const deleteGame = async (gameId: string) => {
  return await GameModel.findByIdAndUpdate(gameId, { isActive: false });
};

export const dealCards = async (gameId: string) => {
  const game = await getGameById(gameId);
  if (!game || !game.isStarted) {
    throw new Error('Game not found or not started');
  }
  
  // Deal 2 cards to each player
  const playerCards = new Map();
  const gameObj = game.toObject();
  const deck = [...gameObj.deck];
  
  for (const playerId of game.players) {
    const playerHand = [deck.pop(), deck.pop()];
    playerCards.set(playerId.toString(), playerHand);
  }
  
  // Update the game with dealt cards and remaining deck
  return await GameModel.findByIdAndUpdate(gameId, {
    playerCards,
    deck
  }, { new: true });
};