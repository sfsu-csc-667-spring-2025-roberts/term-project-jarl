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
