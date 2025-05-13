// src/server/routes/games.ts
import express from "express";
import { isAuthenticated } from "../middleware/auth";
import games from "../db/games";
import { GameState, Game } from "../db/models/game";

const router = express.Router();

// Get all active games
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const activeGames = await games.findActiveGames();
    res.render("lobby", { games: activeGames, user: req.session.user });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).render("error", { message: "Error loading games" });
  }
});

// Create a new game
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    console.log("Create game request:", req.body);
    
    // Extract data - check both JSON and form data formats
    let name, maxPlayers, minBuyIn, isPrivate;
    
    if (typeof req.body === 'object') {
      // Handle both naming conventions
      name = req.body.name || req.body.gameName;
      maxPlayers = req.body.maxPlayers || req.body.max_players;
      minBuyIn = req.body.minBuyIn || req.body.min_buy_in;
      isPrivate = req.body.private || req.body['private-game'] === 'on';
    }
    
    if (!name || !maxPlayers) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }
    
    const parsedMaxPlayers = parseInt(maxPlayers);
    
    if (isNaN(parsedMaxPlayers) || parsedMaxPlayers < 2 || parsedMaxPlayers > 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid player count (2-8)" 
      });
    }
    
    // Use timeout for the database operation
    const result = await Promise.race([
      games.create(name, parsedMaxPlayers, req.session.user.id),
      new Promise<Game>((_, reject) => 
        setTimeout(() => reject(new Error('Game creation timeout')), 5000)
      )
    ]);
    
    // Check if the request expects JSON (AJAX call) or a redirect
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    
    if (isAjax) {
      return res.json({ success: true, game_id: result.id });
    } else {
      return res.redirect(`/games/${result.id}`);
    }
  } catch (error) {
    console.error("Error creating game:", error);
    
    // Handle error based on request type
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    
    const errorMessage = error.message === 'Game creation timeout' 
      ? "Game creation is taking too long. Please try again." 
      : "Server error while creating game";
    
    if (isAjax) {
      return res.status(500).json({ 
        success: false, 
        message: errorMessage 
      });
    } else {
      return res.status(500).render("error", { message: errorMessage });
    }
  }
});

// Join a specific game
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    
    if (isNaN(gameId)) {
      return res.status(400).render("error", { message: "Invalid game ID" });
    }
    
    // Use timeout for the database operation
    const game = await Promise.race([
      games.findById(gameId),
      new Promise<Game | null>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 3000)
      )
    ]);
    
    if (!game) {
      return res.status(404).render("error", { message: "Game not found" });
    }
    
    if (game.state === GameState.FINISHED) {
      return res.redirect("/");
    }
    
    res.render("games", { game, user: req.session.user });
  } catch (error) {
    console.error("Error joining game:", error);
    
    const errorMessage = error.message === 'Database query timeout' 
      ? "Loading game is taking too long. Please try again." 
      : "Error loading game";
    
    res.status(500).render("error", { message: errorMessage });
  }
});

// Leave a game (new endpoint for explicit leaving via HTTP)
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = req.session.user.id;
    
    if (isNaN(gameId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid game ID" 
      });
    }
    
    // Remove player from game
    await games.removePlayer(gameId, userId);
    
    // Check if request expects JSON
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    
    if (isAjax) {
      return res.json({ success: true });
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    console.error("Error leaving game:", error);
    
    // Check if request expects JSON
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    
    if (isAjax) {
      return res.status(500).json({ 
        success: false, 
        message: "Error leaving game" 
      });
    } else {
      return res.status(500).render("error", { message: "Error leaving game" });
    }
  }
});

export default router;