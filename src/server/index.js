"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// --- App Imports ---
const config = __importStar(require("./config"));
const routes = __importStar(require("./routes"));
const middleware = __importStar(require("./middleware"));
const root_1 = __importDefault(require("./routes/root"));
const test_1 = __importDefault(require("./routes/test"));
const sockets_1 = __importDefault(require("./config/sockets"));
const friends_1 = require("./socket/friends");
// --- App & Server ---
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
// --- Middleware ---
config.liveReload(app);
config.session(app);
config.sockets(io, app); // can be optional if setupFriendSocket + configureSockets cover it
(0, sockets_1.default)(io, app);
(0, friends_1.setupFriendSocket)(io);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path.join(process.cwd(), "public")));
app.use((0, morgan_1.default)("dev"));
app.use(
  (0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }),
);
// --- View Engine ---
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");
// --- Routes ---
app.get("/healthcheck", (_req, res) => {
  res.send("Server is running");
});
app.use("/", root_1.default);
app.use("/test", test_1.default);
app.use("/auth", routes.auth);
app.use("/chat", middleware.auth, routes.chat);
app.use("/lobby", middleware.auth, routes.lobby);
app.use("/friends", middleware.auth, routes.friends);
app.use("/games", require("./routes/games").default);
// --- Error Handling ---
const http_errors_1 = __importDefault(require("http-errors"));
app.use((_req, _res, next) => next((0, http_errors_1.default)(404)));
// --- Server Start ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
