"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
const connection_1 = __importDefault(require("../connection"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUser = async (username, email, password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
    try {
        return await connection_1.default.one("INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email", [username, email, hashedPassword]);
    }
    catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    try {
        return await connection_1.default.oneOrNone("SELECT * FROM users WHERE email = $1", [email]);
    }
    catch (error) {
        console.error("Error finding user by email:", error);
        throw error;
    }
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    try {
        return await connection_1.default.oneOrNone("SELECT id, username, email FROM users WHERE id = $1", [id]);
    }
    catch (error) {
        console.error("Error finding user by ID:", error);
        throw error;
    }
};
exports.findUserById = findUserById;
const updatePassword = async (userId, newPassword) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
    try {
        return await connection_1.default.one("UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id", [hashedPassword, userId]);
    }
    catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
};
exports.updatePassword = updatePassword;
exports.default = {
    createUser: exports.createUser,
    findUserByEmail: exports.findUserByEmail,
    findUserById: exports.findUserById,
    updatePassword: exports.updatePassword
};
//# sourceMappingURL=index.js.map