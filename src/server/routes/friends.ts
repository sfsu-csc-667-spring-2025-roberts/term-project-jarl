import express from "express";
import User from "../db/models/user";
import db from "../db/connection";

const router = express.Router();
const userModel = new User(db);

router.get("/friends", function (req, res) {
  async () => {
    console.log("Fetching friends list...");
    if (!req.session.userId) {
      return res.redirect("/signin");
    }

    // Assuming you have a function to get friends from the database
    const friends = ["John", "Clair", "Joe"]; // Replace with actual database call
    res.render("friends", { friends: friends });
  };
});

export default router;
