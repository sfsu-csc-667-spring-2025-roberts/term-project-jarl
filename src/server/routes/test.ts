// src/server/routes/test.ts
import express from "express";
import db from "../db/connection";
import { Request, Response } from "express";
import type { Server } from "socket.io";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Game } from "../db";

const router = express.Router();

router.post("/test", async (req, res) => {
  try {
    // Use db.none for queries that don't return data
    await db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
      "Test successful at " + new Date().toISOString(),
    ]);

    // Use db.any for queries that return multiple rows
    const result = await db.any("SELECT * FROM test_table");

    res.json({ success: true, result });
  } catch (error) {
    console.error("Error in test route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/promise_version", (request: Request, response: Response) => {
  db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
    `Test string ${new Date().toISOString()}`,
  ])
    .then(() => {
      return db.any("SELECT * FROM test_table");
    })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ error: "Internal Server Error" });
    });
});

router.get("/socket", (request: Request, response: Response) => {
  const io: Server = request.app.get("io");

  // @ts-ignore
  io.emit("test", { user: request.session.user });
  // @ts-ignore
  io.to(request.session.user.id).emit("test", { secret: "hi" });

  response.json({ message: "Socket event emitted" });
});

router.get("/games", async (request: Request, response: Response) => {
  response.render("test/games");
});

router.get("/games/test-user", async (request: Request, response: Response) => {
  const user = await db.one(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id",
    [`${crypto.randomUUID()}@example.com`, await bcrypt.hash("password", 10)],
  );

  response.json({ user });
});

router.get("/games/create", async (request: Request, response: Response) => {
  const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } =
    request.body;

  try {
    const gameId = await db.one(
      "INSERT INTO games(name, min_players, max_players, password) VALUES ($1, $2, $3, $4) RETURNING game_id",
      [gameName, gameMinPlayers, gameMaxPlayers, gamePassword],
    );
    response.json({ gameId });
  } catch (error) {
    console.error("error creating game: ", error);
    response.status(500).send("error creating game");
  }
});

router.post("/games/join", async (request: Request, response: Response) => {
  const { gameId, userId, gamePassword } = request.body;

  try {
    const playerCount = await Game.conditionalJoin(
      gameId,
      userId,
      gamePassword,
    );
    response.json({ playerCount });
  } catch (error) {
    console.log("error joining game: ", error);
    response.status(500).send("error joining game");
  }
});

export default router;
