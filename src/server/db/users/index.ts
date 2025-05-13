import db from "../connection";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// Create a user
export const createUser = async (username: string, email: string, password: string) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  try {
    return await db.one(
      "INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Find user by email
export const findUserByEmail = async (email: string) => {
  try {
    return await db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

// Find user by ID
export const findUserById = async (id: number) => {
  try {
    return await db.oneOrNone(
      "SELECT id, username, email FROM users WHERE id = $1",
      [id]
    );
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
};

// Update password
export const updatePassword = async (userId: number, newPassword: string) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  try {
    return await db.one(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
      [hashedPassword, userId]
    );
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  updatePassword
};