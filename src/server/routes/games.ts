import express from "express";
import { Request, Response } from "express";
import { Game } from "../db";

const router = express.Router();

// i think i fixed the errro just look at terminal error now

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } =
    request.body;

  try {
    const gameId = await Game.create(
      userId,
      gameName,
      gameMinPlayers,
      gameMaxPlayers,
      gamePassword,
    );
    if (gameId) {
      response.redirect(`/games/${gameId}`);
    } else {
      response.status(500).send("error creating game here");
    }
  } catch (err) {
    console.error("error creating game: ", err);
    response.status(500).send("error creating game");
  }
});

router.get("/:gameId", (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const user = request.session.user;
  response.render("games", { gameId, user });
});

export default router;
