"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("../socket");
const roomId =
  (_a = document.querySelector("input#room-id")) === null || _a === void 0
    ? void 0
    : _a.value;
const parent = document.querySelector("section#chat div");
const messageInput = document.querySelector(
  "section#chat form input[name=message]",
);
(_b = document.querySelector("section#chat form.chat-form")) === null ||
_b === void 0
  ? void 0
  : _b.addEventListener("submit", (event) => {
      event.preventDefault();
      const message =
        messageInput === null || messageInput === void 0
          ? void 0
          : messageInput.value;
      messageInput.value = "";
      if (
        (message === null || message === void 0
          ? void 0
          : message.trim().length) === 0
      ) {
        return;
      }
      fetch(`/chat/${roomId}`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ message }),
      });
    });
socket_1.socket.on(
  `chat-message:${roomId}`,
  ({ message, sender, gravatar, timestamp }) => {
    var _a;
    const container =
      (_a = document.querySelector("template#chat-message-template")) ===
        null || _a === void 0
        ? void 0
        : _a.content.cloneNode(true);
    const img = container.querySelector("img");
    img.src = `https://www.gravatar.com/avatar/${gravatar}`;
    img.alt = `${sender}'s avatar`;
    const messageElement = container.querySelector("span.message");
    messageElement.innerText = message;
    const timestampElement = container.querySelector("span.timestamp");
    timestampElement.innerText = new Date(timestamp).toLocaleString();
    parent === null || parent === void 0
      ? void 0
      : parent.appendChild(container);
    parent === null || parent === void 0
      ? void 0
      : parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
  },
);
