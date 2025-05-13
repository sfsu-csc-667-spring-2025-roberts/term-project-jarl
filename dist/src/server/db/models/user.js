"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
class User {
    constructor(db) {
        this.db = db;
    }
    async create(username, email, password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        return this.db.one("INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email", [username, email, hashedPassword]);
    }
    async findByEmail(email) {
        return this.db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
    }
    async findById(id) {
        return this.db.oneOrNone("SELECT id, username, email, balance FROM users WHERE id = $1", [id]);
    }
    async updatePassword(userId, newPassword) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
        return this.db.one("UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id", [hashedPassword, userId]);
    }
    async createPasswordResetToken(email, token, expiresAt) {
        return this.db.one("INSERT INTO password_reset_tokens(email, token, expires_at) VALUES($1, $2, $3) RETURNING id", [email, token, expiresAt]);
    }
    async findPasswordResetToken(token) {
        return this.db.oneOrNone("SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()", [token]);
    }
    async deletePasswordResetToken(token) {
        return this.db.none("DELETE FROM password_reset_tokens WHERE token = $1", [
            token,
        ]);
    }
    async addFunds(userId, amount) {
        const user = await this.db.oneOrNone("SELECT id, balance FROM users WHERE id = $1", [userId]);
        if (!user) {
            throw new Error("User not found");
        }
        return this.db.one("UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2 RETURNING balance", [amount, userId]);
    }
    async getBalance(userId) {
        const result = await this.db.oneOrNone("SELECT balance FROM users WHERE id = $1", [userId]);
        return result ? result.balance : 0;
    }
    async withdrawFunds(userId, amount) {
        const user = await this.db.oneOrNone("SELECT id, balance FROM users WHERE id = $1", [userId]);
        if (!user) {
            throw new Error("User not found");
        }
        const currentBalance = user.balance || 0;
        if (currentBalance < amount) {
            throw new Error("Insufficient funds");
        }
        return this.db.one("UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance", [amount, userId]);
    }
    async validateAndFetchUser(userId) {
        const user = await this.findById(userId);
        if (!user) {
            return null;
        }
        return Object.assign(Object.assign({}, user), { balance: user.balance || 0 });
    }
    async updatePreferences(userId, preferences) {
        return this.db.one("UPDATE users SET preferences = $1 WHERE id = $2 RETURNING id", [JSON.stringify(preferences), userId]);
    }
    async getUserStats(userId) {
        const stats = await this.db.oneOrNone(`
      SELECT 
        (SELECT COUNT(*) FROM game_players WHERE user_id = $1) as total_games,
        (SELECT COALESCE(balance, 0) FROM users WHERE id = $1) as current_balance
    `, [userId]);
        return stats || { total_games: 0, current_balance: 0 };
    }
}
exports.default = User;
//# sourceMappingURL=user.js.map