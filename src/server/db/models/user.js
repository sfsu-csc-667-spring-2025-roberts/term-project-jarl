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
const bcrypt_1 = __importDefault(require("bcrypt"));
class User {
  constructor(db) {
    this.db = db;
  }
  create(username, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
      const saltRounds = 10;
      const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
      return this.db.one(
        "INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING user_id, username, email",
        [username, email, hashedPassword],
      );
    });
  }
  findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.db.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
    });
  }
  findById(id) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.db.oneOrNone(
        "SELECT user_id, username, email FROM users WHERE user_id = $1",
        [id],
      );
    });
  }
  updatePassword(userId, newPassword) {
    return __awaiter(this, void 0, void 0, function* () {
      const saltRounds = 10;
      const hashedPassword = yield bcrypt_1.default.hash(
        newPassword,
        saltRounds,
      );
      return this.db.one(
        "UPDATE users SET password = $1 WHERE user_id = $2 RETURNING user_id",
        [hashedPassword, userId],
      );
    });
  }
  createPasswordResetToken(email, token, expiresAt) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.db.one(
        "INSERT INTO password_reset_tokens(email, token, expires_at) VALUES($1, $2, $3) RETURNING user_id",
        [email, token, expiresAt],
      );
    });
  }
  findPasswordResetToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.db.oneOrNone(
        "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
        [token],
      );
    });
  }
  deletePasswordResetToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.db.none(
        "DELETE FROM password_reset_tokens WHERE token = $1",
        [token],
      );
    });
  }
}
exports.default = User;
