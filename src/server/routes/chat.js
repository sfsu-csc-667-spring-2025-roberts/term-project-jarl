"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/:roomId", (request, response) => {
  const { message } = request.body;
  const id = request.params.roomId;
  const io = request.app.get("io");
  const broadcastMessage = {
    message,
    // @ts-ignore
    sender: request.session.user.email,
    // @ts-ignore
    gravatar: request.session.user.gravatar,
    timestamp: Date.now(),
  };
  console.log({ broadcastMessage });
  io.emit(`chat-message:${id}`, broadcastMessage);
  response.status(200).send();
});
exports.default = router;
