import dotenv from "dotenv";
import path from "path";
import webpack from "webpack";
import { friends } from "./src/server/routes";

dotenv.config();

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const config: webpack.Configuration = {
  mode,
  entry: {
    main: path.join(process.cwd(), "src", "client", "index.ts"),
    lobby: path.join(process.cwd(), "src", "client", "js", "lobby.ts"),
    games: path.join(process.cwd(), "src", "client", "js", "games.ts"),
    friends: path.join(process.cwd(), "src", "client", "js", "friends.ts"),
  },
  output: {
    path: path.join(process.cwd(), "public", "js"),
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

export default config;
