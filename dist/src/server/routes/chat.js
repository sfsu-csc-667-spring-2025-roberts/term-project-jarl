"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/:roomId", (request, response) => {
    var _a, _b;
    const { message } = request.body;
    const id = request.params.roomId;
    const io = request.app.get("io");
    const broadcastMessage = {
        message,
        sender: ((_a = request.session.user) === null || _a === void 0 ? void 0 : _a.email) || "Anonymous",
        gravatar: (_b = request.session.user) === null || _b === void 0 ? void 0 : _b.gravatar,
        timestamp: Date.now(),
    };
    console.log({ broadcastMessage });
    io.emit(`chat-message:${id}`, broadcastMessage);
    response.status(200).send();
});
exports.default = router;
//# sourceMappingURL=chat.js.map