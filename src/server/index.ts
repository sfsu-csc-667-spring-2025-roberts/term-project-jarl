import * as path from "path";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import livereload from "livereload";
import connectLivereload from "connect-livereload";

import dotenv from "dotenv";
dotenv.config();
const app = express();

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

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
app.use("/test", () => {});

app.use((_request, _response, next) => {
  next(httpErrors(404));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
