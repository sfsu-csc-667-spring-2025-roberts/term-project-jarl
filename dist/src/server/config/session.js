"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
let sessionMiddleware;
const configureSession = (app) => {
    const store = new ((0, connect_pg_simple_1.default)(express_session_1.default))({
        createTableIfMissing: true,
    });
    exports.sessionMiddleware = sessionMiddleware = (0, express_session_1.default)({
        store,
        secret: process.env.SESSION_SECRET || "dev-secret-key",
        resave: true,
        saveUninitialized: false,
    });
    app.use(sessionMiddleware);
};
exports.default = configureSession;
//# sourceMappingURL=session.js.map