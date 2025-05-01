import express from "express";
import { Request, Response } from "express";
import path from "path";

const router = express.Router();

router.get("/", (_request: Request, response: Response) => {
  const fullPath = path.join(__dirname, "../../../views/realLobby.ejs");
  response.render(fullPath);
});

export default router;
