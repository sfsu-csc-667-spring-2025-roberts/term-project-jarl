"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeMiddleware = void 0;
// example of a middleware function that will be used for user requests
const timeMiddleware = (_request, _response, next) => {
    console.log(`Request made at ${new Date().toISOString()}`);
    next();
};
exports.timeMiddleware = timeMiddleware;
