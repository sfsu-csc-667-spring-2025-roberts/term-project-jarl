"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
const connection_1 = __importDefault(require("../connection"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// Create a user
const createUser = (username, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 10;
    const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
    try {
        return yield connection_1.default.one("INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email", [username, email, hashedPassword]);
    }
    catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
});
exports.createUser = createUser;
// Find user by email
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield connection_1.default.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
    }
    catch (error) {
        console.error("Error finding user by email:", error);
        throw error;
    }
});
exports.findUserByEmail = findUserByEmail;
// Find user by ID
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield connection_1.default.oneOrNone("SELECT id, username, email FROM users WHERE id = $1", [id]);
    }
    catch (error) {
        console.error("Error finding user by ID:", error);
        throw error;
    }
});
exports.findUserById = findUserById;
// Update password
const updatePassword = (userId, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 10;
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, saltRounds);
    try {
        return yield connection_1.default.one("UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id", [hashedPassword, userId]);
    }
    catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
});
exports.updatePassword = updatePassword;
exports.default = {
    createUser: exports.createUser,
    findUserByEmail: exports.findUserByEmail,
    findUserById: exports.findUserById,
    updatePassword: exports.updatePassword
};
