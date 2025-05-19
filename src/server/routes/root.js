"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/routes/root.ts
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("../db/models/user"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
const userModel = new user_1.default(connection_1.default);
const userFriends = (userId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const friends = yield connection_1.default.any(
      `SELECT friend_id, status FROM "userFriends" WHERE user_id = $1`,
      [userId],
    );
    return friends;
  });
const friendRequests = (userId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const requests = yield connection_1.default.any(
      `SELECT user_id, status FROM "userFriends" WHERE friend_id = $1 AND status = 'pending'`,
      [userId],
    );
    return requests;
  });
// Home page
router.get("/", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      let user = null;
      if (req.session.userId) {
        user = yield userModel.findById(req.session.userId);
        if (!user) {
          return res.redirect("/signin");
        }
        const friends = yield userFriends(req.session.userId);
        user.friends = friends;
        const requests = yield friendRequests(req.session.userId);
        user.requests = requests;
      }
      res.render("root", {
        title: "Poker Game",
        user,
        friends: user ? user.friends : [],
        requests: user ? user.requests : [],
      });
    } catch (error) {
      console.error("Home page error:", error);
      res.render("root", {
        title: "Poker Game",
        error: "An error occurred",
      });
    }
  }),
);
// Sign in page
router.get("/signin", (req, res) => {
  console.log("Signin route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("signin", { title: "Sign In" });
});
// Sign up page
router.get("/signup", (req, res) => {
  console.log("Signup route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("signup", { title: "Sign Up" });
});
// Forgot password page
router.get("/forgot-password", (req, res) => {
  console.log("Forgot password route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("forgot-password", { title: "Forgot Password" });
});
// Reset password page
router.get("/reset-password", (req, res) => {
  console.log("Reset password route accessed");
  const { token } = req.query;
  if (!token) {
    return res.redirect("/forgot-password");
  }
  res.render("reset-password", {
    title: "Reset Password",
    token,
  });
});
exports.default = router;
