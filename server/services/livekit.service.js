import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

export function livekitStatus() {
  return { configured: env.integrations.livekit, provider: 'livekit' };
}

export function issueLiveKitToken({ room, identity, name, canPublish }) {
  if (!env.integrations.livekit) {
    throw ApiError.notConfigured(
      'livekit',
      'Live streaming is not configured on this deployment. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to enable video rooms.',
    );
  }
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: process.env.LIVEKIT_API_KEY,
      sub: identity,
      name,
      nbf: now - 10,
      exp: now + 2 * 60 * 60,
      jti: crypto.randomUUID(),
      video: {
        roomJoin: true,
        room,
        canPublish,
        canSubscribe: true,
        canPublishData: true,
      },
    },
    process.env.LIVEKIT_API_SECRET,
    { algorithm: 'HS256' },
  );
  return { token, url: process.env.LIVEKIT_URL, room };
}
