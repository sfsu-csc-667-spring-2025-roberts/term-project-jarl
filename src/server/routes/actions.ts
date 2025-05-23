import express, { Request, Response } from "express";
import db from "../db/connection";
import { GameState } from "../db";
import { Server } from "socket.io";

const router = express.Router();

const emitGameUpdate = async (
  res: Response,
  io: Server,
  gameId: string,
  gameState: GameState,
) => {
  res.status(200).json({
    pot: gameState.getPot(),
    currentTurn: gameState.getCurrentTurn(),
    numPlayers: gameState.getNumPlayers(),
    dealer: gameState.getDealer(),
    lastRaiser: gameState.getLastRaiser(),
    currentBet: gameState.getCurrentBet(),
  });

  io.to(gameId).emit(`game:${gameId}:update`, {
    pot: gameState.getPot(),
    currentTurn: gameState.getCurrentTurn(),
    currentBet: gameState.getCurrentBet(),
  });
};

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

    const playerStack = await gameState.getPlayerStack(userId, numericGameId);

    // Add pot update emission
    const io = req.app.get("io");
    io.to(gameId).emit(`game:${gameId}:pot-updated`, gameState.getPot());
    io.to(gameId).emit(`game:${gameId}:stack-updated`, playerStack);

    if (gameState) {
      await emitGameUpdate(res, io, gameId, gameState);
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

  try {
    const gameState = await GameState.load(db, numericGameId);
    await gameState.raise(userId, numericGameId);
    await gameState.save(numericGameId);

    const playerStack = await gameState.getPlayerStack(userId, numericGameId);

    // Add pot update emission
    const io = req.app.get("io");
    io.to(gameId).emit(`game:${gameId}:pot-updated`, gameState.getPot());
    io.to(gameId).emit(`game:${gameId}:stack-updated`, playerStack);

    if (gameState) {
      await emitGameUpdate(res, io, gameId, gameState);
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
      const io = req.app.get("io");
      await emitGameUpdate(res, io, gameId, gameState);
    } else {
      res.status(400).json({ error: "Failed to fold" });
    }
  } catch (error) {
    console.error("Error folding in game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
