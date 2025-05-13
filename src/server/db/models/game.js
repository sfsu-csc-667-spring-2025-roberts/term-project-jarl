"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerAction = exports.RoundState = exports.GameState = void 0;
const connection_1 = __importDefault(require("../connection"));
var GameState;
(function (GameState) {
    GameState["WAITING"] = "waiting";
    GameState["ACTIVE"] = "active";
    GameState["FINISHED"] = "finished";
})(GameState || (exports.GameState = GameState = {}));
var RoundState;
(function (RoundState) {
    RoundState["PREFLOP"] = "preflop";
    RoundState["FLOP"] = "flop";
    RoundState["TURN"] = "turn";
    RoundState["RIVER"] = "river";
    RoundState["SHOWDOWN"] = "showdown";
})(RoundState || (exports.RoundState = RoundState = {}));
var PlayerAction;
(function (PlayerAction) {
    PlayerAction["FOLD"] = "fold";
    PlayerAction["CHECK"] = "check";
    PlayerAction["CALL"] = "call";
    PlayerAction["BET"] = "bet";
    PlayerAction["RAISE"] = "raise";
    PlayerAction["ALL_IN"] = "all_in";
})(PlayerAction || (exports.PlayerAction = PlayerAction = {}));
const GameModel = {
    create: (name, max_players, created_by) => connection_1.default.one("INSERT INTO games(name, max_players, current_players, state, created_by) VALUES($1, $2, 1, $3, $4) RETURNING id", [name, max_players, GameState.WAITING, created_by]),
    findById: (id) => connection_1.default.oneOrNone("SELECT * FROM games WHERE id=$1", [id]),
    findActiveGames: () => connection_1.default.any("SELECT * FROM games WHERE state=$1 OR state=$2", [
        GameState.WAITING,
        GameState.ACTIVE
    ]),
    addPlayer: (game_id, user_id, seat_position) => connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        yield t.none("INSERT INTO game_players(game_id, user_id, seat_position, chips, is_active, current_bet) VALUES($1, $2, $3, $4, $5, $6)", [game_id, user_id, seat_position, 1000, true, 0]);
        return t.one("UPDATE games SET current_players = current_players + 1 WHERE id=$1 RETURNING current_players", [game_id]);
    })),
    removePlayer: (game_id, user_id) => connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        yield t.none("DELETE FROM game_players WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
        const { current_players } = yield t.one("UPDATE games SET current_players = current_players - 1 WHERE id=$1 RETURNING current_players", [game_id]);
        if (current_players === 0) {
            yield t.none("UPDATE games SET state=$1 WHERE id=$2", [
                GameState.FINISHED,
                game_id
            ]);
        }
        return current_players;
    })),
    getPlayers: (game_id) => connection_1.default.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]),
    startGame: (game_id) => connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Set game state to active
        yield t.none("UPDATE games SET state=$1 WHERE id=$2", [
            GameState.ACTIVE,
            game_id
        ]);
        // Get players in the game
        const players = yield t.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]);
        // Determine dealer position (random for first round)
        const dealerPosition = Math.floor(Math.random() * players.length);
        const smallBlindPosition = (dealerPosition + 1) % players.length;
        const bigBlindPosition = (dealerPosition + 2) % players.length;
        // Create first game round
        return t.one(`INSERT INTO game_rounds(
          game_id, round_number, dealer_position, small_blind_position, 
          big_blind_position, current_player_position, pot, community_cards, round_state
        ) VALUES($1, 1, $2, $3, $4, $5, 0, '[]', $6) RETURNING *`, [
            game_id,
            dealerPosition,
            smallBlindPosition,
            bigBlindPosition,
            (bigBlindPosition + 1) % players.length,
            RoundState.PREFLOP
        ]);
    })),
    getCurrentRound: (game_id) => connection_1.default.oneOrNone("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]),
    updatePlayerAction: (game_id, user_id, action, amount = 0) => connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        const currentRound = yield t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
        const player = yield t.one("SELECT * FROM game_players WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
        // Process player action based on action type
        switch (action) {
            case PlayerAction.FOLD:
                yield t.none("UPDATE game_players SET is_active=false WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
                break;
            case PlayerAction.CHECK:
                // No changes to player chips or current bet
                break;
            case PlayerAction.CALL:
                const activePlayersWithBets = yield t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true", [game_id]);
                const highestBet = Math.max(...activePlayersWithBets.map((p) => p.current_bet));
                const callAmount = highestBet - player.current_bet;
                yield t.none("UPDATE game_players SET chips=chips-$1, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [callAmount, game_id, user_id]);
                yield t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [callAmount, game_id, currentRound.round_number]);
                break;
            case PlayerAction.BET:
            case PlayerAction.RAISE:
                yield t.none("UPDATE game_players SET chips=chips-$1, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [amount, game_id, user_id]);
                yield t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [amount, game_id, currentRound.round_number]);
                break;
            case PlayerAction.ALL_IN:
                const allInAmount = player.chips;
                yield t.none("UPDATE game_players SET chips=0, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [allInAmount, game_id, user_id]);
                yield t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [allInAmount, game_id, currentRound.round_number]);
                break;
        }
        // Move to next player
        const activePlayers = yield t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true ORDER BY seat_position", [game_id]);
        if (activePlayers.length <= 1) {
            // Only one player left, they win
            return t.none("UPDATE game_rounds SET round_state=$1 WHERE game_id=$2 AND round_number=$3", [RoundState.SHOWDOWN, game_id, currentRound.round_number]);
        }
        const currentPlayerIndex = activePlayers.findIndex((p) => p.seat_position === currentRound.current_player_position);
        const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        const nextPlayerPosition = activePlayers[nextPlayerIndex].seat_position;
        return t.none("UPDATE game_rounds SET current_player_position=$1 WHERE game_id=$2 AND round_number=$3", [nextPlayerPosition, game_id, currentRound.round_number]);
    })),
    dealCards: (game_id) => connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Get active players
        const players = yield t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true ORDER BY seat_position", [game_id]);
        // Create a deck
        const suits = ["h", "d", "c", "s"]; // hearts, diamonds, clubs, spades
        const values = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
        let deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push(value + suit);
            }
        }
        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        // Deal cards to players
        for (const player of players) {
            const cards = [deck.pop(), deck.pop()];
            yield t.none("UPDATE game_players SET cards=$1 WHERE game_id=$2 AND user_id=$3", [JSON.stringify(cards), game_id, player.user_id]);
        }
        // Reserve community cards
        const communityCards = [
            deck.pop(),
            deck.pop(),
            deck.pop(),
            deck.pop(),
            deck.pop()
        ];
        return t.none("UPDATE game_rounds SET community_cards=$1 WHERE game_id=$2 AND round_number=(SELECT MAX(round_number) FROM game_rounds WHERE game_id=$2)", [JSON.stringify(communityCards), game_id]);
    })),
    // Added missing methods that were causing errors
    // -----------------------------------------------------------------
    isRoundComplete: (game_id) => __awaiter(void 0, void 0, void 0, function* () {
        return connection_1.default.task((t) => __awaiter(void 0, void 0, void 0, function* () {
            const round = yield t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            if (round.round_state === RoundState.SHOWDOWN) {
                return true;
            }
            const activePlayers = yield t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true", [game_id]);
            if (activePlayers.length <= 1) {
                return true;
            }
            // Check if all active players have the same bet amount
            const bets = activePlayers.map((p) => p.current_bet);
            const maxBet = Math.max(...bets);
            // If any player has a different bet amount, the round is not complete
            return bets.every((bet) => bet === maxBet);
        }));
    }),
    determineWinner: (game_id) => __awaiter(void 0, void 0, void 0, function* () {
        return connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
            const round = yield t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            const players = yield t.any("SELECT gp.*, u.username FROM game_players gp JOIN users u ON gp.user_id = u.id WHERE gp.game_id=$1 AND gp.is_active=true", [game_id]);
            if (players.length === 1) {
                // Only one player left - they win automatically
                yield t.none("UPDATE game_players SET chips=chips+$1 WHERE game_id=$2 AND user_id=$3", [round.pot, game_id, players[0].user_id]);
                return {
                    winner: players[0],
                    pot: round.pot,
                    type: "last-player-standing"
                };
            }
            // In a real poker game, we would evaluate hands here
            // For simplicity in this example, randomly choose a winner
            const winnerIndex = Math.floor(Math.random() * players.length);
            const winner = players[winnerIndex];
            yield t.none("UPDATE game_players SET chips=chips+$1 WHERE game_id=$2 AND user_id=$3", [round.pot, game_id, winner.user_id]);
            return {
                winner,
                pot: round.pot,
                type: "showdown"
            };
        }));
    }),
    startNewRound: (game_id) => __awaiter(void 0, void 0, void 0, function* () {
        return connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
            const previousRound = yield t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            const players = yield t.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]);
            // Rotate dealer position
            const newDealerPosition = (previousRound.dealer_position + 1) % players.length;
            const newSmallBlindPosition = (newDealerPosition + 1) % players.length;
            const newBigBlindPosition = (newDealerPosition + 2) % players.length;
            // Reset player states
            yield t.none("UPDATE game_players SET is_active=true, current_bet=0, cards=NULL WHERE game_id=$1", [game_id]);
            // Create new round
            const newRound = yield t.one(`INSERT INTO game_rounds(
          game_id, round_number, dealer_position, small_blind_position, 
          big_blind_position, current_player_position, pot, community_cards, round_state
        ) VALUES($1, $2, $3, $4, $5, $6, 0, '[]', $7) RETURNING *`, [
                game_id,
                previousRound.round_number + 1,
                newDealerPosition,
                newSmallBlindPosition,
                newBigBlindPosition,
                (newBigBlindPosition + 1) % players.length,
                RoundState.PREFLOP
            ]);
            // Post blinds
            const smallBlindPlayer = players.find((p) => p.seat_position === newSmallBlindPosition);
            const bigBlindPlayer = players.find((p) => p.seat_position === newBigBlindPosition);
            const smallBlindAmount = 5;
            const bigBlindAmount = 10;
            // Post small blind
            yield t.none("UPDATE game_players SET chips=chips-$1, current_bet=$1 WHERE game_id=$2 AND user_id=$3", [smallBlindAmount, game_id, smallBlindPlayer.user_id]);
            // Post big blind
            yield t.none("UPDATE game_players SET chips=chips-$1, current_bet=$1 WHERE game_id=$2 AND user_id=$3", [bigBlindAmount, game_id, bigBlindPlayer.user_id]);
            // Update pot
            yield t.none("UPDATE game_rounds SET pot=$1 WHERE game_id=$2 AND round_number=$3", [smallBlindAmount + bigBlindAmount, game_id, newRound.round_number]);
            return newRound;
        }));
    }),
    advanceRoundState: (game_id) => __awaiter(void 0, void 0, void 0, function* () {
        return connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
            const currentRound = yield t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            const communityCards = JSON.parse(currentRound.community_cards);
            let newState;
            let visibleCards = [];
            switch (currentRound.round_state) {
                case RoundState.PREFLOP:
                    newState = RoundState.FLOP;
                    visibleCards = communityCards.slice(0, 3);
                    break;
                case RoundState.FLOP:
                    newState = RoundState.TURN;
                    visibleCards = communityCards.slice(0, 4);
                    break;
                case RoundState.TURN:
                    newState = RoundState.RIVER;
                    visibleCards = communityCards.slice(0, 5);
                    break;
                case RoundState.RIVER:
                    newState = RoundState.SHOWDOWN;
                    visibleCards = communityCards;
                    break;
                default:
                    throw new Error("Invalid round state");
            }
            // Reset all player bets for the new betting round
            if (newState !== RoundState.SHOWDOWN) {
                yield t.none("UPDATE game_players SET current_bet=0 WHERE game_id=$1", [game_id]);
            }
            yield t.none("UPDATE game_rounds SET round_state=$1, community_cards=$2 WHERE game_id=$3 AND round_number=$4", [newState, JSON.stringify(visibleCards), game_id, currentRound.round_number]);
            return {
                newState,
                visibleCards
            };
        }));
    })
};
exports.default = GameModel;
