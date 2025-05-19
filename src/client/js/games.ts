import io from "socket.io-client";

const socket = io();

const leaveGameBtn =
  document.querySelector<HTMLButtonElement>("#leave-game-btn");
const leaveGameContainer = document.querySelector<HTMLDivElement>(
  "#leave-game-container",
);
const leaveGameModal =
  document.querySelector<HTMLDivElement>("#leave-game-modal");
const confirmLeaveBtn =
  document.querySelector<HTMLButtonElement>("#confirm-leave-btn");
const cancelLeaveBtn =
  document.querySelector<HTMLButtonElement>("#cancel-leave-btn");

const startGameButton =
  document.querySelector<HTMLButtonElement>("#start-game-btn");

const main = document.querySelector<HTMLDivElement>("main");
const mainId = main!.id;
const gameId = parseInt(mainId.split("-")[1]);

leaveGameBtn!.addEventListener("click", (e) => {
  e.preventDefault();
  leaveGameContainer!.classList.toggle("hidden");
});

cancelLeaveBtn!.addEventListener("click", (e) => {
  e.preventDefault();
  leaveGameContainer!.classList.toggle("hidden");
});

leaveGameContainer!.addEventListener("click", (e) => {
  e.preventDefault();
  if (e.target === leaveGameContainer) {
    leaveGameContainer!.classList.toggle("hidden");
  }
});

confirmLeaveBtn!.addEventListener("click", (e) => {
  e.preventDefault();
  leaveGameContainer!.classList.toggle("hidden");
  fetch(`/games/${gameId}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log(`in client, there are ${response} data`);
        window.location.href = "/";
      } else {
        console.error("Failed to leave game");
      }
    })
    .catch((error) => {
      console.error("Error leaving game:", error);
    });
});

console.log(`game:${gameId}:player-joined`);
socket.on(`game:${gameId}:player-joined`, (data) => {
  console.log("data in games.ts with socket on from join is");
  console.log(data);
});

startGameButton!.addEventListener("click", (e) => {
  e.preventDefault();

  startGameButton.disabled = true;

  fetch(`/games/${gameId}/start`, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        console.log("started game in client");
        startGameButton.parentNode?.removeChild(startGameButton);
      } else {
        console.error("Failed to start game");
        startGameButton.disabled = false;
      }
    })
    .catch((error) => {
      console.error("Error starting game:", error);
    });
});

socket.on(`game:${gameId}:start:error`, (data) => {
  console.log("start game err, data:");
  console.log(data);
});

socket.on(`game:${gameId}:start:success`, (data) => {
  console.log("start game success, data:");
  console.log(data);
});
