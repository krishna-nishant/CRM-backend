const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         picture:
 *           type: string
 *           description: URL to user's profile picture
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 * 
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: OAuth code from Google
 *     responses:
 *       302:
 *         description: Redirects to frontend with success/error
 * 
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * 
 * /api/auth/me:
 *   get:
 *     summary: Get current user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */

// Initiate Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Set cookie with appropriate settings for dev/prod
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Log cookie settings in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Cookie settings:', {
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
      }

      res.redirect(`${process.env.FRONTEND_URL}/login?success=true`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  // Clear cookie with matching settings
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    try {
      const user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
      };
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router; 