"use strict";
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
    addPlayer: (game_id, user_id, seat_position) => connection_1.default.tx(async (t) => {
        await t.none("INSERT INTO game_players(game_id, user_id, seat_position, chips, is_active, current_bet) VALUES($1, $2, $3, $4, $5, $6)", [game_id, user_id, seat_position, 1000, true, 0]);
        return t.one("UPDATE games SET current_players = current_players + 1 WHERE id=$1 RETURNING current_players", [game_id]);
    }),
    removePlayer: (game_id, user_id) => connection_1.default.tx(async (t) => {
        await t.none("DELETE FROM game_players WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
        const { current_players } = await t.one("UPDATE games SET current_players = current_players - 1 WHERE id=$1 RETURNING current_players", [game_id]);
        if (current_players === 0) {
            await t.none("UPDATE games SET state=$1 WHERE id=$2", [
                GameState.FINISHED,
                game_id
            ]);
        }
        return current_players;
    }),
    getPlayers: (game_id) => connection_1.default.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]),
    startGame: (game_id) => connection_1.default.tx(async (t) => {
        await t.none("UPDATE games SET state=$1 WHERE id=$2", [
            GameState.ACTIVE,
            game_id
        ]);
        const players = await t.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]);
        const dealerPosition = Math.floor(Math.random() * players.length);
        const smallBlindPosition = (dealerPosition + 1) % players.length;
        const bigBlindPosition = (dealerPosition + 2) % players.length;
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
    }),
    getCurrentRound: (game_id) => connection_1.default.oneOrNone("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]),
    updatePlayerAction: (game_id, user_id, action, amount = 0) => connection_1.default.tx(async (t) => {
        const currentRound = await t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
        const player = await t.one("SELECT * FROM game_players WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
        switch (action) {
            case PlayerAction.FOLD:
                await t.none("UPDATE game_players SET is_active=false WHERE game_id=$1 AND user_id=$2", [game_id, user_id]);
                break;
            case PlayerAction.CHECK:
                break;
            case PlayerAction.CALL:
                const activePlayersWithBets = await t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true", [game_id]);
                const highestBet = Math.max(...activePlayersWithBets.map((p) => p.current_bet));
                const callAmount = highestBet - player.current_bet;
                await t.none("UPDATE game_players SET chips=chips-$1, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [callAmount, game_id, user_id]);
                await t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [callAmount, game_id, currentRound.round_number]);
                break;
            case PlayerAction.BET:
            case PlayerAction.RAISE:
                await t.none("UPDATE game_players SET chips=chips-$1, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [amount, game_id, user_id]);
                await t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [amount, game_id, currentRound.round_number]);
                break;
            case PlayerAction.ALL_IN:
                const allInAmount = player.chips;
                await t.none("UPDATE game_players SET chips=0, current_bet=current_bet+$1 WHERE game_id=$2 AND user_id=$3", [allInAmount, game_id, user_id]);
                await t.none("UPDATE game_rounds SET pot=pot+$1 WHERE game_id=$2 AND round_number=$3", [allInAmount, game_id, currentRound.round_number]);
                break;
        }
        const activePlayers = await t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true ORDER BY seat_position", [game_id]);
        if (activePlayers.length <= 1) {
            return t.none("UPDATE game_rounds SET round_state=$1 WHERE game_id=$2 AND round_number=$3", [RoundState.SHOWDOWN, game_id, currentRound.round_number]);
        }
        const currentPlayerIndex = activePlayers.findIndex((p) => p.seat_position === currentRound.current_player_position);
        const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        const nextPlayerPosition = activePlayers[nextPlayerIndex].seat_position;
        return t.none("UPDATE game_rounds SET current_player_position=$1 WHERE game_id=$2 AND round_number=$3", [nextPlayerPosition, game_id, currentRound.round_number]);
    }),
    dealCards: (game_id) => connection_1.default.tx(async (t) => {
        const players = await t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true ORDER BY seat_position", [game_id]);
        const suits = ["h", "d", "c", "s"];
        const values = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
        let deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push(value + suit);
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        for (const player of players) {
            const cards = [deck.pop(), deck.pop()];
            await t.none("UPDATE game_players SET cards=$1 WHERE game_id=$2 AND user_id=$3", [JSON.stringify(cards), game_id, player.user_id]);
        }
        const communityCards = [
            deck.pop(),
            deck.pop(),
            deck.pop(),
            deck.pop(),
            deck.pop()
        ];
        return t.none("UPDATE game_rounds SET community_cards=$1 WHERE game_id=$2 AND round_number=(SELECT MAX(round_number) FROM game_rounds WHERE game_id=$2)", [JSON.stringify(communityCards), game_id]);
    }),
    isRoundComplete: async (game_id) => {
        return connection_1.default.task(async (t) => {
            const round = await t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            if (round.round_state === RoundState.SHOWDOWN) {
                return true;
            }
            const activePlayers = await t.any("SELECT * FROM game_players WHERE game_id=$1 AND is_active=true", [game_id]);
            if (activePlayers.length <= 1) {
                return true;
            }
            const bets = activePlayers.map((p) => p.current_bet);
            const maxBet = Math.max(...bets);
            return bets.every((bet) => bet === maxBet);
        });
    },
    determineWinner: async (game_id) => {
        return connection_1.default.tx(async (t) => {
            const round = await t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            const players = await t.any("SELECT gp.*, u.username FROM game_players gp JOIN users u ON gp.user_id = u.id WHERE gp.game_id=$1 AND gp.is_active=true", [game_id]);
            if (players.length === 1) {
                await t.none("UPDATE game_players SET chips=chips+$1 WHERE game_id=$2 AND user_id=$3", [round.pot, game_id, players[0].user_id]);
                return {
                    winner: players[0],
                    pot: round.pot,
                    type: "last-player-standing"
                };
            }
            const winnerIndex = Math.floor(Math.random() * players.length);
            const winner = players[winnerIndex];
            await t.none("UPDATE game_players SET chips=chips+$1 WHERE game_id=$2 AND user_id=$3", [round.pot, game_id, winner.user_id]);
            return {
                winner,
                pot: round.pot,
                type: "showdown"
            };
        });
    },
    startNewRound: async (game_id) => {
        return connection_1.default.tx(async (t) => {
            const previousRound = await t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
            const players = await t.any("SELECT * FROM game_players WHERE game_id=$1 ORDER BY seat_position", [game_id]);
            const newDealerPosition = (previousRound.dealer_position + 1) % players.length;
            const newSmallBlindPosition = (newDealerPosition + 1) % players.length;
            const newBigBlindPosition = (newDealerPosition + 2) % players.length;
            await t.none("UPDATE game_players SET is_active=true, current_bet=0, cards=NULL WHERE game_id=$1", [game_id]);
            const newRound = await t.one(`INSERT INTO game_rounds(
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
            const smallBlindPlayer = players.find((p) => p.seat_position === newSmallBlindPosition);
            const bigBlindPlayer = players.find((p) => p.seat_position === newBigBlindPosition);
            const smallBlindAmount = 5;
            const bigBlindAmount = 10;
            await t.none("UPDATE game_players SET chips=chips-$1, current_bet=$1 WHERE game_id=$2 AND user_id=$3", [smallBlindAmount, game_id, smallBlindPlayer.user_id]);
            await t.none("UPDATE game_players SET chips=chips-$1, current_bet=$1 WHERE game_id=$2 AND user_id=$3", [bigBlindAmount, game_id, bigBlindPlayer.user_id]);
            await t.none("UPDATE game_rounds SET pot=$1 WHERE game_id=$2 AND round_number=$3", [smallBlindAmount + bigBlindAmount, game_id, newRound.round_number]);
            return newRound;
        });
    },
    advanceRoundState: async (game_id) => {
        return connection_1.default.tx(async (t) => {
            const currentRound = await t.one("SELECT * FROM game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [game_id]);
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
            if (newState !== RoundState.SHOWDOWN) {
                await t.none("UPDATE game_players SET current_bet=0 WHERE game_id=$1", [game_id]);
            }
            await t.none("UPDATE game_rounds SET round_state=$1, community_cards=$2 WHERE game_id=$3 AND round_number=$4", [newState, JSON.stringify(visibleCards), game_id, currentRound.round_number]);
            return {
                newState,
                visibleCards
            };
        });
    }
};
exports.default = GameModel;
//# sourceMappingURL=game.js.map