// src/server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Type assertion for session
  const session = req.session as any;
  
  if (session && session.userId) {
    // Ensure user object exists in session
    if (!session.user) {
      // Reload user data from database if missing
      const db = require('../db/connection').default;
      const User = require('../db/models/user').default;
      const userModel = new User(db);
      
      try {
        const user = await userModel.findById(session.userId);
        if (user) {
          session.user = user;
          // Save session asynchronously
          req.session.save(() => {});
        } else {
          // User not found in database, clear session
          req.session.destroy(() => {
            return res.redirect('/signin');
          });
          return;
        }
      } catch (error) {
        console.error('Error reloading user data:', error);
        return res.redirect('/signin');
      }
    }
    
    return next();
  }
  
  // Check if it's an AJAX request
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  res.redirect('/signin');
};

// Check if user is NOT authenticated
export const isNotAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Type assertion for session
  const session = req.session as any;
  
  if (session && session.userId) {
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        message: 'Already authenticated'
      });
    }
    
    return res.redirect('/');
  }
  
  next();
};

// Session cleanup middleware
export const cleanupSessions = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  
  // Clean up old sessions
  if (session && session.userId && session.lastActivity) {
    const now = Date.now();
    const lastActivity = session.lastActivity;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - lastActivity > maxAge) {
      req.session.destroy(() => {
        return res.redirect('/signin');
      });
      return;
    }
  }
  
  // Update last activity
  if (session && session.userId) {
    session.lastActivity = Date.now();
    // Save session asynchronously
    req.session.save(() => {});
  }
  
  next();
};