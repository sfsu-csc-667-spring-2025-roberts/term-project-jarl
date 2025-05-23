"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var socket_1 = require("../socket");
console.log("socket.ts loaded", socket_1.socket);
var roomId =
  (_a = document.querySelector("input#room-id")) === null || _a === void 0
    ? void 0
    : _a.value;
console.log("roomId found:", roomId);
socket_1.socket.on("connect", function () {
  console.log("✅ Socket connected:", socket_1.socket.id);
});
// joins the room for chat
if (roomId) {
  console.log("Emitting join-room with", roomId);
  socket_1.socket.emit("join-room", roomId);
}
var parent = document.querySelector("section#chat div");
var messageInput = document.querySelector(
  "section#chat form input[name=message]",
);
(_b = document.querySelector("section#chat form.chat-form")) === null ||
_b === void 0
  ? void 0
  : _b.addEventListener("submit", function (event) {
      event.preventDefault();
      var message =
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
      fetch("/chat/".concat(roomId), {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ message: message }),
      });
    });
socket_1.socket.on("chat-message:".concat(roomId), function (_a) {
  var _b;
  var message = _a.message,
    sender = _a.sender,
    gravatar = _a.gravatar,
    timestamp = _a.timestamp;
  var container =
    (_b = document.querySelector("template#chat-message-template")) === null ||
    _b === void 0
      ? void 0
      : _b.content.cloneNode(true);
  var img = container.querySelector("img");
  img.src = "https://www.gravatar.com/avatar/".concat(gravatar);
  img.alt = "".concat(sender, "'s avatar");
  var messageElement = container.querySelector("span.message");
  messageElement.innerText = message;
  var timestampElement = container.querySelector("span.timestamp");
  timestampElement.innerText = new Date(timestamp).toLocaleString();
  parent === null || parent === void 0 ? void 0 : parent.appendChild(container);
  parent === null || parent === void 0
    ? void 0
    : parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
});
