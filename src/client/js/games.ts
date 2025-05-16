/*
when i click the leave game button, the leave game modal should appear (not be hidden)
if i click no in the modal, it should hide it
if i click yes, it should call the appropriate route, 
prob delete that game_player_id, update state, and go back to lobby
*/

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

console.log(`game:${gameId}:player-joined`);
socket.on(`game:${gameId}:player-joined`, (data) => {
  console.log("data in games.ts with socket on from join is");
  console.log(data);
});
