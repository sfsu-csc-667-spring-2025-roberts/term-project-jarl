import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", async (_request: Request, response: Response) => {
  if (!_request.session.userId) {
    return response.redirect("/signin");
  }

  response.render("realLobby");
});

export default router;
