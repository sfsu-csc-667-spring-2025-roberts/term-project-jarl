// src/server/routes/lobby.ts
import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  // Type assertion for session
  const session = req.session as any;
  
  if (!session || !session.userId) {
    return res.redirect("/signin");
  }

  res.render("realLobby");
});

export default router;