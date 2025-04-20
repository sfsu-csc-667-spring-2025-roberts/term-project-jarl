import * as path from "path";
import * as http from "http";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import livereload from "livereload";
import connectLivereload from "connect-livereload";

import dotenv from "dotenv";
dotenv.config();

import * as config from "./config";
import * as routes from "./routes";
import * as middleware from "./middleware";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(middleware.room);
config.liveReload(app);
config.session(app);
config.sockets(io, app);

if (process.env.NODE_ENV !== "production") {
  const reloadServer = livereload.createServer();

  reloadServer.watch(path.join(process.cwd(), "public", "js"));
  reloadServer.server.once("connection", () => {
    setTimeout(() => {
      reloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLivereload());
}

import rootRoutes from "./routes/root";
import testRouter from "./routes/test";

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
app.use("/test", testRouter);
app.use("/auth", routes.auth);
app.use("/chat", middleware.auth, routes.chat);
app.use("/lobby", middleware.auth, routes.lobby);

app.use((_request, _response, next) => {
  next(httpErrors(404));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
