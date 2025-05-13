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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupSessions = exports.isNotAuthenticated = exports.isAuthenticated = void 0;
// Check if user is authenticated
var isAuthenticated = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, db, User, userModel, user, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                session = req.session;
                if (!(session && session.userId)) return [3 /*break*/, 5];
                if (!!session.user) return [3 /*break*/, 4];
                db = require('../db/connection').default;
                User = require('../db/models/user').default;
                userModel = new User(db);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, userModel.findById(session.userId)];
            case 2:
                user = _b.sent();
                if (user) {
                    session.user = user;
                    // Save session asynchronously
                    req.session.save(function () { });
                }
                else {
                    // User not found in database, clear session
                    req.session.destroy(function () {
                        return res.redirect('/signin');
                    });
                    return [2 /*return*/];
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Error reloading user data:', error_1);
                return [2 /*return*/, res.redirect('/signin')];
            case 4: return [2 /*return*/, next()];
            case 5:
                // Check if it's an AJAX request
                if (req.xhr || ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.includes('application/json'))) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Authentication required'
                        })];
                }
                res.redirect('/signin');
                return [2 /*return*/];
        }
    });
}); };
exports.isAuthenticated = isAuthenticated;
// Check if user is NOT authenticated
var isNotAuthenticated = function (req, res, next) {
    var _a;
    // Type assertion for session
    var session = req.session;
    if (session && session.userId) {
        // Check if it's an AJAX request
        if (req.xhr || ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: 'Already authenticated'
            });
        }
        return res.redirect('/');
    }
    next();
};
exports.isNotAuthenticated = isNotAuthenticated;
// Session cleanup middleware
var cleanupSessions = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, now, lastActivity, maxAge;
    return __generator(this, function (_a) {
        session = req.session;
        // Clean up old sessions
        if (session && session.userId && session.lastActivity) {
            now = Date.now();
            lastActivity = session.lastActivity;
            maxAge = 24 * 60 * 60 * 1000;
            if (now - lastActivity > maxAge) {
                req.session.destroy(function () {
                    return res.redirect('/signin');
                });
                return [2 /*return*/];
            }
        }
        // Update last activity
        if (session && session.userId) {
            session.lastActivity = Date.now();
            // Save session asynchronously
            req.session.save(function () { });
        }
        next();
        return [2 /*return*/];
    });
}); };
exports.cleanupSessions = cleanupSessions;
