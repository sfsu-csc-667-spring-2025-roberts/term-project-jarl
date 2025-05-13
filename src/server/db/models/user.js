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
const bcrypt_1 = __importDefault(require("bcrypt"));
class User {
    constructor(db) {
        this.db = db;
    }
    create(username, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
            // Changed 'password' to 'password_hash' and 'user_id' to 'id' to match the database schema
            return this.db.one("INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email", [username, email, hashedPassword]);
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Changed user_id to id to match the database schema
            return this.db.oneOrNone("SELECT id, username, email, balance FROM users WHERE id = $1", [id]);
        });
    }
    updatePassword(userId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, saltRounds);
            // Changed 'password' to 'password_hash' and 'user_id' to 'id'
            return this.db.one("UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id", [hashedPassword, userId]);
        });
    }
    createPasswordResetToken(email, token, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.one("INSERT INTO password_reset_tokens(email, token, expires_at) VALUES($1, $2, $3) RETURNING id", [email, token, expiresAt]);
        });
    }
    findPasswordResetToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.oneOrNone("SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()", [token]);
        });
    }
    deletePasswordResetToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.none("DELETE FROM password_reset_tokens WHERE token = $1", [
                token,
            ]);
        });
    }
    // New methods for handling user balance and funds
    addFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if the user has a balance
            const user = yield this.db.oneOrNone("SELECT id, balance FROM users WHERE id = $1", [userId]);
            if (!user) {
                throw new Error("User not found");
            }
            return this.db.one("UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2 RETURNING balance", [amount, userId]);
        });
    }
    getBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.oneOrNone("SELECT balance FROM users WHERE id = $1", [userId]);
            return result ? result.balance : 0;
        });
    }
    withdrawFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if the user has sufficient balance
            const user = yield this.db.oneOrNone("SELECT id, balance FROM users WHERE id = $1", [userId]);
            if (!user) {
                throw new Error("User not found");
            }
            const currentBalance = user.balance || 0;
            if (currentBalance < amount) {
                throw new Error("Insufficient funds");
            }
            return this.db.one("UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance", [amount, userId]);
        });
    }
    // Method to validate user's session and fetch data
    validateAndFetchUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findById(userId);
            if (!user) {
                return null;
            }
            return Object.assign(Object.assign({}, user), { balance: user.balance || 0 });
        });
    }
    // Method to update user preferences
    updatePreferences(userId, preferences) {
        return __awaiter(this, void 0, void 0, function* () {
            // If you have a preferences column, you can update it
            // For now, this is a placeholder for future extensions
            return this.db.one("UPDATE users SET preferences = $1 WHERE id = $2 RETURNING id", [JSON.stringify(preferences), userId]);
        });
    }
    // Method to get user statistics
    getUserStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get total games played, wins, etc.
            const stats = yield this.db.oneOrNone(`
      SELECT 
        (SELECT COUNT(*) FROM game_players WHERE user_id = $1) as total_games,
        (SELECT COALESCE(balance, 0) FROM users WHERE id = $1) as current_balance
    `, [userId]);
            return stats || { total_games: 0, current_balance: 0 };
        });
    }
}
exports.default = User;
