import { Router } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const LOGIN_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
const GMAIL_SCOPES = [
  ...LOGIN_SCOPES,
  'https://www.googleapis.com/auth/gmail.readonly',
];

const serverPort = process.env.PORT || '3000';

function googleRedirectUri() {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  if (process.env.NODE_ENV === 'production') {
    return 'https://subpilot.nibravalabs.com/api/auth/google/callback';
  }
  return `http://localhost:${serverPort}/api/auth/google/callback`;
}

const LIVE_SITE = 'https://subpilot.nibravalabs.com';
// This preview deployment was deleted. Vercel answers every path with DEPLOYMENT_NOT_FOUND.
const RETIRED_SITES = ['https://clever-sub-watch-h0rlgpw40-subpilot.vercel.app'];

function frontendUrl() {
  const configured = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (configured && !RETIRED_SITES.includes(configured)) return configured;
  if (process.env.NODE_ENV === 'production') return LIVE_SITE;
  return 'http://localhost:8080';
}

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri()
  );
}

// 1. Get Auth URL (Called by frontend Connect Bank page)
router.get('/url', requireAuth, (req: any, res) => {
  if (!googleConfigured()) {
    return res.status(500).json({ error: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.' });
  }
  const url = createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    include_granted_scopes: true,
    prompt: 'consent',
    state: req.userId
  });
  res.json({ url });
});

// 1b. Get Auth URL for Login/Signup (Called by frontend Login page)
router.get('/login-url', (req, res) => {
  if (!googleConfigured()) {
    return res.status(500).json({ error: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.' });
  }
  const url = createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: LOGIN_SCOPES,
    prompt: 'select_account',
    state: 'login'
  });
  res.json({ url });
});

// 2. OAuth Callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const passedState = state as string;

  if (!code || !passedState) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user email & profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const appUrl = frontendUrl();

    if (passedState === 'login') {
      // --- LOGIN / SIGNUP FLOW ---
      const email = userInfo.data.email!;
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Create user
        user = await prisma.user.create({
          data: {
            email,
            name: userInfo.data.name || 'Google User',
            passwordHash: 'oauth_user', // placeholder for oauth users
            googleAccessToken: tokens.access_token ?? null,
            googleRefreshToken: tokens.refresh_token ?? null,
            googleEmail: email
          }
        });
      } else {
        // Update tokens for existing user — never overwrite with null
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(tokens.access_token && { googleAccessToken: tokens.access_token }),
            ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
            googleEmail: email
          }
        });
      }

      // Log them in
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.redirect(`${appUrl}/dashboard`);
    } else {
      // --- CONNECT GMAIL TO EXISTING ACCOUNT FLOW ---
      const userId = passedState;
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(tokens.access_token && { googleAccessToken: tokens.access_token }),
          ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
          googleEmail: userInfo.data.email
        }
      });
      return res.redirect(`${appUrl}/dashboard/connect?gmail=success`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// 3. Status Check
router.get('/status', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId }
  });
  
  if (!user || !user.googleRefreshToken) {
    return res.json({ connected: false });
  }

  res.json({ 
    connected: true, 
    email: user.googleEmail 
  });
});

import { scanUserEmails } from '../lib/gmailScanner';

// 4. Disconnect
router.post('/disconnect', requireAuth, async (req: any, res) => {
  const deleteSubs = req.body?.deleteSubscriptions !== false && req.query?.deleteSubscriptions !== 'false';
  if (deleteSubs) {
    await prisma.subscription.deleteMany({
      where: {
        userId: req.userId,
        detectionSource: 'email',
      },
    });
  }

  await prisma.user.update({
    where: { id: req.userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleEmail: null,
    },
  });
  res.json({ success: true });
});

// 5. Sync Emails
router.post('/sync', requireAuth, async (req: any, res) => {
  try {
    const detectedCount = await scanUserEmails(req.userId);
    res.json({ success: true, detected: detectedCount });
  } catch (error: any) {
    console.error('Gmail sync error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to sync emails',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

export default router;
