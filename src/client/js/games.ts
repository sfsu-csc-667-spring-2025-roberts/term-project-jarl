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
  if (startGameButton!.disabled) {
    return;
  }
  console.log("sstart game btn clicked");
  startGameButton!.disabled = true;

  fetch(`/games/${gameId}/start`, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        console.log("started game in client");
        // startGameButton!.parentNode?.removeChild(startGameButton!);
      } else {
        console.error("Failed to start game");
        startGameButton!.disabled = false;
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

function getCardDisplay(value: string): string {
  const num = parseInt(value);
  switch (num) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return value;
  }
}

function renderCard(card: { value: string; shape: string }) {
  const container = document.getElementById("card-container");
  if (!container) return;

  const cardDiv = document.createElement("div");
  cardDiv.className = "card";

  const valueDiv = document.createElement("div");
  valueDiv.className = "card-value";
  valueDiv.textContent = getCardDisplay(card.value);

  const suitDiv = document.createElement("div");
  suitDiv.className = "card-suit";
  suitDiv.textContent = card.shape;

  cardDiv.appendChild(valueDiv);
  cardDiv.appendChild(suitDiv);
  container.appendChild(cardDiv);
}

// When card is received from backend
socket.on("dealCard", (card) => {
  console.log("Card received from backend:", card);
  renderCard(card);
});
// In-Game Chat functionality
const chatForm = document.getElementById("game-chat-form") as HTMLFormElement;
const chatInput = document.getElementById(
  "game-chat-input",
) as HTMLInputElement;
const chatMessages = document.getElementById(
  "game-chat-messages",
) as HTMLDivElement;

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) {
    socket.emit("gameChatMessage", message);
    chatInput.value = "";
  }
});

// When a chat message is received from the server
socket.on("gameChatMessage", (data: { user: string; content: string }) => {
  console.log("Chat message received:", data);
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message";
  messageDiv.innerHTML = `<strong>${data.user}</strong>: ${data.content}`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
