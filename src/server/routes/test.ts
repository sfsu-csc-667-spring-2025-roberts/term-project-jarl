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

export default router;
