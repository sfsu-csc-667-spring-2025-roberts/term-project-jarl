// src/server/middleware/auth.ts
import express from "express";
import User from "../db/models/user";
import db from "../db/connection";

const userModel = new User(db);

export const auth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await userModel.findById(userId);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Make user available in request
    // this doesn't exist, and causes an error so I commented it out
    // req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export default auth;
