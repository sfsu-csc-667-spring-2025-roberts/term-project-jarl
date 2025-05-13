"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeMiddleware = void 0;
const timeMiddleware = (_request, _response, next) => {
    console.log(`Request made at ${new Date().toISOString()}`);
    next();
};
exports.timeMiddleware = timeMiddleware;
//# sourceMappingURL=time.js.map