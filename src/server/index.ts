// src/server/index.ts
import express from 'express';
import path from 'path';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db, { pgp } from './db/connection';
import { setupSockets } from './socket'; // Import setupSockets function
import { timeMiddleware } from './middleware/time';
import * as routes from './routes';
import dotenv from 'dotenv';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();

// Create Express app
console.log('Creating Express app...');
const app = express();
const server = createServer(app);

// Set up Socket.IO
console.log('Setting up Socket.IO...');
const io = new Server(server);

// Set up basic middleware
console.log('Setting up basic middleware...');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));

// Set up session middleware
console.log('Setting up session middleware...');
const PgSession = pgSession(session);
app.use(session({
  store: new PgSession({
    // Using pg directly instead of db.$pool
    conString: process.env.DATABASE_URL || 'postgres://localhost/poker_game',
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Set up view engine
console.log('Setting up view engine...');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Add time middleware for request logging
console.log('Loading time middleware...');
app.use(timeMiddleware);
console.log('Time middleware loaded successfully');

// Set up routes
console.log('Setting up routes...');
app.use('/', routes.default || routes.root || express.Router());
app.use('/auth', routes.auth || express.Router());
app.use('/games', routes.games || express.Router());
app.use('/funds', routes.funds || express.Router());
app.use('/friends', routes.friends || express.Router());
app.use('/lobby', routes.lobby || express.Router());
app.use('/test', routes.test || express.Router());

// Set up Socket.IO handlers
console.log('Setting up socket.io handlers');
setupSockets(io);

// Start the server
console.log('Starting server...');
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to database and log success
db.connect()
  .then(obj => {
    obj.done(); // release the connection
    console.log('Connected to PostgreSQL database');
  })
  .catch(error => {
    console.error('Failed to connect to PostgreSQL database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});