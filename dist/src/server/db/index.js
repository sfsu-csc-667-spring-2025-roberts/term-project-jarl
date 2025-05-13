"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.games = exports.db = void 0;
const connection_1 = __importDefault(require("./connection"));
exports.db = connection_1.default;
const games_1 = __importDefault(require("./games"));
exports.games = games_1.default;
const users_1 = __importDefault(require("./users"));
exports.users = users_1.default;
//# sourceMappingURL=index.js.map