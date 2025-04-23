// src/server/db/models/user.ts
import { Pool } from "pg";
import bcrypt from "bcrypt";

class User {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(username: string, email: string, password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = {
      text: "INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING id, username, email",
      values: [username, email, hashedPassword],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async findById(id: number) {
    const query = {
      text: "SELECT id, username, email FROM users WHERE id = $1",
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async updatePassword(userId: number, newPassword: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = {
      text: "UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
      values: [hashedPassword, userId],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async createPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ) {
    const query = {
      text: "INSERT INTO password_reset_tokens(email, token, expires_at) VALUES($1, $2, $3) RETURNING id",
      values: [email, token, expiresAt],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async findPasswordResetToken(token: string) {
    const query = {
      text: "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
      values: [token],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async deletePasswordResetToken(token: string) {
    const query = {
      text: "DELETE FROM password_reset_tokens WHERE token = $1",
      values: [token],
    };

    await this.pool.query(query);
  }
}

export default User;
