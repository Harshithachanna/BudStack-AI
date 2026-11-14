import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

let cachedApiKey: string | null = null;

function getFirebaseApiKey(): string | null {
  if (cachedApiKey) return cachedApiKey;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { apiKey?: string };
      if (raw.apiKey) {
        cachedApiKey = raw.apiKey;
        return cachedApiKey;
      }
    }
  } catch (err) {
    console.error('Failed to read firebase-applet-config.json:', err);
  }
  return null;
}

export async function verifyFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in again.' });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    res.status(401).json({ error: 'Invalid authorization token.' });
    return;
  }

  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    res.status(500).json({ error: 'Firebase configuration is missing on the server.' });
    return;
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!lookupRes.ok) {
      res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
      return;
    }

    const data = (await lookupRes.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };

    const user = data.users?.[0];
    if (!user?.localId) {
      res.status(401).json({ error: 'Unable to verify authenticated user.' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        error: 'Please verify your email address before generating AI financial insights.',
      });
      return;
    }

    req.user = {
      uid: user.localId,
      email: user.email ?? '',
      emailVerified: Boolean(user.emailVerified),
    };

    next();
  } catch (err) {
    console.error('Firebase token verification error:', err);
    res.status(500).json({ error: 'Failed to verify authentication session.' });
  }
}
