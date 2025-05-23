// src/server/db/models/user.ts
import pgPromise from "pg-promise";
import bcrypt from "bcrypt";

class User {
  private db: pgPromise.IDatabase<any>;

  constructor(db: pgPromise.IDatabase<any>) {
    this.db = db;
  }

  async create(username: string, email: string, password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return this.db.one(
      "INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING user_id, username, email",
      [username, email, hashedPassword],
    );
  }

  async findByEmail(email: string) {
    return this.db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
  }

  async findById(id: number) {
    return this.db.oneOrNone(
      "SELECT user_id, username, email FROM users WHERE user_id = $1",
      [id],
    );
  }

  async updatePassword(userId: number, newPassword: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    return this.db.one(
      "UPDATE users SET password = $1 WHERE user_id = $2 RETURNING user_id",
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

  async getFunds(userId: number) {
    return this.db.oneOrNone("SELECT funds FROM users WHERE user_id = $1", [
      userId,
    ]);
  }

  async addFunds(userId: number, amount: number) {
    return this.db.one(
      "UPDATE users SET funds = funds + $1 WHERE user_id = $2 RETURNING funds",
      [amount, userId],
    );
  }
}

export default User;
