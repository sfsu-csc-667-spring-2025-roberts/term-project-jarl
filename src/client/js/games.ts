/*
when i click the leave game button, the leave game modal should appear (not be hidden)
if i click no in the modal, it should hide it
if i click yes, it should call the appropriate route, 
prob delete that game_player_id, update state, and go back to lobby
*/

// Leave Game modal logic
// src/client/js/games.ts
import { io } from "socket.io-client";

// --- Leave Game Modal Logic ---
const leaveGameBtn = document.querySelector("#leave-game-btn") as HTMLElement;
const leaveGameContainer = document.querySelector(
  "#leave-game-container",
) as HTMLElement;
const leaveGameModal = document.querySelector(
  "#leave-game-modal",
) as HTMLElement;
const confirmLeaveBtn = document.querySelector(
  "#confirm-leave-btn",
) as HTMLElement;
const cancelLeaveBtn = document.querySelector(
  "#cancel-leave-btn",
) as HTMLElement;

leaveGameBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  leaveGameContainer.classList.toggle("hidden");
});

cancelLeaveBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  leaveGameContainer.classList.add("hidden");
});

leaveGameContainer?.addEventListener("click", (e) => {
  if (e.target === leaveGameContainer) {
    leaveGameContainer.classList.add("hidden");
  }
});

// --- ✅ Start Game Logic ---
const startGameBtn = document.querySelector(
  "#start-game-btn",
) as HTMLButtonElement;
const gameIdMeta = document.querySelector(
  "meta[name='game-id']",
) as HTMLMetaElement;

const gameId = (
  gameIdMeta?.content || window.location.pathname.split("/").pop()
)?.trim();

if (startGameBtn && gameId) {
  const socket = io();

  startGameBtn.addEventListener("click", async () => {
    try {
      console.log("Start Game clicked for game", gameId);

      startGameBtn.disabled = true;
      startGameBtn.innerText = "Starting...";

      const response = await fetch(`/games/${gameId}/start`, {
        method: "POST",
      });

      if (response.ok) {
        console.log("Game start request sent successfully.");
        startGameBtn.innerText = "Game Started";
      } else {
        alert("Failed to start game");
        startGameBtn.disabled = false;
        startGameBtn.innerText = "Start Game";
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Server error while starting game.");
      startGameBtn.disabled = false;
      startGameBtn.innerText = "Start Game";
    }
  });

  socket.on(`game:${gameId}:started`, () => {
    alert("🎮 The game has started!");
    startGameBtn.innerText = "Game Started";
    startGameBtn.disabled = true;
  });
}
