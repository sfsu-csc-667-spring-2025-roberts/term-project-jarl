"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotAuthenticated = exports.isAuthenticated = void 0;
const isAuthenticated = (req, res, next) => {
    const session = req.session;
    if (session && session.userId) {
        return next();
    }
    res.redirect('/signin');
};
exports.isAuthenticated = isAuthenticated;
const isNotAuthenticated = (req, res, next) => {
    const session = req.session;
    if (session && session.userId) {
        return res.redirect('/');
    }
    next();
};
exports.isNotAuthenticated = isNotAuthenticated;
//# sourceMappingURL=auth.js.map