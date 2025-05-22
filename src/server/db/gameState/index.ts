import pgPromise from "pg-promise";

const CREATE_GAME_STATE_TABLE = `INSERT INTO game_state (game_id, pot, current_turn, num_players, dealer, current_bet)
    VALUES ($1, $2, $3, $4, $5, $6)`;
const GET_PLAYER_STACK = `SELECT stack FROM "gamePlayers" WHERE game_id = $1 AND user_id = $2`;
const UPDATE_PLAYER_STACK = `UPDATE "gamePlayers" SET stack = stack - $1 WHERE game_id = $2 AND user_id = $3`;
const FOLD_PLAYER = `UPDATE "gamePlayers" SET is_in_hand = false WHERE game_id = $1 AND user_id = $2`;
const UPDATE_POT = `UPDATE game_state SET pot = $1, current_turn = $2, dealer = $3, last_raiser = $4, current_bet = $5 WHERE game_id = $6`;
const GET_GAME_STATE = `SELECT * FROM game_state WHERE game_id = $1`;

class GameState {
  private db: pgPromise.IDatabase<any>;
  private pot: number;
  private currentTurn: number;
  private numPlayers: number;
  private dealer: number;
  private lastRaiser: number | null;
  private currentBet: number;

  constructor(db: pgPromise.IDatabase<any>, numPlayers: number) {
    this.db = db;
    this.pot = 0;
    this.currentTurn = 1;
    this.numPlayers = numPlayers;
    this.dealer = numPlayers;
    this.lastRaiser = null;
    this.currentBet = 1;
  }

  async createGameState(gameId: number): Promise<void> {
    await this.db.none(CREATE_GAME_STATE_TABLE, [
      gameId,
      this.pot,
      this.currentTurn,
      this.numPlayers,
      this.dealer,
      this.currentBet,
    ]);
  }

  async call(playerId: number, gameId: number): Promise<void> {
    const playerStack = await this.db.one(GET_PLAYER_STACK, [gameId, playerId]);

    const currentBet = this.currentBet;

    if (playerStack.stack >= currentBet) {
      await this.db.none(UPDATE_PLAYER_STACK, [currentBet, gameId, playerId]);

      this.addToPot(currentBet);
    } else {
      throw new Error("Not enough chips to call");
    }
  }

  async raise(playerId: number, gameId: number, amount: number): Promise<void> {
    const playerStack = await this.db.one(GET_PLAYER_STACK, [gameId, playerId]);

    const currentBet = this.currentBet;
    const totalBet = currentBet + amount;
    if (playerStack.stack >= totalBet && amount >= currentBet) {
      await this.db.none(UPDATE_PLAYER_STACK, [totalBet, gameId, playerId]);
      this.pot += totalBet;
      this.currentBet = totalBet;
      this.lastRaiser = playerId;
    } else {
      throw new Error("Not enough chips to raise");
    }
  }

  async fold(playerId: number, gameId: number): Promise<void> {
    await this.db.none(FOLD_PLAYER, [gameId, playerId]);
  }

  async save(gameId: number) {
    await this.db.none(UPDATE_POT, [
      this.pot,
      this.currentTurn,
      this.dealer,
      this.lastRaiser,
      this.currentBet,
      gameId,
    ]);
  }

  static async load(
    db: pgPromise.IDatabase<any>,
    gameId: number,
  ): Promise<GameState> {
    const row = await db.one(GET_GAME_STATE, [gameId]);
    const state = new GameState(db, row.num_players);
    state.pot = row.pot;
    state.currentTurn = row.current_turn;
    state.dealer = row.dealer;
    state.lastRaiser = row.last_raiser;
    state.currentBet = row.current_bet;

    return state;
  }

  getPot(): number {
    return this.pot;
  }

  getCurrentTurn(): number {
    return this.currentTurn;
  }

  getNumPlayers(): number {
    return this.numPlayers;
  }

  getDealer(): number {
    return this.dealer;
  }

  getLastRaiser(): number | null {
    return this.lastRaiser;
  }

  getCurrentBet(): number {
    return this.currentBet;
  }

  addToPot(pot: number): void {
    this.pot += pot;
  }

  resetPot(): void {
    this.pot = 0;
  }

  nextTurn(): void {
    this.currentTurn = (this.currentTurn + 1) % this.numPlayers;
  }

  nextDealer(): void {
    this.dealer = (this.dealer + 1) % this.numPlayers;
  }

  setLastRaiser(playerId: number): void {
    this.lastRaiser = playerId;
  }

  resetLastRaiser(): void {
    this.lastRaiser = null;
  }
}

export default GameState;
