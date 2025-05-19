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
exports.auth = void 0;
const user_1 = __importDefault(require("../db/models/user"));
const connection_1 = __importDefault(require("../db/connection"));
const userModel = new user_1.default(connection_1.default);
const auth = (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const userId = req.session.userId;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const user = yield userModel.findById(userId);
      if (!user) {
        req.session.destroy(() => {});
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      // Make user available in request
      // this doesn't exist, and causes an error so I commented it out
      // @ts-ignore
      req.session.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  });
exports.auth = auth;
exports.default = exports.auth;
