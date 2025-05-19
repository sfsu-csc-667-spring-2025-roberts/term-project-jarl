"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";
const config = {
  mode,
  entry: {
    main: path_1.default.join(process.cwd(), "src", "client", "index.ts"),
    lobby: path_1.default.join(
      process.cwd(),
      "src",
      "client",
      "js",
      "lobby.ts",
    ),
    games: path_1.default.join(
      process.cwd(),
      "src",
      "client",
      "js",
      "games.ts",
    ),
  },
  output: {
    path: path_1.default.join(process.cwd(), "public", "js"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
exports.default = config;
