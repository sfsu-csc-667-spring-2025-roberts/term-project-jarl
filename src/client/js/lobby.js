"use strict";
const createGameButton = document.querySelector("#show-create-form");
const createGameContainer = document.querySelector("#create-game-container");
const hideCreateGameContainer = document.querySelector("#hide-create-form");
const joinGameButton = document.querySelector("#show-join-form");
const joinGameContainer = document.querySelector("#join-game-container");
const hideJoinGameContainer = document.querySelector("#hide-join-form");
createGameButton.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("create game button clicked");
  createGameContainer.classList.toggle("hidden");
});
hideCreateGameContainer.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("hide create game form button clicked");
  createGameContainer.classList.toggle("hidden");
});
createGameContainer.addEventListener("click", (e) => {
  if (e.target === createGameContainer) {
    console.log("clicked outside of form");
    createGameContainer.classList.toggle("hidden");
  }
});
joinGameButton.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("join game button clicked");
  joinGameContainer.classList.toggle("hidden");
});
hideJoinGameContainer.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("hide join game form button clicked");
  joinGameContainer.classList.toggle("hidden");
});
joinGameContainer.addEventListener("click", (e) => {
  if (e.target === joinGameContainer) {
    console.log("clicked outside of form");
    joinGameContainer.classList.toggle("hidden");
  }
});
