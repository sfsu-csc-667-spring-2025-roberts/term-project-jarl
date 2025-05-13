// Create this file in your project root as test.js
const session = require('./src/server/config/session');

console.log('Default export:', typeof session.default);
console.log('sessionMiddleware export:', typeof session.sessionMiddleware);
console.log('Full exports:', Object.keys(session));