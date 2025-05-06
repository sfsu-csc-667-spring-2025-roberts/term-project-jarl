// import bcrypt from "bcrypt";
// import crypto from "crypto";

// import db from "../connection";

// const register = async (email: string, password: string) => {
//   const sql =
//     "INSERT INTO users (email, password, gravatar) VALUES ($1, $2, $3) RETURNING id, gravatar";

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const { id, gravatar } = await db.one(sql, [
//     email,
//     hashedPassword,
//     crypto.createHash("sha256").update(email).digest("hex"),
//   ]);

//   return { id, gravatar, email };
// };

// const login = async (email: string, password: string) => {
//   const sql = "SELECT * FROM users WHERE email = $1";

//   const {
//     id,
//     gravatar,
//     password: encryptedPassword,
//   } = await db.one(sql, [email]);

//   const isValidPassword = await bcrypt.compare(password, encryptedPassword);

//   if (!isValidPassword) {
//     throw new Error("Invalid credentials, try again.");
//   }

//   return { id, gravatar, email };
// };

// export default { register, login };
// File: src/server/db/users/index.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  gravatar?: string;
  chips: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gravatar: { type: String },
  chips: { type: Number, default: 1000 },
}, {
  timestamps: true
});

export const UserModel = mongoose.model<IUser>('User', userSchema);

export const createUser = async (userData: Partial<IUser>) => {
  const user = new UserModel(userData);
  await user.save();
  return user;
};

export const getUserById = async (userId: string) => {
  return await UserModel.findById(userId);
};

export const getUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email });
};

export const getUserByUsername = async (username: string) => {
  return await UserModel.findOne({ username });
};

export const updateUser = async (userId: string, update: Partial<IUser>) => {
  return await UserModel.findByIdAndUpdate(userId, update, { new: true });
};