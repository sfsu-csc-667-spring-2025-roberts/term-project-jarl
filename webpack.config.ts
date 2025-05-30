import dotenv from "dotenv";
import path from "path";
import webpack from "webpack";

dotenv.config();

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const config: webpack.Configuration = {
  mode,
  entry: {
    main: path.join(process.cwd(), "src", "client", "index.ts"),
    lobby: path.join(process.cwd(), "src", "client", "js", "lobby.ts"),
    games: path.join(process.cwd(), "src", "client", "js", "games.ts"),
    actions: path.join(process.cwd(), "src", "client", "js", "actions.ts"),
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
  // resolve: {
  //   extensions: [".ts", ".js"],
  // },
};

export default config;
