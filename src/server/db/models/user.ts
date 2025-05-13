// src/server/db/models/user.ts
import pgPromise from "pg-promise";
import bcrypt from "bcrypt";
import db from "../connection";

class User {
  private db: pgPromise.IDatabase<any>;

  constructor(db: pgPromise.IDatabase<any>) {
    this.db = db;
  }

  async create(username: string, email: string, password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Changed 'password' to 'password_hash' and 'user_id' to 'id' to match the database schema
    return this.db.one(
      "INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword],
    );
  }

  async findByEmail(email: string) {
    return this.db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
  }

  async findById(id: number) {
    // Changed user_id to id to match the database schema
    return this.db.oneOrNone(
      "SELECT id, username, email, balance FROM users WHERE id = $1",
      [id],
    );
  }

  async updatePassword(userId: number, newPassword: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Changed 'password' to 'password_hash' and 'user_id' to 'id'
    return this.db.one(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
      [hashedPassword, userId],
    );
  }

  async createPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ) {
    return this.db.one(
      "INSERT INTO password_reset_tokens(email, token, expires_at) VALUES($1, $2, $3) RETURNING id",
      [email, token, expiresAt],
    );
  }

  async findPasswordResetToken(token: string) {
    return this.db.oneOrNone(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
      [token],
    );
  }

  async deletePasswordResetToken(token: string) {
    return this.db.none("DELETE FROM password_reset_tokens WHERE token = $1", [
      token,
    ]);
  }

  // New methods for handling user balance and funds
  async addFunds(userId: number, amount: number) {
    // First check if the user has a balance
    const user = await this.db.oneOrNone(
      "SELECT id, balance FROM users WHERE id = $1",
      [userId]
    );
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return this.db.one(
      "UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2 RETURNING balance",
      [amount, userId]
    );
  }

  async getBalance(userId: number) {
    const result = await this.db.oneOrNone(
      "SELECT balance FROM users WHERE id = $1",
      [userId]
    );
    
    return result ? result.balance : 0;
  }

  async withdrawFunds(userId: number, amount: number) {
    // First check if the user has sufficient balance
    const user = await this.db.oneOrNone(
      "SELECT id, balance FROM users WHERE id = $1",
      [userId]
    );
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const currentBalance = user.balance || 0;
    
    if (currentBalance < amount) {
      throw new Error("Insufficient funds");
    }
    
    return this.db.one(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, userId]
    );
  }

  // Method to validate user's session and fetch data
  async validateAndFetchUser(userId: number) {
    const user = await this.findById(userId);
    
    if (!user) {
      return null;
    }
    
    return {
      ...user,
      balance: user.balance || 0
    };
  }
  
  // Method to update user preferences
  async updatePreferences(userId: number, preferences: any) {
    // If you have a preferences column, you can update it
    // For now, this is a placeholder for future extensions
    return this.db.one(
      "UPDATE users SET preferences = $1 WHERE id = $2 RETURNING id",
      [JSON.stringify(preferences), userId]
    );
  }
  
  // Method to get user statistics
  async getUserStats(userId: number) {
    // Get total games played, wins, etc.
    const stats = await this.db.oneOrNone(`
      SELECT 
        (SELECT COUNT(*) FROM game_players WHERE user_id = $1) as total_games,
        (SELECT COALESCE(balance, 0) FROM users WHERE id = $1) as current_balance
    `, [userId]);
    
    return stats || { total_games: 0, current_balance: 0 };
  }
}

export default User;