// File: src/client/js/games.ts

import io from "socket.io-client";

const socket = io();

// DOM Elements
const gameContainer = document.getElementById("game-container");
const lobbyContainer = document.getElementById("lobby-container");
const startGameButton = document.getElementById("start-game-button");
const joinGameButtons = document.querySelectorAll(".join-game-button");
const createGameForm = document.getElementById("create-game-form");
const gamesList = document.getElementById("games-list");

// Game state
let currentGameId: string | null = null;
let isGameCreator = false;

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  connectToSocket();
});

function setupEventListeners() {
  // Start game event
  if (startGameButton) {
    startGameButton.addEventListener("click", handleStartGame);
  }

  // Join game events
  joinGameButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const gameId = (e.target as HTMLElement).getAttribute("data-game-id");
      if (gameId) {
        handleJoinGame(gameId);
      }
    });
  });

  // Create game form
  if (createGameForm) {
    createGameForm.addEventListener("submit", handleCreateGame);
  }
}

function connectToSocket() {
  // Join the lobby room
  socket.emit("join:lobby");

  // Socket event listeners
  socket.on("game:created", handleGameCreated);
  socket.on("game:updated", handleGameUpdated);
  socket.on("player:joined", handlePlayerJoined);
  socket.on("game:started", handleGameStarted);
}

// Event handlers
async function handleStartGame() {
  if (!currentGameId) {
    showError("No game selected");
    return;
  }

  try {
    const response = await fetch(`/games/${currentGameId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.error || "Failed to start game");
      return;
    }

    const game = await response.json();
    console.log("Game started:", game);

    // The UI will be updated via socket events
  } catch (error) {
    console.error("Error starting game:", error);
    showError("Failed to start game");
  }
}

async function handleJoinGame(gameId: string) {
  try {
    const response = await fetch(`/games/${gameId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.error || "Failed to join game");
      return;
    }

    const game = await response.json();
    currentGameId = game._id;

    // Join the game room via socket
    socket.emit("join:game", { gameId });

    // Update UI
    showGameLobby(game);
  } catch (error) {
    console.error("Error joining game:", error);
    showError("Failed to join game");
  }
}

async function handleCreateGame(e: Event) {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  // Get values from form
  const name = formData.get("name") as string;
  const minPlayers = (formData.get("minPlayers") as string) || "2";
  const maxPlayers = (formData.get("maxPlayers") as string) || "6";
  const password = (formData.get("password") as string) || "";

  // Validate form data
  if (!name || name.trim() === "") {
    showError("Game name is required");
    return;
  }

  try {
    const response = await fetch("/games/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        minPlayers: parseInt(minPlayers, 10),
        maxPlayers: parseInt(maxPlayers, 10),
        password: password.trim() === "" ? undefined : password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.error || "Failed to create game");
      return;
    }

    const game = await response.json();
    currentGameId = game.game_id; // Note: Using game_id to match server response
    isGameCreator = true;

    // Join the game room via socket
    socket.emit("join:game", { gameId: game.game_id });

    // Update UI
    showGameLobby(game);
    form.reset();
  } catch (error) {
    console.error("Error creating game:", error);
    showError("Failed to create game");
  }
}

// Socket event handlers
function handleGameCreated(data: any) {
  if (gamesList) {
    // Add new game to the list
    const gameItem = document.createElement("div");
    gameItem.classList.add("game-item");
    gameItem.innerHTML = `
      <h3>${data.name}</h3>
      <p>Players: ${data.players ? data.players.length : 0}/${data.maxPlayers}</p>
      <button class="join-game-button" data-game-id="${data.gameId}">Join</button>
    `;
    gamesList.appendChild(gameItem);

    // Add event listener to the new button
    const button = gameItem.querySelector(".join-game-button");
    if (button) {
      button.addEventListener("click", () => handleJoinGame(data.gameId));
    }
  }
}

function handleGameUpdated(data: any) {
  // Update game info if it's the current game
  if (currentGameId === data.gameId) {
    updateGameLobbyUI(data);
  }

  // Update game in the games list
  const gameItem = document.querySelector(
    `.game-item[data-game-id="${data.gameId}"]`,
  );
  if (gameItem) {
    const playersInfo = gameItem.querySelector("p");
    if (playersInfo) {
      playersInfo.textContent = `Players: ${data.players ? data.players.length : 0}/${data.maxPlayers}`;
    }
  }
}

function handlePlayerJoined(data: any) {
  if (currentGameId === data.gameId) {
    // Refresh game data
    fetchGameData(data.gameId);
  }
}

function handleGameStarted(data: any) {
  if (currentGameId === data.gameId) {
    // Show game UI
    showGameUI();
    // Fetch latest game data
    fetchGameData(data.gameId);
  }
}

// Helper functions
async function fetchGameData(gameId: string) {
  try {
    const response = await fetch(`/games/${gameId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch game data");
    }

    const game = await response.json();

    if (game.is_started) {
      updateGameUI(game);
    } else {
      updateGameLobbyUI(game);
    }
  } catch (error) {
    console.error("Error fetching game data:", error);
  }
}

function showGameLobby(game: any) {
  if (lobbyContainer && gameContainer) {
    lobbyContainer.style.display = "none";
    gameContainer.style.display = "block";

    // Show/hide start game button
    if (startGameButton) {
      startGameButton.style.display = isGameCreator ? "block" : "none";
    }

    updateGameLobbyUI(game);
  }
}

function updateGameLobbyUI(game: any) {
  const playersListElement = document.getElementById("game-players-list");
  if (playersListElement) {
    playersListElement.innerHTML = "";

    if (game.players) {
      game.players.forEach((player: any) => {
        const playerItem = document.createElement("li");
        playerItem.textContent = player.username || player.user_id;
        if (player.is_host) {
          playerItem.textContent += " (Host)";
        }
        playersListElement.appendChild(playerItem);
      });
    }
  }

  const gameNameElement = document.getElementById("game-name");
  if (gameNameElement) {
    gameNameElement.textContent = game.name;
  }
}

function showGameUI() {
  const gameLobbyElement = document.getElementById("game-lobby");
  const gamePlayElement = document.getElementById("game-play");

  if (gameLobbyElement && gamePlayElement) {
    gameLobbyElement.style.display = "none";
    gamePlayElement.style.display = "block";
  }
}

function updateGameUI(game: any) {
  // Update player cards
  const playerCardsElement = document.getElementById("player-cards");
  if (playerCardsElement && game.playerCards) {
    const userId = document.body.getAttribute("data-user-id");
    if (userId && game.playerCards[userId]) {
      playerCardsElement.innerHTML = "";

      game.playerCards[userId].forEach((card: any) => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.innerHTML = `
          <div class="card-value">${card.value}</div>
          <div class="card-suit">${card.suit}</div>
        `;
        playerCardsElement.appendChild(cardElement);
      });
    }
  }

  // Update community cards
  const communityCardsElement = document.getElementById("community-cards");
  if (communityCardsElement && game.communityCards) {
    communityCardsElement.innerHTML = "";

    game.communityCards.forEach((card: any) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("card");
      cardElement.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
      `;
      communityCardsElement.appendChild(cardElement);
    });
  }

  // Update pot amount
  const potElement = document.getElementById("pot-amount");
  if (potElement) {
    potElement.textContent = `$${game.pot}`;
  }

  // Update current turn
  if (game.currentTurn) {
    const isMyTurn =
      game.currentTurn === document.body.getAttribute("data-user-id");
    const turnElement = document.getElementById("turn-indicator");
    if (turnElement) {
      turnElement.textContent = isMyTurn
        ? "Your turn!"
        : `${game.currentTurn.username || "Player"}'s turn`;
    }

    // Show/hide action buttons
    const actionButtons = document.getElementById("action-buttons");
    if (actionButtons) {
      actionButtons.style.display = isMyTurn ? "flex" : "none";
    }
  }

  // Update round info
  const roundElement = document.getElementById("round-info");
  if (roundElement) {
    roundElement.textContent = `Round: ${game.round}`;
  }
}

function showError(message: string) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";

    setTimeout(() => {
      errorElement.style.display = "none";
    }, 3000);
  } else {
    // Fallback to alert if error element doesn't exist
    alert(message);
  }
}

// Export functions for use in other modules
export { handleStartGame, handleJoinGame, handleCreateGame };
