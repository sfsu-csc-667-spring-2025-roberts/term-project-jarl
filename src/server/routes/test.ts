// src/server/routes/test.ts
import express from "express";
import pool from "../db/connection";

const router = express.Router();

router.post("/test", async (req, res) => {
  try {
    // Replace db.none with pool.query without expecting a return value
    await pool.query("INSERT INTO test_table (test_string) VALUES ($1)", [
      "Test successful at " + new Date().toISOString(),
    ]);

    // Replace db.any with pool.query and use rows property
    const result = await pool.query("SELECT * FROM test_table");

    res.json({ success: true, result: result.rows });
  } catch (error) {
    console.error("Error in test route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
