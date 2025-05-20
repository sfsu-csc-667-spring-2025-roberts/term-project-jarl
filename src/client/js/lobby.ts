import io from "socket.io-client";

const socket = io();

const createGameButton =
  document.querySelector<HTMLAnchorElement>("#show-create-form");
const createGameContainer = document.querySelector<HTMLDivElement>(
  "#create-game-container",
);
const hideCreateGameContainer =
  document.querySelector<HTMLAnchorElement>("#hide-create-form");

const joinGameButton =
  document.querySelector<HTMLAnchorElement>("#show-join-form");

const joinGameContainer = document.querySelector<HTMLDivElement>(
  "#join-game-container",
);

const hideJoinGameContainer =
  document.querySelector<HTMLAnchorElement>("#hide-join-form");

const gamesListContainer = document.querySelector<HTMLDivElement>(
  "#games-list-container",
);

createGameButton!.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("create game button clicked");
  createGameContainer!.classList.toggle("hidden");
});

hideCreateGameContainer!.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("hide create game form button clicked");
  createGameContainer!.classList.toggle("hidden");
});

createGameContainer!.addEventListener("click", (e) => {
  if (e.target === createGameContainer) {
    console.log("clicked outside of form");
    createGameContainer!.classList.toggle("hidden");
  }
});

joinGameButton!.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("join game button clicked");
  joinGameContainer!.classList.toggle("hidden");
});

hideJoinGameContainer!.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("hide join game form button clicked");
  joinGameContainer!.classList.toggle("hidden");
});

joinGameContainer!.addEventListener("click", (e) => {
  if (e.target === joinGameContainer) {
    console.log("clicked outside of form");
    joinGameContainer!.classList.toggle("hidden");
  }
});

socket.on("game:getGames", (data) => {
  gamesListContainer!.textContent = "";
  for (let i = 0; i < data.allGames.length; i++) {
    const game = data.allGames[i];
    const passwordRequired = game.password === "" ? "Not required" : "Required";

    const gameItem = document.createElement("div");
    const gameIdDiv = document.createElement("div");
    const passwordDiv = document.createElement("div");

    gameIdDiv.textContent = `Game ID: ${game.game_id}`;
    passwordDiv.textContent = `Password: ${passwordRequired}`;
    gameItem.classList.add("game-item");

    gameItem.appendChild(gameIdDiv);
    gameItem.appendChild(passwordDiv);
    gamesListContainer!.appendChild(gameItem);
  }
});
