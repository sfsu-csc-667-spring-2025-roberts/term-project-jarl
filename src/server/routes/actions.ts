import express, { Request, Response } from "express";
import db from "../db/connection";
import { GameState } from "../db";

const router = express.Router();

// @ts-ignore
router.post("/:gameId/call", async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const numericGameId = Number(gameId);

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const gameState = await GameState.load(db, numericGameId);
    await gameState.call(userId, numericGameId);
    await gameState.save(numericGameId);

    if (gameState) {
      res.status(200).json({
        pot: gameState.getPot(),
        currentTurn: gameState.getCurrentTurn(),
        numPlayers: gameState.getNumPlayers(),
        dealer: gameState.getDealer(),
        lastRaiser: gameState.getLastRaiser(),
        currentBet: gameState.getCurrentBet(),
      });
      console.log("Game state after call:", gameState);
    } else {
      res.status(400).json({ error: "Failed to call" });
    }
  } catch (error) {
    console.error("Error calling in game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @ts-ignore
router.post("/:gameId/raise", async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const numericGameId = Number(gameId);
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  try {
    const gameState = await GameState.load(db, numericGameId);
    await gameState.raise(userId, numericGameId, amount);
    await gameState.save(numericGameId);

    if (gameState) {
      res.status(200).json({
        pot: gameState.getPot(),
        currentTurn: gameState.getCurrentTurn(),
        numPlayers: gameState.getNumPlayers(),
        dealer: gameState.getDealer(),
        lastRaiser: gameState.getLastRaiser(),
        currentBet: gameState.getCurrentBet(),
      });
    } else {
      res.status(400).json({ error: "Failed to raise" });
    }
  } catch (error) {
    console.error("Error raising in game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @ts-ignore
router.post("/:gameId/fold", async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const numericGameId = Number(gameId);

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const gameState = await GameState.load(db, numericGameId);
    await gameState.fold(userId, numericGameId);
    await gameState.save(numericGameId);

    if (gameState) {
      res.status(200).json({
        pot: gameState.getPot(),
        currentTurn: gameState.getCurrentTurn(),
        numPlayers: gameState.getNumPlayers(),
        dealer: gameState.getDealer(),
        lastRaiser: gameState.getLastRaiser(),
        currentBet: gameState.getCurrentBet(),
      });
    } else {
      res.status(400).json({ error: "Failed to fold" });
    }
  } catch (error) {
    console.error("Error folding in game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
