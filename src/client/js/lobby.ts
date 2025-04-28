const createGameButton =
  document.querySelector<HTMLAnchorElement>("#show-create-form");
const createGameContainer = document.querySelector<HTMLDivElement>(
  "#create-game-container",
);
const hideCreateGameContainer =
  document.querySelector<HTMLAnchorElement>("#hide-create-form");

createGameButton!.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("create game button clicked");

  createGameContainer!.classList.toggle("hidden");
});

console.log(hideCreateGameContainer!);
console.log("ddd");
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
