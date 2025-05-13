// src/server/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import rootRoutes from './root';
import gamesRoutes from './games';
import fundsRoutes from './funds';
import friendsRoutes from './friends';
import lobbyRoutes from './lobby';
import testRoutes from './test';

// Export all route modules
export const root = rootRoutes;
export const auth = authRoutes;
export const games = gamesRoutes;
export const funds = fundsRoutes;
export const friends = friendsRoutes;
export const lobby = lobbyRoutes;
export const test = testRoutes;

// Create a default router that combines all routes
const router = express.Router();

// Root routes should go first
router.use('/', rootRoutes);
router.use('/auth', authRoutes);
router.use('/games', gamesRoutes);
router.use('/funds', fundsRoutes);
router.use('/friends', friendsRoutes);
router.use('/lobby', lobbyRoutes);
router.use('/test', testRoutes);

// Export default router
export default router;