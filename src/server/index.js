"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const connection_1 = __importDefault(require("./db/connection"));
const socket_1 = require("./socket");
const config_1 = require("./config"); // Import from config
const routes = __importStar(require("./routes"));
const middleware = __importStar(require("./middleware"));
// Load environment variables
console.log("Loading environment variables...");
dotenv_1.default.config();
// Create Express app
console.log("Creating Express app...");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Create Socket.IO server with CORS configured
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // In production, change this to your specific domain
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Set up basic middleware
console.log("Setting up basic middleware...");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(path_1.default.join(__dirname, "../../public")));
// Set up session middleware
console.log("Setting up session middleware...");
(0, config_1.configureSession)(app);
// Set up view engine
console.log("Setting up view engine...");
app.set("views", path_1.default.join(__dirname, "../../views"));
app.set("view engine", "ejs");
// Load time middleware
console.log("Loading time middleware...");
app.use(middleware.timeMiddleware);
console.log("Time middleware loaded successfully");
// Set up routes
console.log("Setting up routes...");
// Setup routes individually
app.use("/", routes.root);
app.use("/test", routes.test);
app.use("/auth", routes.auth);
app.use("/games", routes.games);
app.use("/chat", routes.chat);
app.use("/lobby", routes.lobby);
// In your server setup file
app.use('/funds', routes.funds);
app.use("/friends", routes.friends);
// Make io accessible in routes
app.set("io", io);
// Set up socket handlers
console.log("Setting up Socket.IO...");
(0, socket_1.setupSockets)(io);
// Start server
console.log("Starting server...");
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Connect to database
    connection_1.default.connect()
        .then(() => {
        console.log("Connected to PostgreSQL database");
    })
        .catch((err) => {
        console.error("Failed to connect to database:", err);
    });
});
