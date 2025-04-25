// src/server/routes/test.ts
import express from "express";
import db from "../db/connection";

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

export default router;
