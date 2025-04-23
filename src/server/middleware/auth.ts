// src/server/middleware/auth.ts
import express from "express";
import User from "../db/models/user";
import pool from "../db/connection";

const userModel = new User(pool);

export const requireAuth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Authentication required" });
    }

    // Make user available in request
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
