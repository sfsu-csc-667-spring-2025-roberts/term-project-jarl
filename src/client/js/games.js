"use strict";
/*
when i click the leave game button, the leave game modal should appear (not be hidden)
if i click no in the modal, it should hide it
if i click yes, it should call the appropriate route,
prob delete that game_player_id, update state, and go back to lobby
*/
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Leave Game modal logic
// src/client/js/games.ts
const socket_io_client_1 = require("socket.io-client");
// --- Leave Game Modal Logic ---
const leaveGameBtn = document.querySelector("#leave-game-btn");
const leaveGameContainer = document.querySelector("#leave-game-container");
const leaveGameModal = document.querySelector("#leave-game-modal");
const confirmLeaveBtn = document.querySelector("#confirm-leave-btn");
const cancelLeaveBtn = document.querySelector("#cancel-leave-btn");
leaveGameBtn === null || leaveGameBtn === void 0
  ? void 0
  : leaveGameBtn.addEventListener("click", (e) => {
      e.preventDefault();
      leaveGameContainer.classList.toggle("hidden");
    });
cancelLeaveBtn === null || cancelLeaveBtn === void 0
  ? void 0
  : cancelLeaveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      leaveGameContainer.classList.add("hidden");
    });
leaveGameContainer === null || leaveGameContainer === void 0
  ? void 0
  : leaveGameContainer.addEventListener("click", (e) => {
      if (e.target === leaveGameContainer) {
        leaveGameContainer.classList.add("hidden");
      }
    });
// --- ✅ Start Game Logic ---
const startGameBtn = document.querySelector("#start-game-btn");
const gameIdMeta = document.querySelector("meta[name='game-id']");
const gameId =
  (_a =
    (gameIdMeta === null || gameIdMeta === void 0
      ? void 0
      : gameIdMeta.content) || window.location.pathname.split("/").pop()) ===
    null || _a === void 0
    ? void 0
    : _a.trim();
if (startGameBtn && gameId) {
  const socket = (0, socket_io_client_1.io)();
  startGameBtn.addEventListener("click", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      try {
        console.log("Start Game clicked for game", gameId);
        startGameBtn.disabled = true;
        startGameBtn.innerText = "Starting...";
        const response = yield fetch(`/games/${gameId}/start`, {
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
    }),
  );
  socket.on(`game:${gameId}:started`, () => {
    alert("🎮 The game has started!");
    startGameBtn.innerText = "Game Started";
    startGameBtn.disabled = true;
  });
}
